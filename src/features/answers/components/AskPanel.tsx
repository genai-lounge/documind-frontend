"use client";

import { useId, useState, type FormEvent } from "react";

import { ApiError } from "@/lib/http";

import { askQuestion } from "../api";
import type { AnswerCitation, AnswerResponse } from "../types";

const MAX_QUESTION_CHARS = 2000;

function location(item: { filename: string; page_number: number | null }): string {
  return item.page_number !== null ? `${item.filename} · page ${item.page_number}` : item.filename;
}

export function AskPanel() {
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [result, setResult] = useState<AnswerResponse | null>(null);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(
    null,
  );
  const idPrefix = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    setIsAsking(true);
    setError(null);
    try {
      setResult(await askQuestion(question));
    } catch (err) {
      setResult(null);
      setError(
        err instanceof ApiError
          ? { message: err.message, requestId: err.requestId }
          : { message: "Something went wrong while answering.", requestId: null },
      );
    } finally {
      setIsAsking(false);
    }
  }

  const citationId = (n: number) => `${idPrefix}-citation-${n}`;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Your question</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={MAX_QUESTION_CHARS}
            rows={2}
            placeholder="e.g. How many vacation days do employees get?"
            className="resize-y rounded-md border border-zinc-300 bg-transparent p-2 dark:border-zinc-700"
          />
        </label>
        <button
          type="submit"
          disabled={isAsking || !question.trim()}
          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isAsking ? "Thinking…" : "Ask"}
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

      {result && (
        <div className="flex flex-col gap-4">
          <div
            className={`rounded-lg border p-4 ${
              result.insufficient_evidence
                ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            {result.insufficient_evidence && (
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-300">
                Not answered by your documents
              </p>
            )}
            <p className="whitespace-pre-wrap leading-relaxed">
              <AnswerText text={result.answer} citationId={citationId} />
            </p>
            {result.model && (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Answered by <span className="font-mono">{result.model}</span> using only the
                passages below.
              </p>
            )}
          </div>

          {result.citations.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Citations</h3>
              <ol className="flex flex-col gap-2">
                {result.citations.map((citation) => (
                  <CitationItem
                    key={citation.number}
                    citation={citation}
                    anchorId={citationId(citation.number)}
                  />
                ))}
              </ol>
            </div>
          )}

          {result.sources.length > 0 && (
            <details className="rounded-md border border-zinc-200 text-sm dark:border-zinc-800">
              <summary className="cursor-pointer px-3 py-2">
                All {result.sources.length} passages given to the model
              </summary>
              <ol className="flex flex-col gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
                {result.sources.map((source) => (
                  <li key={`${source.document_id}:${source.chunk_index}`} className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      #{source.rank} · {location(source)} · score {source.score.toFixed(3)}
                      {source.cited_as !== null ? ` · cited as [${source.cited_as}]` : " · not cited"}
                    </span>
                    <span className="whitespace-pre-wrap break-words">{source.text}</span>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function AnswerText({ text, citationId }: { text: string; citationId: (n: number) => string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = /^\[(\d+)\]$/.exec(part);
        if (!match) return <span key={i}>{part}</span>;
        const n = Number(match[1]);
        return (
          <a
            key={i}
            href={`#${citationId(n)}`}
            className="mx-0.5 align-super text-xs font-semibold text-blue-700 no-underline hover:underline dark:text-blue-400"
            aria-label={`Citation ${n}`}
          >
            [{n}]
          </a>
        );
      })}
    </>
  );
}

function CitationItem({ citation, anchorId }: { citation: AnswerCitation; anchorId: string }) {
  return (
    <li
      id={anchorId}
      className="scroll-mt-4 rounded-md border border-zinc-200 p-3 text-sm target:border-blue-500 dark:border-zinc-800"
    >
      <div className="mb-1 flex flex-wrap justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">[{citation.number}]</span>{" "}
          {location(citation)} · chunk {citation.chunk_index + 1}
        </span>
        <span className="font-mono">score {citation.score.toFixed(3)}</span>
      </div>
      <blockquote className="whitespace-pre-wrap break-words border-l-2 border-zinc-300 pl-3 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
        {citation.quote}
      </blockquote>
    </li>
  );
}
