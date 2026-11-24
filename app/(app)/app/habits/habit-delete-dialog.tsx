"use client";

import { useState } from "react";

import { deleteHabitAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteHabitDialog({
  habitId,
  habitTitle,
}: {
  habitId: string;
  habitTitle: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Hapus habit
      </Button>

      <DialogContent>
        <DialogTitle>Hapus habit ini?</DialogTitle>
        <DialogDescription>
          Habit “{habitTitle}” akan dihapus permanen beserta riwayat check-in-nya.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <form action={deleteHabitAction}>
            <input type="hidden" name="habitId" value={habitId} />
            <Button type="submit" variant="destructive" onClick={() => setOpen(false)}>
              Hapus habit
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
