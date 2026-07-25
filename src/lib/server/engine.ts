import { adminDb } from "@/lib/firebase/admin";
import { Campaign, CampaignLeadProgress } from "@/types/campaign";
import { Lead } from "@/types/lead";
import { google } from "googleapis";
import { FieldValue } from "firebase-admin/firestore";

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
        
        try {
          const subject = personalizeText(node.subject, lead);
          const body = personalizeText(node.body, lead);
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
            subject,
            body,
            sentAt: Date.now(),
            status: "Sent"
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
