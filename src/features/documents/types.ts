export type DocumentStatus = "extracted" | "no_text";

export interface DocumentMetadata {
  title: string | null;
  author: string | null;
}

export interface DocumentSection {
  page_number: number | null;
  text: string;
  char_count: number;
}

export interface EmbeddingInfo {
  model: string;
  dimensions: number;
}

export interface DocumentChunk {
  chunk_index: number;
  page_number: number | null;
  text: string;
  start_char: number;
  end_char: number;
  char_count: number;
  embedding_preview: number[];
}

export interface DocumentResponse {
  id: string;
  filename: string;
  file_type: string;
  size_bytes: number;
  status: DocumentStatus;
  page_count: number | null;
  metadata: DocumentMetadata;
  sections: DocumentSection[];
  warnings: string[];
  embedding: EmbeddingInfo | null;
  chunks: DocumentChunk[];
}
