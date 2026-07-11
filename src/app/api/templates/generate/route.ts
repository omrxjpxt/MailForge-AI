import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { adminAuth } from "@/lib/firebase/admin";

// Initialize Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verify User Session
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await adminAuth.verifySessionCookie(sessionCookie);
    } catch (error) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 2. Parse Request Body
    const { prompt, tone = "professional", context = "" } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 3. Construct the prompt
    const systemInstruction = `You are an expert B2B cold email copywriter. 
Your goal is to write a highly converting, concise, and personalized cold email template.
Tone: ${tone}
Context: ${context}

Rules:
- Keep the body under 150 words.
- Focus on the prospect's problem, not just features.
- Include a clear, low-friction call to action.
- Use placeholders like {{firstName}} or {{companyName}} for personalization.
- Provide a catchy, non-clickbaity subject line.
- Categorize the template into one of the following: Cold Outreach, Follow-up, Value-Add, Breakup, or Other.
- Provide 2-4 relevant tags.`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        subject: {
          type: Type.STRING,
          description: "The subject line of the email.",
        },
        body: {
          type: Type.STRING,
          description: "The body of the email. Can include basic HTML like <br> for line breaks.",
        },
        tone: {
          type: Type.STRING,
          description: "The tone used for the email.",
        },
        category: {
          type: Type.STRING,
          description: "The category of the email template.",
        },
        tags: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "2-4 tags describing the email.",
        },
      },
      required: ["subject", "body", "tone", "category", "tags"],
    };

    // 4. Generate content using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema,
      }
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini");
    }

    const generatedTemplate = JSON.parse(response.text);

    return NextResponse.json({ 
      template: generatedTemplate,
      success: true
    });

  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error("Error generating template:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to generate template" 
    }, { status: 500 });
  }
}
