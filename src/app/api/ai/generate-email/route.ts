import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { generateStreamWithFallback } from "@/lib/ai";
import { checkRateLimit } from "@/lib/server/rate-limit";

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

    const body = await request.json();
    const { context, brandProfile, mode = "single" } = body;

    const systemInstruction = `You are an elite B2B cold email copywriter.
Your goal is to write a highly converting, concise, and personalized cold email.

Brand/Context:
${JSON.stringify({ ...context, ...brandProfile }, null, 2)}

Rules:
- Generate ${mode === "sequence" ? "a 4-step sequence (Initial, Follow-up 1, Follow-up 2, Breakup)" : "a single email"}.
- Return plain text.
- Do NOT output JSON. Use standard formatting.
- For each email, clearly label it, e.g., "[Initial Email]" followed by "[Subject]: ..." and then the body.
- Use placeholders like {{firstName}} or {{company}}.
- Adhere to the requested tone, length, and brand guidelines.`;

    const prompt = "Write the email(s) now based on the provided context.";

    const stream = await generateStreamWithFallback(prompt, {
      systemInstruction,
      temperature: 0.7,
    });

    // Create a ReadableStream for Server-Sent Events
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              const data = JSON.stringify({ text: chunk.text });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err: any) {
          const errorData = JSON.stringify({ error: err.message });
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error: any) {
    console.error("Error generating email stream:", error);
    return NextResponse.json({ error: error.message || "Failed to generate email" }, { status: 500 });
  }
}
