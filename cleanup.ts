import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { adminDb } from "./src/lib/firebase/admin";

async function cleanup() {
  const usersSnap = await adminDb.collection("users").limit(1).get();
  if (usersSnap.empty) return;
  const uid = usersSnap.docs[0].id;
  
  const campaignsSnap = await adminDb.collection(`users/${uid}/campaigns`).where("name", "==", "E2E Test Campaign").get();
  const batch = adminDb.batch();
  for (const doc of campaignsSnap.docs) {
    batch.delete(doc.ref);
    // Also delete leads
    const leadsSnap = await doc.ref.collection("campaignLeads").get();
    for (const lead of leadsSnap.docs) {
      batch.delete(lead.ref);
    }
  }
  await batch.commit();
  console.log(`Deleted ${campaignsSnap.size} campaigns`);
}
cleanup().catch(console.error);
