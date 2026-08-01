import { z } from "zod";

export const BrandProfileSchema = z.object({
  companyName: z.string().optional().default(""),
  description: z.string().optional().default(""),
  website: z.string().optional().default(""),
  brandVoice: z.string().optional().default(""),
  writingStyle: z.string().optional().default(""),
  tone: z.string().optional().default("Professional"),
  preferredCTA: z.string().optional().default(""),
  targetCustomer: z.string().optional().default(""),
  signature: z.string().optional().default(""),
  forbiddenWords: z.array(z.string()).optional().default([]),
});

export type BrandProfile = z.infer<typeof BrandProfileSchema>;

export const AIGenerationContextSchema = z.object({
  productName: z.string().optional().default(""),
  productDescription: z.string().optional().default(""),
  targetAudience: z.string().optional().default(""),
  campaignGoal: z.string().optional().default(""),
  cta: z.string().optional().default(""),
  tone: z.string().optional().default("Professional"),
  emailLength: z.enum(["Short", "Medium", "Long"]).optional().default("Medium"),
  personalizationLevel: z.enum(["Basic", "Smart", "Deep AI"]).optional().default("Basic"),
  websiteUrl: z.string().optional().default(""),
  useBrandProfile: z.boolean().optional().default(true),
});

export type AIGenerationContext = z.infer<typeof AIGenerationContextSchema>;

export type GeneratedEmail = {
  id: string; // for React keys
  subject: string;
  body: string;
  label?: string; // e.g. "Initial Email", "Follow-up #1"
};

export type SubjectQuality = {
  subject: string;
  quality: number; // 1-5 stars
  spamRisk: "Low" | "Medium" | "High";
  tone: string;
  curiosityLevel: string;
};

export type SpamAnalysis = {
  score: number; // 0-100 (higher is better/cleaner)
  triggerWords: string[];
  hasTooManyLinks: boolean;
  hasCapitalizationIssues: boolean;
  hasExcessiveExclamation: boolean;
  readingGrade: string;
  ctaClarity: string;
  inboxFriendliness: string;
  suggestions: string[];
};

export type RewriteAction = 
  | "rewrite"
  | "shorter"
  | "longer"
  | "professional"
  | "friendly"
  | "personalized"
  | "improve-cta"
  | "fix-grammar"
  | "direct"
  | "humor";
