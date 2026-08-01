import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { generateWithFallback, AIError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { Type, Schema } from "@google/genai";
import * as cheerio from "cheerio";

// Simple memory cache (URL -> JSON String)
// In a production app, use Redis or Firestore, but memory is fine for MVP
const cache = new Map<string, { data: any, expiresAt: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

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

    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // Ensure proper protocol
    const validUrl = url.startsWith("http") ? url : `https://${url}`;

    // Check cache
    const cached = cache.get(validUrl);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ result: cached.data, success: true });
    }

    // Fetch HTML
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    let html = "";
    
    try {
      const fetchRes = await fetch(validUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }
      });
      clearTimeout(timeout);
      
      if (!fetchRes.ok) {
        throw new Error(`Failed to fetch website (${fetchRes.status})`);
      }
      html = await fetchRes.text();
    } catch (e: any) {
      clearTimeout(timeout);
      console.warn("Website scraping failed, but we will return partial empty result.", e.message);
      return NextResponse.json({ error: "Could not read website content" }, { status: 400 });
    }

    // Extract raw text
    const $ = cheerio.load(html);
    
    // Remove unnecessary elements
    $("script, style, noscript, iframe, img, svg, video, audio").remove();
    
    const pageTitle = $("title").text() || "";
    const metaDescription = $("meta[name='description']").attr("content") || "";
    const bodyText = $("body").text().replace(/\s+/g, ' ').trim();
    
    // Limit text to avoid blowing up token limits (Gemini has huge limits, but good practice)
    const rawText = `TITLE: ${pageTitle}\nDESCRIPTION: ${metaDescription}\nCONTENT: ${bodyText.substring(0, 15000)}`;

    const systemInstruction = `You are an expert brand analyst. Analyze the following text extracted from a company's website homepage and extract key information for cold outreach.
Return ONLY valid JSON.
Do not invent information if it's missing from the text (use empty strings).`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        companyName: { type: Type.STRING, description: "Name of the company or brand." },
        productDescription: { type: Type.STRING, description: "Clear, concise 1-2 sentence description of what the product/service does." },
        industry: { type: Type.STRING, description: "The industry they operate in (e.g. B2B SaaS, Marketing Agency)." },
        targetAudience: { type: Type.STRING, description: "Who their ideal customer is based on the website copy." },
        valueProposition: { type: Type.STRING, description: "Their main value proposition or core benefit." },
        brandTone: { type: Type.STRING, description: "The tone of their website copy (e.g. Professional, Friendly, Casual, Direct)." }
      },
      required: ["companyName", "productDescription", "industry", "targetAudience", "valueProposition", "brandTone"]
    };

    const response = await generateWithFallback(`Extract information from this website text:\n\n${rawText}`, {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema,
    });

    const text = response.text?.replace(/^```json\n|\n```$/g, "").trim() || "{}";
    const parsed = JSON.parse(text);

    // Save to cache
    cache.set(validUrl, { data: parsed, expiresAt: Date.now() + CACHE_TTL });

    return NextResponse.json({ 
      result: parsed,
      success: true
    });

  } catch (error: any) {
    console.error("Error scraping website:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze website" }, { status: 500 });
  }
}
