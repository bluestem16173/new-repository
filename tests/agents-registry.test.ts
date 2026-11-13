import { describe, expect, it } from "vitest";
import {
  getAgentById,
  listAgents,
  type AgentStatus,
} from "@/domain/agents/registry";

describe("MedIntel agent registry", () => {
  it("exposes exactly 16 agents with unique ids and icon paths", () => {
    const agents = listAgents();
    expect(agents).toHaveLength(16);
    const ids = new Set(agents.map((a) => a.id));
    expect(ids.size).toBe(16);
    for (const agent of agents) {
      expect(agent.icon.startsWith("/agents/")).toBe(true);
      expect(agent.icon.endsWith(".png")).toBe(true);
      expect(agent.route).toBe(`/agents/${agent.id}`);
    }
  });

  it("only marks Active when implemented capabilities exist", () => {
    for (const agent of listAgents()) {
      if (agent.status === "active") {
        expect(agent.implementedCapabilities.length).toBeGreaterThan(0);
        expect(agent.workflowHref).toBeTruthy();
      }
      if (agent.status === "planned") {
        expect(
          agent.implementedCapabilities.length === 0 ||
            agent.plannedCapabilities.length > 0,
        ).toBe(true);
      }
      const allowed: AgentStatus[] = ["active", "in_development", "planned"];
      expect(allowed).toContain(agent.status);
    }
  });

  it("resolves known agents and returns null for unknown ids", () => {
    expect(getAgentById("kol-simulator")?.name).toBe("KOL Simulator");
    expect(getAgentById("missing-agent")).toBeNull();
  });
});
