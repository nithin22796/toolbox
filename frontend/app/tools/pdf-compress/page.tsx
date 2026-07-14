"use client";

import { useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Result = {
  download_url: string;
  engine: string;
  original_size: number;
  compressed_size: number;
  savings_percent: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState("medium");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function compress() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(
        `${API_URL}/api/apps/pdf-compress/compress?quality=${quality}`,
        { method: "POST", body: form }
      );
      if (!res.ok) throw new Error(await res.text());

      const data: Result = await res.json();
      setResult({ ...data, download_url: `${API_URL}${data.download_url}` });
    } catch {
      setError("Compression failed. Check the backend logs.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          &larr; Toolbox
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-black dark:text-zinc-50">
          Compress PDF
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Shrink a PDF's file size.
        </p>

        <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-10 text-sm text-zinc-500 hover:border-zinc-400 dark:border-zinc-700">
          {file ? file.name : "Click to choose a PDF"}
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
            }}
          />
        </label>

        <div className="mt-6 flex gap-2">
          {(["low", "medium", "high"] as const).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize ${
                quality === q
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        <button
          onClick={compress}
          disabled={!file || busy}
          className="mt-6 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {busy ? "Compressing…" : "Compress PDF"}
        </button>

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <div className="mt-6 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
            <p className="text-black dark:text-zinc-50">
              {formatBytes(result.original_size)} → {formatBytes(result.compressed_size)}{" "}
              <span className="text-green-600 dark:text-green-400">
                (-{result.savings_percent}%)
              </span>
            </p>
            <p className="mt-1 text-zinc-500">via {result.engine}</p>
            <a
              href={result.download_url}
              className="mt-3 block font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Download compressed.pdf
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
