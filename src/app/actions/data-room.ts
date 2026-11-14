"use server";

import {
  sendToDataRoomInputSchema,
  type DataRoomPackage,
} from "@/domain/data-room/types";
import { requireUser } from "@/lib/security/require-user";
import {
  getAccessibleDataRoomPackage,
  listAccessibleDataRoomPackages,
  sendPackageToDataRoom,
} from "@/services/data-room/packages";

export type SendToDataRoomResult =
  | { ok: true; package: DataRoomPackage }
  | { ok: false; error: string };

export async function sendToDataRoomAction(
  raw: unknown,
): Promise<SendToDataRoomResult> {
  try {
    const parsed = sendToDataRoomInputSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Invalid Data Room package payload." };
    }

    const user = await requireUser({
      action: "data_room.send_package",
      resourceType: "data_room_package",
    });

    const pkg = await sendPackageToDataRoom({
      user,
      payload: parsed.data,
    });

    return { ok: true, package: pkg };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to send package to Data Room.";
    return { ok: false, error: message };
  }
}

export type ListDataRoomResult =
  | { ok: true; packages: DataRoomPackage[] }
  | { ok: false; error: string };

export async function listDataRoomPackagesAction(): Promise<ListDataRoomResult> {
  try {
    const user = await requireUser({
      action: "data_room.list_packages",
      resourceType: "data_room_package",
    });
    const packages = await listAccessibleDataRoomPackages({ user });
    return { ok: true, packages };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to list Data Room packages.";
    return { ok: false, error: message };
  }
}

export type GetDataRoomResult =
  | { ok: true; package: DataRoomPackage }
  | { ok: false; error: string };

export async function getDataRoomPackageAction(
  packageId: string,
): Promise<GetDataRoomResult> {
  try {
    if (!packageId || packageId.length > 80) {
      return { ok: false, error: "Invalid package id." };
    }

    const user = await requireUser({
      action: "data_room.view_package",
      resourceType: "data_room_package",
      resourceId: packageId,
    });

    const pkg = await getAccessibleDataRoomPackage({
      user,
      packageId,
    });

    if (!pkg) {
      return {
        ok: false,
        error: "Package not found or you do not have access.",
      };
    }

    return { ok: true, package: pkg };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to open Data Room package.";
    return { ok: false, error: message };
  }
}
