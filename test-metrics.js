const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin-sdk.json");
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
async function run() {
  const db = admin.firestore();
  const campSnap = await db.collection("users/OXBQzA8ZUqgWQjJ0rOYCaijqdaj1/campaigns").doc("nCd2dv2OQ05yToaOl0I3").get();
  console.log("Campaign metrics after open:", campSnap.data());
  process.exit(0);
}
run();
