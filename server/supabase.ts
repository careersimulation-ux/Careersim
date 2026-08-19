import { createClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

let client: any;

/**
 * Creates the private, server-only client used by Express/tRPC. The service-role
 * credential must never be imported by browser code because it bypasses RLS.
 */
export function getSupabase() {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error("Supabase server configuration is incomplete");
  }

  if (!client) {
    client = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "careersim" },
    });
  }

  return client.schema("careersim");
}
