import { z } from "zod";
import { recordSecurityAuditEvent } from "@/lib/security/audit";
import { hasOpenAiApiKey } from "@/lib/security/openai-env";
import { getRuntimeMode } from "@/lib/supabase/env";

export type AiOperatingMode = "demo" | "byok" | "enterprise";

/** Narrow purpose for Workflow Studio illustrative mock reports (RAG over fixtures). */
export const WORKFLOW_STUDIO_MOCK_REPORT_PURPOSE =
  "workflow_studio_mock_report" as const;

/** Narrow purpose for per-section evaluation walkthrough notes. */
export const WORKFLOW_STUDIO_SECTION_EVAL_PURPOSE =
  "workflow_studio_section_evaluation" as const;

/** Narrow purpose for live Data Room package generation via OpenAI. */
export const DATA_ROOM_LIVE_PACKAGE_PURPOSE =
  "data_room_live_package" as const;

const gatewayRequestSchema = z.object({
  agentId: z.string().min(1).max(80),
  purpose: z.string().min(1).max(200),
  inputChars: z.number().int().nonnegative().max(200_000),
  estimatedOutputTokens: z.number().int().nonnegative().max(8_192).default(1024),
  model: z.string().min(1).max(80).optional(),
  userId: z.string().uuid().nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
});

export type AiGatewayRequest = z.infer<typeof gatewayRequestSchema>;

const DEMO_USER_DAILY_REQUESTS = 40;
const DEMO_GLOBAL_DAILY_REQUESTS = 2_000;
const ALLOWED_MODELS = [
  "demo-synthetic",
  "openai:gpt-4.1-mini",
  "anthropic:claude-sonnet-4-5",
] as const;

declare global {
  var __medintelAiGatewayUsage:
    | {
        day: string;
        byUser: Record<string, number>;
        global: number;
      }
    | undefined;
}

function usageDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function getUsage() {
  const day = usageDay();
  if (!globalThis.__medintelAiGatewayUsage || globalThis.__medintelAiGatewayUsage.day !== day) {
    globalThis.__medintelAiGatewayUsage = { day, byUser: {}, global: 0 };
  }
  return globalThis.__medintelAiGatewayUsage;
}

export function getAiOperatingMode(): AiOperatingMode {
  const configured = process.env.MEDINTEL_AI_MODE?.trim().toLowerCase();
  if (configured === "byok" || configured === "enterprise" || configured === "demo") {
    return configured;
  }
  return getRuntimeMode() === "demo" ? "demo" : "enterprise";
}

export function estimateRequestCostUsd(input: {
  inputChars: number;
  estimatedOutputTokens: number;
}): number {
  // Application-side estimate only — not a hard provider guarantee.
  const inputTokens = Math.ceil(input.inputChars / 4);
  const total = inputTokens + input.estimatedOutputTokens;
  return Number(((total / 1_000_000) * 3).toFixed(6));
}

/**
 * Centralized AI gateway gate. Browser code must never call providers directly.
 * DEMO fails closed to synthetic/cached paths without requiring visitor API keys.
 */
export async function authorizeAiGatewayRequest(
  raw: AiGatewayRequest,
): Promise<
  | {
      ok: true;
      mode: AiOperatingMode;
      model: string;
      estimatedCostUsd: number;
      remainingUserQuota: number;
    }
  | { ok: false; reason: string }
> {
  const parsed = gatewayRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: "Invalid AI gateway request." };
  }

  const mode = getAiOperatingMode();
  const model = parsed.data.model ?? (mode === "demo" ? "demo-synthetic" : ALLOWED_MODELS[1]);
  if (!ALLOWED_MODELS.includes(model as (typeof ALLOWED_MODELS)[number])) {
    await recordSecurityAuditEvent({
      actorId: parsed.data.userId ?? null,
      organizationId: parsed.data.organizationId,
      eventType: "ai.gateway.model_denied",
      resourceType: "ai_gateway",
      resourceId: parsed.data.agentId,
      outcome: "denied",
      metadata: { model, purpose: parsed.data.purpose },
    });
    return { ok: false, reason: "Model not on allowlist." };
  }

  if (mode === "byok") {
    const hasSessionKey = Boolean(process.env.MEDINTEL_BYOK_SESSION_PRESENT);
    // BYOK credentials must be server-managed; never read localStorage keys here.
    if (!hasSessionKey && !process.env.MEDINTEL_BYOK_SECRET_REF) {
      return {
        ok: false,
        reason:
          "BYOK mode requires a server-side secret reference or session-scoped credential. Client-visible keys are not accepted.",
      };
    }
  }

  const isWorkflowStudioMockReport =
    parsed.data.purpose === WORKFLOW_STUDIO_MOCK_REPORT_PURPOSE;
  const isWorkflowStudioSectionEval =
    parsed.data.purpose === WORKFLOW_STUDIO_SECTION_EVAL_PURPOSE;
  const isDataRoomLivePackage =
    parsed.data.purpose === DATA_ROOM_LIVE_PACKAGE_PURPOSE;
  const isWorkflowStudioAllowlistedPurpose =
    isWorkflowStudioMockReport ||
    isWorkflowStudioSectionEval ||
    isDataRoomLivePackage;

  if (isWorkflowStudioAllowlistedPurpose) {
    if (model === "openai:gpt-4.1-mini" && !hasOpenAiApiKey()) {
      return {
        ok: false,
        reason:
          "OpenAI API key is not configured on the server (OPENAI_API_KEY or OPENAI_API_Key).",
      };
    }
    if (model !== "openai:gpt-4.1-mini" && model !== "demo-synthetic") {
      return {
        ok: false,
        reason:
          "Workflow Studio demo AI only allows openai:gpt-4.1-mini or demo-synthetic.",
      };
    }
  } else if (mode !== "demo" || model !== "demo-synthetic") {
    return {
      ok: false,
      reason:
        "Live AI execution is unavailable until authenticated durable budgets, provider execution, and usage accounting are implemented.",
    };
  }

  const usage = getUsage();
  const userKey = parsed.data.userId ?? "anonymous-demo";
  const userCount = usage.byUser[userKey] ?? 0;
  if (userCount >= DEMO_USER_DAILY_REQUESTS) {
    await recordSecurityAuditEvent({
      actorId: parsed.data.userId ?? null,
      eventType: "ai.gateway.user_quota",
      resourceType: "ai_gateway",
      resourceId: parsed.data.agentId,
      outcome: "denied",
      metadata: { userCount, limit: DEMO_USER_DAILY_REQUESTS },
    });
    return { ok: false, reason: "Per-user AI quota exceeded." };
  }
  if (usage.global >= DEMO_GLOBAL_DAILY_REQUESTS) {
    return { ok: false, reason: "Global AI quota exceeded." };
  }

  usage.byUser[userKey] = userCount + 1;
  usage.global += 1;

  const estimatedCostUsd = estimateRequestCostUsd(parsed.data);
  await recordSecurityAuditEvent({
    actorId: parsed.data.userId ?? null,
    organizationId: parsed.data.organizationId,
    eventType: "ai.gateway.authorized",
    resourceType: "ai_gateway",
    resourceId: parsed.data.agentId,
    outcome: "success",
    metadata: {
      mode,
      model,
      purpose: parsed.data.purpose,
      estimatedCostUsd,
      note: "Cost is an application estimate, not a provider billing guarantee.",
    },
  });

  return {
    ok: true,
    mode,
    model,
    estimatedCostUsd,
    remainingUserQuota: DEMO_USER_DAILY_REQUESTS - (userCount + 1),
  };
}

export function getAiGatewayStatus() {
  const usage = getUsage();
  return {
    mode: getAiOperatingMode(),
    allowedModels: [...ALLOWED_MODELS],
    day: usage.day,
    globalRequestsToday: usage.global,
    globalDailyLimit: DEMO_GLOBAL_DAILY_REQUESTS,
    perUserDailyLimit: DEMO_USER_DAILY_REQUESTS,
    browserDirectCallsAllowed: false,
    hardCostGuarantee: false,
  };
}
