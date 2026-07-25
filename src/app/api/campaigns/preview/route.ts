import { NextResponse } from "next/server";
import { generateAIEmailVariation } from "@/lib/server/ai-generator";

export async function POST(req: Request) {
  try {
    const { subject, body, lead, mode, campaignName } = await req.json();

    if (!subject || !body || !lead || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (mode === "Basic") {
      // Simple string replacement
      let finalSubject = subject;
      let finalBody = body;
      
      const replacePlaceholders = (text: string, data: any) => {
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

    const replacePlaceholders = (text: string, data: any) => {
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

  } catch (error: any) {
    console.error("Preview Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate preview" }, { status: 500 });
  }
}
