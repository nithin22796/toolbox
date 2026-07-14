type CategoryColor = {
  badgeBg: string;
  badgeText: string;
  hoverBorder: string;
  activeBg: string;
  activeText: string;
};

const COLORS: Record<string, CategoryColor> = {
  PDF: {
    badgeBg: "bg-rose-100 dark:bg-rose-500/15",
    badgeText: "text-rose-600 dark:text-rose-400",
    hoverBorder: "hover:border-rose-300 dark:hover:border-rose-500/40",
    activeBg: "bg-rose-50 dark:bg-rose-500/10",
    activeText: "text-rose-700 dark:text-rose-400",
  },
  Finance: {
    badgeBg: "bg-emerald-100 dark:bg-emerald-500/15",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-500/40",
    activeBg: "bg-emerald-50 dark:bg-emerald-500/10",
    activeText: "text-emerald-700 dark:text-emerald-400",
  },
  Music: {
    badgeBg: "bg-violet-100 dark:bg-violet-500/15",
    badgeText: "text-violet-600 dark:text-violet-400",
    hoverBorder: "hover:border-violet-300 dark:hover:border-violet-500/40",
    activeBg: "bg-violet-50 dark:bg-violet-500/10",
    activeText: "text-violet-700 dark:text-violet-400",
  },
  Video: {
    badgeBg: "bg-sky-100 dark:bg-sky-500/15",
    badgeText: "text-sky-600 dark:text-sky-400",
    hoverBorder: "hover:border-sky-300 dark:hover:border-sky-500/40",
    activeBg: "bg-sky-50 dark:bg-sky-500/10",
    activeText: "text-sky-700 dark:text-sky-400",
  },
};

const DEFAULT_COLOR: CategoryColor = {
  badgeBg: "bg-zinc-100 dark:bg-zinc-800",
  badgeText: "text-zinc-600 dark:text-zinc-300",
  hoverBorder: "hover:border-zinc-400 dark:hover:border-zinc-600",
  activeBg: "bg-zinc-100 dark:bg-zinc-900",
  activeText: "text-black dark:text-zinc-50",
};

export function getCategoryColor(category: string): CategoryColor {
  return COLORS[category] ?? DEFAULT_COLOR;
}
