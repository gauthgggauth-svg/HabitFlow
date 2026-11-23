"use server";

import { redirect } from "next/navigation";

import { clientEnv } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/redirect";
import {
  forgotPasswordSchema,
  formString,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  zodFieldErrors,
  type FormState,
} from "@/lib/validation";

function authErrorMessage(message: string | undefined): string {
  if (!message) return "Terjadi kesalahan. Coba lagi.";

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email atau password salah.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Email belum dikonfirmasi. Cek kotak masuk untuk tautan konfirmasi.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  }

  if (normalized.includes("user already registered")) {
    return "Email sudah terdaftar. Coba masuk atau gunakan email lain.";
  }

  return "Terjadi kesalahan saat memproses permintaan. Coba lagi.";
}

export async function signInAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    next: formString(formData, "next"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: authErrorMessage(error.message) };
  }

  redirect(safeNextPath(parsed.data.next));
}

export async function signUpAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { status: "error", message: authErrorMessage(error.message) };
  }

  if (data.session) {
    redirect("/onboarding");
  }

  return {
    status: "success",
    message:
      "Akun dibuat. Cek email untuk mengonfirmasi, lalu masuk kembali ke HabitFlow.",
  };
}

export async function forgotPasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formString(formData, "email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Masukkan email yang valid.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createServerSupabase();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });

  return {
    status: "success",
    message:
      "Jika email terdaftar, kami sudah mengirim tautan reset password. Cek kotak masuk dan folder spam.",
  };
}

export async function resetPasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali password yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Sesi reset password sudah berakhir. Minta tautan baru dari halaman lupa password.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: authErrorMessage(error.message) };
  }

  redirect("/app");
}

export async function signOutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}
