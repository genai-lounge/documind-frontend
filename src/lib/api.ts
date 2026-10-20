import type { ApiErrorBody, DocumentResponse } from "@/types/document";

// Inlined into the browser bundle at build time (NEXT_PUBLIC_ prefix).
// It is an address, not a secret.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8008";

/** An error from the API, carrying the backend's error code and readable message. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Upload one file and return its extracted text and metadata. */
export async function uploadDocument(file: File): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/documents`, {
      method: "POST",
      body: formData,
    });
  } catch {
    // fetch only throws when no response arrived at all (server down, CORS, network).
    throw new ApiError(
      `Could not reach the backend at ${API_BASE_URL}. Is it running?`,
      "network_error",
      0,
    );
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  return (await response.json()) as DocumentResponse;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body?.detail?.message) {
      return new ApiError(body.detail.message, body.detail.code, response.status);
    }
  } catch {
    // The body was not JSON; fall through to a generic message.
  }
  return new ApiError(
    `The upload failed (HTTP ${response.status}).`,
    "unknown_error",
    response.status,
  );
}
