import type { User, UserRole } from "@/domain/types";
import {
  getDemoCurrentUser,
  getDemoStore,
  setDemoCurrentUser,
} from "@/lib/demo/seed";
import { getRuntimeMode } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<User> {
  if (getRuntimeMode() === "demo") {
    return getDemoCurrentUser();
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return getDemoCurrentUser();
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    // Fall back to demo specialist identity when auth session is absent
    // but env is configured — keeps local walkthrough usable.
    return getDemoCurrentUser();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!profile) {
    return {
      id: authUser.id,
      email: authUser.email ?? "unknown@medintel.local",
      fullName: authUser.email ?? "Authenticated User",
      role: "medical_information_specialist",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    id: profile.id as string,
    email: profile.email as string,
    fullName: profile.full_name as string,
    role: profile.role as UserRole,
    createdAt: profile.created_at as string,
    updatedAt: profile.updated_at as string,
  };
}

export async function listDemoUsers(): Promise<User[]> {
  return getDemoStore().users;
}

export async function switchDemoUser(userId: string): Promise<User> {
  if (getRuntimeMode() !== "demo") {
    throw new Error("Demo user switching is only available in demo mode.");
  }
  setDemoCurrentUser(userId);
  return getDemoCurrentUser();
}
