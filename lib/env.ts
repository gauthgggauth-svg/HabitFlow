import { z } from "zod";

/**
 * Env publik aman dipakai di client. Hanya NEXT_PUBLIC_* yang boleh di sini.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.string().email().optional(),
});

export type ClientEnv = z.infer<typeof clientSchema>;

export const clientEnv: ClientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || undefined,
});

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional(),
);

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  MIDTRANS_SERVER_KEY: optionalString,
  MIDTRANS_API_URL: optionalString,
  MIDTRANS_SNAP_URL: optionalString,
  MIDTRANS_IS_PRODUCTION: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CRON_SECRET: optionalString,
  VAPID_PRIVATE_KEY: optionalString,
  VAPID_SUBJECT: optionalString,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString,
});

export type ServerEnv = z.infer<typeof serverSchema>;

let serverEnvCache: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (!serverEnvCache) {
    const parsed = serverSchema.safeParse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY,
      MIDTRANS_API_URL: process.env.MIDTRANS_API_URL,
      MIDTRANS_SNAP_URL: process.env.MIDTRANS_SNAP_URL,
      MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION ?? "false",
      CRON_SECRET: process.env.CRON_SECRET,
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
      VAPID_SUBJECT: process.env.VAPID_SUBJECT,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
    });

    if (!parsed.success) {
      const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Konfigurasi environment tidak valid: ${names}`);
    }

    serverEnvCache = parsed.data;
  }

  return serverEnvCache;
}

export function hasMidtrans(): boolean {
  return Boolean(getServerEnv().MIDTRANS_SERVER_KEY);
}

export function hasWebPush(): boolean {
  const env = getServerEnv();
  return Boolean(clientEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
}

export function hasEmail(): boolean {
  const env = getServerEnv();
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}
