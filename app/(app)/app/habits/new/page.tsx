import { PageHeader } from "@/components/page-header";
import { HabitForm } from "../habit-form";

export const metadata = {
  title: "Habit baru",
};

export default function NewHabitPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Habit baru"
        description="Mulai dari satu kebiasaan kecil. Tentukan frekuensi, lalu atur pengingat kapan diperlukan."
      />

      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <HabitForm />
      </div>
    </div>
  );
}
