"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Loader2,
  Radio,
  ShieldAlert,
  Sparkles,
  ThumbsUp,
  Wifi,
} from "lucide-react";
import { getAgentById } from "@/domain/agents/registry";
import {
  progressPercent,
  type LivePipelineRun,
  type LivePipelineStage,
} from "@/domain/data-room/live-pipeline";
import type { MockReportWorkflowId } from "@/domain/workflow-studio/mock-report";
import {
  approveLivePipelineStageAction,
  finalizeLivePipelineAction,
  runLivePipelineStageAction,
  startLivePipelineAction,
} from "@/app/actions/data-room-live";
import {
  readLivePipelineRuns,
  upsertLivePipelineRun,
} from "@/lib/data-room/live-pipeline-client-store";
import { DemoOversightBanner } from "@/components/workflow-studio/demo-oversight-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LivePipelineSessionProps {
  defaultWorkflowId?: MockReportWorkflowId;
  className?: string;
}

type UiPhase =
  | "idle"
  | "starting"
  | "running_stage"
  | "awaiting_approval"
  | "finalizing"
  | "done";

export function LivePipelineSession({
  defaultWorkflowId = "kol-meeting-prep",
  className,
}: LivePipelineSessionProps) {
  const [workflowId, setWorkflowId] =
    useState<MockReportWorkflowId>(defaultWorkflowId);
  const [emails, setEmails] = useState(
    "jordan.lee@demo.medintel.local, sam.patel@demo.medintel.local",
  );
  const [run, setRun] = useState<LivePipelineRun | null>(null);
  const [phase, setPhase] = useState<UiPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState("Ready for a live staged session");
  const [pending, startTransition] = useTransition();

  // Resume from localStorage on mount (phone refresh)
  useEffect(() => {
    const saved = readLivePipelineRuns().find(
      (item) => item.status === "active" || item.status === "completed",
    );
    if (saved) {
      setRun(saved);
      const current = saved.stages[saved.currentStageIndex];
      if (saved.packageId) {
        setPhase("done");
        setStatusLine("Session complete — package in Data Room");
      } else if (current?.status === "awaiting_approval") {
        setPhase("awaiting_approval");
        setStatusLine(`Awaiting your approval · ${current.title}`);
      } else if (saved.status === "active") {
        setPhase("idle");
        setStatusLine("Session restored — continue when ready");
      }
    }
  }, []);

  const persist = useCallback((next: LivePipelineRun) => {
    setRun(next);
    upsertLivePipelineRun(next);
  }, []);

  const activeStage = useMemo(() => {
    if (!run) return null;
    return (
      run.stages.find((stage) => stage.status === "awaiting_approval") ??
      run.stages[run.currentStageIndex] ??
      null
    );
  }, [run]);

  const pct = run ? progressPercent(run) : 0;

  function startSession() {
    setError(null);
    setErrorCode(null);
    setPhase("starting");
    setStatusLine("Opening live session…");
    const accessEmails = emails
      .split(/[,;\s]+/)
      .map((v) => v.trim())
      .filter(Boolean);

    startTransition(async () => {
      const result = await startLivePipelineAction({
        workflowId,
        accessEmails,
      });
      if (!result.ok) {
        setError(result.error);
        setPhase("idle");
        return;
      }
      persist(result.run);
      setStatusLine("Session live — running first agent…");
      await executeStage(result.run, result.run.stages[0]!, false);
    });
  }

  async function executeStage(
    currentRun: LivePipelineRun,
    stage: LivePipelineStage,
    allowLabeledFixtureFallback: boolean,
  ) {
    setPhase("running_stage");
    setError(null);
    setErrorCode(null);
    setStatusLine(`Calling OpenAI · ${stage.agentName}…`);

    // Optimistic running state
    const runningRun: LivePipelineRun = {
      ...currentRun,
      updatedAt: new Date().toISOString(),
      currentStageIndex: stage.index,
      stages: currentRun.stages.map((item) =>
        item.id === stage.id
          ? { ...item, status: "running", error: null }
          : item,
      ),
    };
    persist(runningRun);

    const priorStages = currentRun.stages
      .filter((item) => item.index < stage.index)
      .map((item) => ({
        id: item.id,
        title: item.title,
        agentId: item.agentId,
        compiled: item.compiled,
      }));

    const result = await runLivePipelineStageAction({
      runId: currentRun.id,
      stageId: stage.id,
      workflowId: currentRun.workflowId,
      priorStages,
      allowLabeledFixtureFallback,
    });

    if (!result.ok) {
      setError(result.error);
      setErrorCode(result.code ?? null);
      const failed: LivePipelineRun = {
        ...runningRun,
        stages: runningRun.stages.map((item) =>
          item.id === stage.id
            ? { ...item, status: "failed", error: result.error }
            : item,
        ),
      };
      persist(failed);
      setPhase("idle");
      setStatusLine("Stage failed — fix and retry");
      return;
    }

    const awaiting: LivePipelineRun = {
      ...runningRun,
      updatedAt: new Date().toISOString(),
      stages: runningRun.stages.map((item) =>
        item.id === stage.id
          ? {
              ...item,
              ...result.stage,
              index: item.index,
              status: "awaiting_approval",
            }
          : item,
      ),
    };
    persist(awaiting);
    setPhase("awaiting_approval");
    setStatusLine(
      result.source === "openai_live"
        ? `Live OpenAI result ready · approve ${stage.title}`
        : `Labeled fixture fallback ready · approve ${stage.title}`,
    );
  }

  function approveCurrent() {
    if (!run || !activeStage || activeStage.status !== "awaiting_approval") {
      return;
    }

    startTransition(async () => {
      const now = new Date().toISOString();
      const approvedLocal: LivePipelineRun = {
        ...run,
        updatedAt: now,
        stages: run.stages.map((stage) =>
          stage.id === activeStage.id
            ? { ...stage, status: "approved", approvedAt: now }
            : stage,
        ),
      };

      // Fire-and-forget server mirror
      void approveLivePipelineStageAction({
        runId: run.id,
        stageId: activeStage.id,
      });

      const next = approvedLocal.stages.find(
        (stage) =>
          stage.index === activeStage.index + 1 && stage.status === "queued",
      );

      if (!next) {
        // All done — finalize
        persist(approvedLocal);
        setPhase("finalizing");
        setStatusLine("Compiling Data Room package…");
        const finalized = await finalizeLivePipelineAction({
          run: approvedLocal,
        });
        if (!finalized.ok) {
          setError(finalized.error);
          setPhase("awaiting_approval");
          return;
        }
        persist(finalized.run);
        setPhase("done");
        setStatusLine("Package live in Data Room");
        return;
      }

      const advanced: LivePipelineRun = {
        ...approvedLocal,
        currentStageIndex: next.index,
      };
      persist(advanced);
      setStatusLine(`Approved · starting ${next.title}…`);
      await executeStage(advanced, next, false);
    });
  }

  function retryWithLabeledFallback() {
    if (!run || !activeStage) return;
    const stage =
      run.stages.find((item) => item.status === "failed") ?? activeStage;
    startTransition(async () => {
      await executeStage(run, stage, true);
    });
  }

  function resumeOrRunQueued() {
    if (!run) return;
    const stage =
      run.stages.find((item) => item.status === "failed") ??
      run.stages.find((item) => item.status === "queued") ??
      run.stages[run.currentStageIndex];
    if (!stage) return;
    if (stage.status === "awaiting_approval") {
      setPhase("awaiting_approval");
      return;
    }
    startTransition(async () => {
      await executeStage(run, stage, false);
    });
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-[#2563EB]/20 bg-gradient-to-b from-[#F4F8FF] via-white to-[#F8FAFC] shadow-[0_12px_40px_rgba(37,99,235,0.08)]",
        className,
      )}
      aria-labelledby="live-pipeline-heading"
    >
      <div className="border-b border-[#DBEAFE] bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_55%)] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2563EB]/30 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D4ED8]">
                <Radio className="size-3 animate-pulse" aria-hidden />
                Live staged session
              </span>
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 font-medium text-amber-950"
              >
                Illustrative Demo
              </Badge>
              <Badge
                variant="outline"
                className="border-[#E5E7EB] bg-white font-medium text-[#17212B]/60"
              >
                <Wifi className="size-3" aria-hidden />
                Mobile approve
              </Badge>
            </div>
            <h3
              id="live-pipeline-heading"
              className="text-[1.35rem] font-semibold tracking-tight text-[#17212B] sm:text-[1.5rem]"
            >
              Watch agents compile — approve every stage
            </h3>
            <p className="max-w-2xl text-[13px] leading-relaxed text-[#17212B]/70 sm:text-[14px]">
              Real OpenAI calls over allowlisted fixtures. Each agent produces a
              dense card. You approve on your phone before the next stage runs.
              Session state survives refresh.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-[#17212B]/55">
            <span>{statusLine}</span>
            <span>{pct}%</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-[#E8EEF7]"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#60A5FA] transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <DemoOversightBanner />

        {!run ? (
          <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/50">
                Pathway
              </span>
              <select
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-3 text-[14px] text-[#17212B]"
                value={workflowId}
                onChange={(event) =>
                  setWorkflowId(event.target.value as MockReportWorkflowId)
                }
              >
                <option value="kol-meeting-prep">KOL Meeting Prep</option>
                <option value="manager-education">Manager Education</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/50">
                Invite emails (Data Room access)
              </span>
              <Input
                value={emails}
                onChange={(event) => setEmails(event.target.value)}
                className="h-11 rounded-xl bg-[#FAFBFC] text-[14px]"
              />
            </label>
            <Button
              type="button"
              size="lg"
              className="h-12 w-full bg-[#2563EB] text-base text-white hover:bg-[#1D4ED8]"
              disabled={pending}
              onClick={startSession}
            >
              <Sparkles className="size-4" aria-hidden />
              Start live session
            </Button>
          </div>
        ) : null}

        {error ? (
          <div
            className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
            role="alert"
          >
            <p className="text-[13px] font-medium text-rose-950">{error}</p>
            {(errorCode === "missing_api_key" ||
              errorCode === "openai_http" ||
              errorCode === "openai_empty" ||
              errorCode === "openai_invalid_json") && (
              <Button
                type="button"
                variant="outline"
                className="border-rose-300 bg-white"
                onClick={retryWithLabeledFallback}
                disabled={pending}
              >
                Continue with labeled fixture fallback
              </Button>
            )}
          </div>
        ) : null}

        {run ? (
          <>
            {/* Stage rail */}
            <ol className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {run.stages.map((stage) => (
                <li key={stage.id} className="min-w-[7.5rem] flex-1">
                  <div
                    className={cn(
                      "rounded-xl border px-2.5 py-2",
                      stage.status === "awaiting_approval" &&
                        "border-[#2563EB] bg-[#EEF4FF] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]",
                      stage.status === "approved" &&
                        "border-emerald-200 bg-emerald-50/70",
                      stage.status === "running" &&
                        "border-sky-300 bg-sky-50",
                      stage.status === "failed" &&
                        "border-rose-200 bg-rose-50",
                      stage.status === "queued" &&
                        "border-[#E5E7EB] bg-white",
                    )}
                  >
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/45">
                      {String(stage.index + 1).padStart(2, "0")}
                    </p>
                    <p className="truncate text-[12px] font-semibold text-[#17212B]">
                      {stage.title}
                    </p>
                    <p className="truncate text-[10px] text-[#17212B]/50">
                      {stage.status.replaceAll("_", " ")}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Active stage card */}
            {activeStage ? (
              <article className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_8px_30px_rgba(23,33,43,0.06)]">
                <div className="flex items-start gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-4 py-4">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                    {getAgentById(activeStage.agentId)?.icon ? (
                      <Image
                        src={getAgentById(activeStage.agentId)!.icon}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="size-10 object-contain"
                      />
                    ) : (
                      <ShieldAlert className="size-5 text-[#2563EB]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[16px] font-semibold text-[#17212B]">
                        {activeStage.title}
                      </h4>
                      {activeStage.source === "openai_live" ? (
                        <Badge className="bg-[#2563EB] text-white">
                          Live OpenAI
                        </Badge>
                      ) : null}
                      {activeStage.source === "fixture_fallback_labeled" ? (
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-amber-950"
                        >
                          Labeled fallback
                        </Badge>
                      ) : null}
                      {phase === "running_stage" ? (
                        <Badge
                          variant="outline"
                          className="border-sky-200 bg-sky-50 text-sky-900"
                        >
                          <Loader2 className="size-3 animate-spin" />
                          Calling API
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-[13px] text-[#17212B]/65">
                      {activeStage.blurb}
                    </p>
                    <p className="text-[12px] text-[#17212B]/50">
                      Agent:{" "}
                      <Link
                        href={activeStage.agentRoute}
                        className="font-medium text-[#2563EB] hover:underline"
                      >
                        {activeStage.agentName}
                      </Link>
                    </p>
                  </div>
                </div>

                {activeStage.compiled ? (
                  <div className="space-y-4 p-4">
                    <p className="text-[15px] font-semibold leading-snug text-[#17212B]">
                      {activeStage.compiled.headline}
                    </p>
                    <ul className="space-y-2">
                      {activeStage.compiled.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-2 rounded-xl border border-[#E8EEF7] bg-[#F8FAFF] px-3 py-2.5 text-[13px] leading-relaxed text-[#17212B]/80"
                        >
                          <Check className="mt-0.5 size-3.5 shrink-0 text-[#2563EB]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {activeStage.compiled.fields.map((field) => (
                        <div
                          key={`${field.label}-${field.value}`}
                          className="rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-3 py-2"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/45">
                            {field.label}
                          </p>
                          <p className="mt-0.5 text-[13px] font-medium text-[#17212B]">
                            {field.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#17212B]/50">
                      Confidence:{" "}
                      {activeStage.compiled.confidence.replaceAll("_", " ")} ·{" "}
                      {activeStage.compiled.evidenceNotes}
                    </p>
                  </div>
                ) : phase === "running_stage" ? (
                  <div className="flex items-center gap-3 p-6 text-[14px] text-[#17212B]/60">
                    <Loader2 className="size-5 animate-spin text-[#2563EB]" />
                    Generating dense compiled card via OpenAI…
                  </div>
                ) : (
                  <div className="p-4 text-[13px] text-[#17212B]/55">
                    Stage queued. Run to generate a live compiled card.
                  </div>
                )}
              </article>
            ) : null}

            {/* Approved archive (compact) */}
            {run.stages.some((stage) => stage.status === "approved") ? (
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/45">
                  Approved stages
                </h4>
                <div className="space-y-2">
                  {run.stages
                    .filter((stage) => stage.status === "approved")
                    .map((stage) => (
                      <details
                        key={stage.id}
                        className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2"
                      >
                        <summary className="cursor-pointer text-[13px] font-semibold text-[#17212B]">
                          {stage.title} · {stage.agentName}
                        </summary>
                        {stage.compiled ? (
                          <p className="mt-2 text-[12px] leading-relaxed text-[#17212B]/70">
                            {stage.compiled.headline}
                          </p>
                        ) : null}
                      </details>
                    ))}
                </div>
              </div>
            ) : null}

            {phase === "done" && run.packageId ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-[14px] font-semibold text-emerald-950">
                  Final package is in the Data Room
                </p>
                <p className="mt-1 text-[12px] text-emerald-900/80">
                  Colleagues on the invite list can open it after sign-in.
                </p>
                <Button
                  type="button"
                  className="mt-3 bg-emerald-700 text-white hover:bg-emerald-800"
                  render={<Link href={`/data-room/${run.packageId}`} />}
                  role="link"
                >
                  Open package
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}

            {run && phase !== "done" && phase !== "awaiting_approval" ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={pending || phase === "running_stage"}
                onClick={resumeOrRunQueued}
              >
                {phase === "running_stage" ? "Running…" : "Run / resume stage"}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      {/* Sticky mobile approve bar */}
      {phase === "awaiting_approval" && activeStage?.compiled ? (
        <div className="sticky bottom-0 z-20 border-t border-[#DBEAFE] bg-white/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:p-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center">
            <p className="flex-1 text-[12px] leading-snug text-[#17212B]/65">
              Approve <span className="font-semibold">{activeStage.title}</span>{" "}
              to unlock the next agent. Nothing advances without you.
            </p>
            <Button
              type="button"
              size="lg"
              className="h-12 w-full bg-[#2563EB] text-base text-white hover:bg-[#1D4ED8] sm:w-auto sm:min-w-[12rem]"
              disabled={pending}
              onClick={approveCurrent}
            >
              <ThumbsUp className="size-4" aria-hidden />
              Approve stage
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
