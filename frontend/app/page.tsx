"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AppInfo = {
  slug: string;
  name: string;
  description: string;
  icon: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Home() {
  const [apps, setApps] = useState<AppInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/apps`)
      .then((res) => res.json())
      .then(setApps)
      .catch(() => setError("Could not reach the backend. Is it running on :8000?"));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Toolbox
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Local tools, no cloud, no accounts.
        </p>

        {error && (
          <p className="mt-8 text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {apps?.map((app) => (
            <Link
              key={app.slug}
              href={`/tools/${app.slug}`}
              className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            >
              <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                {app.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {app.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
