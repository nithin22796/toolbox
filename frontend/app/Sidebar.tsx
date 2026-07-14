"use client";

import { LayoutGrid } from "lucide-react";
import { CategoryIcon } from "./category-icon-map";
import { getCategoryColor } from "./category-colors";
import { ThemeToggle } from "./ThemeToggle";

type CategoryCount = { category: string; count: number };

export function Sidebar({
  categories,
  total,
  selected,
  onSelect,
}: {
  categories: CategoryCount[];
  total: number;
  selected: string | "all";
  onSelect: (category: string | "all") => void;
}) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 py-8 pl-6 pr-4 dark:border-white/10 md:flex">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Toolbox
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Local tools, no cloud.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <nav className="mt-8 space-y-0.5">
        <SidebarItem
          active={selected === "all"}
          onClick={() => onSelect("all")}
          label="All Tools"
          count={total}
          icon={<LayoutGrid className="h-4 w-4" strokeWidth={1.75} />}
          activeBg="bg-zinc-100 dark:bg-white/10"
          activeText="text-black dark:text-zinc-50"
        />
        {categories.map(({ category, count }) => {
          const color = getCategoryColor(category);
          return (
            <SidebarItem
              key={category}
              active={selected === category}
              onClick={() => onSelect(category)}
              label={category}
              count={count}
              icon={<CategoryIcon category={category} className="h-4 w-4" />}
              activeBg={color.activeBg}
              activeText={color.activeText}
            />
          );
        })}
      </nav>
    </aside>
  );
}

function SidebarItem({
  active,
  onClick,
  label,
  count,
  icon,
  activeBg,
  activeText,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon: React.ReactNode;
  activeBg: string;
  activeText: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? `${activeBg} ${activeText}`
          : "text-zinc-600 hover:bg-zinc-50 hover:text-black dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-50"
      }`}
    >
      <span className={active ? activeText : "text-zinc-400"}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <span className="text-xs text-zinc-400 dark:text-zinc-600">{count}</span>
    </button>
  );
}
