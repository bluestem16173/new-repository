import {
  DATA_ROOM_DEMO_NOTICE,
  DATA_ROOM_OVERSIGHT_LABEL,
  normalizeAccessEmails,
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

export async function sendPackageToDataRoom(input: {
  user: User;
  payload: SendToDataRoomInput;
}): Promise<DataRoomPackage> {
  const accessEmails = normalizeAccessEmails(input.payload.accessEmails ?? []);
  const now = new Date().toISOString();
  const membership = await getCurrentUserOrganization();

  if (getRuntimeMode() === "demo") {
    const pkg: DataRoomPackage = {
      id: createPackageId(),
      title: input.payload.title.trim(),
      summary: input.payload.summary.trim(),
      workflowType: input.payload.workflowType,
      sections: input.payload.sections,
      demoLabel: DATA_ROOM_DEMO_NOTICE,
      oversightLabel: DATA_ROOM_OVERSIGHT_LABEL,
      senderId: input.user.id,
      senderEmail: input.user.email,
      senderDisplayName: input.user.fullName,
      accessEmails,
      organizationId: null,
      createdAt: now,
      updatedAt: now,
      persistence: "demo_memory",
    };
    demoSaveDataRoomPackage(pkg);
    await recordSecurityAuditEvent({
      actorId: input.user.id,
      eventType: "data_room.package_created",
      resourceType: "data_room_package",
      resourceId: pkg.id,
      outcome: "success",
      metadata: {
        workflowType: pkg.workflowType,
        persistence: "demo_memory",
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
      demo_label: DATA_ROOM_DEMO_NOTICE,
      oversight_label: DATA_ROOM_OVERSIGHT_LABEL,
      access_emails: accessEmails,
      audit_created_at: now,
    })
    .select("*")
    .single();

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
      inviteCount: accessEmails.length,
    },
  });

  return mapRow(data as Record<string, unknown>);
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

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
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

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable for Data Room.");
  }

  const { data, error } = await supabase
    .from("data_room_packages")
    .select("*")
    .eq("id", input.packageId)
    .maybeSingle();

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
