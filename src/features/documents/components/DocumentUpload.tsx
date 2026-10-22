"use client";

import { useRef, useState } from "react";

import { formatBytes } from "@/lib/format";
import { ApiError } from "@/lib/http";

import { uploadDocument } from "../api";
import type { DocumentResponse } from "../types";
import { DocumentResult } from "./DocumentResult";

type UploadEntry =
  | { key: string; filename: string; size: number; state: "uploading" }
  | { key: string; filename: string; size: number; state: "done"; document: DocumentResponse }
  | {
      key: string;
      filename: string;
      size: number;
      state: "failed";
      error: string;
      requestId: string | null;
    };

const ACCEPTED_TYPES = ".pdf,.docx,.txt";

export function DocumentUpload() {
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextKey = useRef(0);

  function updateEntry(key: string, entry: UploadEntry) {
    setEntries((current) => current.map((e) => (e.key === key ? entry : e)));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    for (const file of Array.from(files)) {
      const base = { key: String(nextKey.current++), filename: file.name, size: file.size };
      setEntries((current) => [{ ...base, state: "uploading" }, ...current]);

      try {
        const document = await uploadDocument(file);
        updateEntry(base.key, { ...base, state: "done", document });
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Something went wrong while uploading.";
        const requestId = err instanceof ApiError ? err.requestId : null;
        updateEntry(base.key, { ...base, state: "failed", error: message, requestId });
      }
    }

    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 p-8 text-center transition-colors hover:border-zinc-400 has-[:focus-visible]:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500">
        <span className="font-medium">
          {isUploading ? "Uploading…" : "Choose PDF, DOCX, or TXT files"}
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Text is extracted, chunked, and embedded on the server. Nothing is stored yet.
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          disabled={isUploading}
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />
      </label>

      {entries.length === 0 ? (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          No documents uploaded in this session.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {entries.map((entry) => (
            <li
              key={entry.key}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="break-all font-medium">{entry.filename}</h2>
                <StatusBadge entry={entry} />
              </div>

              {entry.state === "uploading" && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Uploading {formatBytes(entry.size)}…
                </p>
              )}
              {entry.state === "failed" && (
                <p
                  role="alert"
                  className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                >
                  {entry.error}
                  {entry.requestId && (
                    <span className="mt-1 block font-mono text-xs opacity-70">
                      Reference: {entry.requestId}
                    </span>
                  )}
                </p>
              )}
              {entry.state === "done" && <DocumentResult document={entry.document} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ entry }: { entry: UploadEntry }) {
  const [label, style] =
    entry.state === "uploading"
      ? ["Uploading", "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"]
      : entry.state === "failed"
        ? ["Failed", "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"]
        : entry.document.status === "no_text"
          ? ["No text found", "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"]
          : ["Extracted", "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"];

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
