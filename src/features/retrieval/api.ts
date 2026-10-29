import { requestJson } from "@/lib/http";

import type { SearchRequest, SearchResponse } from "./types";

export function searchChunks(request: SearchRequest): Promise<SearchResponse> {
  return requestJson<SearchResponse>("/api/v1/retrieval/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}
