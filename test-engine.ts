import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { processEngineTick } from "./src/lib/server/engine";
import { adminDb } from "./src/lib/firebase/admin";

async function run() {
  const usersSnap = await adminDb.collection("users").where("gmailRefreshToken", "!=", null).limit(1).get();
  if (usersSnap.empty) return;
  const uid = usersSnap.docs[0].id;
  console.log(`Running engine for ${uid}...`);
  await processEngineTick(uid);
  console.log("Done");
}
run().catch(console.error);
