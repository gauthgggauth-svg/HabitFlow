import { CheckoutForm } from "./checkout-form";
import { getActivePlans } from "@/services/plans";
import { requireOnboardedAccount } from "@/lib/auth/account";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const { entitlement } = await requireOnboardedAccount();
  const plans = await getActivePlans();
  const plan = plans.find((candidate) => candidate.id === planId);

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Paket tidak ditemukan</h1>
        <p className="text-sm text-muted-foreground">Paket yang kamu pilih tidak tersedia.</p>
      </div>
    );
  }

  const samePlanIsActive =
    entitlement.planCode === plan.code && entitlement.subscription?.status !== "canceled";

  if (samePlanIsActive) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Paket ini sedang aktif</h1>
        <p className="text-sm text-muted-foreground">
          Kamu sudah memakai paket {plan.name}. Buka halaman langganan untuk melihat status
          pembayaran dan periode aktif.
        </p>
        <a
          href="/billing"
          className="inline-flex h-11 w-fit items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          Lihat langganan
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">Checkout</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{plan.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(plan.price)}
          {" "}/bulan
        </p>
      </div>

      {entitlement.subscription?.status === "canceled" ? (
        <p className="rounded-xl border border-border bg-muted/60 p-4 text-sm leading-6 text-muted-foreground">
          Langganan sebelumnya sudah dibatalkan. Pembayaran baru akan mengaktifkan kembali paket
          ini untuk satu bulan ke depan.
        </p>
      ) : null}

      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <CheckoutForm planId={plan.id} planName={plan.name} />
      </div>
    </div>
  );
}
