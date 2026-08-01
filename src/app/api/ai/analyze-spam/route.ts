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

    if (!checkRateLimit(decodedClaims.sub, 15, 60 * 1000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { subject, body } = await request.json();

    const systemInstruction = `You are an expert cold email deliverability analyst.
Analyze the following email subject and body for spam triggers, reading difficulty, and inbox friendliness.
Provide actionable suggestions to improve deliverability.
Return ONLY valid JSON.`;

    const prompt = `Subject: ${subject}\n\nBody:\n${body}`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Deliverability score from 0 to 100" },
        triggerWords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of spam trigger words found" },
        hasTooManyLinks: { type: Type.BOOLEAN },
        hasCapitalizationIssues: { type: Type.BOOLEAN },
        hasExcessiveExclamation: { type: Type.BOOLEAN },
        readingGrade: { type: Type.STRING, description: "e.g., '6th Grade', 'College Level'" },
        ctaClarity: { type: Type.STRING, description: "e.g., 'Clear', 'Confusing'" },
        inboxFriendliness: { type: Type.STRING, description: "Short summary of inbox friendliness" },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable improvements" }
      },
      required: [
        "score", "triggerWords", "hasTooManyLinks", "hasCapitalizationIssues", 
        "hasExcessiveExclamation", "readingGrade", "ctaClarity", "inboxFriendliness", "suggestions"
      ]
    };

    const response = await generateWithFallback(prompt, {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema,
    });

    const text = response.text?.replace(/^```json\n|\n```$/g, "").trim() || "{}";
    const parsed = JSON.parse(text);

    return NextResponse.json({ 
      analysis: parsed,
      success: true
    });

  } catch (error: any) {
    console.error("Error analyzing spam:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze spam" }, { status: 500 });
  }
}
