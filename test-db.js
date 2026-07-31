const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin-sdk.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function run() {
  const db = admin.firestore();
  
  // Find a user
  const usersSnap = await db.collection("users").limit(1).get();
  if (usersSnap.empty) return console.log("No users");
  const userId = usersSnap.docs[0].id;

  // Find a campaign
  const campsSnap = await db.collection(`users/${userId}/campaigns`).limit(1).get();
  if (campsSnap.empty) return console.log("No campaigns");
  const campaignId = campsSnap.docs[0].id;
  const campaign = campsSnap.docs[0].data();

  console.log(`Campaign ${campaignId} stats:`, { opens: campaign.opens, emailsSent: campaign.emailsSent, emailsDelivered: campaign.emailsDelivered });

  // Find history
  const histSnap = await db.collection(`users/${userId}/emailHistory`).limit(1).get();
  if (histSnap.empty) return console.log("No history");
  const histId = histSnap.docs[0].id;
  const hist = histSnap.docs[0].data();
  console.log("History entry:", hist);
}

run().catch(console.error);
