import { FileText, Wallet, Music, Clapperboard, LayoutGrid, type LucideIcon } from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  PDF: FileText,
  Finance: Wallet,
  Music: Music,
  Video: Clapperboard,
};

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? LayoutGrid;
  return <Icon className={className} strokeWidth={1.75} />;
}
