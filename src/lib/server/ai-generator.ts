import { generateWithFallback, getWorkingModel } from "@/lib/ai";

export async function generateAIEmailVariation(
  originalSubject: string,
  originalBody: string,
  strength: "Low" | "Medium" | "High"
): Promise<{ subject: string; body: string; modelUsed: string }> {
  let instructions = "";
  
  if (strength === "Low") {
    instructions = "Make very minor wording tweaks. Keep it 95% identical to the original.";
  } else if (strength === "Medium") {
    instructions = "Restructure sentences, change greetings and transitions slightly, but keep the exact same flow.";
  } else if (strength === "High") {
    instructions = "Completely rewrite the email for a fresh flow and different sentence structure while keeping the exact same intent and meaning.";
  }

  const prompt = `You are an elite cold email copywriter. Your task is to generate a unique variation of the provided cold email.

STRENGTH LEVEL: ${strength}
INSTRUCTIONS: ${instructions}

CRITICAL RULES:
1. NEVER modify any placeholders (e.g., {{firstName}}, {{company}}, etc). They MUST survive the rewrite EXACTLY as they appear.
2. NEVER modify the Call To Action (CTA), pricing, calendar links, or any URLs.
3. NEVER add new placeholders or hallucinate information not present in the original.
4. ONLY return a valid JSON object. Do not wrap in markdown blocks.

JSON FORMAT REQUIRED:
{
  "subject": "The rewritten subject line",
  "body": "The rewritten body text including preserved placeholders"
}

ORIGINAL SUBJECT:
${originalSubject}

ORIGINAL BODY:
${originalBody}
`;

  try {
    const res = await generateWithFallback(prompt, {
      responseMimeType: "application/json",
      temperature: strength === "Low" ? 0.2 : strength === "Medium" ? 0.7 : 0.9,
    });
    
    // Attempt to parse JSON response
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

    return {
      subject: parsed.subject,
      body: parsed.body,
      // The current model is somewhat abstracted inside generateWithFallback, 
      // but assuming the wrapper resolves to the successful model.
      modelUsed: getWorkingModel(), 
    };
  } catch (error: any) {
    console.error("AI Variation Generation Failed:", error);
    throw error;
  }
}
