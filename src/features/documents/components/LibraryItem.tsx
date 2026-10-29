"use client";

import { useState } from "react";

import { formatBytes } from "@/lib/format";
import { ApiError } from "@/lib/http";

import { deleteDocument, getDocument } from "../api";
import type { DocumentDetail, DocumentResponse, DocumentSummary, IndexStatus } from "../types";
import { ChunkList } from "./ChunkList";
import { DocumentResult } from "./DocumentResult";

const STATUS: Record<IndexStatus, [string, string]> = {
  indexed: ["Indexed", "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"],
  no_text: ["No text found", "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"],
  processing: ["Processing", "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"],
  failed: ["Failed", "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"],
};

export function LibraryItem({
  summary,
  uploadResult,
  onDeleted,
}: {
  summary: DocumentSummary;
  uploadResult?: DocumentResponse;
  onDeleted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !uploadResult && !detail) {
      try {
        setDetail(await getDocument(summary.id));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load this document.");
      }
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await deleteDocument(summary.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this document.");
      setBusy(false);
      setConfirming(false);
    }
  }

  const [label, style] = STATUS[summary.status];
  const facts = [
    summary.file_type.toUpperCase(),
    formatBytes(summary.size_bytes),
    summary.page_count !== null ? `${summary.page_count} pages` : null,
    `${summary.chunk_count} chunks`,
    summary.embedding?.model ?? null,
    new Date(summary.created_at).toLocaleString(),
  ].filter(Boolean);

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="break-all font-medium">{summary.filename}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{facts.join(" · ")}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>{label}</span>
      </div>

      {summary.status === "failed" && (
        <p className="text-sm text-red-700 dark:text-red-300">
          Indexing failed ({summary.error_code ?? "unknown error"}). Delete it and upload again.
        </p>
      )}
      {summary.status === "indexed" && !summary.searchable && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Indexed with a different embedding model, so search can&apos;t find it. Delete it and
          upload again to re-index.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {summary.chunk_count > 0 && (
          <button type="button" onClick={toggle} className="underline">
            {expanded ? "Hide details" : "Show details"}
          </button>
        )}
        {confirming ? (
          <span className="flex items-center gap-2">
            <span>Delete this document and its vectors?</span>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="rounded bg-red-600 px-2 py-0.5 font-medium text-white disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-red-700 underline dark:text-red-400"
          >
            Delete
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {expanded &&
        (uploadResult ? (
          <DocumentResult document={uploadResult} />
        ) : detail ? (
          <ChunkList chunks={detail.chunks} embedding={detail.embedding} />
        ) : (
          !error && <p className="text-sm text-zinc-500">Loading…</p>
        ))}
    </li>
  );
}
