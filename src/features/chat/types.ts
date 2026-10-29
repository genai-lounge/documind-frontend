export interface ChatCitation {
  number: number;
  document_id: string;
  filename: string;
  page_number: number | null;
  chunk_index: number;
  quote: string;
  score: number;
}

export interface ChatSource {
  rank: number;
  score: number;
  document_id: string;
  filename: string;
  page_number: number | null;
  chunk_index: number;
  text: string;
}

/** An earlier question and answer, sent back so follow-up questions have context. */
export interface ChatTurn {
  question: string;
  answer: string;
}

export type ChatStreamEvent =
  | { type: "sources"; sources: ChatSource[] }
  | { type: "delta"; text: string }
  | { type: "citation"; citation: ChatCitation }
  | { type: "done"; insufficientEvidence: boolean; model: string | null };

export type ExchangeStatus = "streaming" | "done" | "stopped" | "failed";

export interface ChatExchange {
  id: number;
  question: string;
  answer: string;
  citations: ChatCitation[];
  sources: ChatSource[];
  status: ExchangeStatus;
  insufficientEvidence: boolean;
  model: string | null;
  error: { message: string; requestId: string | null } | null;
}
