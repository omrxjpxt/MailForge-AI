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
    } catch (error) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const code = request.nextUrl.searchParams.get("code");
    
    if (!code) {
      return NextResponse.redirect(new URL("/settings?error=missing_code", request.url));
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    // Save to Firestore
    if (tokens.refresh_token) {
      await adminDb.collection("users").doc(decodedClaims.sub).update({
        gmailRefreshToken: tokens.refresh_token,
        gmailConnected: true,
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.redirect(new URL("/settings?success=gmail_connected", request.url));
  } catch (error) {
    console.error("Error in Gmail callback:", error);
    return NextResponse.redirect(new URL("/settings?error=auth_failed", request.url));
  }
}
