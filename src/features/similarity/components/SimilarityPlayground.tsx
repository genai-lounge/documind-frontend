"use client";

import { useState, type FormEvent } from "react";

import { ApiError } from "@/lib/http";

import { compareTexts } from "../api";

const MAX_CHARS = 2000;

const EXAMPLES: [string, string][] = [
  ["car", "automobile"],
  ["car", "banana"],
  ["How much did revenue grow last quarter?", "In Q3, revenue increased by 12% to $4M."],
  ["I love this movie.", "I hate this movie."],
];

interface Comparison {
  key: number;
  textA: string;
  textB: string;
  similarity: number;
  model: string;
}

export function SimilarityPlayground() {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(
    null,
  );
  const [history, setHistory] = useState<Comparison[]>([]);

  async function compare(a: string, b: string) {
    setIsComparing(true);
    setError(null);
    try {
      const result = await compareTexts({ text_a: a, text_b: b });
      setHistory((current) => [
        {
          key: Date.now(),
          textA: a,
          textB: b,
          similarity: result.similarity,
          model: result.model,
        },
        ...current,
      ]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? { message: err.message, requestId: err.requestId }
          : { message: "Something went wrong while comparing.", requestId: null },
      );
    } finally {
      setIsComparing(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (textA.trim() && textB.trim()) void compare(textA, textB);
  }

  function tryExample([a, b]: [string, string]) {
    setTextA(a);
    setTextB(b);
    void compare(a, b);
  }

  const canSubmit = !isComparing && textA.trim() !== "" && textB.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextBox label="Text A" value={textA} onChange={setTextA} />
          <TextBox label="Text B" value={textB} onChange={setTextB} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isComparing ? "Comparing…" : "Compare"}
          </button>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">or try:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example.join("|")}
              type="button"
              disabled={isComparing}
              onClick={() => tryExample(example)}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:border-zinc-500 disabled:opacity-40 dark:border-zinc-700"
            >
              {example[0].length > 20 ? "question / answer" : `${example[0]} / ${example[1]}`}
            </button>
          ))}
        </div>
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

      {history.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Cosine similarity runs from -1 (opposite) through 0 (unrelated) to 1 (same
            meaning). Scores are relative: compare pairs with each other rather than
            reading one number as a percentage.
          </p>
          <ul className="flex flex-col gap-2">
            {history.map((item) => (
              <li
                key={item.key}
                className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="break-words">
                    “{item.textA}” <span className="text-zinc-400">vs</span> “{item.textB}”
                  </span>
                  <span className="shrink-0 font-mono text-base font-semibold">
                    {item.similarity.toFixed(3)}
                  </span>
                </div>
                <ScoreBar similarity={item.similarity} />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.model}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TextBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_CHARS}
        rows={3}
        className="resize-y rounded-md border border-zinc-300 bg-transparent p-2 dark:border-zinc-700"
      />
    </label>
  );
}

function ScoreBar({ similarity }: { similarity: number }) {
  const percent = ((similarity + 1) / 2) * 100;
  return (
    <div
      className="relative h-2 rounded-full bg-zinc-100 dark:bg-zinc-800"
      role="meter"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={similarity}
      aria-label="Similarity"
    >
      <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-300 dark:bg-zinc-600" />
      <div
        className="h-2 rounded-full bg-zinc-800 dark:bg-zinc-200"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
