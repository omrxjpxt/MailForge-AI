import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  console.log("[OAuth Trace] --- Starting /api/gmail/callback ---");
  try {
    console.log("[OAuth Trace] Checking session cookie");
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      console.log("[OAuth Trace] No session cookie found, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    let decodedClaims;
    try {
      console.log("[OAuth Trace] Verifying session cookie with adminAuth");
      decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      console.log("[OAuth Trace] Session verified successfully for user:", decodedClaims.uid);
    } catch (err) {
      console.error("[OAuth Trace] Session verification failed:", err);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const error = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthStateCookie = request.cookies.get("oauth_state")?.value;

    console.log("[OAuth Trace] Query Params - error:", error ? "Present" : "Missing");
    console.log("[OAuth Trace] Query Params - code:", code ? "Present" : "Missing");
    console.log("[OAuth Trace] Query Params - state:", state ? "Present" : "Missing");
    console.log("[OAuth Trace] Cookies - oauth_state:", oauthStateCookie ? "Present" : "Missing");

    // 1. Handle OAuth errors from Google (e.g., access_denied)
    if (error) {
      console.warn("[OAuth Trace] Gmail OAuth error returned from Google:", error);
      const response = NextResponse.redirect(new URL(`/settings?tab=integrations&gmail_error=${error}`, request.url));
      response.cookies.delete("oauth_state");
      return response;
    }

    // 2. Validate state parameter to prevent CSRF
    if (!state || !oauthStateCookie || state !== oauthStateCookie) {
      console.warn("[OAuth Trace] Gmail OAuth state mismatch or missing");
      console.log("[OAuth Trace] Expected:", oauthStateCookie, "Got:", state);
      const response = NextResponse.redirect(new URL("/settings?tab=integrations&gmail_error=invalid_state", request.url));
      response.cookies.delete("oauth_state");
      return response;
    }
    
    if (!code) {
      console.log("[OAuth Trace] No authorization code found in URL");
      return NextResponse.redirect(new URL("/settings?tab=integrations&gmail_error=missing_code", request.url));
    }

    console.log("[OAuth Trace] Exchanging authorization code for tokens using native fetch");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[OAuth Trace] Token exchange failed:", errorText);
      throw new Error("Token exchange failed");
    }

    const tokens = await tokenResponse.json();
    console.log("[OAuth Trace] Tokens received:", {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
    });

    // Save to Firestore
    if (tokens.refresh_token) {
      console.log("[OAuth Trace] Saving refresh token to Firestore for user:", decodedClaims.uid || decodedClaims.sub);
      await adminDb.collection("users").doc(decodedClaims.sub).set({
        gmailRefreshToken: tokens.refresh_token,
        gmailConnected: true,
        gmailAuthError: null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("[OAuth Trace] Firestore update successful");
    } else {
      console.log("[OAuth Trace] WARNING: No refresh token returned by Google (was it already granted?)");
    }

    console.log("[OAuth Trace] --- Finishing /api/gmail/callback successfully ---");
    console.log("[OAuth Trace] Redirecting to dashboard/settings");
    const response = NextResponse.redirect(new URL("/settings?tab=integrations&success=gmail_connected", request.url));
    response.cookies.delete("oauth_state");
    return response;
  } catch (error: unknown) {
    console.error("[OAuth Trace] Error in Gmail callback:", error);
    if (error instanceof Error) {
      console.error("[OAuth Trace] Error message:", error.message);
      console.error("[OAuth Trace] Error stack:", error.stack);
    }
    
    // Check for specific token errors
    let errorCode = "oauth_failed";
    if (error && typeof error === "object" && "response" in error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resp = (error as any).response;
      if (resp?.data?.error) {
        errorCode = resp.data.error;
        console.error("[OAuth Trace] API Error Code:", errorCode);
        console.error("[OAuth Trace] API Error Description:", resp?.data?.error_description);
      }
    }
    
    const response = NextResponse.redirect(new URL(`/settings?tab=integrations&gmail_error=${errorCode}`, request.url));
    response.cookies.delete("oauth_state");
    return response;
  }
}

