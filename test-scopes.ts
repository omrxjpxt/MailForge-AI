import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { google } from "googleapis";
import { adminDb } from "./src/lib/firebase/admin";

async function run() {
  const usersSnap = await adminDb.collection("users").where("gmailRefreshToken", "!=", null).limit(1).get();
  if (usersSnap.empty) {
    console.log("No user with refresh token");
    return;
  }
  const uid = usersSnap.docs[0].id;
  const userData = usersSnap.docs[0].data();

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({ refresh_token: userData.gmailRefreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  const tokenInfo = await oauth2Client.getTokenInfo(credentials.access_token!);
  
  console.log(JSON.stringify({
    uid,
    scopesGrantedToAccessToken: credentials.scope,
    tokenInfoScopes: tokenInfo.scopes,
    expectedScopeIncluded: tokenInfo.scopes.includes("https://www.googleapis.com/auth/gmail.send")
  }, null, 2));
}

run().catch(console.error);
