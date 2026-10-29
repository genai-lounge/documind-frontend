import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { jsonResponse, mockFetch } from "@/test/fetch";

import type { DocumentResponse, DocumentSummary } from "../types";
import { DocumentLibrary } from "./DocumentLibrary";

const SUMMARY: DocumentSummary = {
  id: "doc1",
  filename: "handbook.txt",
  file_type: "txt",
  size_bytes: 1200,
  status: "indexed",
  created_at: "2026-10-29T10:00:00Z",
  page_count: null,
  chunk_count: 3,
  embedding: { model: "text-embedding-3-small", dimensions: 1536 },
  error_code: null,
  searchable: true,
};
const UPLOADED: DocumentResponse = {
  id: "doc1",
  filename: "handbook.txt",
  file_type: "txt",
  size_bytes: 1200,
  status: "extracted",
  page_count: null,
  metadata: { title: null, author: null },
  sections: [],
  warnings: [],
  embedding: null,
  chunks: [],
  index_status: "indexed",
  created_at: "2026-10-29T10:00:00Z",
};

function file(name = "handbook.txt") {
  return new File(["Employees get 25 vacation days."], name, { type: "text/plain" });
}

describe("DocumentLibrary", () => {
  it("uploads a file, shows progress, then lists it", async () => {
    let stored: DocumentSummary[] = [];
    let finishUpload!: () => void;
    mockFetch(({ method }) => {
      if (method === "POST") {
        return new Promise((resolve) => {
          finishUpload = () => {
            stored = [SUMMARY];
            resolve(jsonResponse(UPLOADED));
          };
        });
      }
      return jsonResponse(stored);
    });
    const user = userEvent.setup();
    const { container } = render(<DocumentLibrary />);
    expect(await screen.findByText(/No documents yet/)).toBeInTheDocument();

    await user.upload(container.querySelector("input[type=file]") as HTMLInputElement, file());

    expect(screen.getByText(/uploading and indexing/)).toBeInTheDocument();
    expect(screen.getByText("Uploading…")).toBeInTheDocument();
    finishUpload();
    expect(await screen.findByRole("heading", { name: "handbook.txt" })).toBeInTheDocument();
    expect(screen.queryByText(/uploading and indexing/)).not.toBeInTheDocument();
    expect(screen.getByText("Indexed")).toBeInTheDocument();
  });

  it("shows a failed upload with its reference until dismissed", async () => {
    mockFetch(({ method }) =>
      method === "POST"
        ? jsonResponse(
            { detail: { code: "unsupported_file_type", message: "Only PDF, DOCX and TXT files." } },
            415,
            { "X-Request-ID": "req-9" },
          )
        : jsonResponse([]),
    );
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<DocumentLibrary />);
    await screen.findByText(/No documents yet/);

    await user.upload(container.querySelector("input[type=file]") as HTMLInputElement, file("x.png"));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("x.png: Only PDF, DOCX and TXT files.");
    expect(alert).toHaveTextContent("Reference: req-9");
    await user.click(within(alert).getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("asks for confirmation before deleting", async () => {
    let stored = [SUMMARY];
    const calls = mockFetch(({ method }) => {
      if (method === "DELETE") {
        stored = [];
        return jsonResponse(null, 204);
      }
      return jsonResponse(stored);
    });
    const user = userEvent.setup();
    render(<DocumentLibrary />);
    await screen.findByRole("heading", { name: "handbook.txt" });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete this document and its vectors?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.getByText(/No documents yet/)).toBeInTheDocument());
    expect(calls.find((c) => c.method === "DELETE")?.url).toMatch(/\/api\/v1\/documents\/doc1$/);
  });
});
