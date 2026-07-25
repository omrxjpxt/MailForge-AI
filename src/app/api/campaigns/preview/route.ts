import { NextResponse, NextRequest } from "next/server";
import { generateAIEmailVariation } from "@/lib/server/ai-generator";
import { adminAuth } from "@/lib/firebase/admin";
import { checkRateLimit } from "@/lib/server/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decodedClaims;
    try {
      decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Rate Limit: 20 previews per minute per user
    if (!checkRateLimit(decodedClaims.sub, 20, 60 * 1000)) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }

    const { subject, body, lead, mode, campaignName } = await req.json();

    if (!subject || !body || !lead || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (mode === "Basic") {
      // Simple string replacement
      let finalSubject = subject;
      let finalBody = body;
      
      const replacePlaceholders = (text: string, data: Record<string, string>) => {
        return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
          return data[key.trim()] || match;
        });
      };

      finalSubject = replacePlaceholders(finalSubject, lead);
      finalBody = replacePlaceholders(finalBody, lead);

      return NextResponse.json({ subject: finalSubject, body: finalBody, mode: "Basic" });
    }

    // AI Modes
    const result = await generateAIEmailVariation(
      subject,
      body,
      lead,
      mode,
      campaignName || "Outreach"
    );

    // After AI returns the text with placeholders STILL intact (as per rules), we swap them
    let finalSubject = result.subject;
    let finalBody = result.body;

    const replacePlaceholders = (text: string, data: Record<string, string>) => {
      return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        return data[key.trim()] || match; // fallback to original placeholder if missing
      });
    };

    finalSubject = replacePlaceholders(finalSubject, lead);
    finalBody = replacePlaceholders(finalBody, lead);

    return NextResponse.json({ 
      subject: finalSubject, 
      body: finalBody, 
      mode,
      tokensUsed: result.tokensUsed,
      timeMs: result.timeMs
    });

  } catch (error: unknown) {
    console.error("Preview Generation Error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Failed to generate preview" }, { status: 500 });
  }
}
