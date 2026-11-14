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
    // Fail closed for identity: do not silently impersonate a demo specialist
    // when Supabase is configured. Middleware should redirect unauthenticated
    // browsers; server actions must call requireUser() for mutations.
    throw new Error(
      "Unauthenticated: Supabase session required when NEXT_PUBLIC_SUPABASE_URL is configured.",
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!profile) {
    // Least privilege: authenticated but unprovisioned users get MSL-equivalent
    // read-oriented role, never admin/reviewer, until an admin assigns a profile.
    // No client-side role escalation path exists.
    return {
      id: authUser.id,
      email: authUser.email ?? "unknown@medintel.local",
      fullName: authUser.email ?? "Authenticated User",
      role: "msl",
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

/**
 * Returns organization membership for the authenticated user, or a clear error
 * reason when membership is missing. Does not escalate roles.
 */
export async function getCurrentUserOrganization(): Promise<{
  organizationId: string | null;
  membershipRole: string | null;
  error: string | null;
}> {
  if (getRuntimeMode() === "demo") {
    return { organizationId: null, membershipRole: null, error: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      organizationId: null,
      membershipRole: null,
      error: "Supabase client unavailable",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      organizationId: null,
      membershipRole: null,
      error: "Not authenticated",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const organizationId = (profile?.organization_id as string | null) ?? null;
  if (!organizationId) {
    return {
      organizationId: null,
      membershipRole: null,
      error:
        "Your account has no organization membership. Ask an administrator to provision access.",
    };
  }

  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("membership_role")
    .eq("organization_id", organizationId)
    .eq("profile_id", user.id)
    .maybeSingle();

  return {
    organizationId,
    membershipRole: (membership?.membership_role as string | null) ?? "member",
    error: null,
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
