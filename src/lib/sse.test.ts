import { describe, expect, it } from "vitest";

import { parseSse, type SseMessage } from "./sse";

function streamOf(chunks: (string | Uint8Array)[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(typeof chunk === "string" ? encoder.encode(chunk) : chunk);
      }
      controller.close();
    },
  });
}

async function collect(chunks: (string | Uint8Array)[]): Promise<SseMessage[]> {
  const messages: SseMessage[] = [];
  for await (const message of parseSse(streamOf(chunks))) messages.push(message);
  return messages;
}

describe("parseSse", () => {
  it("reads named events with their data", async () => {
    expect(await collect(['event: delta\ndata: {"text":"Hi"}\n\n', "event: done\ndata: {}\n\n"])).toEqual([
      { event: "delta", data: '{"text":"Hi"}' },
      { event: "done", data: "{}" },
    ]);
  });

  it("handles events split at any point, even one character at a time", async () => {
    const text = "event: delta\r\ndata: one\r\n\r\nevent: delta\ndata: two\n\n";

    expect(await collect(text.split(""))).toEqual([
      { event: "delta", data: "one" },
      { event: "delta", data: "two" },
    ]);
  });

  it("joins multi-line data, skips comments, and defaults the event name", async () => {
    expect(await collect([": ping\n\ndata: line 1\ndata:line 2\n\n"])).toEqual([
      { event: "message", data: "line 1\nline 2" },
    ]);
  });

  it("decodes characters split across chunks", async () => {
    const bytes = new TextEncoder().encode("data: café ✓\n\n");
    const middle = bytes.length - 4;

    expect(await collect([bytes.slice(0, middle), bytes.slice(middle)])).toEqual([
      { event: "message", data: "café ✓" },
    ]);
  });

  it("drops an event that was cut off before its blank line", async () => {
    expect(await collect(["data: complete\n\n", "data: cut off"])).toEqual([
      { event: "message", data: "complete" },
    ]);
  });
});
