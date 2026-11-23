import "server-only";

import { cache } from "react";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Plan } from "@/types/domain";

export const getActivePlans = cache(async (): Promise<Plan[]> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Gagal memuat plan:", error.code);
    return [];
  }

  return data ?? [];
});
