import { db } from "./client";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch
} from "firebase/firestore";
import { Campaign, CampaignInput, ExecutionNode, CampaignLeadProgress } from "@/types/campaign";

export const getCampaignsCollection = (userId: string) => {
  return collection(db, "users", userId, "campaigns");
};

export const createCampaign = async (userId: string, data: CampaignInput): Promise<string> => {
  const campaignsRef = getCampaignsCollection(userId);
  const newDocRef = doc(campaignsRef);
  // Translate UI steps to ExecutionNodes graph
  const executionNodes: ExecutionNode[] = [];
  
  if (data.steps && data.steps.length > 0) {
    data.steps.forEach((step, index) => {
      if (index === 0) {
        // First step is always an email immediately
        executionNodes.push({ type: "email", stepId: step.stepId, subject: step.subject, body: step.body });
      } else {
        // Subsequent steps have a wait delay, then an email
        if (step.waitDays > 0) {
          executionNodes.push({ type: "wait", waitDays: step.waitDays });
        }
        executionNodes.push({ type: "email", stepId: step.stepId, subject: step.subject, body: step.body });
      }
    });
  }

  const campaign: Omit<Campaign, "id"> = {
    ...data,
    executionNodes,
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(newDocRef, campaign);
  
  if ((campaign.status === "Scheduled" || campaign.status === "Running") && campaign.leadIds.length > 0) {
    // Initialize CampaignLeadProgress for every lead
    const batchSize = 400;
    for (let i = 0; i < campaign.leadIds.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = campaign.leadIds.slice(i, i + batchSize);
      
      chunk.forEach(leadId => {
        const leadRef = doc(db, "users", userId, "campaigns", newDocRef.id, "campaignLeads", leadId);
        const progress: CampaignLeadProgress = {
          leadId,
          campaignId: newDocRef.id,
          currentStepIndex: 0,
          status: "Running",
          nextExecutionAt: campaign.scheduledAt || Date.now(),
          lastEmailSentAt: null,
          hasReplied: false,
          completed: false,
          error: null,
          generatedEmailCache: {}
        };
        batch.set(leadRef, progress);
      });
      
      await batch.commit();
    }
  }
  
  return newDocRef.id;
};

export const updateCampaign = async (userId: string, campaignId: string, data: Partial<CampaignInput>): Promise<void> => {
  const campaignRef = doc(db, "users", userId, "campaigns", campaignId);
  await updateDoc(campaignRef, {
    ...data,
    updatedAt: Date.now(),
  });
};

export const deleteCampaign = async (userId: string, campaignId: string): Promise<void> => {
  const campaignRef = doc(db, "users", userId, "campaigns", campaignId);
  await deleteDoc(campaignRef);
};

export const duplicateCampaign = async (userId: string, campaign: Campaign): Promise<string> => {
  const { name, description, leadIds, templateId, steps, dailyLimit, delayBetweenEmails, timezone, totalLeads } = campaign;
  
  const duplicatedData: CampaignInput = {
    name: `${name} (Copy)`,
    description,
    leadIds,
    templateId,
    steps,
    dailyLimit,
    delayBetweenEmails,
    timezone,
    totalLeads,
    status: "Draft",
    aiPersonalization: campaign.aiPersonalization,
    
    // Reset metrics and execution state
    emailsSent: 0,
    emailsDelivered: 0,
    replies: 0,
    opens: 0,
    bounces: 0,
    failures: 0,
    progress: 0,
    aiGenerations: 0,
    aiFallbacks: 0,
    aiFailures: 0,
    currentStep: 0,
    currentLeadIndex: 0,
    isProcessing: false,
    processingLock: null,
    nextExecutionAt: null,
    startedAt: null,
    completedAt: null,
    dailyEmailsSent: 0,
    dailyEmailsSentDate: null,
  };

  return await createCampaign(userId, duplicatedData);
};

export const launchCampaign = async (userId: string, campaignId: string): Promise<void> => {
  // Sets the campaign to Running or Scheduled depending on scheduledAt
  await updateCampaign(userId, campaignId, {
    status: "Running",
    startedAt: Date.now()
  });
};

export const pauseCampaign = async (userId: string, campaignId: string): Promise<void> => {
  await updateCampaign(userId, campaignId, {
    status: "Paused"
  });
};

export const archiveCampaign = async (userId: string, campaignId: string): Promise<void> => {
  await updateCampaign(userId, campaignId, {
    status: "Archived"
  });
};

export const bulkDeleteCampaigns = async (userId: string, campaignIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  
  campaignIds.forEach(id => {
    const campaignRef = doc(db, "users", userId, "campaigns", id);
    batch.delete(campaignRef);
  });

  await batch.commit();
};
