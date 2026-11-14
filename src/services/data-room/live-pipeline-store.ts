import type { LivePipelineRun } from "@/domain/data-room/live-pipeline";

/**
 * Process-local live pipeline runs for demo/preview.
 * Client also mirrors to localStorage so a phone refresh can resume.
 */
const runs = new Map<string, LivePipelineRun>();

export function saveLivePipelineRun(run: LivePipelineRun): void {
  runs.set(run.id, run);
}

export function getLivePipelineRun(id: string): LivePipelineRun | undefined {
  return runs.get(id);
}

export function listLivePipelineRuns(): LivePipelineRun[] {
  return [...runs.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function clearLivePipelineRuns(): void {
  runs.clear();
}
