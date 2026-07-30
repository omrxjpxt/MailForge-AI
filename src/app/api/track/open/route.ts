import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// A minimal 1x1 transparent GIF
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const campaignId = searchParams.get("campaignId");
  const leadId = searchParams.get("leadId");
  const stepId = searchParams.get("stepId");

  if (userId && campaignId && leadId && stepId) {
    try {
      // Find the specific email in history
      const historySnap = await adminDb
        .collection(`users/${userId}/emailHistory`)
        .where("campaignId", "==", campaignId)
        .where("leadId", "==", leadId)
        .where("stepId", "==", stepId)
        .limit(1)
        .get();

      if (!historySnap.empty) {
        const docRef = historySnap.docs[0].ref;
        const data = historySnap.docs[0].data();

        // Only process if it hasn't been opened yet (Unique Opens tracking)
        if (!data.opened) {
          const batch = adminDb.batch();

          // 1. Mark email history as opened
          batch.update(docRef, {
            opened: true,
            openedAt: Date.now()
          });

          // 2. Increment campaign open metrics
          const campaignRef = adminDb.collection(`users/${userId}/campaigns`).doc(campaignId);
          batch.update(campaignRef, {
            opens: FieldValue.increment(1)
          });

          // 3. Update Lead status conditionally (don't overwrite 'Replied' or something further along)
          const leadRef = adminDb.collection(`users/${userId}/leads`).doc(leadId);
          const leadSnap = await leadRef.get();
          if (leadSnap.exists) {
            const leadData = leadSnap.data();
            if (leadData?.status === "Contacted") {
              batch.update(leadRef, {
                status: "Opened",
                lastContactedAt: Date.now()
              });
            }
          }

          await batch.commit();
        }
      }
    } catch (error) {
      console.error("[Tracking] Error processing open event:", error);
      // We still return the image even if updating fails
    }
  }

  // Always return the transparent 1x1 GIF so Gmail proxy doesn't flag it as a broken image
  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}
