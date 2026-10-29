"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, isAbortError } from "@/lib/http";

import { streamAnswer } from "./api";
import type { ChatExchange, ChatTurn } from "./types";

export const MAX_HISTORY_TURNS = 3;
const MAX_ANSWER_CHARS = 20000;

export function useChat() {
  const [exchanges, setExchanges] = useState<ChatExchange[]>([]);
  const controller = useRef<AbortController | null>(null);
  const nextId = useRef(0);

  const isStreaming = exchanges.at(-1)?.status === "streaming";

  const stop = useCallback(() => {
    controller.current?.abort();
  }, []);

  const reset = useCallback(() => {
    controller.current?.abort();
    setExchanges([]);
  }, []);

  useEffect(() => () => controller.current?.abort(), []);

  async function ask(rawQuestion: string) {
    const question = rawQuestion.trim();
    if (!question || isStreaming) return;

    const history: ChatTurn[] = exchanges
      .filter((e) => e.status === "done")
      .slice(-MAX_HISTORY_TURNS)
      .map((e) => ({ question: e.question, answer: e.answer.slice(0, MAX_ANSWER_CHARS) }));

    const id = nextId.current++;
    const abort = new AbortController();
    controller.current = abort;
    setExchanges((current) => [
      ...current,
      {
        id,
        question,
        answer: "",
        citations: [],
        sources: [],
        status: "streaming",
        insufficientEvidence: false,
        model: null,
        error: null,
      },
    ]);

    const update = (change: (e: ChatExchange) => Partial<ChatExchange>) =>
      setExchanges((current) => current.map((e) => (e.id === id ? { ...e, ...change(e) } : e)));

    try {
      for await (const event of streamAnswer(question, history, abort.signal)) {
        switch (event.type) {
          case "sources":
            update(() => ({ sources: event.sources }));
            break;
          case "delta":
            update((e) => ({ answer: e.answer + event.text }));
            break;
          case "citation":
            update((e) => ({ citations: [...e.citations, event.citation] }));
            break;
          case "done":
            update(() => ({
              status: "done",
              insufficientEvidence: event.insufficientEvidence,
              model: event.model,
            }));
            break;
        }
      }
      update((e) =>
        e.status === "streaming"
          ? {
              status: "failed",
              error: { message: "The answer ended unexpectedly.", requestId: null },
            }
          : {},
      );
    } catch (err) {
      if (isAbortError(err)) {
        update(() => ({ status: "stopped" }));
      } else {
        update(() => ({
          status: "failed",
          error:
            err instanceof ApiError
              ? { message: err.message, requestId: err.requestId }
              : { message: "Something went wrong while answering.", requestId: null },
        }));
      }
    } finally {
      if (controller.current === abort) controller.current = null;
    }
  }

  return { exchanges, isStreaming, ask, stop, reset };
}
