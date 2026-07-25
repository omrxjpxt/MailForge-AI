import { db } from "./client";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch
} from "firebase/firestore";
import { Lead, LeadInput } from "@/types/lead";

export const getLeadsCollection = (userId: string) => {
  return collection(db, "users", userId, "leads");
};

export const addLead = async (userId: string, data: LeadInput): Promise<string> => {
  const leadsRef = getLeadsCollection(userId);
  const newDocRef = doc(leadsRef);
  
  const lead: Omit<Lead, "id"> = {
    ...data,
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(newDocRef, lead);
  return newDocRef.id;
};

export const updateLead = async (userId: string, leadId: string, data: Partial<LeadInput>): Promise<void> => {
  const leadRef = doc(db, "users", userId, "leads", leadId);
  await updateDoc(leadRef, {
    ...data,
    updatedAt: Date.now(),
  });
};

export const deleteLead = async (userId: string, leadId: string): Promise<void> => {
  const leadRef = doc(db, "users", userId, "leads", leadId);
  await deleteDoc(leadRef);
};

export const duplicateLead = async (userId: string, lead: Lead): Promise<string> => {
  const { firstName, lastName, email, phone, company, jobTitle, website, linkedin, location, industry, companySize, status, tags, isArchived, source, notes, campaignId, emailVerified, createdByAI } = lead;
  
  const duplicatedData: LeadInput = {
    firstName: `${firstName} (Copy)`,
    lastName, email, phone, company, jobTitle, website, linkedin, location, industry, companySize, status, tags, isArchived, source, notes, campaignId, emailVerified, createdByAI
  };

  return await addLead(userId, duplicatedData);
};

export const archiveLead = async (userId: string, leadId: string, isArchived: boolean = true): Promise<void> => {
  await updateLead(userId, leadId, { isArchived });
};

export const bulkDeleteLeads = async (userId: string, leadIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  
  leadIds.forEach(id => {
    const leadRef = doc(db, "users", userId, "leads", id);
    batch.delete(leadRef);
  });

  await batch.commit();
};

export const bulkUpdateStatus = async (userId: string, leadIds: string[], status: string): Promise<void> => {
  const batch = writeBatch(db);
  
  leadIds.forEach(id => {
    const leadRef = doc(db, "users", userId, "leads", id);
    batch.update(leadRef, { 
      status,
      updatedAt: Date.now()
    });
  });

  await batch.commit();
};

export const batchImportLeads = async (userId: string, leads: LeadInput[]): Promise<void> => {
  const batch = writeBatch(db);
  const leadsRef = getLeadsCollection(userId);
  
  leads.forEach(leadData => {
    const newDocRef = doc(leadsRef);
    const lead: Omit<Lead, "id"> = {
      ...leadData,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    batch.set(newDocRef, lead);
  });

  await batch.commit();
};
