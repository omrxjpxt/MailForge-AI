import { adminDb } from "@/lib/firebase/admin";
import { Campaign } from "@/types/campaign";
import { SendQueueJob } from "@/types/queue";
import { Lead } from "@/types/lead";
import { google } from "googleapis";
import { FieldValue } from "firebase-admin/firestore";

const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Recovers jobs that have been stuck in 'Processing' for too long.
 */
async function recoverStuckJobs(uid: string) {
  const cutoff = Date.now() - PROCESSING_TIMEOUT_MS;
  const snapshot = await adminDb
    .collection(`users/${uid}/sendQueue`)
    .where("status", "==", "Processing")
    .where("lockedAt", "<=", cutoff)
    .get();

  if (snapshot.empty) return;

  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: "Pending",
      lockedAt: null,
      processingNode: null
    });
  });
  await batch.commit();
}

/**
 * Main Engine tick for a user.
 */
export async function processEngineTick(uid: string) {
  await recoverStuckJobs(uid);

  // 1. GENERATOR PHASE: Queue new leads for running campaigns
  const campaignsSnap = await adminDb
    .collection(`users/${uid}/campaigns`)
    .where("status", "==", "Running")
    .get();

  for (const campDoc of campaignsSnap.docs) {
    const campaign = campDoc.data() as Campaign;
    
    // Check daily limits
    const today = new Date().toISOString().split("T")[0];
    if (campaign.dailyEmailsSentDate !== today) {
      // Reset daily limit if it's a new day
      await campDoc.ref.update({
        dailyEmailsSent: 0,
        dailyEmailsSentDate: today
      });
      campaign.dailyEmailsSent = 0;
    }

    if (campaign.dailyEmailsSent >= campaign.dailyLimit) {
      continue; // Skip queuing/sending for this campaign today
    }

    // Queue leads if there are more left
    if (campaign.currentLeadIndex < campaign.leadIds.length) {
      const batchSize = Math.min(
        50, // Process 50 at a time to avoid memory/timeout issues
        campaign.leadIds.length - campaign.currentLeadIndex
      );

      const batch = adminDb.batch();
      const firstStep = campaign.steps[0];
      
      if (firstStep) {
        for (let i = 0; i < batchSize; i++) {
          const leadId = campaign.leadIds[campaign.currentLeadIndex + i];
          const jobRef = adminDb.collection(`users/${uid}/sendQueue`).doc();
          const job: Omit<SendQueueJob, "id"> = {
            campaignId: campDoc.id,
            leadId,
            stepId: firstStep.stepId,
            scheduledFor: Date.now(),
            status: "Pending",
            retryCount: 0,
            lockedAt: null,
            processingNode: null,
            createdAt: Date.now()
          };
          batch.set(jobRef, job);
        }
      }

      batch.update(campDoc.ref, {
        currentLeadIndex: campaign.currentLeadIndex + batchSize,
        updatedAt: Date.now()
      });

      await batch.commit();
    }
  }

  // 2. EXECUTION PHASE: Process jobs from the queue
  // Process up to 10 jobs per tick to stay within serverless execution limits
  const jobsSnap = await adminDb
    .collection(`users/${uid}/sendQueue`)
    .where("status", "==", "Pending")
    .where("scheduledFor", "<=", Date.now())
    .limit(10)
    .get();

  if (jobsSnap.empty) return;

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

  for (const jobDoc of jobsSnap.docs) {
    const job = jobDoc.data() as SendQueueJob;
    
    // Attempt to lock job
    try {
      await adminDb.runTransaction(async (t) => {
        const doc = await t.get(jobDoc.ref);
        if (doc.data()?.status !== "Pending") throw new Error("Job no longer pending");
        t.update(jobDoc.ref, {
          status: "Processing",
          lockedAt: Date.now(),
          processingNode: "engine-v1"
        });
      });
    } catch (e: unknown) {
      continue; // Failed to lock, skip
    }

    try {
      const campDoc = await adminDb.collection(`users/${uid}/campaigns`).doc(job.campaignId).get();
      if (!campDoc.exists) throw new Error("Campaign deleted");
      const campaign = campDoc.data() as Campaign;

      if (campaign.status !== "Running") {
        // Just delete job if paused/archived, or we can keep it as Pending. Let's delete to prevent stale queues.
        await jobDoc.ref.delete();
        continue;
      }

      // Check daily limit again (in case other jobs pushed it over)
      if (campaign.dailyEmailsSent >= campaign.dailyLimit) {
        await jobDoc.ref.update({ status: "Pending", lockedAt: null });
        continue;
      }

      const stepIndex = campaign.steps.findIndex(s => s.stepId === job.stepId);
      const step = campaign.steps[stepIndex];
      if (!step) throw new Error("Step deleted");

      const leadDoc = await adminDb.collection(`users/${uid}/leads`).doc(job.leadId).get();
      if (!leadDoc.exists) throw new Error("Lead deleted");
      const lead = leadDoc.data() as Lead;

      // Idempotency Check
      const historySnap = await adminDb
        .collection(`users/${uid}/emailHistory`)
        .where("campaignId", "==", job.campaignId)
        .where("leadId", "==", job.leadId)
        .where("stepId", "==", job.stepId)
        .where("status", "==", "Sent")
        .limit(1)
        .get();

      if (!historySnap.empty) {
        // Already sent, delete job safely
        await jobDoc.ref.delete();
        continue;
      }

      // Personalize
      const subject = personalizeText(step.subject, lead);
      const body = personalizeText(step.body, lead);
      const raw = createMimeMessage(lead.email, subject, body);

      // Send
      const res = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
      });

      const messageId = res.data.id;
      const threadId = res.data.threadId;

      // Success Batch Updates
      const batch = adminDb.batch();
      
      // Update Campaign metrics
      batch.update(campDoc.ref, {
        emailsSent: FieldValue.increment(1),
        dailyEmailsSent: FieldValue.increment(1),
        updatedAt: Date.now()
      });

      // Update Lead
      batch.update(leadDoc.ref, {
        status: "Contacted",
        lastContactedAt: Date.now(),
        campaignId: job.campaignId
      });

      // Create EmailHistory
      const historyRef = adminDb.collection(`users/${uid}/emailHistory`).doc();
      batch.set(historyRef, {
        campaignId: job.campaignId,
        leadId: job.leadId,
        stepId: job.stepId,
        stepNumber: stepIndex + 1,
        gmailMessageId: messageId,
        gmailThreadId: threadId,
        subject,
        body,
        sentAt: Date.now(),
        status: "Sent",
        retryCount: job.retryCount
      });

      // Queue Next Step
      const nextStep = campaign.steps[stepIndex + 1];
      if (nextStep) {
        const nextJobRef = adminDb.collection(`users/${uid}/sendQueue`).doc();
        batch.set(nextJobRef, {
          campaignId: job.campaignId,
          leadId: job.leadId,
          stepId: nextStep.stepId,
          scheduledFor: Date.now() + (nextStep.waitDays * 24 * 60 * 60 * 1000),
          status: "Pending",
          retryCount: 0,
          createdAt: Date.now()
        });
      }

      // Delete current job
      batch.delete(jobDoc.ref);

      await batch.commit();

    } catch (error: unknown) {
      console.error(`Job ${jobDoc.id} failed:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const retryCount = job.retryCount + 1;
      
      if (retryCount >= 3) {
        await jobDoc.ref.update({
          status: "Dead",
          lockedAt: null
        });

        // Record fatal failure in history
        await adminDb.collection(`users/${uid}/emailHistory`).add({
          campaignId: job.campaignId,
          leadId: job.leadId,
          stepId: job.stepId,
          sentAt: Date.now(),
          status: "Failed",
          retryCount,
          error: errorMessage
        });
      } else {
        // Exponential backoff: 5m, 15m
        const backoffMs = retryCount * retryCount * 5 * 60 * 1000; 
        await jobDoc.ref.update({
          status: "Pending",
          retryCount,
          scheduledFor: Date.now() + backoffMs,
          lockedAt: null
        });
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
