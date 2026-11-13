import { getRuntimeMode } from "@/lib/supabase/env";
import {
  assertDemoOnlyReset,
  getFieldMedicalStore,
  resetFieldMedicalStore,
  type FieldMedicalStore,
} from "@/lib/demo/field-medical-seed";

/**
 * Field Medical currently uses the deterministic demo adapter.
 * When Supabase is configured, the same in-memory synthetic corpus remains the
 * source of truth until FM tables are populated — never imply production persistence.
 */
export async function loadFieldMedicalStore(): Promise<{
  store: FieldMedicalStore;
  mode: "demo" | "supabase";
  persisted: boolean;
}> {
  const mode = getRuntimeMode();
  return {
    store: getFieldMedicalStore(),
    mode,
    persisted: false,
  };
}

export async function resetFieldMedicalDemoStore(): Promise<FieldMedicalStore> {
  const mode = getRuntimeMode();
  assertDemoOnlyReset(mode === "supabase" ? "supabase" : "demo");
  // Even if Supabase env exists, FM reset only clears the demo adapter corpus.
  if (mode === "supabase") {
    throw new Error(
      "Refusing to reset Field Medical seed while Supabase env is configured. Use an explicit demo-only environment.",
    );
  }
  return resetFieldMedicalStore();
}
