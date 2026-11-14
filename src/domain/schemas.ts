import { z } from "zod";

export const userRoleSchema = z.enum([
  "admin",
  "medical_reviewer",
  "medical_information_specialist",
  "msl",
  "field_director",
]);

export const inquiryStatusSchema = z.enum([
  "draft",
  "submitted",
  "evidence_review",
  "response_drafted",
  "medical_review",
  "approved",
  "closed",
  "rejected",
  "needs_revision",
]);

export const inquiryPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);

export const inquiryChannelSchema = z.enum([
  "email",
  "phone",
  "portal",
  "congress",
  "msl_field",
  "other",
]);

export const requesterTypeSchema = z.enum([
  "hcp",
  "patient",
  "caregiver",
  "internal",
  "other",
]);

export const inquiryIntakeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "Title must be at least 8 characters")
    .max(160, "Title must be 160 characters or fewer"),
  questionText: z
    .string()
    .trim()
    .min(20, "Question must be at least 20 characters")
    .max(4000, "Question must be 4000 characters or fewer"),
  productName: z
    .string()
    .trim()
    .min(2, "Product name is required")
    .max(120, "Product name must be 120 characters or fewer"),
  therapeuticArea: z
    .string()
    .trim()
    .min(2, "Therapeutic area is required")
    .max(120, "Therapeutic area must be 120 characters or fewer"),
  requesterType: requesterTypeSchema,
  requesterName: z
    .string()
    .trim()
    .min(2, "Requester name is required")
    .max(120, "Requester name must be 120 characters or fewer"),
  requesterOrganization: z
    .string()
    .trim()
    .max(160, "Organization must be 160 characters or fewer")
    .optional()
    .or(z.literal("")),
  channel: inquiryChannelSchema,
  priority: inquiryPrioritySchema,
  submitImmediately: z.boolean(),
});

export type InquiryIntakeInput = z.infer<typeof inquiryIntakeSchema>;

export const workflowTransitionSchema = z.object({
  inquiryId: z.string().uuid(),
  toStatus: inquiryStatusSchema,
  comments: z
    .string()
    .trim()
    .max(2000, "Comments must be 2000 characters or fewer")
    .optional(),
  responseDraft: z
    .string()
    .trim()
    .max(8000, "Response draft must be 8000 characters or fewer")
    .optional(),
});

export type WorkflowTransitionInput = z.infer<typeof workflowTransitionSchema>;

export const reviewDecisionSchema = z.object({
  inquiryId: z.string().uuid(),
  outcome: z.enum(["approved", "rejected", "needs_revision"]),
  comments: z
    .string()
    .trim()
    .max(2000, "Comments must be 2000 characters or fewer")
    .optional(),
});

export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
