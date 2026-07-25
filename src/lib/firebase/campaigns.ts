import { db } from "./client";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch
} from "firebase/firestore";
import { Campaign, CampaignInput } from "@/types/campaign";

export const getCampaignsCollection = (userId: string) => {
  return collection(db, "users", userId, "campaigns");
};

export const createCampaign = async (userId: string, data: CampaignInput): Promise<string> => {
  const campaignsRef = getCampaignsCollection(userId);
  const newDocRef = doc(campaignsRef);
  
  const campaign: Omit<Campaign, "id"> = {
    ...data,
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(newDocRef, campaign);
  
  // Note: For a production execution engine, we would also initialize the 
  // users/{uid}/campaigns/{campaignId}/leads/{leadId} subcollection here 
  // or via a Cloud Function triggers when status changes to 'Scheduled' or 'Running'.
  
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
    
    // Reset metrics and execution state
    emailsSent: 0,
    emailsDelivered: 0,
    replies: 0,
    opens: 0,
    bounces: 0,
    failures: 0,
    progress: 0,
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
