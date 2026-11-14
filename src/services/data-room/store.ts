import type { DataRoomPackage } from "@/domain/data-room/types";

/**
 * Demo-mode Data Room store. Process-local only — clearly not durable.
 * Supabase mode uses the data_room_packages table with RLS.
 */
const packages = new Map<string, DataRoomPackage>();

export function demoListDataRoomPackages(): DataRoomPackage[] {
  return [...packages.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function demoGetDataRoomPackage(
  id: string,
): DataRoomPackage | undefined {
  return packages.get(id);
}

export function demoSaveDataRoomPackage(pkg: DataRoomPackage): void {
  packages.set(pkg.id, pkg);
}

export function demoClearDataRoomPackages(): void {
  packages.clear();
}

export function demoAccessiblePackagesFor(input: {
  userId: string;
  email: string;
}): DataRoomPackage[] {
  const email = input.email.trim().toLowerCase();
  return demoListDataRoomPackages().filter((pkg) => {
    if (pkg.senderId === input.userId) return true;
    return pkg.accessEmails.some(
      (invite) => invite.trim().toLowerCase() === email,
    );
  });
}
