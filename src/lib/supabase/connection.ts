import { createClient } from "@supabase/supabase-js";
import {
  getSupabasePublicConfig,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";

export type SupabaseConnectionCheck = {
  configured: boolean;
  reachable: boolean;
  authHealthOk: boolean;
  /** True when a PostgREST request returned any HTTP response (incl. RLS 401/403/PGRST errors). */
  dataApiReachable: boolean;
  /** Present when a permitted table read succeeded with rows or empty result. */
  tableProbe:
    | {
        table: string;
        ok: boolean;
        /** RLS / missing-table / permission messages are not treated as offline. */
        classification:
          | "ok"
          | "empty"
          | "rls_or_permission"
          | "missing_table"
          | "error"
          | "skipped";
        message?: string;
      }
    | null;
  projectHost: string | null;
  runtimeMode: "supabase" | "demo";
  error?: string;
};

const PROBE_TABLES = [
  "organizations",
  "profiles",
  "medical_inquiries",
  "knowledge_items",
] as const;

/**
 * Safe read-only connectivity check. Does not print credentials.
 * RLS denials and missing tables mean the project is reachable but schema/auth may be incomplete.
 */
export async function checkSupabaseConnection(): Promise<SupabaseConnectionCheck> {
  const config = getSupabasePublicConfig();
  if (!config) {
    return {
      configured: false,
      reachable: false,
      authHealthOk: false,
      dataApiReachable: false,
      tableProbe: null,
      projectHost: null,
      runtimeMode: "demo",
      error: "NEXT_PUBLIC_SUPABASE_URL and publishable/anon key are not set.",
    };
  }

  let projectHost: string | null = null;
  try {
    projectHost = new URL(config.url).host;
  } catch {
    return {
      configured: true,
      reachable: false,
      authHealthOk: false,
      dataApiReachable: false,
      tableProbe: null,
      projectHost: null,
      runtimeMode: "supabase",
      error: "NEXT_PUBLIC_SUPABASE_URL is not a valid URL.",
    };
  }

  let authHealthOk = false;
  try {
    const health = await fetch(`${config.url}/auth/v1/health`, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
      cache: "no-store",
    });
    authHealthOk = health.ok;
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      authHealthOk: false,
      dataApiReachable: false,
      tableProbe: null,
      projectHost,
      runtimeMode: "supabase",
      error: error instanceof Error ? error.message : "Auth health request failed.",
    };
  }

  const serviceKey = getSupabaseServiceRoleKey();
  const client = createClient(config.url, serviceKey ?? config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let dataApiReachable = false;
  let tableProbe: SupabaseConnectionCheck["tableProbe"] = {
    table: PROBE_TABLES[0],
    ok: false,
    classification: "skipped",
    message: "No probe completed.",
  };

  for (const table of PROBE_TABLES) {
    const { error, status } = await client.from(table).select("id").limit(1);
    dataApiReachable = true;

    if (!error) {
      tableProbe = {
        table,
        ok: true,
        classification: "empty",
        message: `Select on ${table} succeeded (0+ rows).`,
      };
      // Prefer first successful table
      break;
    }

    const code = error.code ?? "";
    const message = error.message ?? String(error);
    if (code === "PGRST205" || /Could not find the table/i.test(message)) {
      tableProbe = {
        table,
        ok: false,
        classification: "missing_table",
        message,
      };
      continue;
    }

    if (
      status === 401 ||
      status === 403 ||
      code === "42501" ||
      /permission|rls|policy|JWT|not authorized/i.test(message)
    ) {
      tableProbe = {
        table,
        ok: false,
        classification: "rls_or_permission",
        message,
      };
      // Reachable with auth/RLS gating — stop; do not treat as offline
      break;
    }

    tableProbe = {
      table,
      ok: false,
      classification: "error",
      message,
    };
  }

  const reachable = authHealthOk || dataApiReachable;

  return {
    configured: true,
    reachable,
    authHealthOk,
    dataApiReachable,
    tableProbe,
    projectHost,
    runtimeMode: "supabase",
  };
}
