import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { processEngineTick } from "@/lib/server/engine";

export async function GET(request: NextRequest) {
  try {
    const usersSnap = await adminDb.collection("users").where("gmailRefreshToken", "!=", null).limit(1).get();
    if (usersSnap.empty) return NextResponse.json({ error: "No user" });
    const uid = usersSnap.docs[0].id;
    
    // Clear old test campaigns
    const allCamps = await adminDb.collection(`users/${uid}/campaigns`).get();
    const batch = adminDb.batch();
    for (const d of allCamps.docs) {
      if (d.data().name.includes("E2E Diagnose Campaign") || d.data().name.includes("E2E Trace Campaign")) {
        batch.delete(d.ref);
        const l = await d.ref.collection("campaignLeads").get();
        for (const c of l.docs) { batch.delete(c.ref); }
      }
    }
    await batch.commit();

    const leadRef = adminDb.collection(`users/${uid}/leads`).doc();
    await leadRef.set({
      id: leadRef.id,
      email: "trace@example.com",
      firstName: "Trace",
      status: "New",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const campRef = adminDb.collection(`users/${uid}/campaigns`).doc();
    const campaignDoc = {
      name: "E2E Trace Campaign",
      status: "Running",
      leadIds: [leadRef.id],
      totalLeads: 1,
      emailsSent: 0,
      dailyEmailsSentDate: new Date().toISOString().split("T")[0],
      dailyEmailsSent: 0,
      dailyLimit: 100,
      aiPersonalization: { enabled: false },
      executionNodes: [{ type: "email", stepId: "step-1", subject: "Trace Subject", body: "Trace Body", waitDays: 0 }],
      userId: uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await campRef.set(campaignDoc);

    const batch2 = adminDb.batch();
    const campLeadRef = adminDb.collection(`users/${uid}/campaigns/${campRef.id}/campaignLeads`).doc(leadRef.id);
    batch2.set(campLeadRef, {
      leadId: leadRef.id,
      campaignId: campRef.id,
      currentStepIndex: 0,
      status: "Running",
      nextExecutionAt: Date.now() - 10000,
      lastEmailSentAt: null,
      hasReplied: false,
      completed: false,
      error: null
    });
    await batch2.commit();
    
    // TRACE
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ");
      logs.push(msg);
      originalLog(...args); 
    };

    try {
      await processEngineTick(uid);
    } catch (e: any) {
      console.log(`FATAL DIAGNOSE ERROR: ${e.message}`);
    } finally {
      console.log = originalLog;
    }

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack });
  }
}
