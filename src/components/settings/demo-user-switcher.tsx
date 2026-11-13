"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/domain/types";
import { ROLE_LABELS } from "@/domain/authorization";
import { switchDemoUserAction } from "@/app/actions/inquiries";
import { Button } from "@/components/ui/button";

interface DemoUserSwitcherProps {
  users: User[];
  currentUserId: string;
}

export function DemoUserSwitcher({
  users,
  currentUserId,
}: DemoUserSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <ul className="space-y-2">
      {users.map((user) => {
        const active = user.id === currentUserId;
        return (
          <li
            key={user.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[user.role]} · {user.email}
              </p>
            </div>
            <Button
              size="sm"
              variant={active ? "secondary" : "outline"}
              disabled={pending || active}
              onClick={() => {
                startTransition(async () => {
                  await switchDemoUserAction(user.id);
                  router.refresh();
                });
              }}
            >
              {active ? "Active" : "Switch"}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
