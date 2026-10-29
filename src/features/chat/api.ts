import { ApiError, requestStream } from "@/lib/http";

import type { ChatCitation, ChatSource, ChatStreamEvent, ChatTurn } from "./types";

interface DoneData {
  insufficient_evidence: boolean;
  model: string | null;
}

interface ErrorData {
  code: string;
  message: string;
}

export async function* streamAnswer(
  question: string,
  history: ChatTurn[],
  signal: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  const messages = requestStream("/api/v1/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ question, history }),
    signal,
  });

  for await (const message of messages) {
    const data: unknown = JSON.parse(message.data);
    switch (message.event) {
      case "sources":
        yield { type: "sources", sources: data as ChatSource[] };
        break;
      case "delta":
        yield { type: "delta", text: (data as { text: string }).text };
        break;
      case "citation":
        yield { type: "citation", citation: data as ChatCitation };
        break;
      case "done": {
        const done = data as DoneData;
        yield { type: "done", insufficientEvidence: done.insufficient_evidence, model: done.model };
        break;
      }
      case "error": {
        const error = data as ErrorData;
        throw new ApiError(error.message, error.code, 200);
      }
    }
  }
}
