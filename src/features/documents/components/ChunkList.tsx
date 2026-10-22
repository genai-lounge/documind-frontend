import type { DocumentChunk, EmbeddingInfo } from "../types";

function overlapWithPrevious(chunk: DocumentChunk, previous?: DocumentChunk): number {
  if (!previous || previous.page_number !== chunk.page_number) return 0;
  return Math.max(0, Math.min(previous.end_char - chunk.start_char, chunk.char_count));
}

function formatPreview(preview: number[], dimensions: number): string {
  const shown = preview.map((n) => n.toFixed(4)).join(", ");
  const hidden = dimensions - preview.length;
  return hidden > 0 ? `[${shown}, … ${hidden.toLocaleString()} more]` : `[${shown}]`;
}

export function ChunkList({
  chunks,
  embedding,
}: {
  chunks: DocumentChunk[];
  embedding: EmbeddingInfo | null;
}) {
  if (chunks.length === 0 || !embedding) {
    return (
      <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
        No chunks: there was no text to split.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {chunks.length.toLocaleString()} chunks, each embedded by{" "}
        <span className="font-mono">{embedding.model}</span> as a vector of{" "}
        {embedding.dimensions.toLocaleString()} numbers.{" "}
        <span className="text-zinc-400 dark:text-zinc-500">Faded text</span> also appears at
        the end of the previous chunk (overlap).
      </p>
      <ol className="flex flex-col gap-2">
        {chunks.map((chunk, i) => {
          const overlap = overlapWithPrevious(chunk, chunks[i - 1]);
          return (
            <li
              key={chunk.chunk_index}
              className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Chunk {chunk.chunk_index + 1}
                </span>
                {chunk.page_number !== null && <span>Page {chunk.page_number}</span>}
                <span>
                  Characters {chunk.start_char.toLocaleString()}–
                  {chunk.end_char.toLocaleString()} ({chunk.char_count.toLocaleString()})
                </span>
                {overlap > 0 && <span>{overlap} overlapping</span>}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {overlap > 0 && (
                  <span className="text-zinc-400 dark:text-zinc-500">
                    {chunk.text.slice(0, overlap)}
                  </span>
                )}
                {chunk.text.slice(overlap)}
              </p>
              <code className="break-all text-xs text-zinc-500 dark:text-zinc-400">
                {formatPreview(chunk.embedding_preview, embedding.dimensions)}
              </code>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
