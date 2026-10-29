"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { MAX_HISTORY_TURNS, useChat } from "../useChat";
import { ChatAnswer } from "./ChatAnswer";

const MAX_QUESTION_CHARS = 2000;
const FOLLOW_DISTANCE_PX = 80;

const STATUS_TEXT = {
  streaming: "Answering…",
  done: "Answer ready.",
  stopped: "Answer stopped.",
  failed: "The answer failed.",
} as const;

export function ChatPanel() {
  const { exchanges, isStreaming, ask, stop, reset } = useChat();
  const [question, setQuestion] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const last = exchanges.at(-1);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && following.current) el.scrollTop = el.scrollHeight;
  }, [exchanges]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    following.current = el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_DISTANCE_PX;
  }

  function submit() {
    if (!question.trim() || isStreaming) return;
    following.current = true;
    void ask(question);
    setQuestion("");
    inputRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  function startOver() {
    reset();
    setQuestion("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[28rem] flex-col gap-4 lg:h-full lg:min-h-0">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Claude answers from your documents only, and cites the passages it used. Follow-up
          questions remember the last {MAX_HISTORY_TURNS} exchanges.
        </p>
        <button
          type="button"
          onClick={startOver}
          disabled={exchanges.length === 0}
          className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700"
        >
          New chat
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        {exchanges.length === 0 ? (
          <p className="flex h-full items-center justify-center text-center text-sm text-zinc-500 dark:text-zinc-400">
            Ask a question about your documents to start.
          </p>
        ) : (
          <ol className="flex flex-col gap-6" aria-label="Conversation">
            {exchanges.map((exchange) => (
              <li key={exchange.id} className="flex flex-col gap-3">
                <p className="self-end whitespace-pre-wrap rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-800">
                  <span className="sr-only">You asked: </span>
                  {exchange.question}
                </p>
                <ChatAnswer exchange={exchange} />
              </li>
            ))}
          </ol>
        )}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {last ? STATUS_TEXT[last.status] : ""}
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 flex-col gap-2 rounded-2xl border border-zinc-300 bg-zinc-50 p-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:border-blue-500"
      >
        <label className="flex flex-col">
          <span className="sr-only">
            {exchanges.length > 0 ? "Ask a follow-up" : "Your question"}
          </span>
          <textarea
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_QUESTION_CHARS}
            rows={2}
            placeholder={
              exchanges.length > 0
                ? "Ask a follow-up…"
                : "Ask about your documents, e.g. How many vacation days do employees get?"
            }
            className="field-sizing-content max-h-48 min-h-12 resize-none bg-transparent px-1 outline-none"
          />
        </label>
        <div className="flex justify-end">
          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop"
              title="Stop"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-400 hover:bg-zinc-200 dark:border-zinc-500 dark:hover:bg-zinc-800"
            >
              <StopIcon />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!question.trim()}
              aria-label="Ask"
              title="Ask"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-zinc-400 disabled:opacity-50 dark:disabled:bg-zinc-600"
            >
              <SendIcon />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}
