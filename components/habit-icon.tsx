import {
  Activity,
  BookOpen,
  Brain,
  Coffee,
  Droplets,
  Dumbbell,
  HeartPulse,
  Leaf,
  Moon,
  Pencil,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  activity: Activity,
  "book-open": BookOpen,
  droplets: Droplets,
  dumbbell: Dumbbell,
  moon: Moon,
  sun: Sun,
  brain: Brain,
  pencil: Pencil,
  "heart-pulse": HeartPulse,
  leaf: Leaf,
  coffee: Coffee,
};

export function HabitIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}
