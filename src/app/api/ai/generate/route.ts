import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { generateWithFallback, AIError } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify User Session
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await adminAuth.verifySessionCookie(sessionCookie);
    } catch (_error) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 2. Parse Request Body
    const { prompt, tone = "professional", context = "" } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 3. Construct the prompt for the model
    const systemInstruction = `You are an expert B2B cold email copywriter. 
Your goal is to write a highly converting, concise, and personalized cold email.
Tone: ${tone}
Context: ${context}

Rules:
- Keep it under 150 words.
- Focus on the prospect's problem, not just features.
- Include a clear, low-friction call to action.
- Use placeholders like {{firstName}} or {{companyName}} for personalization.
- Do NOT include a subject line in the main output, just the body.`;

    // 4. Generate content using the best available model
    const response = await generateWithFallback(prompt, {
      systemInstruction,
      temperature: 0.7,
    });

    return NextResponse.json({ 
      text: response.text,
      success: true
    });

  } catch (error: unknown) {
    if (error instanceof AIError) {
      console.error(`AIError (${error.status}):`, error.message);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    
    console.error("Error generating AI content:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate content" 
    }, { status: 500 });
  }
}
