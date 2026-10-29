"use client";

import { useId } from "react";

import type { ChatCitation, ChatExchange } from "../types";

function location(item: { filename: string; page_number: number | null }): string {
  return item.page_number !== null ? `${item.filename} · page ${item.page_number}` : item.filename;
}

export function ChatAnswer({ exchange }: { exchange: ChatExchange }) {
  const idPrefix = useId();
  const citationId = (n: number) => `${idPrefix}-citation-${n}`;
  const { status, answer, citations, sources } = exchange;
  const isStreaming = status === "streaming";
  const showBanner = status === "done" && exchange.insufficientEvidence;

  const citedAs = new Map(citations.map((c) => [`${c.document_id}:${c.chunk_index}`, c.number]));

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`rounded-lg border p-4 ${
          showBanner
            ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950"
            : "border-zinc-200 dark:border-zinc-800"
        }`}
      >
        {showBanner && (
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-300">
            Not answered by your documents
          </p>
        )}

        {answer ? (
          <p className="whitespace-pre-wrap leading-relaxed">
            <AnswerText text={answer} citationId={citationId} />
            {isStreaming && (
              <span
                aria-hidden="true"
                className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-zinc-400 align-middle"
              />
            )}
          </p>
        ) : (
          isStreaming && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {sources.length > 0 ? "Writing the answer…" : "Searching your documents…"}
            </p>
          )
        )}

        {status === "stopped" && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Stopped.</p>
        )}

        {exchange.error && (
          <p
            role="alert"
            className="mt-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          >
            {exchange.error.message}
            {exchange.error.requestId && (
              <span className="mt-1 block font-mono text-xs opacity-70">
                Reference: {exchange.error.requestId}
              </span>
            )}
          </p>
        )}

        {status === "done" && exchange.model && (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Answered by <span className="font-mono">{exchange.model}</span> using only the
            passages below.
          </p>
        )}
      </div>

      {citations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Citations</h3>
          <ol className="flex flex-col gap-2">
            {citations.map((citation) => (
              <CitationItem
                key={citation.number}
                citation={citation}
                anchorId={citationId(citation.number)}
              />
            ))}
          </ol>
        </div>
      )}

      {sources.length > 0 && !isStreaming && (
        <details className="rounded-md border border-zinc-200 text-sm dark:border-zinc-800">
          <summary className="cursor-pointer px-3 py-2">
            All {sources.length} passages given to the model
          </summary>
          <ol className="flex flex-col gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
            {sources.map((source) => {
              const cited = citedAs.get(`${source.document_id}:${source.chunk_index}`);
              return (
                <li
                  key={`${source.document_id}:${source.chunk_index}`}
                  className="flex flex-col gap-1"
                >
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    #{source.rank} · {location(source)} · score {source.score.toFixed(3)}
                    {cited !== undefined ? ` · cited as [${cited}]` : " · not cited"}
                  </span>
                  <span className="whitespace-pre-wrap break-words">{source.text}</span>
                </li>
              );
            })}
          </ol>
        </details>
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

function CitationItem({ citation, anchorId }: { citation: ChatCitation; anchorId: string }) {
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
