"use client";

import { Menu } from "lucide-react";
import type { User } from "@/domain/types";
import { ROLE_LABELS } from "@/domain/authorization";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { useState } from "react";

interface HeaderProps {
  title: string;
  user: User;
  runtimeMode: "demo" | "supabase";
}

export function Header({ title, user, runtimeMode }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
            />
          }
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar onNavigate={() => setOpen(false)} className="w-full border-0" />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={
            runtimeMode === "demo"
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-emerald-300 bg-emerald-50 text-emerald-900"
          }
        >
          {runtimeMode === "demo" ? "Demo mode" : "Supabase"}
        </Badge>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-none">{user.fullName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
      </div>
    </header>
  );
}
