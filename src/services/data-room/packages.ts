import {
  DATA_ROOM_DEMO_NOTICE,
  DATA_ROOM_OVERSIGHT_LABEL,
  normalizeAccessEmails,
  type DataRoomGenerationSource,
  type DataRoomPackage,
  type DataRoomSectionSnapshot,
  type SendToDataRoomInput,
} from "@/domain/data-room/types";
import type { User } from "@/domain/types";
import { getRuntimeMode } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/lib/session";
import { recordSecurityAuditEvent } from "@/lib/security/audit";
import {
  demoAccessiblePackagesFor,
  demoGetDataRoomPackage,
  demoSaveDataRoomPackage,
} from "@/services/data-room/store";

function createPackageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapRow(row: Record<string, unknown>): DataRoomPackage {
  const sections = Array.isArray(row.sections)
    ? (row.sections as DataRoomSectionSnapshot[])
    : [];
  return {
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary),
    workflowType: row.workflow_type as DataRoomPackage["workflowType"],
    sections,
    demoLabel: String(row.demo_label ?? DATA_ROOM_DEMO_NOTICE),
    oversightLabel: String(row.oversight_label ?? DATA_ROOM_OVERSIGHT_LABEL),
    senderId: String(row.sender_profile_id),
    senderEmail: String(row.sender_email),
    senderDisplayName: String(row.sender_display_name),
    accessEmails: Array.isArray(row.access_emails)
      ? (row.access_emails as string[])
      : [],
    organizationId: (row.organization_id as string | null) ?? null,
    createdAt: String(row.created_at ?? row.audit_created_at),
    updatedAt: String(row.updated_at ?? row.created_at),
    persistence: "supabase",
  };
}

/** PostgREST missing-relation / schema-cache errors for unapplied migration 013. */
export function isDataRoomSchemaMissingError(
  error: { message?: string; code?: string } | null | undefined,
): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    message.includes("schema cache") ||
    message.includes("could not find the table") ||
    (message.includes("data_room_packages") &&
      message.includes("does not exist")) ||
    (message.includes("relation") && message.includes("data_room"))
  );
}

function saveDemoPackage(input: {
  user: User;
  payload: SendToDataRoomInput;
  accessEmails: string[];
  reason: string;
  generationSource?: DataRoomGenerationSource;
  demoLabelOverride?: string;
  oversightLabelOverride?: string;
}): DataRoomPackage {
  const now = new Date().toISOString();
  const pkg: DataRoomPackage = {
    id: createPackageId(),
    title: input.payload.title.trim(),
    summary: input.payload.summary.trim(),
    workflowType: input.payload.workflowType,
    sections: input.payload.sections,
    demoLabel:
      input.demoLabelOverride ??
      `${DATA_ROOM_DEMO_NOTICE} Fallback: ${input.reason}`,
    oversightLabel: input.oversightLabelOverride ?? DATA_ROOM_OVERSIGHT_LABEL,
    senderId: input.user.id,
    senderEmail: input.user.email,
    senderDisplayName: input.user.fullName,
    accessEmails: input.accessEmails,
    organizationId: null,
    createdAt: now,
    updatedAt: now,
    persistence: "demo_memory",
    generationSource: input.generationSource ?? "manual_send",
  };
  demoSaveDataRoomPackage(pkg);
  return pkg;
}

export async function sendPackageToDataRoom(input: {
  user: User;
  payload: SendToDataRoomInput;
  generationSource?: DataRoomGenerationSource;
  demoLabelOverride?: string;
  oversightLabelOverride?: string;
}): Promise<DataRoomPackage> {
  const accessEmails = normalizeAccessEmails(input.payload.accessEmails ?? []);
  const now = new Date().toISOString();
  const membership = await getCurrentUserOrganization();
  const generationSource = input.generationSource ?? "manual_send";
  const demoLabel = input.demoLabelOverride ?? DATA_ROOM_DEMO_NOTICE;
  const oversightLabel =
    input.oversightLabelOverride ?? DATA_ROOM_OVERSIGHT_LABEL;

  if (getRuntimeMode() === "demo") {
    const pkg = saveDemoPackage({
      user: input.user,
      payload: input.payload,
      accessEmails,
      reason: "demo runtime (in-memory only).",
      generationSource,
      demoLabelOverride: demoLabel,
      oversightLabelOverride: oversightLabel,
    });
    await recordSecurityAuditEvent({
      actorId: input.user.id,
      eventType: "data_room.package_created",
      resourceType: "data_room_package",
      resourceId: pkg.id,
      outcome: "success",
      metadata: {
        workflowType: pkg.workflowType,
        persistence: "demo_memory",
        generationSource,
        inviteCount: accessEmails.length,
      },
    });
    return pkg;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable for Data Room.");
  }

  const { data, error } = await supabase
    .from("data_room_packages")
    .insert({
      organization_id: membership.organizationId,
      sender_profile_id: input.user.id,
      sender_email: input.user.email,
      sender_display_name: input.user.fullName,
      title: input.payload.title.trim(),
      summary: input.payload.summary.trim(),
      workflow_type: input.payload.workflowType,
      sections: input.payload.sections,
      demo_label: demoLabel,
      oversight_label: oversightLabel,
      access_emails: accessEmails,
      audit_created_at: now,
    })
    .select("*")
    .single();

  if (isDataRoomSchemaMissingError(error)) {
    const pkg = saveDemoPackage({
      user: input.user,
      payload: input.payload,
      accessEmails,
      reason:
        "public.data_room_packages missing (apply migration 013_data_room_packages.sql). Session-local only until migration is applied.",
      generationSource,
      demoLabelOverride: `${demoLabel} (schema fallback: demo memory)`,
      oversightLabelOverride: oversightLabel,
    });
    await recordSecurityAuditEvent({
      actorId: input.user.id,
      eventType: "data_room.package_created_fallback",
      resourceType: "data_room_package",
      resourceId: pkg.id,
      outcome: "success",
      metadata: {
        workflowType: pkg.workflowType,
        persistence: "demo_memory",
        fallback: "schema_missing",
        generationSource,
        inviteCount: accessEmails.length,
      },
    });
    return pkg;
  }

  if (error || !data) {
    throw new Error(
      error?.message ?? "Unable to create Data Room package under RLS.",
    );
  }

  await supabase.from("data_room_access_events").insert({
    package_id: data.id,
    actor_profile_id: input.user.id,
    actor_email: input.user.email,
    event_type: "created",
  });

  await recordSecurityAuditEvent({
    actorId: input.user.id,
    eventType: "data_room.package_created",
    resourceType: "data_room_package",
    resourceId: String(data.id),
    outcome: "success",
    metadata: {
      workflowType: input.payload.workflowType,
      persistence: "supabase",
      generationSource,
      inviteCount: accessEmails.length,
    },
  });

  return {
    ...mapRow(data as Record<string, unknown>),
    generationSource,
  };
}

export async function listAccessibleDataRoomPackages(input: {
  user: User;
}): Promise<DataRoomPackage[]> {
  if (getRuntimeMode() === "demo") {
    return demoAccessiblePackagesFor({
      userId: input.user.id,
      email: input.user.email,
    });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable for Data Room.");
  }

  const { data, error } = await supabase
    .from("data_room_packages")
    .select("*")
    .order("created_at", { ascending: false });

  if (isDataRoomSchemaMissingError(error)) {
    return demoAccessiblePackagesFor({
      userId: input.user.id,
      email: input.user.email,
    });
  }

  if (error) {
    throw new Error(error.message);
  }

  const remote = (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  const local = demoAccessiblePackagesFor({
    userId: input.user.id,
    email: input.user.email,
  });
  // Merge any session fallback packages when remote schema is partial.
  const ids = new Set(remote.map((pkg) => pkg.id));
  return [...remote, ...local.filter((pkg) => !ids.has(pkg.id))];
}

export async function getAccessibleDataRoomPackage(input: {
  user: User;
  packageId: string;
}): Promise<DataRoomPackage | null> {
  if (getRuntimeMode() === "demo") {
    const pkg = demoGetDataRoomPackage(input.packageId);
    if (!pkg) return null;
    const allowed = demoAccessiblePackagesFor({
      userId: input.user.id,
      email: input.user.email,
    }).some((item) => item.id === pkg.id);
    return allowed ? pkg : null;
  }

  const local = demoGetDataRoomPackage(input.packageId);
  if (local) {
    const allowed = demoAccessiblePackagesFor({
      userId: input.user.id,
      email: input.user.email,
    }).some((item) => item.id === local.id);
    if (allowed) return local;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable for Data Room.");
  }

  const { data, error } = await supabase
    .from("data_room_packages")
    .select("*")
    .eq("id", input.packageId)
    .maybeSingle();

  if (isDataRoomSchemaMissingError(error)) {
    return null;
  }

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  await supabase.from("data_room_access_events").insert({
    package_id: data.id,
    actor_profile_id: input.user.id,
    actor_email: input.user.email,
    event_type: "viewed",
  });

  return mapRow(data as Record<string, unknown>);
}
