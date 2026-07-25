import { NextRequest, NextResponse } from "next/server";
import { Type, Schema } from "@google/genai";
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
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 2. Parse Request Body
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 3. Construct the prompt
    const systemInstruction = `You are an elite SDR and B2B cold email copywriter.

Your job is to generate production-ready email templates that can be saved and used immediately.

Return ONLY valid JSON.

Schema:

{
  "templateName": string,
  "description": string,
  "tags": string[],
  "subject": string,
  "body": string
}

Rules:

- Return plain text only.
- Never return HTML.
- Never use <br>, <p>, <div>, or Markdown.
- Use \\n\\n for paragraph spacing.
- Automatically generate:
  - Template Name
  - Description
  - Tags
  - Subject
  - Email Body
- The email body must already be perfectly formatted.
- Use these placeholders whenever appropriate:

{{firstName}}
{{lastName}}
{{company}}
{{jobTitle}}
{{industry}}
{{email}}

- Never ask the user to manually replace company names.
- Never invent unsupported placeholders.
- Keep the email concise, conversational, and high-converting.
- Include one clear CTA.
- Return JSON only. No explanations or code fences.`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        templateName: {
          type: Type.STRING,
          description: "The name of the template.",
        },
        description: {
          type: Type.STRING,
          description: "The description of the template.",
        },
        subject: {
          type: Type.STRING,
          description: "The subject line of the email.",
        },
        body: {
          type: Type.STRING,
          description: "The body of the email.",
        },
        tags: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "2-4 tags describing the email.",
        },
      },
      required: ["templateName", "description", "subject", "body", "tags"],
    };

    // 4. Generate content using Gemini
    const response = await generateWithFallback(prompt, {
      systemInstruction,
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema,
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini");
    }

    const generatedTemplate = JSON.parse(response.text);

    return NextResponse.json({ 
      template: generatedTemplate,
      success: true
    });

  } catch (error: unknown) {
    if (error instanceof AIError) {
      console.error(`AIError (${error.status}):`, error.message);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error generating template:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate template" 
    }, { status: 500 });
  }
}
