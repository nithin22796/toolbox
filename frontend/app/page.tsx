"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, PackageOpen, TriangleAlert } from "lucide-react";
import { AppIcon } from "./icon-map";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { getCategoryColor } from "./category-colors";

type AppInfo = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function AppCard({ app }: { app: AppInfo }) {
  const color = getCategoryColor(app.category);
  return (
    <Link
      href={`/tools/${app.slug}`}
      className={`group flex items-start gap-4 rounded-xl border border-zinc-200 bg-surface p-5 shadow-sm transition-colors dark:border-white/10 ${color.hoverBorder}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${color.badgeBg} ${color.badgeText}`}
      >
        <AppIcon icon={app.icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-medium text-black dark:text-zinc-50">{app.name}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{app.description}</p>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-surface p-5 dark:border-white/10">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-zinc-100 dark:bg-white/10" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/5 animate-pulse rounded bg-zinc-100 dark:bg-white/10" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100 dark:bg-white/10" />
      </div>
    </div>
  );
}

export default function Home() {
  const [apps, setApps] = useState<AppInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");

  useEffect(() => {
    fetch(`${API_URL}/api/apps`)
      .then((res) => res.json())
      .then(setApps)
      .catch(() => setError("Could not reach the backend. Is it running on :8000?"));
  }, []);

  const categories = useMemo(() => {
    if (!apps) return [];
    const counts = new Map<string, number>();
    for (const app of apps) counts.set(app.category, (counts.get(app.category) ?? 0) + 1);
    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [apps]);

  const filtered = useMemo(() => {
    if (!apps) return null;
    const q = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (selectedCategory !== "all" && app.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q)
      );
    });
  }, [apps, query, selectedCategory]);

  const grouped = useMemo(() => {
    if (!filtered) return [];
    if (selectedCategory !== "all") return [[selectedCategory, filtered] as const];
    const byCategory = new Map<string, AppInfo[]>();
    for (const app of filtered) {
      const list = byCategory.get(app.category) ?? [];
      list.push(app);
      byCategory.set(app.category, list);
    }
    return [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, selectedCategory]);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-rose-400/10 blur-3xl dark:bg-rose-500/20" />
        <div className="absolute -top-20 right-0 h-96 w-96 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/20" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-400/5 blur-3xl dark:bg-sky-500/10" />
      </div>

      <Sidebar
        categories={categories}
        total={apps?.length ?? 0}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <main className="min-w-0 flex-1 px-8 py-10 sm:px-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50 md:hidden">
            Toolbox
          </h2>

          {apps && apps.length > 0 && (
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools…"
                className="w-full rounded-lg border border-zinc-200 bg-surface py-2 pl-9 pr-3 text-sm text-black outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/10 dark:text-zinc-50 dark:focus:border-white/30"
              />
            </div>
          )}

          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>

        {error && (
          <div className="mt-10 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            <TriangleAlert className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {!apps && !error && (
          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {apps && apps.length === 0 && !error && (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-white/15">
            <PackageOpen className="h-8 w-8 text-zinc-400" />
            <p className="text-sm text-zinc-500">No tools installed yet.</p>
          </div>
        )}

        {filtered && filtered.length === 0 && apps && apps.length > 0 && (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-white/15">
            <Search className="h-8 w-8 text-zinc-400" />
            <p className="text-sm text-zinc-500">
              {query ? <>No tools match &ldquo;{query}&rdquo;.</> : "No tools in this category."}
            </p>
          </div>
        )}

        {grouped.length > 0 && (
          <div className="mt-10 space-y-10">
            {grouped.map(([category, categoryApps]) => (
              <section key={category}>
                {selectedCategory === "all" && (
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {category}
                  </h3>
                )}
                <div
                  className={`grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 ${
                    selectedCategory === "all" ? "mt-4" : ""
                  }`}
                >
                  {categoryApps.map((app) => (
                    <AppCard key={app.slug} app={app} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
