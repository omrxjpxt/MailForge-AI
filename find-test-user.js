require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "mailforge-ai-3035c"
  });
}
const db = admin.firestore();

async function run() {
  const usersSnap = await db.collection("users").where("gmailRefreshToken", "!=", null).limit(1).get();
  if (usersSnap.empty) {
    console.log("No users found with a connected Gmail account.");
  } else {
    console.log(`Found user: ${usersSnap.docs[0].id}`);
  }
}
run().catch(console.error);
