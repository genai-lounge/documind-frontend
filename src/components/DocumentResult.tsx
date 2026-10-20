import type { DocumentResponse, DocumentSection } from "@/types/document";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sectionLabel(section: DocumentSection): string {
  return section.page_number === null
    ? "Full text"
    : `Page ${section.page_number}`;
}

/** Shows one extracted document: metadata, warnings, and text by page. */
export function DocumentResult({ document }: { document: DocumentResponse }) {
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

      <div className="flex flex-col gap-2">
        {document.sections.map((section, index) => (
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
    </div>
  );
}
