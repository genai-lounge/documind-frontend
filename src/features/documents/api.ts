import { requestJson } from "@/lib/http";

import type { DocumentResponse } from "./types";

export function uploadDocument(file: File): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return requestJson<DocumentResponse>("/api/v1/documents", {
    method: "POST",
    body: formData,
  });
}
