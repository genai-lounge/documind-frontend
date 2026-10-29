export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8008";

const REQUEST_ID_HEADER = "X-Request-ID";

interface ApiErrorBody {
  detail?: {
    code?: string;
    message?: string;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly requestId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await send(path, init);
  return (await response.json()) as T;
}

/** For requests whose success reply has no body, e.g. DELETE (204 No Content). */
export async function requestNoContent(path: string, init?: RequestInit): Promise<void> {
  await send(path, init);
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError(
      `Could not reach the backend at ${API_BASE_URL}. Is it running?`,
      "network_error",
      0,
    );
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  return response;
}

async function toApiError(response: Response): Promise<ApiError> {
  const requestId = response.headers.get(REQUEST_ID_HEADER);
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body.detail?.message) {
      return new ApiError(
        body.detail.message,
        body.detail.code ?? "unknown_error",
        response.status,
        requestId,
      );
    }
  } catch {
  }
  return new ApiError(
    `The request failed (HTTP ${response.status}).`,
    "unknown_error",
    response.status,
    requestId,
  );
}
