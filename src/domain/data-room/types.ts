import { z } from "zod";
import type { WorkflowStudioId } from "@/domain/workflow-studio/types";

export const DATA_ROOM_DEMO_NOTICE =
  "Data Room packages are Illustrative Demo Data only. No PHI. Access requires authentication (same organization or explicit invite email). Demo mode uses an in-memory store that does not survive restarts.";

export const DATA_ROOM_OVERSIGHT_LABEL =
  "Illustrative Demo package — provisional only. Requires human medical/scientific oversight. Not verified clinical content. Do not auto-release.";

export type DataRoomWorkflowType =
  | WorkflowStudioId
  | "other";

export type DataRoomSectionSnapshot = {
  id: string;
  title: string;
  body: string;
  agentIds: string[];
};

export type DataRoomGenerationSource =
  | "openai_live"
  | "fixture_fallback_labeled"
  | "manual_send";

export type DataRoomPackage = {
  id: string;
  title: string;
  summary: string;
  workflowType: DataRoomWorkflowType;
  sections: DataRoomSectionSnapshot[];
  demoLabel: string;
  oversightLabel: string;
  senderId: string;
  senderEmail: string;
  senderDisplayName: string;
  accessEmails: string[];
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
  persistence: "supabase" | "demo_memory";
  /** How the package content was produced. */
  generationSource?: DataRoomGenerationSource;
};

export const liveGenerateDataRoomInputSchema = z.object({
  workflowType: z.enum(["kol-meeting-prep", "manager-education"]),
  accessEmails: z.array(z.string().email().max(200)).max(25).default([]),
  /** Explicit opt-in only — never silent. Labels package as fixture fallback. */
  allowLabeledFixtureFallback: z.boolean().default(false),
});

export type LiveGenerateDataRoomInput = z.infer<
  typeof liveGenerateDataRoomInputSchema
>;

export type LiveGenerateProgressStage =
  | "preparing_context"
  | "calling_openai"
  | "validating_json"
  | "persisting_package"
  | "complete"
  | "error";

export const sendToDataRoomInputSchema = z.object({
  title: z.string().min(1).max(240),
  summary: z.string().min(1).max(4000),
  workflowType: z.enum([
    "kol-meeting-prep",
    "manager-education",
    "mi-inquiry",
    "leadership-briefing",
    "other",
  ]),
  sections: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        title: z.string().min(1).max(160),
        body: z.string().min(1).max(8000),
        agentIds: z.array(z.string().min(1).max(80)).max(12),
      }),
    )
    .min(1)
    .max(24),
  accessEmails: z
    .array(z.string().email().max(200))
    .max(25)
    .default([]),
});

export type SendToDataRoomInput = z.infer<typeof sendToDataRoomInputSchema>;

export function normalizeAccessEmails(emails: string[]): string[] {
  const unique = new Set(
    emails
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
  return [...unique];
}
