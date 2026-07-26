import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { adminDb } from "./src/lib/firebase/admin";

async function findUser() {
  const usersSnap = await adminDb.collection("users").where("gmailRefreshToken", "!=", null).limit(1).get();
  if (usersSnap.empty) {
    console.log("NO_USER");
    return;
  }
  const uid = usersSnap.docs[0].id;
  const data = usersSnap.docs[0].data();
  console.log(`FOUND_USER: ${uid}`);
  console.log(`Has gmail token: ${!!data.gmailRefreshToken}`);
}
findUser().catch(console.error);
