import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  try {
    console.log("[Test] Writing to Firestore...");
    await adminDb.collection("test").doc("ping").set({ timestamp: new Date().toISOString() });
    console.log("[Test] Firestore write success!");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[Test] Firestore error:", e);
    return NextResponse.json({ success: false, error: e.message });
  }
}
