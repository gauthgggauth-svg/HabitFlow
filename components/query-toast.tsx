"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const DEFAULT_MESSAGES: Record<string, { type: "success" | "error"; message: string }> = {
  created: { type: "success", message: "Berhasil disimpan." },
  deleted: { type: "success", message: "Berhasil dihapus." },
  updated: { type: "success", message: "Perubahan tersimpan." },
  activated: { type: "success", message: "Habit diaktifkan kembali." },
  inactive: { type: "success", message: "Habit dinonaktifkan." },
  cancel: { type: "success", message: "Perpanjangan langganan dihentikan." },
  failed: { type: "error", message: "Proses belum berhasil. Coba lagi." },
  limit: {
    type: "error",
    message: "Batas paket saat ini sudah tercapai. Nonaktifkan item lain atau upgrade paket.",
  },
  delete: { type: "error", message: "Data belum bisa dihapus. Coba lagi." },
};

export function QueryToast({
  messages = {},
}: {
  messages?: Record<string, { type: "success" | "error"; message: string }>;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const status = searchParams.get("status");
  const error = searchParams.get("error");
  const key = error ?? status;

  useEffect(() => {
    if (!key) return;

    const mapping = { ...DEFAULT_MESSAGES, ...messages };
    const entry = mapping[key];

    if (entry) {
      if (entry.type === "success") {
        toast.success(entry.message);
      } else {
        toast.error(entry.message);
      }
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.delete("error");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pathname]);

  return null;
}
