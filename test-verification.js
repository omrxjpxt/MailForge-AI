const admin = require("firebase-admin");

// Initialize Firebase Admin (uses application default credentials from environment)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "mailforge-ai-3035c"
  });
}
const db = admin.firestore();

async function test() {
  const userId = "test-uid-verification";
  const campaignId = "test-camp-" + Date.now();
  const leadId = "test-lead-123";
  
  const batch = db.batch();
  
  // Create parent document
  const campRef = db.doc(`users/${userId}/campaigns/${campaignId}`);
  batch.set(campRef, { status: "Scheduled", name: "Test Camp" });
  
  // Create subcollection document
  const leadRef = db.doc(`users/${userId}/campaigns/${campaignId}/campaignLeads/${leadId}`);
  batch.set(leadRef, { status: "Running", leadId });
  
  await batch.commit();
  
  const snap = await db.collection(`users/${userId}/campaigns/${campaignId}/campaignLeads`).get();
  console.log(`Document count: ${snap.docs.length}`);
  console.log(`Document IDs: ${snap.docs.map(d => d.id).join(', ')}`);
}

test().catch(console.error);
