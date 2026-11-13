"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveKnowledgeItemAction,
  rejectKnowledgeItemAction,
} from "@/app/actions/knowledge";
import { Button } from "@/components/ui/button";

export function KnowledgeReviewActions({
  knowledgeItemId,
}: {
  knowledgeItemId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await approveKnowledgeItemAction(knowledgeItemId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        Approve for scoped reuse
      </Button>
      <Button
        variant="outline"
        className="border-[#E5E7EB]"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await rejectKnowledgeItemAction(knowledgeItemId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        Reject
      </Button>
      {error ? (
        <p className="w-full text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
