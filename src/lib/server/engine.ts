import { adminDb } from "@/lib/firebase/admin";
import { Campaign, CampaignLeadProgress } from "@/types/campaign";
import { Lead } from "@/types/lead";
import { google } from "googleapis";
import { FieldValue } from "firebase-admin/firestore";
import { generateAIEmailVariation } from "./ai-generator";

/**
 * Main Engine tick for a user.
 */
export async function processEngineTick(uid: string) {
  const campaignsSnap = await adminDb
    .collection(`users/${uid}/campaigns`)
    .where("status", "==", "Running")
    .get();

  if (campaignsSnap.empty) return;

  const userDoc = await adminDb.collection("users").doc(uid).get();
  const userData = userDoc.data();
  if (!userData?.gmailRefreshToken) return; // Cannot send emails without Gmail

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: userData.gmailRefreshToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  for (const campDoc of campaignsSnap.docs) {
    const campaign = campDoc.data() as Campaign;
    
    // Check daily limits
    const today = new Date().toISOString().split("T")[0];
    if (campaign.dailyEmailsSentDate !== today) {
      await campDoc.ref.update({
        dailyEmailsSent: 0,
        dailyEmailsSentDate: today
      });
      campaign.dailyEmailsSent = 0;
    }

    if (campaign.dailyEmailsSent >= campaign.dailyLimit) {
      continue; // Skip queuing/sending for this campaign today
    }

    // Fetch leads ready for processing in this campaign
    const leadsSnap = await adminDb
      .collection(`users/${uid}/campaigns/${campDoc.id}/campaignLeads`)
      .where("status", "==", "Running")
      .where("nextExecutionAt", "<=", Date.now())
      .limit(50) // Process up to 50 leads per tick to avoid timeouts
      .get();

    for (const leadProgressDoc of leadsSnap.docs) {
      const progress = leadProgressDoc.data() as CampaignLeadProgress;
      
      // Immediate Halt: If the lead has replied
      if (progress.hasReplied) {
        await leadProgressDoc.ref.update({
          status: "Replied",
          completed: true
        });
        
        await campDoc.ref.update({
          replies: FieldValue.increment(1)
        });
        continue;
      }

      const node = campaign.executionNodes?.[progress.currentStepIndex];
      
      // Sequence Completed: No more nodes
      if (!node) {
         await leadProgressDoc.ref.update({
           status: "Completed",
           completed: true
         });
         continue;
      }

      // Wait Node: Schedule the next execution and advance pointer
      if (node.type === "wait") {
         await leadProgressDoc.ref.update({
           currentStepIndex: progress.currentStepIndex + 1,
           nextExecutionAt: Date.now() + (node.waitDays * 24 * 60 * 60 * 1000)
         });
         continue;
      }
      
      // Email Node: Send email via Gmail
      if (node.type === "email") {
        // Double check limits before sending
        if (campaign.dailyEmailsSent >= campaign.dailyLimit) {
           break; // Stop processing this campaign's leads for now
        }

        const leadDoc = await adminDb.collection(`users/${uid}/leads`).doc(progress.leadId).get();
        if (!leadDoc.exists) {
           await leadProgressDoc.ref.update({ status: "Failed", error: "Lead deleted" });
           continue;
        }
        const lead = leadDoc.data() as Lead;
        
        // Idempotency: Prevent duplicate emails for the same step
        const historySnap = await adminDb
          .collection(`users/${uid}/emailHistory`)
          .where("campaignId", "==", campDoc.id)
          .where("leadId", "==", progress.leadId)
          .where("stepId", "==", node.stepId)
          .where("status", "==", "Sent")
          .limit(1)
          .get();

        if (!historySnap.empty) {
           // Somehow already sent, just advance pointer
           await leadProgressDoc.ref.update({
             currentStepIndex: progress.currentStepIndex + 1,
             nextExecutionAt: Date.now()
           });
           continue;
        }

        // --- AI Personalization Logic ---
        let baseSubject = node.subject;
        let baseBody = node.body;
        let modelUsed = "none";
        let personalizationMode = "Basic";
        
        const aiSettings = campaign.aiPersonalization;
        
        if (aiSettings?.enabled && aiSettings.mode !== "Basic") {
          // Check if already generated
          const cache = progress.generatedEmailCache || {};
          const cachedVariation = cache[node.stepId];
          
          if (cachedVariation) {
            baseSubject = cachedVariation.subject;
            baseBody = cachedVariation.body;
            modelUsed = cachedVariation.modelUsed;
            personalizationMode = cachedVariation.mode;
          } else {
            // Need to generate
            try {
              const generated = await generateAIEmailVariation(
                node.subject, 
                node.body, 
                lead, 
                aiSettings.mode as "Smart" | "Deep", 
                campaign.name
              );
              baseSubject = generated.subject;
              baseBody = generated.body;
              modelUsed = generated.modelUsed;
              personalizationMode = aiSettings.mode;
              
              // Save to cache before sending, in case Gmail fails
              await leadProgressDoc.ref.update({
                [`generatedEmailCache.${node.stepId}`]: {
                  subject: baseSubject,
                  body: baseBody,
                  generatedAt: Date.now(),
                  modelUsed,
                  mode: personalizationMode,
                  tokens: generated.tokensUsed,
                  timeMs: generated.timeMs
                }
              });
              
              await campDoc.ref.update({
                aiGenerations: FieldValue.increment(1),
                aiTokensUsed: FieldValue.increment(generated.tokensUsed),
                aiTotalTimeMs: FieldValue.increment(generated.timeMs)
              });
            } catch (error) {
              console.error(`AI Generation failed for lead ${progress.leadId}:`, error);
              
              await campDoc.ref.update({
                aiFailures: FieldValue.increment(1)
              });
              
              if (aiSettings.fallbackBehavior === "Original") {
                await campDoc.ref.update({ aiFallbacks: FieldValue.increment(1) });
                // baseSubject and baseBody remain the original node defaults
              } else if (aiSettings.fallbackBehavior === "Skip") {
                await leadProgressDoc.ref.update({
                  status: "Failed",
                  error: "AI generation failed and fallback is Skip"
                });
                continue; // Skip this lead
              } else if (aiSettings.fallbackBehavior === "Retry") {
                // Do not update pointer, let it retry on next tick
                continue; 
              }
            }
          }
        }
        
        try {
          const subject = personalizeText(baseSubject, lead);
          const body = personalizeText(baseBody, lead);
          const raw = createMimeMessage(lead.email, subject, body);

          const res = await gmail.users.messages.send({
            userId: "me",
            requestBody: { raw },
          });

          const messageId = res.data.id;
          const threadId = res.data.threadId;

          // Commit Success Batch
          const batch = adminDb.batch();
          
          batch.update(campDoc.ref, {
            emailsSent: FieldValue.increment(1),
            dailyEmailsSent: FieldValue.increment(1),
            updatedAt: Date.now()
          });
          campaign.dailyEmailsSent++;

          batch.update(leadDoc.ref, {
            status: "Contacted",
            lastContactedAt: Date.now(),
            campaignId: campDoc.id
          });

          batch.update(leadProgressDoc.ref, {
            currentStepIndex: progress.currentStepIndex + 1,
            nextExecutionAt: Date.now(), // Evaluate next node immediately
            lastEmailSentAt: Date.now()
          });

          const historyRef = adminDb.collection(`users/${uid}/emailHistory`).doc();
          batch.set(historyRef, {
            campaignId: campDoc.id,
            leadId: progress.leadId,
            stepId: node.stepId,
            stepNumber: progress.currentStepIndex + 1,
            gmailMessageId: messageId,
            gmailThreadId: threadId,
            subject, // The actual sent text
            body,    // The actual sent text
            sentAt: Date.now(),
            status: "Sent",
            generatedSubject: aiSettings?.enabled ? baseSubject : null, // Audit trail
            generatedBody: aiSettings?.enabled ? baseBody : null,
            modelUsed,
            mode: personalizationMode
          });

          await batch.commit();
        } catch (error: any) {
           console.error(`Email sending failed for lead ${progress.leadId}:`, error);
           await leadProgressDoc.ref.update({
             status: "Failed",
             error: error.message || "Email failed"
           });
           
           await campDoc.ref.update({
             failures: FieldValue.increment(1)
           });
        }
      }
    }

    // Check if campaign is now completed
    const remainingLeadsSnap = await adminDb
      .collection(`users/${uid}/campaigns/${campDoc.id}/campaignLeads`)
      .where("completed", "==", false)
      .limit(1)
      .get();

    if (remainingLeadsSnap.empty) {
      await campDoc.ref.update({
        status: "Completed",
        updatedAt: Date.now()
      });
    }
  }
}

function personalizeText(text: string, lead: Lead) {
  let result = text;
  result = result.replace(/\{\{firstName\}\}/gi, lead.firstName || "");
  result = result.replace(/\{\{lastName\}\}/gi, lead.lastName || "");
  result = result.replace(/\{\{company\}\}/gi, lead.company || "");
  result = result.replace(/\{\{jobTitle\}\}/gi, lead.jobTitle || "");
  result = result.replace(/\{\{website\}\}/gi, lead.website || "");
  result = result.replace(/\{\{industry\}\}/gi, lead.industry || "");
  result = result.replace(/\{\{location\}\}/gi, lead.location || "");
  return result;
}

function createMimeMessage(to: string, subject: string, body: string) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ];
  const message = messageParts.join("\n");
  return Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
