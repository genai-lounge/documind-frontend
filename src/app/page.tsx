import { AskPanel } from "@/features/answers";
import { DocumentLibrary } from "@/features/documents";
import { SearchInspector } from "@/features/retrieval";
import { SimilarityPlayground } from "@/features/similarity";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">DocuMind</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload documents, then ask questions and get answers with citations you can check.
        </p>
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="documents-heading">
        <h2 id="documents-heading" className="text-xl font-semibold">
          Documents
        </h2>
        <DocumentLibrary />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="ask-heading">
        <div className="flex flex-col gap-1">
          <h2 id="ask-heading" className="text-xl font-semibold">
            Ask
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Claude answers from your documents only, and cites the passages it used.
          </p>
        </div>
        <AskPanel />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="search-heading">
        <div className="flex flex-col gap-1">
          <h2 id="search-heading" className="text-xl font-semibold">
            Search
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Find the stored passages closest in meaning to a question.
          </p>
        </div>
        <SearchInspector />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="similarity-heading">
        <div className="flex flex-col gap-1">
          <h2 id="similarity-heading" className="text-xl font-semibold">
            Similarity playground
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            How close in meaning does the embedding model think two texts are?
          </p>
        </div>
        <SimilarityPlayground />
      </section>
    </main>
  );
}
