"use server";

import { revalidatePath } from "next/cache";

import { requireOnboardedAccount } from "@/lib/auth/account";
import { canUseDarkTheme } from "@/lib/entitlements";
import { formString, profileSchema, zodFieldErrors, type FormState } from "@/lib/validation";

export async function updateProfileAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, entitlement, supabase } = await requireOnboardedAccount();

  const parsed = profileSchema.safeParse({
    name: formString(formData, "name"),
    timezone: formString(formData, "timezone"),
    defaultReminderTime: formString(formData, "defaultReminderTime"),
    emailReminders: formBooleanValue(formData, "emailReminders"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  if (parsed.data.emailReminders && !entitlement.features.email_reminders) {
    return {
      status: "error",
      message: "Email pengingat hanya tersedia untuk paket Standard dan Pro.",
    };
  }

  const { error } = await supabase
    .from("users")
    .update({
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      default_reminder_time: parsed.data.defaultReminderTime,
      email_reminders: parsed.data.emailReminders,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Gagal memperbarui profil:", error.code);
    return {
      status: "error",
      message: "Perubahan belum tersimpan. Coba lagi.",
    };
  }

  revalidatePath("/app", "layout");
  return { status: "success", message: "Profil tersimpan." };
}

export async function updateThemeAction(formData: FormData): Promise<void> {
  const { user, entitlement, supabase } = await requireOnboardedAccount();
  const theme = formString(formData, "theme") === "dark" ? "dark" : "light";

  if (theme === "dark" && !canUseDarkTheme(entitlement)) {
    return;
  }

  await supabase.from("users").update({ theme }).eq("id", user.id);
  revalidatePath("/", "layout");
}

function formBooleanValue(formData: FormData, key: string): boolean {
  return formData.getAll(key).some((value) => value === "on" || value === "true");
}
