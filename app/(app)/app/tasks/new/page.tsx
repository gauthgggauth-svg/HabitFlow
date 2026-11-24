import { PageHeader } from "@/components/page-header";
import { TaskForm } from "../task-form";

export const metadata = {
  title: "Tugas baru",
};

export default function NewTaskPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Tugas baru"
        description="Catat tugas pendukung. Tengkat opsional — tugas tanpa tengkat tetap bisa dicatat."
      />

      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <TaskForm />
      </div>
    </div>
  );
}
