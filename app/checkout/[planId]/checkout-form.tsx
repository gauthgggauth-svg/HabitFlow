"use client";

import { useActionState } from "react";

import { createCheckoutAction } from "./actions";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/validation";

export function CheckoutForm({ planId, planName }: { planId: string; planName: string }) {
  const [state, action] = useActionState(createCheckoutAction, initialFormState);

  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />

      <input type="hidden" name="planId" value={planId} />

      <div className="rounded-xl bg-muted/60 p-4 text-sm">
        <p className="font-medium">{planName}</p>
        <p className="mt-1 text-muted-foreground">Pembayaran satu bulan, bisa berhenti kapan saja.</p>
      </div>

      <SubmitButton pendingText="Membuat token pembayaran…" className="w-full">
        Bayar sekarang
      </SubmitButton>
    </form>
  );
}
