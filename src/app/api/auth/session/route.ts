import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    // Verify ID token to get user profile data
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedIdToken;

    // Sync profile to Firestore
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    let firstName = "";
    let lastName = "";
    if (name) {
      const parts = name.trim().split(" ");
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ") || "";
    } else {
      // Fallback if no name, use email prefix
      firstName = email ? email.split("@")[0] : "";
    }

    const updates: any = {};
    if (!userSnap.exists) {
      updates.firstName = firstName;
      updates.lastName = lastName;
      updates.email = email || "";
      updates.photoURL = picture || null;
      updates.createdAt = new Date().toISOString();
      updates.updatedAt = new Date().toISOString();
      await userRef.set(updates);
    } else {
      const data = userSnap.data() || {};
      let needsUpdate = false;

      if (!data.firstName && firstName) {
        updates.firstName = firstName;
        needsUpdate = true;
      }
      if (!data.lastName && lastName) {
        updates.lastName = lastName;
        needsUpdate = true;
      }
      if (!data.photoURL && picture) {
        updates.photoURL = picture;
        needsUpdate = true;
      }
      if (data.email !== email) {
        updates.email = email || "";
        needsUpdate = true;
      }

      if (needsUpdate) {
        updates.updatedAt = new Date().toISOString();
        await userRef.update(updates);
      }
    }

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Create the session cookie.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const options = {
      name: "session",
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    };

    const response = NextResponse.json({ status: "success" });
    response.cookies.set(options);

    return response;
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No session found" }, { status: 400 });
    }

    // Revoke all sessions for the user
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      await adminAuth.revokeRefreshTokens(decodedClaims.sub);
    } catch {
      // Ignore if session is already invalid
    }

    // Clear the cookie
    const response = NextResponse.json({ status: "success" });
    response.cookies.set({
      name: "session",
      value: "",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error clearing session cookie:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
