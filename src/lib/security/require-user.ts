import type { User, UserRole } from "@/domain/types";
import { getCurrentUser } from "@/lib/session";
import { getRuntimeMode } from "@/lib/supabase/env";
import { recordSecurityAuditEvent } from "@/lib/security/audit";

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Resolves the current user and optionally enforces role membership.
 * In supabase mode, anonymous fallback identities are rejected for mutations.
 */
export async function requireUser(options?: {
  roles?: readonly UserRole[];
  action?: string;
  resourceType?: string;
  resourceId?: string;
}): Promise<User> {
  const mode = getRuntimeMode();
  const user = await getCurrentUser();

  if (mode === "supabase" && user.email.endsWith("@demo.medintel.local")) {
    await recordSecurityAuditEvent({
      actorId: null,
      eventType: options?.action ?? "auth.require_user",
      resourceType: options?.resourceType ?? "session",
      resourceId: options?.resourceId,
      outcome: "denied",
      metadata: { reason: "demo_identity_in_supabase_mode" },
    });
    throw new AuthorizationError(
      "Authenticated Supabase session required. Demo identities are not valid in supabase mode.",
    );
  }

  if (options?.roles && !options.roles.includes(user.role)) {
    await recordSecurityAuditEvent({
      actorId: user.id,
      eventType: options.action ?? "auth.role_check",
      resourceType: options.resourceType ?? "authorization",
      resourceId: options.resourceId,
      outcome: "denied",
      metadata: { requiredRoles: options.roles, actualRole: user.role },
    });
    throw new AuthorizationError(
      `Role ${user.role} is not permitted for this action.`,
    );
  }

  return user;
}
