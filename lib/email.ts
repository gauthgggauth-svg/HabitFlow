import "server-only";

import { Resend } from "resend";

import { getServerEnv, hasEmail } from "@/lib/env";

export async function sendReminderEmail(input: {
  to: string;
  name: string;
  habitTitle: string;
  appUrl: string;
}): Promise<boolean> {
  if (!hasEmail()) return false;

  const env = getServerEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const displayName = input.name.trim() || input.to.split("@")[0];

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? "HabitFlow <no-reply@habitflow.local>",
    to: input.to,
    subject: `Pengingat habit: ${input.habitTitle}`,
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.6; color: #111827;">
        <p>Halo ${displayName},</p>
        <p>Waktunya untuk <strong>${input.habitTitle}</strong>. Satu langkah kecil hari ini tetap berarti.</p>
        <p><a href="${input.appUrl}" style="color: #3f6212;">Buka HabitFlow</a></p>
        <p style="color: #6b7280; font-size: 13px;">Kamu menerima email ini karena mengaktifkan pengingat email di HabitFlow.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
