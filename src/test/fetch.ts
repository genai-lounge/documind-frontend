import { vi } from "vitest";

export interface Call {
  url: string;
  method: string;
  body: unknown;
  signal: AbortSignal | null;
}

type Handler = (call: Call) => Response | Promise<Response>;

export function mockFetch(handler: Handler): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : (init?.body ?? null);
      const call = {
        url: String(input),
        method: init?.method ?? "GET",
        body,
        signal: init?.signal ?? null,
      };
      calls.push(call);
      return handler(call);
    }),
  );
  return calls;
}

export function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function sseStream(signal: AbortSignal | null = null) {
  const encoder = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  signal?.addEventListener("abort", () =>
    controller.error(new DOMException("The operation was aborted.", "AbortError")),
  );
  return {
    response: new Response(body, { headers: { "Content-Type": "text/event-stream" } }),
    send(event: string, data: unknown) {
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    },
    close() {
      controller.close();
    },
  };
}
