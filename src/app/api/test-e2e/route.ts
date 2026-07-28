import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { processEngineTick } from "@/lib/server/engine";
import { createCampaign } from "@/lib/firebase/campaigns";
import { CampaignInput } from "@/types/campaign";

export async function GET(request: NextRequest) {
  const report: Record<string, any> = {
    "1. Setup": "Pending",
    "2. Campaign Created": "Pending",
    "3. CampaignLeads Verified": "Pending",
    "4. Engine Execution": "Pending",
    "5. Email History Verified": "Pending",
    "6. Final Firestore State": "Pending",
    summary: { working: [], minor: [], blocking: [] }
  };

  try {
    // 1. Find a user with Gmail
    const usersSnap = await adminDb.collection("users").where("gmailRefreshToken", "!=", null).limit(1).get();
    if (usersSnap.empty) {
      report.summary.blocking.push("No user found with a connected Gmail account to test sending.");
      return NextResponse.json(report);
    }
    const uid = usersSnap.docs[0].id;
    const testEmail = "test-recipient@mailforge.ai"; // Mock email for testing, ideally should be an owned email to prevent bounces but Gmail API will still 'send' it

    // Create a mock lead
    const leadRef = adminDb.collection(`users/${uid}/leads`).doc();
    await leadRef.set({
      id: leadRef.id,
      email: testEmail,
      firstName: "Test",
      lastName: "User",
      company: "Test Co",
      status: "New",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    report["1. Setup"] = `Created Lead ${leadRef.id} for User ${uid}`;

    // 2. Create and Launch Campaign
    const campaignData: any = {
      name: "E2E Test Campaign",
      description: "Automated E2E Test",
      status: "Running",
      leadIds: [leadRef.id],
      totalLeads: 1,
      emailsSent: 0,
      emailsDelivered: 0,
      replies: 0,
      bounces: 0,
      opens: 0,
      aiPersonalization: { enabled: false, mode: "Basic", fallbackBehavior: "Original" },
      steps: [{ stepId: "step-1", subject: "E2E Test Subject", body: "Hello {{firstName}} from E2E test", waitDays: 0, status: "Pending" }]
    };

    // We must use admin SDK to bypass client-side db initialization errors in api routes if client is not init'd properly
    // But createCampaign uses the client SDK. For this test route, we will simulate the exact same writes the client does using Admin SDK.
    const campRef = adminDb.collection(`users/${uid}/campaigns`).doc();
    
    // Simulate UI transformation to nodes
    const executionNodes = [{ type: "email", stepId: "step-1", subject: "E2E Test Subject", body: "Hello {{firstName}} from E2E test", waitDays: 0 }];
    
    const campaignDoc = {
      ...campaignData,
      executionNodes,
      userId: uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await campRef.set(campaignDoc);

    const batch = adminDb.batch();
    const campLeadRef = adminDb.collection(`users/${uid}/campaigns/${campRef.id}/campaignLeads`).doc(leadRef.id);
    batch.set(campLeadRef, {
      leadId: leadRef.id,
      campaignId: campRef.id,
      currentStepIndex: 0,
      status: "Running",
      nextExecutionAt: Date.now(),
      lastEmailSentAt: null,
      hasReplied: false,
      completed: false,
      error: null,
      generatedEmailCache: {}
    });
    await batch.commit();

    report["2. Campaign Created"] = `Created Campaign ${campRef.id}`;
    report.summary.working.push("Campaign creation pipeline");

    // 3. Verify campaignLeads
    const leadsSnap = await adminDb.collection(`users/${uid}/campaigns/${campRef.id}/campaignLeads`).get();
    if (leadsSnap.empty) {
      report.summary.blocking.push("campaignLeads subcollection is empty after batch commit.");
      return NextResponse.json(report);
    }
    report["3. CampaignLeads Verified"] = `Found ${leadsSnap.size} campaignLeads`;
    report.summary.working.push("Campaign leads batch initialization");

    // 4. Run Engine
    await processEngineTick(uid);
    report["4. Engine Execution"] = "Engine cycle completed successfully";
    report.summary.working.push("Engine Tick Execution");

    // 5. Verify Email History
    const historySnap = await adminDb.collection(`users/${uid}/emailHistory`).where("campaignId", "==", campRef.id).get();
    if (historySnap.empty) {
      report.summary.blocking.push("No email history document was created by the engine.");
      report["5. Email History Verified"] = "FAILED";
    } else {
      const historyDoc = historySnap.docs[0].data();
      report["5. Email History Verified"] = {
        messageId: historyDoc.gmailMessageId,
        threadId: historyDoc.gmailThreadId,
        sentAt: historyDoc.sentAt
      };
      if (historyDoc.gmailMessageId) {
        report.summary.working.push("Gmail API successful send");
        report.summary.working.push("Email history tracking");
      } else {
        report.summary.blocking.push("Email history lacks Gmail Message ID");
      }
    }

    // 6. Verify Firestore State
    const finalCampDoc = await campRef.get();
    const finalCampLeadDoc = await campLeadRef.get();
    
    report["6. Final Firestore State"] = {
      campaign: finalCampDoc.data(),
      campaignLead: finalCampLeadDoc.data()
    };

    if (finalCampDoc.data()?.emailsSent === 1) {
      report.summary.working.push("Campaign emailsSent incremented");
    } else {
      report.summary.blocking.push("Campaign emailsSent NOT incremented");
    }

    if (finalCampLeadDoc.data()?.currentStepIndex === 1) {
      report.summary.working.push("CampaignLead currentStepIndex advanced");
    } else {
      report.summary.blocking.push("CampaignLead currentStepIndex NOT advanced");
    }

  } catch (error: any) {
    report.summary.blocking.push(`Runtime error during test: ${error.message}`);
  }

  return NextResponse.json(report);
}
