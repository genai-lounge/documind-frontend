"use client";

import { useState, type FormEvent } from "react";

import { ApiError } from "@/lib/http";

import { searchChunks } from "../api";
import type { SearchResponse } from "../types";

const TOP_K_CHOICES = [3, 5, 10, 20];
const MAX_QUERY_CHARS = 2000;

export function SearchInspector() {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(
    null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      setResult(await searchChunks({ query, top_k: topK }));
    } catch (err) {
      setResult(null);
      setError(
        err instanceof ApiError
          ? { message: err.message, requestId: err.requestId }
          : { message: "Something went wrong while searching.", requestId: null },
      );
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Question</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={MAX_QUERY_CHARS}
            placeholder="e.g. How much did revenue grow last quarter?"
            className="rounded-md border border-zinc-300 bg-transparent p-2 dark:border-zinc-700"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Results</span>
          <select
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="rounded-md border border-zinc-300 bg-transparent p-2 dark:border-zinc-700"
          >
            {TOP_K_CHOICES.map((k) => (
              <option key={k} value={k}>
                Top {k}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isSearching ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {error.message}
          {error.requestId && (
            <span className="mt-1 block font-mono text-xs opacity-70">
              Reference: {error.requestId}
            </span>
          )}
        </p>
      )}

      {result && result.hits.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No matching passages. Upload documents first, or check that they were indexed with
          the current embedding model.
        </p>
      )}

      {result && result.hits.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            The closest {result.hits.length} chunks by meaning, embedded with{" "}
            <span className="font-mono">{result.embedding.model}</span>. The score is cosine
            similarity: it ranks results, it is not the probability that a passage answers the
            question.
          </p>
          <ol className="flex flex-col gap-2">
            {result.hits.map((hit) => (
              <li
                key={`${hit.document_id}:${hit.chunk_index}`}
                className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      #{hit.rank} {hit.filename}
                    </span>
                    {hit.page_number !== null && <> · page {hit.page_number}</>} · chunk{" "}
                    {hit.chunk_index + 1}
                  </span>
                  <span className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {hit.score.toFixed(3)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-1.5 rounded-full bg-zinc-800 dark:bg-zinc-200"
                    style={{ width: `${Math.max(0, hit.score) * 100}%` }}
                  />
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {hit.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
