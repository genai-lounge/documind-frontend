import { requestJson } from "@/lib/http";

import type { SimilarityRequest, SimilarityResponse } from "./types";

export function compareTexts(request: SimilarityRequest): Promise<SimilarityResponse> {
  return requestJson<SimilarityResponse>("/api/v1/embeddings/similarity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}
