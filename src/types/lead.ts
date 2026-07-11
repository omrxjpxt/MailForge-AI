import { z } from "zod";

export const LeadStatusEnum = z.enum([
  "New",
  "Contacted",
  "Follow-up Scheduled",
  "Replied",
  "Interested",
  "Meeting Booked",
  "Closed Won",
  "Closed Lost",
]);

export const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  industry: z.string().min(1, "Industry is required"),
  companySize: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  source: z.enum(["Manual", "CSV"]).default("Manual"),
  status: LeadStatusEnum.default("New"),
  campaignId: z.string().optional(),
  emailVerified: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  createdByAI: z.boolean().default(false),
});

export type LeadInput = z.infer<typeof leadSchema>;

export interface Lead extends LeadInput {
  id: string;
  userId: string;
  lastContactedAt?: number | null;
  lastRepliedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}
