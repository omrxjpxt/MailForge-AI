export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  tags: string[];
  category: string;
  
  // Content
  subject: string;
  body: string;
  
  // Analytics
  usageCount: number;
  replyCount: number;
  openCount: number;
  campaignCount: number;
  
  // Metadata
  favorite: boolean;
  isArchived: boolean;
  isAI: boolean;
  createdWithPrompt?: string;
  version: number;
  
  // Timestamps
  lastUsed: number;
  createdAt: number;
  updatedAt: number;
}

export type TemplateInput = Omit<EmailTemplate, "id" | "userId" | "usageCount" | "replyCount" | "openCount" | "campaignCount" | "lastUsed" | "createdAt" | "updatedAt" | "version">;
