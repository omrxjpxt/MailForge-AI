import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    let decodedClaims;
    try {
      decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const error = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthStateCookie = request.cookies.get("oauth_state")?.value;

    // 1. Handle OAuth errors from Google (e.g., access_denied)
    if (error) {
      console.warn("Gmail OAuth error returned from Google:", error);
      const response = NextResponse.redirect(new URL(`/settings?tab=integrations&gmail_error=${error}`, request.url));
      response.cookies.delete("oauth_state");
      return response;
    }

    // 2. Validate state parameter to prevent CSRF
    if (!state || !oauthStateCookie || state !== oauthStateCookie) {
      console.warn("Gmail OAuth state mismatch or missing");
      const response = NextResponse.redirect(new URL("/settings?tab=integrations&gmail_error=invalid_state", request.url));
      response.cookies.delete("oauth_state");
      return response;
    }
    
    if (!code) {
      return NextResponse.redirect(new URL("/settings?tab=integrations&gmail_error=missing_code", request.url));
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    console.log("\n=== OAUTH CALLBACK RECEIVED TOKENS ===");
    console.log("Raw tokens scope string:", tokens.scope);
    console.log("Full tokens object keys:", Object.keys(tokens));
    console.log("Does scope include gmail.send?", tokens.scope?.includes("gmail.send"));
    console.log("=======================================\n");

    // Forensic audit dump
    try {
      const fs = require('fs');
      fs.writeFileSync('oauth_audit_dump.json', JSON.stringify({
        searchParams: Object.fromEntries(searchParams.entries()),
        tokens: tokens
      }, null, 2));
    } catch (e) {}

    // Save to Firestore
    if (tokens.refresh_token) {
      await adminDb.collection("users").doc(decodedClaims.sub).set({
        gmailRefreshToken: tokens.refresh_token,
        gmailConnected: true,
        gmailAuthError: null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    const response = NextResponse.redirect(new URL("/settings?tab=integrations&success=gmail_connected", request.url));
    response.cookies.delete("oauth_state");
    return response;
  } catch (error: unknown) {
    console.error("Error in Gmail callback:", error);
    
    // Check for specific token errors
    let errorCode = "oauth_failed";
    if (error && typeof error === "object" && "response" in error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resp = (error as any).response;
      if (resp?.data?.error) {
        errorCode = resp.data.error;
      }
    }
    
    const response = NextResponse.redirect(new URL(`/settings?tab=integrations&gmail_error=${errorCode}`, request.url));
    response.cookies.delete("oauth_state");
    return response;
  }
}

