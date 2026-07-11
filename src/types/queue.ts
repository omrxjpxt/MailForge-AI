import { z } from "zod";

export const SendJobStatusEnum = z.enum([
  "Pending",    // Waiting to be sent
  "Processing", // Picked up by the engine
  "Failed",     // Failed and might be retried
  "Dead"        // Exhausted retries or fatal error
]);

export const SendQueueJobSchema = z.object({
  id: z.string().optional(),
  campaignId: z.string(),
  leadId: z.string(),
  stepId: z.string(),
  scheduledFor: z.number(), // Timestamp for when it should be sent
  status: SendJobStatusEnum.default("Pending"),
  retryCount: z.number().default(0),
  lockedAt: z.number().optional().nullable(),
  processingNode: z.string().optional().nullable(),
  createdAt: z.number()
});

export type SendQueueJob = z.infer<typeof SendQueueJobSchema>;
export type SendJobStatus = z.infer<typeof SendJobStatusEnum>;
