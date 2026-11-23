"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/account";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  formString,
  onboardingSchema,
  zodFieldErrors,
  type FormState,
} from "@/lib/validation";

export async function completeOnboardingAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const parsed = onboardingSchema.safeParse({
    goal: formString(formData, "goal"),
    defaultReminderTime: formString(formData, "defaultReminderTime"),
    timezone: formString(formData, "timezone"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali pilihan kamu.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("users")
    .update({
      goal: parsed.data.goal,
      default_reminder_time: parsed.data.defaultReminderTime,
      timezone: parsed.data.timezone,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      status: "error",
      message: "Preferensi belum tersimpan. Coba lagi.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/app");
}

export async function skipOnboardingAction() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    redirect("/onboarding?error=skip");
  }

  revalidatePath("/", "layout");
  redirect("/app");
}
