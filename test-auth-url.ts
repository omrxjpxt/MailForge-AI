import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { google } from "googleapis";

function run() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const state = "test-state-123";

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    prompt: 'consent',
    state: state
  });

  console.log("=== OAUTH REQUEST INFO ===");
  console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);
  console.log("Redirect URI:", process.env.GOOGLE_REDIRECT_URI);
  console.log("Scopes Requested:", scopes);
  console.log("Generated URL:", authorizationUrl);
  
  // Parse URL to verify parameters
  const urlObj = new URL(authorizationUrl);
  console.log("\n=== URL PARAMETERS ===");
  for (const [key, value] of urlObj.searchParams.entries()) {
    console.log(`${key}: ${value}`);
  }
}

run();
