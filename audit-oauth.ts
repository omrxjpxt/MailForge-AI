import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { google } from "googleapis";
import * as fs from 'fs';

console.log("=== OAUTH AUDIT EVIDENCE ===\n");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  include_granted_scopes: true,
  prompt: 'consent',
  state: "audit-state"
});

console.log("1. Exact authorization URL generated:");
console.log(authUrl);

console.log("\n2. Exact scope array passed into generateAuthUrl():");
console.log(JSON.stringify(scopes, null, 2));

console.log("\n6. Google OAuth client ID:");
console.log(process.env.GOOGLE_CLIENT_ID);

console.log("\n7. Redirect URI:");
console.log(process.env.GOOGLE_REDIRECT_URI);

console.log("\n8. Verify callback route is using SAME oauth2Client instance:");
const authCode = fs.readFileSync('src/app/api/gmail/auth/route.ts', 'utf8');
const callbackCode = fs.readFileSync('src/app/api/gmail/callback/route.ts', 'utf8');

const authClientCode = authCode.match(/const oauth2Client = new google\.auth\.OAuth2\([\s\S]*?\);/)?.[0];
const callbackClientCode = callbackCode.match(/const oauth2Client = new google\.auth\.OAuth2\([\s\S]*?\);/)?.[0];

console.log("Auth route instantiation:\n" + authClientCode);
console.log("Callback route instantiation:\n" + callbackClientCode);
console.log("Are they identical? " + (authClientCode === callbackClientCode));

