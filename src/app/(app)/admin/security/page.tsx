import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ScientificSection } from "@/components/scientific/scientific-section";
import { listSecurityAuditEvents } from "@/lib/security/audit";
import { getAiGatewayStatus } from "@/lib/security/ai-gateway";
import { renderAppPage } from "@/lib/page";
import { getCurrentUser } from "@/lib/session";
import {
  getSecurityStatusReport,
  type SecurityCheckStatus,
} from "@/services/security/status";

function statusClass(status: SecurityCheckStatus): string {
  switch (status) {
    case "PASS":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "FAIL":
      return "border-red-200 bg-red-50 text-red-900";
    case "NOT_APPLICABLE":
      return "border-[#E5E7EB] bg-[#F8FAFC] text-[#17212B]/70";
    default:
      return "border-amber-200 bg-amber-50 text-amber-950";
  }
}

async function AdminSecurityPageContent() {
  await connection();
  const user = await getCurrentUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const report = getSecurityStatusReport();
  const ai = getAiGatewayStatus();
  const recent = listSecurityAuditEvents(15);

  return renderAppPage(
    "Security status",
    <div className="mx-auto w-full max-w-[1100px] space-y-8 bg-white px-1 py-2">
      <header className="space-y-3">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
          Enterprise security status
        </h2>
        <p className="max-w-3xl text-[15px] leading-[1.65] text-[#17212B]/70">
          Admin-only configuration evidence. No invented compliance scores or
          certification badges. Runtime mode:{" "}
          <strong>{report.runtimeMode}</strong>.
        </p>
        <p className="text-[13px] text-[#17212B]/55">{report.disclaimer}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {report.checks.map((check) => (
          <article
            key={check.id}
            className="rounded-xl border border-[#E5E7EB] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-semibold text-[#17212B]">
                {check.title}
              </h3>
              <span
                className={`rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusClass(check.status)}`}
              >
                {check.status.replaceAll("_", " ")}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[#17212B]/65">
              {check.evidence}
            </p>
          </article>
        ))}
      </section>

      <ScientificSection title="AI gateway snapshot">
        <dl className="grid gap-3 text-[14px] sm:grid-cols-2">
          <div>
            <dt className="text-[#17212B]/45">Mode</dt>
            <dd className="font-medium text-[#17212B]">{ai.mode}</dd>
          </div>
          <div>
            <dt className="text-[#17212B]/45">Global requests today</dt>
            <dd className="font-medium text-[#17212B]">
              {ai.globalRequestsToday} / {ai.globalDailyLimit}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[#17212B]/45">Allowlisted models</dt>
            <dd className="font-medium text-[#17212B]">
              {ai.allowedModels.join(", ")}
            </dd>
          </div>
        </dl>
      </ScientificSection>

      <ScientificSection
        title="Recent security audit events"
        description={`${report.recentAuditCount} events in memory for this process. Sensitive secrets are stripped.`}
      >
        {recent.length === 0 ? (
          <p className="text-[14px] text-[#17212B]/60">
            No security audit events recorded yet in this process.
          </p>
        ) : (
          <ul className="space-y-2 text-[13px] text-[#17212B]/75">
            {recent.map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-[#E5E7EB] px-3 py-2"
              >
                <span className="font-medium">{event.eventType}</span> ·{" "}
                {event.outcome} · {event.resourceType}
                {event.resourceId ? `:${event.resourceId.slice(0, 8)}` : ""} ·{" "}
                {new Date(event.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </ScientificSection>

      <p className="text-[13px] text-[#17212B]/55">
        Documentation:{" "}
        <Link href="/dashboard" className="text-[#2563EB] hover:underline">
          return to dashboard
        </Link>
        . Review SECURITY_AUDIT.md in the repository for findings.
      </p>
    </div>,
  );
}

export default function AdminSecurityPage() {
  return <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading workspace…</p>}><AdminSecurityPageContent /></Suspense>;
}
