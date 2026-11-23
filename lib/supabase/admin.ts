import "server-only";

import { createClient } from "@supabase/supabase-js";

import { clientEnv, getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service role hanya boleh dipakai di server setelah otorisasi eksplisit.
 * Jangan pernah mengimpor modul ini dari komponen client.
 */
export function createAdminSupabase() {
  const key = getServerEnv().SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diatur.");
  }

  return createClient<Database>(clientEnv.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
