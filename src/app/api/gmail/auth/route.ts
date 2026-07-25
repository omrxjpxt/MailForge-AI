import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }

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
    const state = crypto.randomUUID();

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      prompt: 'consent', // Force to get refresh token
      state: state
    });

    const response = NextResponse.redirect(authorizationUrl);
    
    // Set HTTP-only cookie for state validation (10 minutes)
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error("Error generating OAuth URL", error);
    return NextResponse.redirect(new URL("/settings?tab=integrations&gmail_error=server_error", request.url));
  }
}

