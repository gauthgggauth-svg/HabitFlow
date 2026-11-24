"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PushState = "loading" | "unsupported" | "unavailable" | "default" | "denied" | "subscribed";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output;
}

function isIosWithoutStandalone(): boolean {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const standalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isIos && !standalone;
}

async function resolvePushState(vapidPublicKey: string | null): Promise<PushState> {
  if (!vapidPublicKey) return "unavailable";

  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = await registration.pushManager.getSubscription();
    return subscription ? "subscribed" : "default";
  } catch {
    return "unsupported";
  }
}

const subscribeToNothing = () => () => {};

export function PushToggle({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const iosHint = useSyncExternalStore(
    subscribeToNothing,
    isIosWithoutStandalone,
    () => false,
  );

  useEffect(() => {
    let cancelled = false;

    void resolvePushState(vapidPublicKey).then((next) => {
      if (!cancelled) {
        setState(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [vapidPublicKey]);

  async function enable() {
    if (!vapidPublicKey) return;

    setBusy(true);
    setMessage(null);

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "default");
        setMessage(
          "Aktifkan notifikasi agar pengingat habit kamu muncul tepat waktu. Kamu bisa mengizinkannya dari pengaturan browser.",
        );
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        }));

      const payload = subscription.toJSON();
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: payload.keys?.p256dh,
            auth: payload.keys?.auth,
          },
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Langganan gagal disimpan.");
      }

      setState("subscribed");
      setMessage("Pengingat browser aktif di perangkat ini.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Pengingat belum bisa diaktifkan. Coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setState("default");
      setMessage("Pengingat browser dimatikan di perangkat ini.");
    } catch {
      setMessage("Pengingat belum bisa dimatikan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel: Record<PushState, string> = {
    loading: "Memeriksa…",
    unsupported: "Tidak didukung",
    unavailable: "Belum tersedia",
    default: "Nonaktif",
    denied: "Diblokir",
    subscribed: "Aktif",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={state === "subscribed" ? "default" : "secondary"}>
          {state === "subscribed" ? (
            <Bell className="size-3" aria-hidden="true" />
          ) : (
            <BellOff className="size-3" aria-hidden="true" />
          )}
          {statusLabel[state]}
        </Badge>

        {state === "subscribed" ? (
          <Button type="button" variant="outline" onClick={disable} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Matikan pengingat
          </Button>
        ) : (
          <Button
            type="button"
            onClick={enable}
            disabled={busy || state === "loading" || state === "unsupported" || state === "unavailable" || state === "denied"}
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Aktifkan pengingat
          </Button>
        )}
      </div>

      {state === "denied" ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Aktifkan notifikasi agar pengingat habit kamu muncul tepat waktu. Buka pengaturan
          situs di browser, ubah izin notifikasi menjadi “Izinkan”, lalu muat ulang halaman ini.
        </p>
      ) : null}

      {state === "unavailable" ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Pengingat browser belum dikonfigurasi di server. Hubungi admin bila kamu memerlukan
          fitur ini.
        </p>
      ) : null}

      {state === "unsupported" ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Browser ini belum mendukung web push. Coba Chrome di desktop atau Android.
        </p>
      ) : null}

      {iosHint ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Di iPhone/iPad, tambahkan HabitFlow ke Home Screen terlebih dahulu, lalu buka dari
          ikon tersebut untuk mengaktifkan pengingat.
        </p>
      ) : null}

      {message ? (
        <p className="text-sm leading-6 text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
