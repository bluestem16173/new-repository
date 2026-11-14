"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  completeSimulationAction,
  replySimulationAction,
  startSimulationAction,
  validateSimulationEvaluationAction,
} from "@/app/actions/scientific";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type {
  ProvisionalEvaluation,
  SimulationSession,
  SimulationTurn,
} from "@/domain/scientific/types";

interface SimulationSessionPanelProps {
  scenarioId: string;
  canValidate: boolean;
}

export function SimulationSessionPanel({
  scenarioId,
  canValidate,
}: SimulationSessionPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [session, setSession] = useState<SimulationSession | null>(null);
  const [evaluation, setEvaluation] = useState<ProvisionalEvaluation | null>(
    null,
  );
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  function applySession(next: SimulationSession) {
    setSession(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending || Boolean(session)}
          className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          onClick={() => {
            setError(null);
            setMessage(null);
            startTransition(async () => {
              const result = await startSimulationAction(scenarioId);
              if (!result.ok) {
                setError(result.message);
                return;
              }
              applySession(result.payload as SimulationSession);
              setMessage(result.message);
            });
          }}
        >
          Start simulation
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-[#E5E7EB]"
          disabled={pending || !session || session.status !== "in_progress"}
          onClick={() => {
            if (!session) return;
            setError(null);
            startTransition(async () => {
              const result = await completeSimulationAction(session.id);
              if (!result.ok) {
                setError(result.message);
                return;
              }
              const payload = result.payload as {
                session: SimulationSession;
                evaluation: ProvisionalEvaluation;
                evaluationId: string;
              };
              applySession(payload.session);
              setEvaluation(payload.evaluation);
              setEvaluationId(payload.evaluationId);
              setMessage(result.message);
              router.refresh();
            });
          }}
        >
          Complete &amp; evaluate
        </Button>
      </div>

      {session ? (
        <div className="space-y-4">
          <ol className="space-y-3" aria-label="Simulation transcript">
            {session.turns.map((turn: SimulationTurn) => (
              <li
                key={turn.id}
                className={
                  turn.speaker === "msl"
                    ? "rounded-lg border border-[#2563EB]/25 bg-[#2563EB]/5 px-4 py-3"
                    : "rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3"
                }
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#17212B]/50">
                  {turn.speaker === "msl" ? "MSL" : turn.speaker === "hcp" ? "HCP (AI teaching persona)" : "System"}
                  <span className="ml-2 font-normal normal-case">
                    {new Date(turn.createdAt).toLocaleString()}
                  </span>
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.65] text-[#17212B]">
                  {turn.content}
                </p>
              </li>
            ))}
          </ol>

          {session.status === "in_progress" ? (
            <form
              className="space-y-3 border-t border-[#E5E7EB] pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!session || !reply.trim()) return;
                setError(null);
                startTransition(async () => {
                  const result = await replySimulationAction({
                    sessionId: session.id,
                    mslMessage: reply.trim(),
                  });
                  if (!result.ok) {
                    setError(result.message);
                    return;
                  }
                  applySession(result.payload as SimulationSession);
                  setReply("");
                  setMessage(result.message);
                });
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="msl-reply">Your scientific exchange reply</Label>
                <Textarea
                  id="msl-reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder="Cite only allowlisted teaching notes. Do not invent trial statistics."
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={pending || !reply.trim()}
                className="bg-[#0F9D92] text-white hover:bg-[#0C857C]"
              >
                Send reply
              </Button>
            </form>
          ) : null}
        </div>
      ) : (
        <p className="text-[15px] leading-relaxed text-[#17212B]/65">
          Start a turn-based teaching simulation. The HCP persona asks
          challenging follow-ups but must not invent study facts beyond
          allowlisted passages.
        </p>
      )}

      {evaluation ? (
        <section
          aria-label="Provisional competency evaluation"
          className="space-y-4 border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-5"
        >
          <div>
            <h3 className="text-base font-semibold text-[#17212B]">
              Provisional evaluation
            </h3>
            <p className="mt-1 text-[14px] leading-relaxed text-[#17212B]/70">
              Zod-validated rubric scores. Not formal competency attainment until
              a qualified reviewer validates. Does not auto-approve readiness.
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["Scientific accuracy", evaluation.scientificAccuracy],
                ["Evidence interpretation", evaluation.evidenceInterpretation],
                ["Compliance", evaluation.compliance],
                ["Communication", evaluation.communication],
                ["Uncertainty handling", evaluation.uncertaintyHandling],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2">
                <dt className="text-xs uppercase tracking-wide text-[#17212B]/50">
                  {label}
                </dt>
                <dd className="text-xl font-semibold tabular-nums text-[#17212B]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {evaluation.criticalInaccuracyFlags.length > 0 ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              <p className="font-semibold">Critical inaccuracy flags</p>
              <ul className="mt-1 list-disc pl-5">
                {evaluation.criticalInaccuracyFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-[#17212B]/70">
              No critical inaccuracy flags detected by deterministic heuristics.
            </p>
          )}
          <p className="text-[14px] leading-relaxed text-[#17212B]/75">
            {evaluation.notes}
          </p>
          {canValidate && evaluationId && !validated ? (
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={pending}
                className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await validateSimulationEvaluationAction({
                      evaluationId,
                      approve: true,
                    });
                    if (!result.ok) {
                      setError(result.message);
                      return;
                    }
                    setValidated(true);
                    setMessage(result.message);
                    router.refresh();
                  });
                }}
              >
                Validate (reviewer)
              </Button>
              <Button
                variant="outline"
                className="border-[#E5E7EB]"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await validateSimulationEvaluationAction({
                      evaluationId,
                      approve: false,
                    });
                    if (!result.ok) {
                      setError(result.message);
                      return;
                    }
                    setMessage(result.message);
                  });
                }}
              >
                Decline validation
              </Button>
            </div>
          ) : null}
          {validated ? (
            <p className="text-sm font-medium text-[#0F9D92]">
              Reviewer validated. Connect to coaching plans manually — readiness
              is never auto-approved from simulations.
            </p>
          ) : null}
        </section>
      ) : null}

      {message ? (
        <p className="text-sm text-[#0F9D92]" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
