import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { jsonResponse, mockFetch, sseStream } from "@/test/fetch";

import { ChatPanel } from "./ChatPanel";

const SOURCE = {
  rank: 1,
  score: 0.81,
  document_id: "doc1",
  filename: "office.txt",
  page_number: null,
  chunk_index: 0,
  text: "The office cat is named Biscuit.",
  cited_as: null,
};
const CITATION = {
  number: 1,
  document_id: "doc1",
  filename: "office.txt",
  page_number: null,
  chunk_index: 0,
  quote: "The office cat is named Biscuit.",
  score: 0.81,
};

function setup() {
  const streams: ReturnType<typeof sseStream>[] = [];
  const calls = mockFetch((call) => {
    const stream = sseStream(call.signal);
    streams.push(stream);
    return stream.response;
  });
  const user = userEvent.setup();
  render(<ChatPanel />);
  return { user, calls, streams, input: screen.getByRole("textbox") };
}

function answerFully(stream: ReturnType<typeof sseStream>) {
  stream.send("sources", [SOURCE]);
  stream.send("citation", CITATION);
  stream.send("delta", { text: "The cat is called Biscuit." });
  stream.send("delta", { text: "[1]" });
  stream.send("done", { insufficient_evidence: false, model: "claude-haiku-5-5" });
  stream.close();
}

describe("ChatPanel", () => {
  it("shows the answer as it streams in, then its citations", async () => {
    const { user, input, streams, calls } = setup();

    await user.type(input, "What is the office cat called?{Enter}");

    expect(calls[0].url).toMatch(/\/api\/v1\/chat\/stream$/);
    expect(calls[0].body).toEqual({ question: "What is the office cat called?", history: [] });
    expect(screen.getByText("What is the office cat called?")).toBeInTheDocument();
    expect(await screen.findByText("Searching your documents…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();

    streams[0].send("sources", [SOURCE]);
    streams[0].send("delta", { text: "The cat is called" });
    expect(await screen.findByText("The cat is called")).toBeInTheDocument();

    streams[0].send("citation", CITATION);
    streams[0].send("delta", { text: " Biscuit." });
    streams[0].send("delta", { text: "[1]" });
    streams[0].send("done", { insufficient_evidence: false, model: "claude-haiku-5-5" });
    streams[0].close();

    const link = await screen.findByRole("link", { name: "Citation 1" });
    const citation = screen.getByText("The office cat is named Biscuit.", { selector: "blockquote" });
    expect(link.getAttribute("href")).toBe(`#${citation.closest("li")?.id}`);
    expect(screen.getByText("claude-haiku-5-5")).toBeInTheDocument();
    expect(screen.getByText("All 1 passages given to the model")).toBeInTheDocument();
    expect(screen.getByText(/cited as \[1\]/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Answer ready.");
    expect(screen.getByRole("button", { name: "Ask" })).toBeInTheDocument();
  });

  it("warns when the documents don't answer the question", async () => {
    const { user, input, streams } = setup();

    await user.type(input, "How tall is the cat?{Enter}");
    streams[0].send("sources", [SOURCE]);
    streams[0].send("delta", { text: "The documents don't say." });
    streams[0].send("done", { insufficient_evidence: true, model: "claude-haiku-5-5" });
    streams[0].close();

    expect(await screen.findByText("Not answered by your documents")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Citation/ })).not.toBeInTheDocument();
  });

  it("stops the answer and keeps what arrived so far", async () => {
    const { user, input, streams, calls } = setup();

    await user.type(input, "Tell me everything{Enter}");
    streams[0].send("delta", { text: "Partial answer" });
    await screen.findByText("Partial answer");
    await user.click(screen.getByRole("button", { name: "Stop" }));

    expect(await screen.findByText("Stopped.")).toBeInTheDocument();
    expect(calls[0].signal?.aborted).toBe(true);
    expect(screen.getByText("Partial answer")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error sent in the middle of the stream", async () => {
    const { user, input, streams } = setup();

    await user.type(input, "Question{Enter}");
    streams[0].send("delta", { text: "Half an" });
    streams[0].send("error", { code: "llm_unavailable", message: "The answering service is down." });
    streams[0].close();

    expect(await screen.findByRole("alert")).toHaveTextContent("The answering service is down.");
    expect(screen.getByText("Half an")).toBeInTheDocument();
  });

  it("shows an error from before the stream started, with its reference", async () => {
    mockFetch(() =>
      jsonResponse(
        { detail: { code: "llm_rate_limited", message: "Busy, try again in a minute." } },
        503,
        { "X-Request-ID": "req-123" },
      ),
    );
    const user = userEvent.setup();
    render(<ChatPanel />);

    await user.type(screen.getByRole("textbox"), "Question{Enter}");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Busy, try again in a minute.");
    expect(alert).toHaveTextContent("Reference: req-123");
  });

  it("sends earlier finished exchanges with a follow-up question", async () => {
    const { user, input, streams, calls } = setup();

    await user.type(input, "What is the office cat called?{Enter}");
    answerFully(streams[0]);
    await screen.findByRole("link", { name: "Citation 1" });
    await user.type(input, "How old is it?{Enter}");

    expect(calls[1].body).toEqual({
      question: "How old is it?",
      history: [
        { question: "What is the office cat called?", answer: "The cat is called Biscuit.[1]" },
      ],
    });
    expect(screen.getByText("Ask a follow-up")).toBeInTheDocument();
  });

  it("uses Shift+Enter for a new line instead of sending", async () => {
    const { user, input, calls } = setup();

    await user.type(input, "Line one{Shift>}{Enter}{/Shift}Line two");

    expect(calls).toHaveLength(0);
    expect(input).toHaveValue("Line one\nLine two");
  });

  it("starts a new chat", async () => {
    const { user, input, streams, calls } = setup();

    await user.type(input, "What is the office cat called?{Enter}");
    answerFully(streams[0]);
    await screen.findByRole("link", { name: "Citation 1" });
    await user.click(screen.getByRole("button", { name: "New chat" }));

    expect(screen.queryByText("What is the office cat called?")).not.toBeInTheDocument();
    await waitFor(() => expect(input).toHaveFocus());
    await user.type(input, "Fresh question{Enter}");
    expect(calls[1].body).toEqual({ question: "Fresh question", history: [] });
  });
});
