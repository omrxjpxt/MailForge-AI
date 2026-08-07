import { adminDb } from './src/lib/firebase/admin.js';

async function test() {
  console.log("Testing Firestore...");
  try {
    await adminDb.collection("users").doc("test_auth_hang").set({test:true}, {merge: true});
    console.log("Firestore write succeeded");
  } catch (e) {
    console.error("Firestore write failed:", e);
  }
  process.exit(0);
}

test();
