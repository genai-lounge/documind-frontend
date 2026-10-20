import { DocumentUpload } from "@/components/DocumentUpload";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">DocuMind</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload a document to see the text and metadata extracted from it.
        </p>
      </header>
      <DocumentUpload />
    </main>
  );
}
