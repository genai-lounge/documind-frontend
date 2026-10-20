// Mirrors the backend's Pydantic models in backend/app/schemas.py.

export type FileType = "pdf" | "docx" | "txt";

// "extracted": some text was found. "no_text": valid file, but no extractable text.
export type DocumentStatus = "extracted" | "no_text";

export interface DocumentMetadata {
  title: string | null;
  author: string | null;
}

export interface DocumentSection {
  // PDF page number (1-based); null for DOCX and TXT.
  page_number: number | null;
  text: string;
  char_count: number;
}

export interface DocumentResponse {
  id: string;
  filename: string;
  file_type: FileType;
  size_bytes: number;
  status: DocumentStatus;
  page_count: number | null;
  metadata: DocumentMetadata;
  sections: DocumentSection[];
  warnings: string[];
}

// Every API error has the shape {"detail": {"code": ..., "message": ...}}.
export interface ApiErrorBody {
  detail: {
    code: string;
    message: string;
  };
}
