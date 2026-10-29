import { requestJson } from "@/lib/http";

import type { AnswerResponse } from "./types";

export function askQuestion(question: string): Promise<AnswerResponse> {
  return requestJson<AnswerResponse>("/api/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}
