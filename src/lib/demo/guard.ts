import { getRuntimeMode } from "@/lib/supabase/env";

/** Synthetic adapters must never handle authenticated operational records. */
export function assertSyntheticRuntime(): void {
  if (getRuntimeMode() !== "demo") {
    throw new Error("This workflow uses synthetic demonstration data. Its database adapter is unavailable. Use an isolated demonstration environment or complete the database integration.");
  }
}
