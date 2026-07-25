import { GoogleGenAI, GenerateContentConfig, GenerateContentResponse } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

let cachedWorkingModel: string | null = null;

const PREFERRED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro"
];

export class AIError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "AIError";
  }
}

export function handleAIError(error: unknown): string {
  const err = error as Record<string, unknown>;
  const status = err?.status || err?.statusCode;
  
  if (status === 404) {
    return "AI model unavailable. Please try again.";
  }
  if (status === 429) {
    return "AI generation is temporarily unavailable because API quota has been reached.";
  }
  if (status === 401) {
    return "Server configuration error.";
  }
  
  return "Something went wrong.";
}

/**
 * Robust wrapper that tries models in order of preference until one succeeds.
 * It caches the first successful model to avoid latency on subsequent calls.
 */
export async function generateWithFallback(
  contents: string | Array<string | object>, 
  config?: GenerateContentConfig
): Promise<GenerateContentResponse> {
  const modelsToTry = cachedWorkingModel 
    ? [cachedWorkingModel, ...PREFERRED_MODELS.filter(m => m !== cachedWorkingModel)] 
    : PREFERRED_MODELS;

  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents,
        config
      });
      
      // If it succeeded, cache it
      cachedWorkingModel = model;
      return response;
    } catch (error: unknown) {
      lastError = error;
      const err = error as Record<string, unknown>;
      // If it's a 404 NOT_FOUND, try the next one
      if (err?.status === 404) {
        console.warn(`Model ${model} returned 404, falling back...`);
        continue;
      }
      
      // For any other error (e.g. 429 Resource Exhausted, 400 Bad Request, 500), throw
      throw new AIError(handleAIError(error), (err?.status as number) || 500);
    }
  }

  const finalErr = lastError as Record<string, unknown>;
  throw new AIError(handleAIError(lastError), (finalErr?.status as number) || 500);
}
