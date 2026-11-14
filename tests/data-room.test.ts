import { afterEach, describe, expect, it } from "vitest";
import type { User } from "@/domain/types";
import {
  getAccessibleDataRoomPackage,
  isDataRoomSchemaMissingError,
  listAccessibleDataRoomPackages,
  sendPackageToDataRoom,
} from "@/services/data-room/packages";
import { demoClearDataRoomPackages } from "@/services/data-room/store";

const sender: User = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "msl",
  email: "alex.chen@demo.medintel.local",
  fullName: "Alex Chen",
  createdAt: "",
  updatedAt: "",
};

const colleague: User = {
  id: "22222222-2222-4222-8222-222222222222",
  role: "field_director",
  email: "jordan.lee@demo.medintel.local",
  fullName: "Jordan Lee",
  createdAt: "",
  updatedAt: "",
};

const stranger: User = {
  id: "33333333-3333-4333-8333-333333333333",
  role: "msl",
  email: "outsider@example.com",
  fullName: "Outsider",
  createdAt: "",
  updatedAt: "",
};

afterEach(() => {
  demoClearDataRoomPackages();
});

describe("data room packages", () => {
  it("sends a package and lists it for sender and invited colleague", async () => {
    const pkg = await sendPackageToDataRoom({
      user: sender,
      payload: {
        title: "KOL Prep Packet — demo",
        summary: "Illustrative package for retrieval.",
        workflowType: "kol-meeting-prep",
        sections: [
          {
            id: "visit-context",
            title: "Visit Context",
            body: "Synthetic visit context only.",
            agentIds: ["medical-drafting"],
          },
        ],
        accessEmails: ["jordan.lee@demo.medintel.local"],
      },
    });

    expect(pkg.persistence).toBe("demo_memory");
    expect(pkg.oversightLabel.toLowerCase()).toContain("oversight");
    expect(pkg.demoLabel.toLowerCase()).toMatch(/illustrative|demo/);

    const senderList = await listAccessibleDataRoomPackages({ user: sender });
    expect(senderList.map((item) => item.id)).toContain(pkg.id);

    const colleagueList = await listAccessibleDataRoomPackages({
      user: colleague,
    });
    expect(colleagueList.map((item) => item.id)).toContain(pkg.id);

    const strangerList = await listAccessibleDataRoomPackages({
      user: stranger,
    });
    expect(strangerList.map((item) => item.id)).not.toContain(pkg.id);
  });

  it("detects PostgREST schema-cache missing-table errors", () => {
    expect(
      isDataRoomSchemaMissingError({
        code: "PGRST205",
        message:
          "Could not find the table 'public.data_room_packages' in the schema cache",
      }),
    ).toBe(true);
    expect(
      isDataRoomSchemaMissingError({
        code: "42501",
        message: "permission denied for table data_room_packages",
      }),
    ).toBe(false);
  });

  it("denies package detail to users outside access list", async () => {
    const pkg = await sendPackageToDataRoom({
      user: sender,
      payload: {
        title: "Manager Education Plan — demo",
        summary: "Illustrative education package.",
        workflowType: "manager-education",
        sections: [
          {
            id: "coaching-plan",
            title: "Coaching Plan",
            body: "Synthetic coaching plan.",
            agentIds: ["coaching-advisor"],
          },
        ],
        accessEmails: [],
      },
    });

    const allowed = await getAccessibleDataRoomPackage({
      user: sender,
      packageId: pkg.id,
    });
    expect(allowed?.id).toBe(pkg.id);

    const denied = await getAccessibleDataRoomPackage({
      user: stranger,
      packageId: pkg.id,
    });
    expect(denied).toBeNull();
  });
});
