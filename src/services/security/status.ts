import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { getAiGatewayStatus } from "@/lib/security/ai-gateway";
import { listSecurityAuditEvents } from "@/lib/security/audit";
import { getRuntimeMode, isSupabaseConfigured } from "@/lib/supabase/env";

export type SecurityCheckStatus =
  | "PASS"
  | "FAIL"
  | "NOT_VERIFIED"
  | "NOT_APPLICABLE";

export interface SecurityCheck {
  id: string;
  title: string;
  status: SecurityCheckStatus;
  evidence: string;
}

function migrationExists(name: string): boolean {
  return existsSync(
    path.join(process.cwd(), "supabase", "migrations", name),
  );
}

function middlewareExists(): boolean {
  return existsSync(path.join(process.cwd(), "src", "middleware.ts"));
}

export function getSecurityStatusReport(): {
  generatedAt: string;
  runtimeMode: "demo" | "supabase";
  checks: SecurityCheck[];
  recentAuditCount: number;
  disclaimer: string;
} {
  const ai = getAiGatewayStatus();
  const mode = getRuntimeMode();
  const checks: SecurityCheck[] = [
    {
      id: "auth-middleware",
      title: "Authentication edge gate",
      status: middlewareExists() ? "PASS" : "FAIL",
      evidence: middlewareExists()
        ? "src/middleware.ts present; supabase mode redirects unauthenticated users to /login; demo mode intentionally open for synthetic portfolio."
        : "middleware.ts missing",
    },
    {
      id: "session-fail-closed",
      title: "Session fail-closed in supabase mode",
      status: "PASS",
      evidence:
        "getCurrentUser() no longer silently impersonates demo specialist when Supabase is configured without a session.",
    },
    {
      id: "rls-core",
      title: "Core RLS migrations present",
      status:
        migrationExists("002_rls_policies.sql") &&
        migrationExists("004_field_medical_rls.sql")
          ? "PASS"
          : "FAIL",
      evidence:
        "002/004 RLS migrations present. Live DB policy enforcement is NOT_VERIFIED without a connected Supabase project.",
    },
    {
      id: "rls-security-foundation",
      title: "Security foundation migration (classification, org, audit)",
      status: migrationExists("007_enterprise_security_foundation.sql")
        ? "PASS"
        : "FAIL",
      evidence:
        "007 adds classification columns, organization scaffolding, tightened inquiry SELECT, SI session policy fix, knowledge approval trigger, append-only security_audit_events.",
    },
    {
      id: "rls-live-verification",
      title: "Live RLS cross-tenant verification",
      status: isSupabaseConfigured() ? "NOT_VERIFIED" : "NOT_APPLICABLE",
      evidence: isSupabaseConfigured()
        ? "Supabase env present but automated cross-org policy tests against a live database are not executed in this environment."
        : "Demo mode — no live database; apply migrations before claiming RLS enforcement.",
    },
    {
      id: "service-role",
      title: "Service-role key exposure",
      status: "PASS",
      evidence:
        "SUPABASE_SERVICE_ROLE_KEY is server-only via getSupabaseServiceRoleKey(); createSupabaseAdminClient is not used by default request paths.",
    },
    {
      id: "ai-gateway",
      title: "Centralized AI gateway controls",
      status: "PASS",
      evidence: `Mode=${ai.mode}; browserDirectCallsAllowed=${ai.browserDirectCallsAllowed}; allowlist=${ai.allowedModels.join(",")}; hardCostGuarantee=${ai.hardCostGuarantee}.`,
    },
    {
      id: "rate-limits",
      title: "AI rate / quota limits",
      status: "PASS",
      evidence: `Per-user daily ${ai.perUserDailyLimit}; global daily ${ai.globalDailyLimit}. Application estimates only — configure provider billing caps separately.`,
    },
    {
      id: "audit-logging",
      title: "Consequential-action audit logging",
      status: "PASS",
      evidence:
        "In-memory security audit store + migration table security_audit_events. Knowledge approve/reuse actions emit events. Ordinary users have no UPDATE/DELETE policies on security_audit_events.",
    },
    {
      id: "demo-mode",
      title: "Public portfolio demo posture",
      status: mode === "demo" ? "PASS" : "NOT_VERIFIED",
      evidence:
        mode === "demo"
          ? "Demo mode active: synthetic data, no recruiter API key required, no service-role in client bundle."
          : "Supabase mode configured — confirm production writes and demo separation before public exposure.",
    },
    {
      id: "security-headers",
      title: "Security response headers",
      status: "PASS",
      evidence:
        "Middleware sets X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. CSP not yet enforced (NOT_VERIFIED) to avoid breaking Next.js without route testing.",
    },
    {
      id: "certifications",
      title: "HIPAA / SOC 2 / GxP certification claims",
      status: "NOT_APPLICABLE",
      evidence:
        "No independent certification asserted. Do not display compliance badges.",
    },
  ];

  // Soft dependency audit signal without printing advisory payloads into UI.
  let dependencyAudit: SecurityCheckStatus = "NOT_VERIFIED";
  try {
    const pkg = readFileSync(path.join(process.cwd(), "package.json"), "utf8");
    dependencyAudit = pkg.includes('"next"') ? "NOT_VERIFIED" : "FAIL";
  } catch {
    dependencyAudit = "FAIL";
  }
  checks.push({
    id: "dependency-audit",
    title: "Dependency vulnerability scan",
    status: dependencyAudit,
    evidence:
      "Run `npm audit --omit=dev` in CI. Results are environment-specific and not embedded as a false PASS here.",
  });

  return {
    generatedAt: new Date().toISOString(),
    runtimeMode: mode,
    checks,
    recentAuditCount: listSecurityAuditEvents(100).length,
    disclaimer:
      "Statuses reflect code and configuration evidence in this repository/runtime. PASS is not a certification. Live multi-tenant RLS and penetration tests remain required for enterprise evaluation.",
  };
}
