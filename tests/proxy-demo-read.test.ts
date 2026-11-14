import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy hosted demo-read and auth-unavailable gate", () => {
  it("allows /workflow-studio in production when public Supabase env is fully absent", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const response = await proxy(
      new NextRequest("https://preview.example/workflow-studio"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-medintel-runtime-mode")).toBe("demo");
    expect(response.headers.get("x-medintel-demo-read")).toBe("workflow-studio");
  });

  it("still fails closed for other app routes in production without Supabase env", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const response = await proxy(
      new NextRequest("https://preview.example/dashboard"),
    );

    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).toContain("Authentication configuration is unavailable");
    expect(body).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(body).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(body).toContain("/workflow-studio");
  });

  it("fails closed for /workflow-studio when configuration is partial", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const response = await proxy(
      new NextRequest("https://preview.example/workflow-studio"),
    );

    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).toContain(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  });
});
