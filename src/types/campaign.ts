import { z } from "zod";

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

export const CampaignSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  status: CampaignStatusEnum.default("Draft"),
  
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
export const CampaignLeadSchema = z.object({
  leadId: z.string(),
  status: z.enum(["Pending", "Sent", "Opened", "Replied", "Bounced", "Failed", "Completed"]).default("Pending"),
  sentAt: z.number().optional().nullable(),
  openedAt: z.number().optional().nullable(),
  repliedAt: z.number().optional().nullable(),
  failedAt: z.number().optional().nullable(),
  error: z.string().optional().nullable(),
  stepCompleted: z.number().default(0) // Which step index they are currently on/completed
});

export type CampaignLead = z.infer<typeof CampaignLeadSchema>;
