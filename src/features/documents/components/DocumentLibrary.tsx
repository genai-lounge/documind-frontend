"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/http";

import { listDocuments, uploadDocument } from "../api";
import type { DocumentResponse, DocumentSummary } from "../types";
import { LibraryItem } from "./LibraryItem";

const ACCEPTED_TYPES = ".pdf,.docx,.txt";

interface UploadMessage {
  key: number;
  filename: string;
  state: "uploading" | "failed";
  error?: string;
  requestId?: string | null;
}

export function DocumentLibrary() {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [messages, setMessages] = useState<UploadMessage[]>([]);
  const [uploadResults, setUploadResults] = useState<Record<string, DocumentResponse>>({});
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextKey = useRef(0);

  const refresh = useCallback(async () => {
    try {
      setDocuments(await listDocuments());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Could not load documents.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listDocuments()
      .then((list) => {
        if (!cancelled) setDocuments(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : "Could not load documents.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    for (const file of Array.from(files)) {
      const key = nextKey.current++;
      setMessages((current) => [{ key, filename: file.name, state: "uploading" }, ...current]);
      try {
        const result = await uploadDocument(file);
        setUploadResults((current) => ({ ...current, [result.id]: result }));
        setMessages((current) => current.filter((m) => m.key !== key));
      } catch (err) {
        setMessages((current) =>
          current.map((m) =>
            m.key === key
              ? {
                  ...m,
                  state: "failed",
                  error:
                    err instanceof ApiError
                      ? err.message
                      : "Something went wrong while uploading.",
                  requestId: err instanceof ApiError ? err.requestId : null,
                }
              : m,
          ),
        );
      }
      await refresh();
    }

    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function dismiss(key: number) {
    setMessages((current) => current.filter((m) => m.key !== key));
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 p-8 text-center transition-colors hover:border-zinc-400 has-[:focus-visible]:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500">
        <span className="font-medium">
          {isUploading ? "Uploading…" : "Choose PDF, DOCX, or TXT files"}
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Files are extracted, chunked, embedded, and stored so you can search them.
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

      {messages.length > 0 && (
        <ul className="flex flex-col gap-2">
          {messages.map((m) => (
            <li
              key={m.key}
              role={m.state === "failed" ? "alert" : undefined}
              className={`flex items-start justify-between gap-3 rounded-md border p-3 text-sm ${
                m.state === "failed"
                  ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                  : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
              }`}
            >
              <span className="break-words">
                <span className="font-medium">{m.filename}</span>
                {m.state === "uploading" ? " — uploading and indexing…" : `: ${m.error}`}
                {m.requestId && (
                  <span className="mt-1 block font-mono text-xs opacity-70">
                    Reference: {m.requestId}
                  </span>
                )}
              </span>
              {m.state === "failed" && (
                <button
                  type="button"
                  onClick={() => dismiss(m.key)}
                  className="shrink-0 text-xs underline"
                >
                  Dismiss
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {loadError && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {loadError}
        </p>
      )}

      {documents === null && !loadError && (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">Loading documents…</p>
      )}

      {documents !== null && documents.length === 0 && (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          No documents yet. Upload one to get started.
        </p>
      )}

      {documents !== null && documents.length > 0 && (
        <ul className="flex flex-col gap-3">
          {documents.map((document) => (
            <LibraryItem
              key={document.id}
              summary={document}
              uploadResult={uploadResults[document.id]}
              onDeleted={refresh}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
