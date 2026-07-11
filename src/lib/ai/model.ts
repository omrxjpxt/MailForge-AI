import { GoogleGenAI, GenerateContentConfig, GenerateContentResponse } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash"; // Single source of truth default

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

/**
 * Robust wrapper that tries models in order of preference until one succeeds.
 * It caches the first successful model to avoid latency on subsequent calls.
 */
export async function generateWithFallback(
  contents: any, 
  config?: GenerateContentConfig
): Promise<GenerateContentResponse> {
  const modelsToTry = cachedWorkingModel 
    ? [cachedWorkingModel, ...PREFERRED_MODELS.filter(m => m !== cachedWorkingModel)] 
    : PREFERRED_MODELS;

  let lastError: any;

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
    } catch (error: any) {
      lastError = error;
      // If it's a 404 NOT_FOUND, try the next one
      if (error?.status === 404) {
        console.warn(`Model ${model} returned 404, falling back...`);
        continue;
      }
      
      // For any other error (e.g. 429 Resource Exhausted, 400 Bad Request, 500), throw immediately
      throw error;
    }
  }

  throw new Error(`All fallback models failed. Last error: ${lastError?.message || String(lastError)}`);
}
