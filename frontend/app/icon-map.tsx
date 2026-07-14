import { Combine, Minimize2, Wrench, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  merge: Combine,
  compress: Minimize2,
};

export function AppIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? Wrench;
  return <Icon className={className} strokeWidth={1.75} />;
}
