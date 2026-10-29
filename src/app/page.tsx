import { ChatPanel } from "@/features/chat";
import { DocumentLibrary } from "@/features/documents";
import { SearchInspector } from "@/features/retrieval";
import { SimilarityPlayground } from "@/features/similarity";

import { WorkspaceTabs } from "./_components/WorkspaceTabs";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 lg:h-dvh lg:flex-none lg:overflow-hidden">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">DocuMind</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload documents, then ask questions and get answers with citations you can check.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 lg:min-h-0" aria-labelledby="documents-heading">
          <h2 id="documents-heading" className="text-xl font-semibold">
            Documents
          </h2>
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
            <DocumentLibrary />
          </div>
        </aside>

        <WorkspaceTabs
          tabs={[
            { label: "Chat", content: <ChatPanel /> },
            {
              label: "Developer tools",
              content: (
                <div className="flex flex-col gap-12">
                  <section className="flex flex-col gap-4" aria-labelledby="search-heading">
                    <div className="flex flex-col gap-1">
                      <h2 id="search-heading" className="text-xl font-semibold">
                        Search inspector
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
                </div>
              ),
            },
          ]}
        />
      </div>
    </main>
  );
}
