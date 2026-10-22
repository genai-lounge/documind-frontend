"use client";

import { useState } from "react";

import { formatBytes } from "@/lib/format";

import type { DocumentResponse, DocumentSection } from "../types";
import { ChunkList } from "./ChunkList";

type View = "pages" | "chunks";

function sectionLabel(section: DocumentSection): string {
  return section.page_number === null
    ? "Full text"
    : `Page ${section.page_number}`;
}

export function DocumentResult({ document }: { document: DocumentResponse }) {
  const [view, setView] = useState<View>("pages");
  const totalChars = document.sections.reduce((n, s) => n + s.char_count, 0);
  const details: [string, string][] = [
    ["Type", document.file_type.toUpperCase()],
    ["Size", formatBytes(document.size_bytes)],
    ["Characters", totalChars.toLocaleString()],
  ];
  if (document.page_count !== null) {
    details.push(["Pages", String(document.page_count)]);
  }
  if (document.metadata.title) details.push(["Title", document.metadata.title]);
  if (document.metadata.author) {
    details.push(["Author", document.metadata.author]);
  }
  details.push(["Chunks", document.chunks.length.toLocaleString()]);
  if (document.embedding) {
    details.push([
      "Embedding",
      `${document.embedding.model} (${document.embedding.dimensions.toLocaleString()} dimensions)`,
    ]);
  }

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {details.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>

      {document.warnings.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          {document.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <div
        role="tablist"
        aria-label="View"
        className="flex w-fit gap-1 rounded-md bg-zinc-100 p-1 text-sm dark:bg-zinc-900"
      >
        {(
          [
            ["pages", `Pages (${document.sections.length})`],
            ["chunks", `Chunks (${document.chunks.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={view === value}
            onClick={() => setView(value)}
            className={`rounded px-3 py-1 ${
              view === value
                ? "bg-white font-medium shadow-sm dark:bg-zinc-700"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "chunks" ? (
        <ChunkList chunks={document.chunks} embedding={document.embedding} />
      ) : (
        <SectionList sections={document.sections} />
      )}
    </div>
  );
}

function SectionList({ sections }: { sections: DocumentSection[] }) {
  return (
    <div className="flex flex-col gap-2">
        {sections.map((section, index) => (
          <details
            key={index}
            open={index === 0}
            className="rounded-md border border-zinc-200 dark:border-zinc-800"
          >
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
              {sectionLabel(section)}
              <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
                {section.char_count.toLocaleString()} characters
              </span>
            </summary>
            {section.text.trim() ? (
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words border-t border-zinc-200 px-3 py-2 font-mono text-xs leading-relaxed dark:border-zinc-800">
                {section.text}
              </pre>
            ) : (
              <p className="border-t border-zinc-200 px-3 py-2 text-sm italic text-zinc-500 dark:border-zinc-800">
                No text on this page.
              </p>
            )}
          </details>
        ))}
      </div>
  );
}
