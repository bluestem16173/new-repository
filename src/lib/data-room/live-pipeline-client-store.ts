"use client";

import {
  LIVE_PIPELINE_STORAGE_KEY,
  type LivePipelineRun,
} from "@/domain/data-room/live-pipeline";

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export function readLivePipelineRuns(): LivePipelineRun[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(LIVE_PIPELINE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLivePipelineRun);
  } catch {
    return [];
  }
}

export function writeLivePipelineRuns(runs: LivePipelineRun[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LIVE_PIPELINE_STORAGE_KEY, JSON.stringify(runs));
}

export function upsertLivePipelineRun(run: LivePipelineRun): void {
  const current = readLivePipelineRuns().filter((item) => item.id !== run.id);
  writeLivePipelineRuns([run, ...current].slice(0, 20));
}

export function readLivePipelineRun(id: string): LivePipelineRun | null {
  return readLivePipelineRuns().find((run) => run.id === id) ?? null;
}

function isLivePipelineRun(value: unknown): value is LivePipelineRun {
  if (!value || typeof value !== "object") return false;
  const run = value as Record<string, unknown>;
  return (
    typeof run.id === "string" &&
    typeof run.workflowId === "string" &&
    Array.isArray(run.stages) &&
    typeof run.currentStageIndex === "number"
  );
}
