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

    const body = await request.json();
    const { context, brandProfile } = body;

    const systemInstruction = `You are an expert cold email subject line writer. 
Generate 5 diverse, highly converting subject lines based on the context provided.
For each, estimate the quality (1-5 stars), spam risk (Low, Medium, High), tone, and curiosity level.
Return ONLY valid JSON.`;

    const prompt = `Context: ${JSON.stringify({ ...context, ...brandProfile })}`;

    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          quality: { type: Type.INTEGER, description: "1 to 5" },
          spamRisk: { type: Type.STRING, description: "Low, Medium, or High" },
          tone: { type: Type.STRING },
          curiosityLevel: { type: Type.STRING }
        },
        required: ["subject", "quality", "spamRisk", "tone", "curiosityLevel"]
      }
    };

    const response = await generateWithFallback(prompt, {
      systemInstruction,
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema,
    });

    const text = response.text?.replace(/^```json\n|\n```$/g, "").trim() || "[]";
    const parsed = JSON.parse(text);

    return NextResponse.json({ 
      subjects: parsed,
      success: true
    });

  } catch (error: any) {
    console.error("Error generating subjects:", error);
    return NextResponse.json({ error: error.message || "Failed to generate subjects" }, { status: 500 });
  }
}
