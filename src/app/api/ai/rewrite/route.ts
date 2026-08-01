import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { generateWithFallback, AIError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { Type, Schema } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decodedClaims;
    try {
      decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!checkRateLimit(decodedClaims.sub, 20, 60 * 1000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { subject, body, action } = await request.json();

    const actionInstructions: Record<string, string> = {
      "rewrite": "Rewrite the email to sound natural and highly converting. Keep the core message but use different wording.",
      "shorter": "Make the email significantly more concise without losing the core offer and CTA.",
      "longer": "Expand on the value proposition and benefits, making the email slightly longer and more detailed.",
      "professional": "Make the tone highly professional, formal, and corporate.",
      "friendly": "Make the tone warmer, more approachable, and conversational.",
      "personalized": "Add subtle elements that make it sound like a 1:1 email hand-typed by a human. Avoid sounding automated.",
      "improve-cta": "Make the Call To Action much stronger, lower friction, and more compelling.",
      "fix-grammar": "Fix any grammar, spelling, or flow issues while keeping the meaning exactly the same.",
      "direct": "Cut the fluff. Make the email extremely direct, blunt, and straight to the point.",
      "humor": "Inject a tiny bit of tasteful, professional humor or wit to stand out in the inbox."
    };

    const specificInstruction = actionInstructions[action] || actionInstructions["rewrite"];

    const systemInstruction = `You are an expert cold email copywriter.
Task: ${specificInstruction}

CRITICAL RULES:
1. Preserve all placeholders exactly as they are (e.g. {{firstName}}, {{company}}).
2. Do not invent new placeholders.
3. Return ONLY valid JSON with 'subject' and 'body'.`;

    const prompt = `Original Subject: ${subject}\n\nOriginal Body:\n${body}`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING },
        body: { type: Type.STRING }
      },
      required: ["subject", "body"]
    };

    const response = await generateWithFallback(prompt, {
      systemInstruction,
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema,
    });

    const text = response.text?.replace(/^```json\n|\n```$/g, "").trim() || "{}";
    const parsed = JSON.parse(text);

    return NextResponse.json({ 
      subject: parsed.subject || subject,
      body: parsed.body || body,
      success: true
    });

  } catch (error: any) {
    console.error("Error rewriting:", error);
    return NextResponse.json({ error: error.message || "Failed to rewrite email" }, { status: 500 });
  }
}
