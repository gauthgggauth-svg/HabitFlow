import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(20).max(500),
    auth: z.string().min(8).max(200),
  }),
  userAgent: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Tidak diizinkan." }, { status: 401 });
  }

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Langganan push tidak valid." }, { status: 400 });
  }

  const input = parsed.data;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      user_agent: input.userAgent ?? request.headers.get("user-agent"),
      revoked_at: null,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    console.error("Gagal menyimpan push subscription:", error.code);
    return NextResponse.json({ ok: false, error: "Langganan gagal disimpan." }, { status: 500 });
  }

  await supabase
    .from("users")
    .update({ notification_permission: "granted" })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
