import { beforeEach, describe, expect, it } from "vitest";
import {
  canEnterSharedKnowledgeNetwork,
  defaultClassificationForResource,
} from "@/domain/security/data-classification";
import {
  authorizeAiGatewayRequest,
  getAiGatewayStatus,
} from "@/lib/security/ai-gateway";
import {
  listSecurityAuditEvents,
  recordSecurityAuditEvent,
  resetSecurityAuditEvents,
} from "@/lib/security/audit";
import { AuthorizationError, requireUser } from "@/lib/security/require-user";
import { getSecurityStatusReport } from "@/services/security/status";
import { approveKnowledgeItemAction } from "@/app/actions/knowledge";
import { getRuntimeMode } from "@/lib/supabase/env";
import { setDemoCurrentUser } from "@/lib/demo/seed";

describe("enterprise security foundation", () => {
  beforeEach(() => {
    resetSecurityAuditEvents();
    setDemoCurrentUser("11111111-1111-4111-8111-111111111111");
  });

  it("classifies inquiries as restricted and blocks restricted from shared knowledge", () => {
    expect(defaultClassificationForResource("inquiry")).toBe("restricted");
    expect(canEnterSharedKnowledgeNetwork("restricted", true)).toBe(false);
    expect(canEnterSharedKnowledgeNetwork("internal_approved", true)).toBe(
      true,
    );
    expect(canEnterSharedKnowledgeNetwork("internal_approved", false)).toBe(
      false,
    );
  });

  it("AI gateway denies non-allowlisted models and records audit", async () => {
    const denied = await authorizeAiGatewayRequest({
      agentId: "knowledge-matcher",
      purpose: "test",
      inputChars: 120,
      estimatedOutputTokens: 100,
      model: "unapproved-model",
      userId: "11111111-1111-4111-8111-111111111111",
    });
    expect(denied.ok).toBe(false);
    expect(
      listSecurityAuditEvents().some(
        (event) => event.eventType === "ai.gateway.model_denied",
      ),
    ).toBe(true);
  });

  it("AI gateway authorizes demo-synthetic model without browser keys", async () => {
    const allowed = await authorizeAiGatewayRequest({
      agentId: "knowledge-matcher",
      purpose: "match",
      inputChars: 80,
      estimatedOutputTokens: 50,
      model: "demo-synthetic",
      userId: "11111111-1111-4111-8111-111111111111",
    });
    expect(allowed.ok).toBe(true);
    if (allowed.ok) {
      expect(allowed.mode).toBe("demo");
      expect(getAiGatewayStatus().browserDirectCallsAllowed).toBe(false);
      expect(getAiGatewayStatus().hardCostGuarantee).toBe(false);
    }
  });

  it("strips secrets from security audit metadata", async () => {
    await recordSecurityAuditEvent({
      actorId: "11111111-1111-4111-8111-111111111111",
      eventType: "test.secret_strip",
      resourceType: "test",
      outcome: "success",
      metadata: {
        api_key: "SHOULD_NOT_PERSIST",
        note: "ok",
      },
    });
    const event = listSecurityAuditEvents()[0];
    expect(event?.metadata).toBeDefined();
    expect(event?.metadata).not.toHaveProperty("api_key");
    expect(event?.metadata?.note).toBe("ok");
  });

  it("denies knowledge approval for MSL role via server action", async () => {
    setDemoCurrentUser("44444444-4444-4444-8444-444444444444");
    expect(getRuntimeMode()).toBe("demo");
    const result = await approveKnowledgeItemAction(
      "kn-item-0002-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.toLowerCase()).toMatch(/not permitted|not authorized/);
    }
  });

  it("requireUser enforces role lists", async () => {
    setDemoCurrentUser("44444444-4444-4444-8444-444444444444");
    await expect(
      requireUser({ roles: ["admin"], action: "admin.only" }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("security status report never claims certifications", () => {
    const report = getSecurityStatusReport();
    const cert = report.checks.find((check) => check.id === "certifications");
    expect(cert?.status).toBe("NOT_APPLICABLE");
    expect(report.disclaimer.toLowerCase()).toContain("not a certification");
  });
});
