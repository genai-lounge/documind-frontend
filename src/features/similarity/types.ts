export interface SimilarityRequest {
  text_a: string;
  text_b: string;
}

export interface SimilarityResponse {
  similarity: number;
  model: string;
  dimensions: number;
}
