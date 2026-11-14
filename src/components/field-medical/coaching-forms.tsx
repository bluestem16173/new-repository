"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignCoachingActivityAction,
  completeCoachingActivityAction,
  createCoachingPlanAction,
} from "@/app/actions/field-medical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateCoachingPlanForm({
  mslOptions,
  competencyOptions,
}: {
  mslOptions: Array<{ id: string; label: string }>;
  competencyOptions: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        setMessage(null);
        startTransition(async () => {
          const result = await createCoachingPlanAction({
            mslId: String(fd.get("mslId")),
            title: String(fd.get("title")),
            objective: String(fd.get("objective")),
            focusCompetencyId: String(fd.get("focusCompetencyId") || "") || null,
          });
          if (!result.ok) {
            setError(result.message);
            return;
          }
          setMessage(result.message);
          e.currentTarget.reset();
          if (result.id) {
            router.push(`/field-medical/coaching/${result.id}`);
            router.refresh();
          }
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="mslId">MSL</Label>
        <select
          id="mslId"
          name="mslId"
          required
          className="h-9 w-full rounded-lg border border-[#10243A]/15 bg-white px-3 text-sm"
        >
          {mslOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="title">Plan title</Label>
        <Input id="title" name="title" required minLength={4} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="focusCompetencyId">Focus competency (optional)</Label>
        <select
          id="focusCompetencyId"
          name="focusCompetencyId"
          className="h-9 w-full rounded-lg border border-[#10243A]/15 bg-white px-3 text-sm"
        >
          <option value="">None</option>
          {competencyOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="objective">Objective</Label>
        <Textarea id="objective" name="objective" required minLength={8} rows={3} />
      </div>
      <Button type="submit" disabled={pending} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
        {pending ? "Saving…" : "Create coaching plan"}
      </Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-800" role="status">{message}</p> : null}
    </form>
  );
}

export function AssignActivityForm({ planId }: { planId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          const dueLocal = String(fd.get("dueAt"));
          const dueAt = new Date(dueLocal).toISOString();
          const result = await assignCoachingActivityAction({
            planId,
            title: String(fd.get("title")),
            description: String(fd.get("description") || "") || null,
            dueAt,
          });
          if (!result.ok) {
            setError(result.message);
            return;
          }
          e.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="activity-title">Activity title</Label>
        <Input id="activity-title" name="title" required minLength={4} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="dueAt">Due at</Label>
        <Input id="dueAt" name="dueAt" type="datetime-local" required />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      <Button type="submit" disabled={pending} variant="outline">
        Assign activity
      </Button>
      {error ? (
        <p className="sm:col-span-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function CompleteActivityButton({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        disabled={pending}
        className="bg-[#0F9D92] hover:bg-[#0B7F76]"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await completeCoachingActivityAction({
              activityId,
              outcomeNotes:
                "Completed via Field Medical demo workflow. Observational only — not evidence of causal improvement.",
              scheduleReassessment: true,
              reassessmentScheduledAt: new Date(
                Date.now() + 30 * 86400000,
              ).toISOString(),
            });
            if (!result.ok) {
              setError(result.message);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Saving…" : "Mark complete"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
