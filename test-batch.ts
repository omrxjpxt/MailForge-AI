import { adminDb } from "./src/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

async function test() {
  const userId = "test-uid-123";
  const campaignId = "test-camp-123";
  const leadId = "test-lead-123";
  
  const progress = {
    leadId,
    campaignId,
    currentStepIndex: 0,
    status: "Running",
    nextExecutionAt: Date.now(),
    hasReplied: false,
    completed: false
  };

  const batch = adminDb.batch();
  const leadRef = adminDb.doc(`users/${userId}/campaigns/${campaignId}/campaignLeads/${leadId}`);
  batch.set(leadRef, progress);
  
  await batch.commit();
  console.log("Batch committed.");
  
  const snap = await adminDb.collection(`users/${userId}/campaigns/${campaignId}/campaignLeads`).get();
  console.log("Docs found:", snap.docs.length);
}

test().catch(console.error);
