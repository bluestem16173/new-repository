"use server";

import {
  approveLiveStageSchema,
  buildLivePipelineRun,
  runLiveStageSchema,
  startLivePipelineSchema,
  type LivePipelineRun,
  type LivePipelineStage,
} from "@/domain/data-room/live-pipeline";
import type { DataRoomPackage } from "@/domain/data-room/types";
import { requireUser } from "@/lib/security/require-user";
import {
  finalizeLivePipelinePackage,
  LivePipelineStageError,
  runLivePipelineStage,
} from "@/services/data-room/live-pipeline";
import {
  getLivePipelineRun,
  saveLivePipelineRun,
} from "@/services/data-room/live-pipeline-store";

export type StartLivePipelineResult =
  | { ok: true; run: LivePipelineRun }
  | { ok: false; error: string };

export async function startLivePipelineAction(
  raw: unknown,
): Promise<StartLivePipelineResult> {
  try {
    const parsed = startLivePipelineSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Invalid live pipeline start payload." };
    }

    await requireUser({
      action: "data_room.live_pipeline_start",
      resourceType: "live_pipeline_run",
    });

    const run = buildLivePipelineRun({
      workflowId: parsed.data.workflowId,
      accessEmails: parsed.data.accessEmails,
    });
    saveLivePipelineRun(run);
    return { ok: true, run };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to start live pipeline.",
    };
  }
}

export type RunLiveStageResult =
  | {
      ok: true;
      stage: LivePipelineStage;
      source: "openai_live" | "fixture_fallback_labeled";
    }
  | { ok: false; error: string; code?: string };

export async function runLivePipelineStageAction(
  raw: unknown,
): Promise<RunLiveStageResult> {
  try {
    const parsed = runLiveStageSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Invalid live stage payload." };
    }

    const user = await requireUser({
      action: "data_room.live_pipeline_stage",
      resourceType: "live_pipeline_run",
      resourceId: parsed.data.runId,
    });

    const existing = getLivePipelineRun(parsed.data.runId);
    const stageMeta =
      existing?.stages.find((stage) => stage.id === parsed.data.stageId) ??
      parsed.data.priorStages.find((stage) => stage.id === parsed.data.stageId);

    if (!stageMeta) {
      return { ok: false, error: "Unknown pipeline stage." };
    }

    // Prefer full stage def from server run when present
    const stageDef = existing?.stages.find(
      (stage) => stage.id === parsed.data.stageId,
    );

    const result = await runLivePipelineStage({
      user,
      workflowId: parsed.data.workflowId,
      stage: {
        id: parsed.data.stageId,
        title: stageDef?.title ?? stageMeta.title ?? parsed.data.stageId,
        agentId: stageDef?.agentId ?? ("agentId" in stageMeta ? stageMeta.agentId : "medical-drafting"),
        blurb: stageDef?.blurb ?? "Compile allowlisted stage output.",
        focusHints: stageDef?.focusHints ?? ["illustrative", "oversight"],
      },
      priorStages: parsed.data.priorStages.map((stage) => ({
        id: stage.id,
        title: stage.title,
        agentId: stage.agentId,
        compiled: stage.compiled,
      })),
      allowLabeledFixtureFallback: parsed.data.allowLabeledFixtureFallback,
    });

    if (existing && stageDef) {
      const updated: LivePipelineRun = {
        ...existing,
        updatedAt: new Date().toISOString(),
        stages: existing.stages.map((stage) =>
          stage.id === parsed.data.stageId
            ? {
                ...stage,
                status: "awaiting_approval",
                compiled: result.compiled,
                source: result.source,
                error: null,
                ranAt: new Date().toISOString(),
              }
            : stage,
        ),
      };
      saveLivePipelineRun(updated);
      const updatedStage = updated.stages.find(
        (stage) => stage.id === parsed.data.stageId,
      )!;
      return { ok: true, stage: updatedStage, source: result.source };
    }

    // Client-authoritative resume path (phone refresh): return stage patch
    const patched: LivePipelineStage = {
      id: parsed.data.stageId,
      index: 0,
      agentId: stageDef?.agentId ?? "medical-drafting",
      agentName: stageDef?.agentName ?? "Agent",
      agentRoute: stageDef?.agentRoute ?? "/agents",
      title: stageDef?.title ?? parsed.data.stageId,
      blurb: stageDef?.blurb ?? "",
      focusHints: stageDef?.focusHints ?? [],
      status: "awaiting_approval",
      compiled: result.compiled,
      source: result.source,
      error: null,
      ranAt: new Date().toISOString(),
      approvedAt: null,
    };

    return { ok: true, stage: patched, source: result.source };
  } catch (error) {
    if (error instanceof LivePipelineStageError) {
      return { ok: false, error: error.message, code: error.code };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to run live pipeline stage.",
    };
  }
}

export type ApproveLiveStageResult =
  | { ok: true; run: LivePipelineRun }
  | { ok: false; error: string };

/** Server mirror of approval — client remains source of truth after refresh. */
export async function approveLivePipelineStageAction(
  raw: unknown,
): Promise<ApproveLiveStageResult> {
  try {
    const parsed = approveLiveStageSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Invalid approval payload." };
    }

    await requireUser({
      action: "data_room.live_pipeline_approve",
      resourceType: "live_pipeline_run",
      resourceId: parsed.data.runId,
    });

    const existing = getLivePipelineRun(parsed.data.runId);
    if (!existing) {
      return {
        ok: false,
        error:
          "Run not found on server. Continue from your device-saved session state.",
      };
    }

    const stageIndex = existing.stages.findIndex(
      (stage) => stage.id === parsed.data.stageId,
    );
    if (stageIndex < 0) {
      return { ok: false, error: "Stage not found." };
    }

    const now = new Date().toISOString();
    const stages = existing.stages.map((stage, index) => {
      if (index !== stageIndex) return stage;
      return {
        ...stage,
        status: "approved" as const,
        approvedAt: now,
      };
    });

    const nextIndex = Math.min(stageIndex + 1, stages.length - 1);
    const allApproved = stages.every((stage) => stage.status === "approved");
    const updated: LivePipelineRun = {
      ...existing,
      stages,
      currentStageIndex: allApproved ? stageIndex : nextIndex,
      status: allApproved ? "completed" : "active",
      updatedAt: now,
    };
    saveLivePipelineRun(updated);
    return { ok: true, run: updated };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to approve live stage.",
    };
  }
}

export type FinalizeLivePipelineResult =
  | { ok: true; package: DataRoomPackage; run: LivePipelineRun }
  | { ok: false; error: string };

export async function finalizeLivePipelineAction(input: {
  run: LivePipelineRun;
}): Promise<FinalizeLivePipelineResult> {
  try {
    const user = await requireUser({
      action: "data_room.live_pipeline_finalize",
      resourceType: "live_pipeline_run",
      resourceId: input.run.id,
    });

    const pkg = await finalizeLivePipelinePackage({
      user,
      run: input.run,
    });

    const updated: LivePipelineRun = {
      ...input.run,
      status: "completed",
      packageId: pkg.id,
      updatedAt: new Date().toISOString(),
    };
    saveLivePipelineRun(updated);

    return { ok: true, package: pkg, run: updated };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to finalize live pipeline to Data Room.",
    };
  }
}

export async function getLivePipelineRunAction(
  runId: string,
): Promise<{ ok: true; run: LivePipelineRun } | { ok: false; error: string }> {
  try {
    await requireUser({
      action: "data_room.live_pipeline_get",
      resourceType: "live_pipeline_run",
      resourceId: runId,
    });
    const run = getLivePipelineRun(runId);
    if (!run) {
      return { ok: false, error: "Run not found on server." };
    }
    return { ok: true, run };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load run.",
    };
  }
}
