"use client";

import {
  AGENT_FOLLOW_UP_STORAGE_KEY,
  type AgentFollowUpTask,
} from "@/domain/workflow-studio/agent-follow-up-tasks";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readFollowUpTasks(): AgentFollowUpTask[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(AGENT_FOLLOW_UP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAgentFollowUpTask);
  } catch {
    return [];
  }
}

export function writeFollowUpTasks(tasks: AgentFollowUpTask[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    AGENT_FOLLOW_UP_STORAGE_KEY,
    JSON.stringify(tasks),
  );
}

function isAgentFollowUpTask(value: unknown): value is AgentFollowUpTask {
  if (!value || typeof value !== "object") return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === "string" &&
    typeof task.sectionId === "string" &&
    typeof task.agentId === "string" &&
    typeof task.note === "string" &&
    (task.status === "open" || task.status === "done") &&
    typeof task.createdAt === "string" &&
    (task.workflowId === "kol-meeting-prep" ||
      task.workflowId === "manager-education")
  );
}
