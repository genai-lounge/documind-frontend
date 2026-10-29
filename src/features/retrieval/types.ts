export interface SearchRequest {
  query: string;
  top_k?: number;
}

export interface SearchHit {
  rank: number;
  score: number;
  document_id: string;
  filename: string;
  page_number: number | null;
  chunk_index: number;
  text: string;
  start_char: number;
  end_char: number;
}

export interface SearchResponse {
  embedding: { model: string; dimensions: number };
  hits: SearchHit[];
}
