import "server-only";

import { sendNotification, setVapidDetails } from "web-push";

import { clientEnv, getServerEnv } from "@/lib/env";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

let configured = false;

function configure() {
  if (configured) return;

  const env = getServerEnv();

  if (!clientEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    throw new Error("VAPID belum dikonfigurasi.");
  }

  setVapidDetails(
    env.VAPID_SUBJECT,
    clientEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  configured = true;
}

export async function sendWebPush(target: PushTarget, payload: PushPayload): Promise<void> {
  configure();

  await sendNotification(
    {
      endpoint: target.endpoint,
      keys: { p256dh: target.p256dh, auth: target.auth },
    },
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? "/app",
      tag: payload.tag,
    }),
    { TTL: 300, urgency: "high" },
  );
}

export function pushErrorStatus(error: unknown): number | null {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const status = (error as { statusCode?: unknown }).statusCode;
    return typeof status === "number" ? status : null;
  }

  return null;
}
