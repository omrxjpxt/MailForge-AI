require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
const { getFirestore, collection, query, orderBy, getDocs } = require('firebase/firestore');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    // 1. Get a test UID (we can list users from admin)
    const listUsers = await admin.auth().listUsers(1);
    if (listUsers.users.length === 0) {
      console.log("No users found");
      return;
    }
    const uid = listUsers.users[0].uid;
    console.log("Testing with UID:", uid);

    // 2. Generate Custom Token
    const customToken = await admin.auth().createCustomToken(uid);

    // 3. Sign in as client
    await signInWithCustomToken(auth, customToken);
    console.log("Signed in successfully as", auth.currentUser.uid);

    // 4. Test the exact query from campaigns/new
    const q = query(
      collection(db, "users", uid, "templates"),
      orderBy("createdAt", "desc")
    );
    
    console.log("Executing getDocs...");
    const snapshot = await getDocs(q);
    console.log("SUCCESS! Got", snapshot.docs.length, "docs");

  } catch (error) {
    console.error("ERROR:");
    console.error(error.message);
    if (error.code) console.error("Code:", error.code);
  }
  process.exit(0);
}
run();
