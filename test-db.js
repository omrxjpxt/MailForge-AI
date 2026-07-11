require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

const db = getFirestore();

async function check() {
  const rootCollections = await db.listCollections();
  console.log("Root collections:");
  rootCollections.forEach(c => console.log("- " + c.id));

  // Find a user doc
  const usersSnapshot = await db.collection("users").limit(1).get();
  if (!usersSnapshot.empty) {
    const userDoc = usersSnapshot.docs[0];
    console.log("\nFound user:", userDoc.id);
    
    // Subcollections?
    const subCollections = await userDoc.ref.listCollections();
    console.log("User subcollections:");
    subCollections.forEach(c => console.log("- " + c.id));
    
    // Check if there are templates in the root
    const rootTemplates = await db.collection("templates").limit(1).get();
    console.log("\nRoot 'templates' count:", rootTemplates.size);
    
    // Check if there are templates in the subcollection
    const subTemplates = await userDoc.ref.collection("templates").limit(1).get();
    console.log("Subcollection 'templates' count:", subTemplates.size);
  }
}
check();
