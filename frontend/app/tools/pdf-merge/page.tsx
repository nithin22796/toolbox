"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.gif";

type Progress = {
  current: number;
  total: number;
  filename: string;
};

type ViewMode = "grid" | "list";

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function fileKindLabel(file: File) {
  return isPdf(file) ? "PDF" : "Image";
}

function useObjectUrl(file: File) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

function Thumbnail({ file, className }: { file: File; className: string }) {
  const url = useObjectUrl(file);
  if (!url) return <div className={`${className} animate-pulse bg-zinc-100 dark:bg-zinc-800`} />;

  return isPdf(file) ? (
    <iframe src={`${url}#toolbar=0&view=FitH`} title={file.name} className={className} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={file.name} className={`${className} object-cover`} />
  );
}

type FileCardProps = {
  file: File;
  selected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
};

function FileCard({
  file,
  selected,
  onToggleSelect,
  onRemove,
  onMove,
  canMoveLeft,
  canMoveRight,
}: FileCardProps) {
  const pillClass = isPdf(file)
    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";

  return (
    <div className="group relative w-[170px] shrink-0">
      <button
        onClick={onToggleSelect}
        aria-label="Select file"
        className={`absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
          selected
            ? "border-blue-600 bg-blue-600"
            : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
        }`}
      >
        {selected && (
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-white">
            <path d="M6.5 11.5 3 8l1-1 2.5 2.5L12 4l1 1z" />
          </svg>
        )}
      </button>

      <button
        onClick={onRemove}
        aria-label="Remove file"
        className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white text-zinc-400 opacity-0 shadow transition-opacity hover:text-red-600 group-hover:opacity-100 dark:bg-zinc-900"
      >
        ✕
      </button>

      <div
        className={`relative h-[210px] w-full overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow dark:bg-zinc-900 ${
          selected
            ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900"
            : "border-zinc-200 dark:border-zinc-700"
        }`}
      >
        <Thumbnail file={file} className="h-full w-full" />
      </div>

      <div className="mt-2 flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onMove(-1)}
          disabled={!canMoveLeft}
          aria-label="Move earlier"
          className="rounded px-1.5 text-xs text-zinc-400 hover:text-black disabled:opacity-30 dark:hover:text-white"
        >
          ‹ earlier
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={!canMoveRight}
          aria-label="Move later"
          className="rounded px-1.5 text-xs text-zinc-400 hover:text-black disabled:opacity-30 dark:hover:text-white"
        >
          later ›
        </button>
      </div>

      <div className="mt-1 flex justify-center">
        <span className={`max-w-full truncate rounded px-2 py-0.5 text-xs font-medium ${pillClass}`}>
          {file.name}
        </span>
      </div>
      <p className="mt-0.5 text-center text-xs text-zinc-400">{fileKindLabel(file)}</p>
    </div>
  );
}

function AddTile({
  onClick,
  onDropFiles,
}: {
  onClick: () => void;
  onDropFiles: (files: FileList) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <button
      onClick={onClick}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) onDropFiles(e.dataTransfer.files);
      }}
      className={`flex h-[210px] w-[170px] shrink-0 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 text-center text-sm text-blue-500 transition-colors dark:text-blue-400 ${
        dragOver
          ? "border-blue-500 bg-blue-100 dark:bg-blue-950/60"
          : "border-blue-300 bg-blue-50/60 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-400 text-lg leading-none dark:border-blue-500">
        +
      </span>
      <span>
        Add <strong className="font-semibold">PDF</strong> or{" "}
        <strong className="font-semibold">image</strong> files
      </span>
    </button>
  );
}

export default function PdfMerge() {
  const [files, setFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortAsc, setSortAsc] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Without this, dropping a file anywhere outside a designated dropzone
  // makes the browser navigate the whole tab to that file, replacing the app.
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
    setDownloadUrl(null);
    setPageCount(null);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setSelected((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  }

  function removeSelected() {
    setFiles((prev) => prev.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
  }

  function toggleSelect(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === files.length ? new Set() : new Set(files.map((_, i) => i))));
  }

  function move(index: number, delta: number) {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function sortByName() {
    setFiles((prev) =>
      [...prev].sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)))
    );
    setSortAsc((v) => !v);
    setSelected(new Set());
  }

  async function merge() {
    setBusy(true);
    setError(null);
    setDownloadUrl(null);
    setPageCount(null);
    setProgress({ current: 0, total: files.length, filename: "" });

    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));

      const res = await fetch(`${API_URL}/api/apps/pdf-merge/merge`, {
        method: "POST",
        body: form,
      });
      if (!res.ok || !res.body) throw new Error(await res.text());

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);

          if (event.type === "progress") {
            setProgress({
              current: event.current,
              total: event.total,
              filename: event.filename,
            });
          } else if (event.type === "done") {
            setDownloadUrl(`${API_URL}${event.download_url}`);
            setPageCount(event.pages);
          }
        }
      }
    } catch {
      setError("Merge failed. Check the backend logs.");
    } finally {
      setBusy(false);
    }
  }

  const allSelected = files.length > 0 && selected.size === files.length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          &larr; Toolbox
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-black dark:text-zinc-50">
          Merge to PDF
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Combine images and PDFs into one PDF, in this order.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {files.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded border ${
                  allSelected
                    ? "border-blue-600 bg-blue-600"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}
              >
                {allSelected && (
                  <svg viewBox="0 0 16 16" className="h-3 w-3 fill-white">
                    <path d="M6.5 11.5 3 8l1-1 2.5 2.5L12 4l1 1z" />
                  </svg>
                )}
              </span>
              {selected.size > 0 ? `${selected.size} selected` : "Select all"}
            </button>

            <div className="flex items-center gap-3">
              {selected.size > 0 && (
                <button
                  onClick={removeSelected}
                  className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Remove selected
                </button>
              )}
              <button
                onClick={sortByName}
                title="Sort by name"
                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-black dark:hover:bg-zinc-900 dark:hover:text-white"
              >
                {sortAsc ? "A→Z" : "Z→A"}
              </button>
              <div className="flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  className={`px-2 py-1.5 text-sm ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  ☰
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={`px-2 py-1.5 text-sm ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  ⊞
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === "grid" ? (
          <div className="mt-6 flex flex-wrap items-start gap-x-4 gap-y-8">
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-4">
                <FileCard
                  file={file}
                  selected={selected.has(i)}
                  onToggleSelect={() => toggleSelect(i)}
                  onRemove={() => removeFile(i)}
                  onMove={(delta) => move(i, delta)}
                  canMoveLeft={i > 0}
                  canMoveRight={i < files.length - 1}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Add file here"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow hover:bg-blue-600"
                >
                  +
                </button>
              </div>
            ))}
            <AddTile onClick={() => fileInputRef.current?.click()} onDropFiles={addFiles} />
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 px-4 py-2 text-sm text-black dark:text-zinc-50"
              >
                <button
                  onClick={() => toggleSelect(i)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    selected.has(i)
                      ? "border-blue-600 bg-blue-600"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {selected.has(i) && (
                    <svg viewBox="0 0 16 16" className="h-3 w-3 fill-white">
                      <path d="M6.5 11.5 3 8l1-1 2.5 2.5L12 4l1 1z" />
                    </svg>
                  )}
                </button>
                <Thumbnail file={file} className="h-12 w-10 shrink-0 rounded object-cover" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="flex shrink-0 gap-2 text-zinc-400">
                  <button onClick={() => move(i, -1)} aria-label="Move up">
                    ↑
                  </button>
                  <button onClick={() => move(i, 1)} aria-label="Move down">
                    ↓
                  </button>
                  <button onClick={() => removeFile(i)} aria-label="Remove">
                    ✕
                  </button>
                </span>
              </li>
            ))}
            <li className="px-4 py-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                + Add more files
              </button>
            </li>
          </ul>
        )}

        <button
          onClick={merge}
          disabled={files.length === 0 || busy}
          className="mt-10 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {busy ? "Merging…" : "Merge PDF"}
        </button>

        {progress && busy && (
          <div className="mt-4 max-w-md">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-black transition-all dark:bg-white"
                style={{
                  width: `${(progress.current / Math.max(progress.total, 1)) * 100}%`,
                }}
              />
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Merging {progress.current} / {progress.total}
              {progress.filename ? ` — ${progress.filename}` : ""}
            </p>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {downloadUrl && (
          <div className="mt-8 max-w-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {pageCount} page{pageCount === 1 ? "" : "s"}
              </p>
              <a
                href={downloadUrl}
                download="merged.pdf"
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Download merged.pdf
              </a>
            </div>
            <iframe
              src={`${downloadUrl}#toolbar=0`}
              title="Merged PDF preview"
              className="mt-3 h-[600px] w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
            />
          </div>
        )}
      </main>
    </div>
  );
}
