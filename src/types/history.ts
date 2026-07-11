import { z } from "zod";

export const EmailHistorySchema = z.object({
  id: z.string().optional(),
  campaignId: z.string(),
  leadId: z.string(),
  stepId: z.string(),
  stepNumber: z.number().default(0), // Which step index this was
  
  gmailMessageId: z.string().optional().nullable(),
  gmailThreadId: z.string().optional().nullable(),
  
  subject: z.string(),
  body: z.string(), // Snapshot of the rendered body
  
  sentAt: z.number(),
  status: z.enum(["Sent", "Failed", "Bounced"]).default("Sent"),
  retryCount: z.number().default(0),
  error: z.string().optional().nullable()
});

export type EmailHistory = z.infer<typeof EmailHistorySchema>;
