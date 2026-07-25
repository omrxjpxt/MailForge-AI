import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function run() {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello",
    });
    console.log("Success:", res.text);
  } catch (err) {
    console.error("Error generating content:");
    console.error("Status:", err.status);
    console.error("Message:", err.message);
  }
}

run();
