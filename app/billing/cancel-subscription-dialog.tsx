"use client";

import { useState } from "react";

import { cancelSubscriptionAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export function CancelSubscriptionDialog({
  subscriptionId,
  planName,
  accessUntil,
}: {
  subscriptionId: string;
  planName: string;
  accessUntil: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Batalkan langganan
      </Button>

      <DialogContent>
        <DialogTitle>Batalkan langganan {planName}?</DialogTitle>
        <DialogDescription>
          Perpanjangan otomatis akan dihentikan. Akses berbayar tetap berlaku sampai{" "}
          {accessUntil ?? "akhir periode yang sudah dibayar"}. Setelah itu akun kembali ke Free
          tanpa menghapus data.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Tetap berlangganan
          </Button>
          <form action={cancelSubscriptionAction}>
            <input type="hidden" name="subscriptionId" value={subscriptionId} />
            <Button type="submit" variant="destructive">
              Ya, batalkan
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
