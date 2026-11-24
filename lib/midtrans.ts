import { createHash, timingSafeEqual } from "node:crypto";

import { getServerEnv } from "@/lib/env";

const DEFAULT_SANDBOX_API_URL = "https://api.sandbox.midtrans.com";
const DEFAULT_PRODUCTION_API_URL = "https://api.midtrans.com";
const DEFAULT_SANDBOX_SNAP_URL = "https://app.sandbox.midtrans.com";
const DEFAULT_PRODUCTION_SNAP_URL = "https://app.midtrans.com";

export interface MidtransSnapResult {
  token: string;
  redirectUrl: string;
}

export interface MidtransTransaction {
  transactionId: string | null;
  orderId: string | null;
  transactionStatus: string | null;
  fraudStatus: string | null;
  statusCode: string | null;
  grossAmount: string | null;
  paymentType: string | null;
  savedTokenId: string | null;
  subscriptionId: string | null;
  transactionTime: string | null;
}

export interface MidtransSubscription {
  id: string;
  status: string | null;
  nextExecutionAt: string | null;
  currentInterval: number | null;
  amount: string | null;
  planId: string | null;
}

function apiBaseUrl(): string {
  const configured = getServerEnv().MIDTRANS_API_URL;
  if (configured) return configured.replace(/\/$/, "");
  return getServerEnv().MIDTRANS_IS_PRODUCTION
    ? DEFAULT_PRODUCTION_API_URL
    : DEFAULT_SANDBOX_API_URL;
}

function snapBaseUrl(): string {
  const configured = getServerEnv().MIDTRANS_SNAP_URL;
  if (configured) return configured.replace(/\/$/, "");
  return getServerEnv().MIDTRANS_IS_PRODUCTION
    ? DEFAULT_PRODUCTION_SNAP_URL
    : DEFAULT_SANDBOX_SNAP_URL;
}

function authHeader(serverKey: string): string {
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

function requireServerKey(): string {
  const serverKey = getServerEnv().MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum diatur.");
  }

  return serverKey;
}

async function midtransRequest<T>(
  path: string,
  init: RequestInit = {},
  baseUrl = apiBaseUrl(),
): Promise<T> {
  const serverKey = requireServerKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader(serverKey),
        ...(init.headers ?? {}),
      },
    });

    const payload = (await response.json().catch(() => ({}))) as T & {
      error_messages?: string[];
      error?: { message?: string };
    };

    if (!response.ok) {
      const message =
        payload.error?.message ??
        payload.error_messages?.join(", ") ??
        `Midtrans menolak permintaan (${response.status}).`;
      throw new Error(message);
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

// ------------------------------------------------------------------ Snap

interface SnapTransactionResponse {
  token?: string;
  redirect_url?: string;
  error_messages?: string[];
}

export async function createMidtransSnapTransaction(input: {
  orderId: string;
  amount: number;
  description: string;
  email: string;
  userId: string;
  planCode: string;
  finishUrl: string;
}): Promise<MidtransSnapResult> {
  const payload = await midtransRequest<SnapTransactionResponse>(
    "/snap/v1/transactions",
    {
      method: "POST",
      body: JSON.stringify({
        transaction_details: {
          order_id: input.orderId,
          gross_amount: input.amount,
        },
        item_details: [
          {
            id: input.planCode,
            price: input.amount,
            quantity: 1,
            name: `HabitFlow ${input.planCode}`.slice(0, 50),
          },
        ],
        customer_details: {
          email: input.email,
          user_id: input.userId,
        },
        callbacks: {
          finish: input.finishUrl,
        },
        // Kartu adalah jalur wajib recurring. Batasi metode agar pembayaran
        // awal selalu menyimpan token kartu untuk subscription berikutnya.
        enabled_payments: ["credit_card"],
        credit_card: {
          save_card: true,
        },
        metadata: {
          user_id: input.userId,
          plan_code: input.planCode,
          purpose: "initial_subscription",
        },
      }),
    },
    snapBaseUrl(),
  );

  if (!payload.token) {
    throw new Error("Midtrans tidak mengembalikan token pembayaran.");
  }

  return {
    token: payload.token,
    redirectUrl: payload.redirect_url ?? "",
  };
}

// ------------------------------------------------------------------ status

interface CoreTransactionResponse {
  transaction_id?: string;
  order_id?: string;
  transaction_status?: string;
  fraud_status?: string;
  status_code?: string;
  gross_amount?: string;
  payment_type?: string;
  saved_token_id?: string;
  subscription_id?: string;
  transaction_time?: string;
  status_message?: string;
}

function mapTransaction(payload: CoreTransactionResponse): MidtransTransaction {
  return {
    transactionId: payload.transaction_id ?? null,
    orderId: payload.order_id ?? null,
    transactionStatus: payload.transaction_status ?? null,
    fraudStatus: payload.fraud_status ?? null,
    statusCode: payload.status_code ?? null,
    grossAmount: payload.gross_amount ?? null,
    paymentType: payload.payment_type ?? null,
    savedTokenId: payload.saved_token_id ?? null,
    subscriptionId: payload.subscription_id ?? null,
    transactionTime: payload.transaction_time ?? null,
  };
}

export async function getMidtransTransactionStatus(
  orderId: string,
): Promise<MidtransTransaction | null> {
  if (!getServerEnv().MIDTRANS_SERVER_KEY) {
    return null;
  }

  try {
    const payload = await midtransRequest<CoreTransactionResponse>(
      `/v2/${encodeURIComponent(orderId)}/status`,
    );
    return mapTransaction(payload);
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ signature

export function midtransSignature(input: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  serverKey: string;
}): string {
  return createHash("sha512")
    .update(`${input.orderId}${input.statusCode}${input.grossAmount}${input.serverKey}`)
    .digest("hex");
}

export function verifyMidtransSignature(input: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  const serverKey = getServerEnv().MIDTRANS_SERVER_KEY;

  if (!serverKey || !input.signatureKey) {
    return false;
  }

  const expected = midtransSignature({
    orderId: input.orderId,
    statusCode: input.statusCode,
    grossAmount: input.grossAmount,
    serverKey,
  });

  const actualBuffer = Buffer.from(input.signatureKey.toLowerCase(), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

// ------------------------------------------------------------------ subscription

interface SubscriptionResponse {
  id?: string;
  status?: string;
  next_execution_at?: string;
  current_interval?: number;
  amount?: string;
  plan_id?: string;
  error_messages?: string[];
}

function mapSubscription(payload: SubscriptionResponse): MidtransSubscription {
  return {
    id: payload.id ?? "",
    status: payload.status ?? null,
    nextExecutionAt: payload.next_execution_at ?? null,
    currentInterval: payload.current_interval ?? null,
    amount: payload.amount ?? null,
    planId: payload.plan_id ?? null,
  };
}

export async function createMidtransSubscription(input: {
  name: string;
  amount: number;
  token: string;
  startTime: string;
  customerName: string;
  customerEmail: string;
}): Promise<MidtransSubscription> {
  const payload = await midtransRequest<SubscriptionResponse>("/v1/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      name: input.name.slice(0, 40),
      amount: String(input.amount),
      currency: "IDR",
      payment_type: "credit_card",
      token: input.token,
      schedule: {
        interval: 1,
        interval_unit: "month",
        start_time: input.startTime,
      },
      retry_schedule: ["1 day", "2 days", "3 days"],
      customer_details: {
        first_name: input.customerName.slice(0, 50),
        email: input.customerEmail,
      },
    }),
  });

  const subscription = mapSubscription(payload);

  if (!subscription.id) {
    throw new Error("Midtrans tidak mengembalikan ID subscription.");
  }

  return subscription;
}

export async function getMidtransSubscription(
  subscriptionId: string,
): Promise<MidtransSubscription | null> {
  if (!getServerEnv().MIDTRANS_SERVER_KEY) {
    return null;
  }

  try {
    const payload = await midtransRequest<SubscriptionResponse>(
      `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    );
    return mapSubscription(payload);
  } catch {
    return null;
  }
}

export async function disableMidtransSubscription(subscriptionId: string): Promise<boolean> {
  if (!getServerEnv().MIDTRANS_SERVER_KEY) {
    return false;
  }

  try {
    await midtransRequest<Record<string, unknown>>(
      `/v1/subscriptions/${encodeURIComponent(subscriptionId)}/disable`,
      { method: "POST" },
    );
    return true;
  } catch {
    return false;
  }
}
