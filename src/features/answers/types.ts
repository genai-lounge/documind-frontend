export interface AnswerCitation {
  number: number;
  document_id: string;
  filename: string;
  page_number: number | null;
  chunk_index: number;
  quote: string;
  score: number;
}

export interface AnswerSource {
  rank: number;
  score: number;
  document_id: string;
  filename: string;
  page_number: number | null;
  chunk_index: number;
  text: string;
  cited_as: number | null;
}

export interface AnswerResponse {
  answer: string;
  insufficient_evidence: boolean;
  citations: AnswerCitation[];
  sources: AnswerSource[];
  model: string | null;
}
