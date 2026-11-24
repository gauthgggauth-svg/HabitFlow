import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  endpoint: z.string().url().max(2000),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Tidak diizinkan." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Endpoint tidak valid." }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("endpoint", parsed.data.endpoint)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ ok: false, error: "Langganan gagal dicabut." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
