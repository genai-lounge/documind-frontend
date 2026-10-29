import { requestJson, requestNoContent } from "@/lib/http";

import type { DocumentDetail, DocumentResponse, DocumentSummary } from "./types";

const DOCUMENTS = "/api/v1/documents";

export function uploadDocument(file: File): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return requestJson<DocumentResponse>(DOCUMENTS, {
    method: "POST",
    body: formData,
  });
}

export function listDocuments(): Promise<DocumentSummary[]> {
  return requestJson<DocumentSummary[]>(DOCUMENTS);
}

export function getDocument(id: string): Promise<DocumentDetail> {
  return requestJson<DocumentDetail>(`${DOCUMENTS}/${encodeURIComponent(id)}`);
}

export function deleteDocument(id: string): Promise<void> {
  return requestNoContent(`${DOCUMENTS}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
