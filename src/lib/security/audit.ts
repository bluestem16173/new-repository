import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { getRuntimeMode } from "@/lib/supabase/env";

export type SecurityAuditOutcome = "success" | "denied" | "error";

export interface SecurityAuditEventInput {
  actorId: string | null;
  organizationId?: string | null;
  eventType: string;
  resourceType: string;
  resourceId?: string | null;
  outcome: SecurityAuditOutcome;
  metadata?: Record<string, unknown>;
}

export interface SecurityAuditEvent extends SecurityAuditEventInput {
  id: string;
  createdAt: string;
}

declare global {
  var __medintelSecurityAudit: SecurityAuditEvent[] | undefined;
}

function getStore(): SecurityAuditEvent[] {
  if (!globalThis.__medintelSecurityAudit) {
    globalThis.__medintelSecurityAudit = [];
  }
  return globalThis.__medintelSecurityAudit;
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!metadata) return {};
  const blocked = new Set([
    "api_key",
    "apiKey",
    "service_role_key",
    "password",
    "authorization",
    "prompt",
    "rawPrompt",
  ]);
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (blocked.has(key)) continue;
    if (typeof value === "string" && value.length > 500) {
      clean[key] = `${value.slice(0, 500)}…`;
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

/**
 * Append-only security/consequential action audit.
 * Demo mode keeps events in-memory. Supabase persistence is additive via migration 007.
 * Never logs API keys or full restricted prompts.
 */
export async function recordSecurityAuditEvent(
  input: SecurityAuditEventInput,
): Promise<SecurityAuditEvent> {
  const event: SecurityAuditEvent = {
    id: randomUUID(),
    actorId: input.actorId,
    organizationId: input.organizationId ?? null,
    eventType: input.eventType,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    outcome: input.outcome,
    metadata: sanitizeMetadata(input.metadata),
    createdAt: new Date().toISOString(),
  };

  if (getRuntimeMode() === "demo") {
    getStore().unshift(event);
  } else {
    const client = await createSupabaseServerClient();
    if (!client) throw new Error("Security audit client unavailable.");
    if (!event.organizationId && event.actorId) {
      const { data: profile, error: profileError } = await client.from("profiles").select("organization_id").eq("id", event.actorId).maybeSingle();
      if (profileError) throw new Error("Security audit organization could not be verified.");
      event.organizationId = profile?.organization_id ?? null;
    }
    const { error } = await client.from("security_audit_events").insert({
      id: event.id, actor_id: event.actorId, organization_id: event.organizationId,
      event_type: event.eventType, resource_type: event.resourceType,
      resource_id: event.resourceId, outcome: event.outcome,
      metadata: event.metadata, created_at: event.createdAt,
    });
    if (error) throw new Error("Security audit could not be persisted.");
  }

  return event;
}

export function listSecurityAuditEvents(limit = 50): SecurityAuditEvent[] {
  return getStore().slice(0, limit);
}

export function resetSecurityAuditEvents(): void {
  globalThis.__medintelSecurityAudit = [];
}
