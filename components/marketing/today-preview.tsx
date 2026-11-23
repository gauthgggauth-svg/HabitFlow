import { Check, Flame, ListChecks, Sparkles } from "lucide-react";

const demoHabits = [
  { title: "Olahraga 20 menit", streak: 12, color: "bg-[#3f6212]", icon: "dumbbell", done: true },
  { title: "Baca 10 halaman", streak: 5, color: "bg-[#b45309]", icon: "book", done: true },
  { title: "Tidur sebelum 23.00", streak: 3, color: "bg-[#0f766e]", icon: "moon", done: false },
];

const demoTasks = [
  { title: "Siapkan sepatu olahraga", priority: "Sedang" },
  { title: "Kirim laporan mingguan", priority: "Tinggi" },
];

export function TodayPreview() {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Senin, 23 November</p>
          <h2 className="mt-0.5 font-heading text-xl font-semibold">Hari ini</h2>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          Free
        </span>
      </div>

      <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
        <span className="font-medium">2 habit selesai hari ini.</span>{" "}
        <span className="text-muted-foreground">2 tugas masih menunggu.</span>
      </div>

      <div className="mt-4 space-y-2">
        {demoHabits.map((habit) => (
          <div
            key={habit.title}
            className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
          >
            <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white ${habit.color}`}>
              {habit.icon === "dumbbell" ? (
                <Sparkles className="size-4" aria-hidden="true" />
              ) : habit.icon === "book" ? (
                <ListChecks className="size-4" aria-hidden="true" />
              ) : (
                <Flame className="size-4" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{habit.title}</p>
              <p className="text-xs text-muted-foreground">Setiap hari · 06.30</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="size-3.5 text-[#b45309]" aria-hidden="true" />
              <span className="streak-number">{habit.streak}</span>
            </span>
            <span
              className={`flex size-8 items-center justify-center rounded-full border ${
                habit.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-transparent"
              }`}
              aria-label={habit.done ? "Selesai" : "Belum selesai"}
            >
              <Check className="size-4" aria-hidden="true" />
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />
          Tugas aktif
        </h3>
        <span className="text-xs text-muted-foreground">Lihat semua</span>
      </div>

      <div className="mt-2 space-y-1.5">
        {demoTasks.map((task) => (
          <div key={task.title} className="flex items-center gap-3 rounded-lg px-1 py-2">
            <span className="size-4 rounded-[4px] border border-input" aria-hidden="true" />
            <span className="flex-1 text-sm">{task.title}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {task.priority}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[10px] text-muted-foreground">Contoh tampilan aplikasi</p>
    </div>
  );
}
