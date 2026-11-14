import type { NodeRunStatus, ValidationState } from "@/domain/workflow-studio/types";

export const NODE_STATUS_LABELS: Record<NodeRunStatus, string> = {
  ready: "Ready",
  in_review: "In review",
  complete: "Complete",
  blocked: "Blocked",
  pending: "Pending",
};

export const VALIDATION_LABELS: Record<ValidationState, string> = {
  pass: "Pass",
  warn: "Warn",
  fail: "Fail",
  not_run: "Not run",
};

export const NODE_STATUS_STYLES: Record<NodeRunStatus, string> = {
  ready: "border-sky-200 bg-sky-50 text-sky-900",
  in_review: "border-amber-200 bg-amber-50 text-amber-950",
  complete: "border-emerald-200 bg-emerald-50 text-emerald-900",
  blocked: "border-rose-200 bg-rose-50 text-rose-900",
  pending: "border-slate-200 bg-slate-50 text-slate-700",
};

export const VALIDATION_STYLES: Record<ValidationState, string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warn: "border-amber-200 bg-amber-50 text-amber-950",
  fail: "border-rose-200 bg-rose-50 text-rose-900",
  not_run: "border-slate-200 bg-slate-50 text-slate-600",
};
