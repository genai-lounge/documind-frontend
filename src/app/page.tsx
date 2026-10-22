import { DocumentUpload } from "@/features/documents";
import { SimilarityPlayground } from "@/features/similarity";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">DocuMind</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload a document to see its text split into chunks and turned into embeddings.
        </p>
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="documents-heading">
        <h2 id="documents-heading" className="text-xl font-semibold">
          Documents
        </h2>
        <DocumentUpload />
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
