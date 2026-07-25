import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { processEngineTick } from "@/lib/server/engine";

// Vercel Cron sends an Authorization header with Bearer CRON_SECRET
// We also allow a custom dev secret for local testing
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    if (!CRON_SECRET) {
      console.error("Missing CRON_SECRET environment variable");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    
    // Support both Bearer token (Vercel Cron) and custom X-Cron-Secret (Dev manual trigger)
    const isValidCron = authHeader === `Bearer ${CRON_SECRET}`;
    const isValidDev = request.headers.get("x-cron-secret") === CRON_SECRET;

    if (!isValidCron && !isValidDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a multi-tenant app, we'd query all users who have active campaigns.
    // For MailForge AI, we find users with active campaigns and process them.
    // To prevent Vercel timeouts, we might want to process a small batch of users.
    
    // For now, we fetch all users who have 'gmailRefreshToken' connected and process them
    const usersSnap = await adminDb
      .collection("users")
      .where("gmailRefreshToken", "!=", null)
      .limit(10) // Limit to avoid timeout in serverless
      .get();

    const processingPromises = usersSnap.docs.map(userDoc => {
      return processEngineTick(userDoc.id).catch(e => {
        console.error(`Engine failed for user ${userDoc.id}:`, e);
      });
    });

    await Promise.allSettled(processingPromises);

    return NextResponse.json({ success: true, processedUsers: usersSnap.docs.length });
  } catch (error: unknown) {
    console.error("Cron Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Allow manual POST triggers for development using the same logic
  return GET(request);
}
