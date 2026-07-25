import { generateWithFallback, getWorkingModel } from "@/lib/ai";
import { Lead } from "@/types/lead";
import { Schema, Type } from "@google/genai";

export async function generateAIEmailVariation(
  originalSubject: string,
  originalBody: string,
  leadData: Partial<Lead>,
  mode: "Smart" | "Deep",
  campaignGoal?: string
): Promise<{ subject: string; body: string; modelUsed: string; tokensUsed: number; timeMs: number }> {
  
  const startTime = Date.now();
  
  // Clean lead data by removing empty or null fields to avoid AI hallucinating missing info
  const cleanedLeadData = Object.entries(leadData).reduce((acc, [key, value]) => {
    if (value && String(value).trim() !== "") {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  let instructions = "";
  
  if (mode === "Smart") {
    instructions = `Rewrite ONLY the opening paragraph of the email using the provided lead data. The goal is to create a highly personalized hook that feels 1:1. 
The rest of the email (value prop, offer, CTA, links) MUST remain completely unchanged.
If a piece of lead data (like industry or jobTitle) is missing, do not attempt to use it.`;
  } else if (mode === "Deep") {
    instructions = `Rewrite the entire email to be deeply personalized for this specific lead based on their data. 
Make it sound natural, conversational, and tailored to their profile.
CRITICAL: You must preserve the core offer, the Call To Action (CTA), pricing, calendar links, and any URLs. Do not change the overall tone drastically.`;
  }

  const prompt = `You are an elite cold email copywriter. Your task is to personalize a cold email for a specific lead.

MODE: ${mode}
INSTRUCTIONS: ${instructions}
CAMPAIGN GOAL: ${campaignGoal || "Not specified"}

CRITICAL RULES:
1. NEVER modify any placeholders (e.g., {{firstName}}, {{company}}, etc). They MUST survive the rewrite EXACTLY as they appear, unless you are organically replacing them with the real lead data provided. Actually, DO NOT replace placeholders with real data in the text—keep the placeholders intact so the backend can swap them later. 
2. NEVER modify the Call To Action (CTA), pricing, calendar links, or any URLs.
3. NEVER hallucinate missing lead data. If "industry" is not provided, do not say "Since you are in the {{industry}} industry". Omit it naturally.
4. ONLY return a valid JSON object.

LEAD DATA (Use this context to personalize):
${JSON.stringify(cleanedLeadData, null, 2)}

ORIGINAL SUBJECT:
${originalSubject}

ORIGINAL BODY:
${originalBody}
`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      subject: {
        type: Type.STRING,
        description: "The personalized subject line."
      },
      body: {
        type: Type.STRING,
        description: "The personalized email body."
      }
    },
    required: ["subject", "body"]
  };

  try {
    const res = await generateWithFallback(prompt, {
      responseMimeType: "application/json",
      responseSchema,
      temperature: mode === "Smart" ? 0.4 : 0.7,
    });
    
    const text = res.text?.replace(/^```json\n|\n```$/g, "").trim() || "{}";
    const parsed = JSON.parse(text);
    
    if (!parsed.subject || !parsed.body) {
      throw new Error("AI returned malformed structure");
    }

    // Validation: Check that all original placeholders survived
    const extractPlaceholders = (text: string) => {
      const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
      return new Set(matches);
    };

    const originalPlaceholders = extractPlaceholders(originalSubject + " " + originalBody);
    const newPlaceholders = extractPlaceholders(parsed.subject + " " + parsed.body);
    
    for (const p of originalPlaceholders) {
      if (!newPlaceholders.has(p)) {
        throw new Error(`AI hallucinated or removed a placeholder: ${p}`);
      }
    }

    const timeMs = Date.now() - startTime;
    // Usage metadata is attached to the Gemini response object.
    const tokensUsed = res.usageMetadata?.totalTokenCount || 0;

    return {
      subject: parsed.subject,
      body: parsed.body,
      modelUsed: getWorkingModel(),
      tokensUsed,
      timeMs
    };
  } catch (error: unknown) {
    console.error(`AI Lead Personalization Failed (Mode: ${mode}):`, error);
    throw error;
  }
}
