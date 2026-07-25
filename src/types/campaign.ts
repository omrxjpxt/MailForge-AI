import { z } from "zod";

export const AIPersonalizationSchema = z.object({
  enabled: z.boolean().default(false),
  strength: z.enum(["Low", "Medium", "High"]).default("Low"),
  fallbackBehavior: z.enum(["Original", "Skip", "Retry"]).default("Original")
});

export const CampaignStatusEnum = z.enum([
  "Draft",
  "Scheduled",
  "Running",
  "Paused",
  "Completed",
  "Failed",
  "Archived"
]);

export const CampaignStepSchema = z.object({
  stepId: z.string(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  waitDays: z.number().min(0, "Wait days cannot be negative"),
  sendAt: z.number().optional(), // Timestamp for scheduled step
  status: z.enum(["Pending", "Active", "Completed"]).default("Pending")
});

export const ExecutionNodeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("wait"),
    waitDays: z.number()
  }),
  z.object({
    type: z.literal("email"),
    stepId: z.string(),
    subject: z.string(),
    body: z.string()
  })
]);

export type ExecutionNode = z.infer<typeof ExecutionNodeSchema>;

export const CampaignSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  status: CampaignStatusEnum.default("Draft"),
  
  aiPersonalization: AIPersonalizationSchema.optional(),
  
  // Future-proof fields for execution engine
  sendingAccountId: z.string().optional().nullable(),
  currentStep: z.number().default(0),
  currentLeadIndex: z.number().default(0),
  nextExecutionAt: z.number().optional().nullable(),
  isProcessing: z.boolean().default(false),
  processingLock: z.string().optional().nullable(),
  
  leadIds: z.array(z.string()).default([]), // Selected lead IDs
  templateId: z.string().optional().nullable(), // Original template ID (if any)
  steps: z.array(CampaignStepSchema).default([]),
  executionNodes: z.array(ExecutionNodeSchema).optional(),
  
  dailyLimit: z.number().min(1).default(50),
  delayBetweenEmails: z.number().min(0).default(0), // in seconds/minutes, up to implementation
  timezone: z.string().default("UTC"),
  
  scheduledAt: z.number().optional().nullable(),
  startedAt: z.number().optional().nullable(),
  completedAt: z.number().optional().nullable(),
  
  // Metrics
  totalLeads: z.number().default(0),
  emailsSent: z.number().default(0),
  emailsDelivered: z.number().default(0),
  replies: z.number().default(0),
  opens: z.number().default(0),
  bounces: z.number().default(0),
  failures: z.number().default(0),
  progress: z.number().default(0), // Percentage 0-100
  
  aiGenerations: z.number().default(0),
  aiFallbacks: z.number().default(0),
  aiFailures: z.number().default(0),
  
  dailyEmailsSent: z.number().default(0),
  dailyEmailsSentDate: z.string().optional().nullable(), // YYYY-MM-DD
  
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Campaign = z.infer<typeof CampaignSchema>;
export type CampaignStep = z.infer<typeof CampaignStepSchema>;
export const CampaignInputSchema = CampaignSchema.omit({ id: true, userId: true, createdAt: true, updatedAt: true });
export type CampaignInput = z.infer<typeof CampaignInputSchema>;
export type CampaignStatus = z.infer<typeof CampaignStatusEnum>;

// Schema for the subcollection elements: users/{uid}/campaigns/{campaignId}/leads/{leadId}
export const CampaignLeadProgressSchema = z.object({
  leadId: z.string(),
  campaignId: z.string(),
  currentStepIndex: z.number().default(0), // Pointer to the execution node
  status: z.enum(["Running", "Paused", "Completed", "Failed", "Replied"]).default("Running"),
  nextExecutionAt: z.number().optional().nullable(),
  lastEmailSentAt: z.number().optional().nullable(),
  hasReplied: z.boolean().default(false),
  completed: z.boolean().default(false),
  error: z.string().optional().nullable(),
  generatedEmailCache: z.record(z.string(), z.object({
    subject: z.string(),
    body: z.string(),
    generatedAt: z.number(),
    modelUsed: z.string(),
    variationStrength: z.string()
  })).default({})
});

export type CampaignLeadProgress = z.infer<typeof CampaignLeadProgressSchema>;
