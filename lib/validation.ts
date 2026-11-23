import { z } from "zod";

import { isValidTimezone } from "@/lib/dates";
import { HABIT_COLORS, HABIT_ICONS } from "@/types/domain";

export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) {
      result[key] = issue.message;
    }
  }

  return result;
}

export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function formOptionalString(formData: FormData, key: string): string | null {
  const value = formString(formData, key).trim();
  return value === "" ? null : value;
}

export function formBoolean(formData: FormData, key: string): boolean {
  return formData.getAll(key).some((value) => value === "on" || value === "true");
}

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email wajib diisi.")
  .pipe(z.email("Format email tidak valid."));

const password = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(72, "Password maksimal 72 karakter.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password wajib diisi."),
  next: z.string().optional(),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nama wajib diisi.")
      .max(80, "Nama maksimal 80 karakter."),
    email,
    password,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

const timezoneSchema = z
  .string()
  .trim()
  .min(1, "Zona waktu wajib diisi.")
  .refine(isValidTimezone, "Zona waktu tidak valid.");

const optionalReminderTime = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:MM.")
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : null));

export const onboardingSchema = z.object({
  goal: z
    .string()
    .trim()
    .max(200, "Tujuan maksimal 200 karakter.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  defaultReminderTime: optionalReminderTime,
  timezone: timezoneSchema,
});

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi.")
    .max(80, "Nama maksimal 80 karakter."),
  timezone: timezoneSchema,
  defaultReminderTime: optionalReminderTime,
  emailReminders: z.boolean(),
});

export const notificationPermissionSchema = z.object({
  permission: z.enum(["default", "granted", "denied"]),
});

export const habitSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Nama habit wajib diisi.")
      .max(80, "Nama habit maksimal 80 karakter."),
    description: z
      .string()
      .trim()
      .max(500, "Deskripsi maksimal 500 karakter.")
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null)),
    frequency: z.enum(["daily", "weekdays"], {
      message: "Pilih frekuensi habit.",
    }),
    weekdays: z.array(z.number().int().min(1).max(7)).default([]),
    reminderTime: optionalReminderTime,
    color: z.enum(HABIT_COLORS),
    icon: z.enum(HABIT_ICONS),
    isActive: z.boolean(),
  })
  .superRefine((data, context) => {
    if (data.frequency === "weekdays" && data.weekdays.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["weekdays"],
        message: "Pilih minimal satu hari.",
      });
    }
  });

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul tugas wajib diisi.")
    .max(160, "Judul tugas maksimal 160 karakter."),
  notes: z
    .string()
    .trim()
    .max(2000, "Catatan maksimal 2.000 karakter.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  priority: z.enum(["low", "medium", "high"], {
    message: "Pilih prioritas tugas.",
  }),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("Endpoint push tidak valid."),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const timezoneList = (() => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "UTC"];
  }
})();
