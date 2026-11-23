import type { Database } from "@/types/database";

type PublicTables = Database["public"]["Tables"];
type PublicEnums = Database["public"]["Enums"];

export type Profile = PublicTables["users"]["Row"];
export type Plan = PublicTables["plans"]["Row"];
export type Subscription = PublicTables["subscriptions"]["Row"];
export type Payment = PublicTables["payments"]["Row"];
export type Habit = PublicTables["habits"]["Row"];
export type HabitLog = PublicTables["habit_logs"]["Row"];
export type Task = PublicTables["tasks"]["Row"];
export type Reminder = PublicTables["reminders"]["Row"];
export type PushSubscription = PublicTables["push_subscriptions"]["Row"];

export type SubscriptionStatus = PublicEnums["subscription_status"];
export type PaymentStatus = PublicEnums["payment_status"];
export type HabitFrequency = PublicEnums["habit_frequency"];
export type TaskPriority = PublicEnums["task_priority"];
export type PlanCode = "free" | "standard" | "pro";

export const HABIT_COLORS = ["moss", "amber", "teal", "slate", "rose"] as const;
export type HabitColor = (typeof HABIT_COLORS)[number];

export const HABIT_ICONS = [
  "sparkles",
  "activity",
  "book-open",
  "droplets",
  "dumbbell",
  "moon",
  "sun",
  "brain",
  "pencil",
  "heart-pulse",
  "leaf",
  "coffee",
] as const;
export type HabitIcon = (typeof HABIT_ICONS)[number];

export const WEEKDAY_LABELS: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Senin", short: "Sen" },
  { value: 2, label: "Selasa", short: "Sel" },
  { value: 3, label: "Rabu", short: "Rab" },
  { value: 4, label: "Kamis", short: "Kam" },
  { value: 5, label: "Jumat", short: "Jum" },
  { value: 6, label: "Sabtu", short: "Sab" },
  { value: 7, label: "Minggu", short: "Min" },
];
