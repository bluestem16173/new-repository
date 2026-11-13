/**
 * Read-only Supabase connectivity check. Loads .env.local if present.
 * Never prints credential values.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const result = {
  configured: Boolean(url && key),
  projectHost: null,
  authHealthOk: false,
  dataApiReachable: false,
  tableProbe: null,
  reachable: false,
  notes: [],
};

if (!result.configured) {
  result.notes.push("Missing URL or publishable/anon key — demo mode.");
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
}

try {
  result.projectHost = new URL(url).host;
} catch {
  result.notes.push("Invalid NEXT_PUBLIC_SUPABASE_URL");
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
}

const health = await fetch(`${url}/auth/v1/health`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
result.authHealthOk = health.ok;

const client = createClient(url, service || key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tables = ["organizations", "profiles", "medical_inquiries", "knowledge_items"];
for (const table of tables) {
  const { error } = await client.from(table).select("id").limit(1);
  result.dataApiReachable = true;
  if (!error) {
    result.tableProbe = { table, classification: "ok_or_empty" };
    break;
  }
  const message = error.message || "";
  if (/Could not find the table|PGRST205/i.test(message) || error.code === "PGRST205") {
    result.tableProbe = { table, classification: "missing_table", code: error.code };
    continue;
  }
  if (/permission|policy|JWT|not authorized|RLS/i.test(message) || error.code === "42501") {
    result.tableProbe = { table, classification: "rls_or_permission", code: error.code };
    result.notes.push("RLS/permission denial is NOT treated as offline.");
    break;
  }
  result.tableProbe = { table, classification: "error", code: error.code };
}

result.reachable = result.authHealthOk || result.dataApiReachable;
if (result.tableProbe?.classification === "missing_table") {
  result.notes.push(
    "Project reachable; MedIntel tables not applied yet — run migrations via Dashboard SQL Editor or approved CLI auth.",
  );
}

console.log(JSON.stringify(result, null, 2));
process.exit(result.reachable ? 0 : 1);
