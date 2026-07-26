import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { processEngineTick } from "@/lib/server/engine";

export async function GET(request: NextRequest) {
  try {
    const usersSnap = await adminDb.collection("users").where("gmailRefreshToken", "!=", null).limit(1).get();
    if (usersSnap.empty) return NextResponse.json({ error: "No user" });
    const uid = usersSnap.docs[0].id;
    
    await processEngineTick(uid);

    const campaignsSnap = await adminDb.collection(`users/${uid}/campaigns`).where("name", "==", "E2E Test Campaign").get();
    
    const historySnap = await adminDb.collection(`users/${uid}/emailHistory`).get();
    const history = historySnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      processed: true,
      campaignsFound: campaignsSnap.size,
      historyCount: history.length,
      history: history
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack });
  }
}
