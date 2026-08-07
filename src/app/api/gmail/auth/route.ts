import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  console.log("[OAuth Trace] --- Starting /api/gmail/auth ---");
  try {
    console.log("[OAuth Trace] Checking session cookie");
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      console.log("[OAuth Trace] No session cookie found, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      console.log("[OAuth Trace] Verifying session cookie with adminAuth");
      await adminAuth.verifySessionCookie(sessionCookie);
      console.log("[OAuth Trace] Session verified successfully");
    } catch (err) {
      console.error("[OAuth Trace] Session verification failed:", err);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    console.log("[OAuth Trace] Initializing oauth2Client");
    console.log("[OAuth Trace] Client ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "Missing");
    console.log("[OAuth Trace] Client Secret:", process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Missing");
    console.log("[OAuth Trace] Redirect URI:", process.env.GOOGLE_REDIRECT_URI);
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    // Generate secure state
    console.log("[OAuth Trace] Generating random state");
    const state = crypto.randomUUID();

    console.log("[OAuth Trace] Generating auth URL");
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      prompt: 'consent', // Force to get refresh token
      state: state
    });

    console.log("[OAuth Trace] Creating redirect response to:", authorizationUrl.split("?")[0] + "?...");
    const response = NextResponse.redirect(authorizationUrl);
    
    // Set HTTP-only cookie for state validation (10 minutes)
    console.log("[OAuth Trace] Setting oauth_state cookie:", state);
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/'
    });

    console.log("[OAuth Trace] --- Finishing /api/gmail/auth successfully ---");
    return response;
  } catch (error) {
    console.error("[OAuth Trace] Error generating OAuth URL:", error);
    return NextResponse.redirect(new URL("/settings?tab=integrations&gmail_error=server_error", request.url));
  }
}

