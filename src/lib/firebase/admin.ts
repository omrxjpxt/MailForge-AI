import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const createFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  // Use environment variables for the service account
  // In production, these should be securely set
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Handle newlines in private key if passed via env var
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) {
    console.warn("Firebase Admin SDK missing required credentials.");
    // Fallback for development without credentials (will fail on actual DB/Auth calls)
    return initializeApp({
      projectId: projectId || "demo-project",
    });
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
};

const adminApp = createFirebaseAdminApp();
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
