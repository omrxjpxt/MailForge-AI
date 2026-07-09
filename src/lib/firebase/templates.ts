import { db } from "./client";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { EmailTemplate, TemplateInput } from "@/types/template";

export const getTemplatesCollection = (userId: string) => {
  return collection(db, "users", userId, "templates");
};

export const createTemplate = async (userId: string, data: TemplateInput): Promise<string> => {
  const templatesRef = getTemplatesCollection(userId);
  const newDocRef = doc(templatesRef);
  
  const template: Omit<EmailTemplate, "id"> = {
    ...data,
    userId,
    usageCount: 0,
    replyCount: 0,
    openCount: 0,
    campaignCount: 0,
    version: 1,
    lastUsed: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(newDocRef, template);
  return newDocRef.id;
};

export const updateTemplate = async (userId: string, templateId: string, data: Partial<TemplateInput>): Promise<void> => {
  const templateRef = doc(db, "users", userId, "templates", templateId);
  
  await updateDoc(templateRef, {
    ...data,
    updatedAt: Date.now(),
  });
};

export const deleteTemplate = async (userId: string, templateId: string): Promise<void> => {
  const templateRef = doc(db, "users", userId, "templates", templateId);
  await deleteDoc(templateRef);
};

export const duplicateTemplate = async (userId: string, template: EmailTemplate): Promise<string> => {
  const { id, userId: _, usageCount, replyCount, openCount, campaignCount, lastUsed, createdAt, updatedAt, version, ...data } = template;
  
  const duplicatedData: TemplateInput = {
    ...data,
    name: `${data.name} (Copy)`,
  };

  return await createTemplate(userId, duplicatedData);
};

export const archiveTemplate = async (userId: string, templateId: string, isArchived: boolean = true): Promise<void> => {
  await updateTemplate(userId, templateId, { isArchived });
};
