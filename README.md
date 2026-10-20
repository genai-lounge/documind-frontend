# DocuMind Frontend

The Next.js frontend for DocuMind, an educational RAG (Retrieval-Augmented Generation) app: upload documents, ask questions, and get Claude-generated answers with source citations you can check. The FastAPI backend lives in a separate repository (`documind-backend`).

**Current status: Phase 0 (project setup only).** There's no document, embedding, vector-store, or Claude functionality yet. See [docs/architecture.md](docs/architecture.md) for the plan and [docs/documind_product_requirements_and_phases.md](docs/documind_product_requirements_and_phases.md) for the full spec.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS.

## Prerequisites

- Node.js 20+ and npm

## Run

```bash
npm install     # install dependencies
npm run dev     # start the dev server at http://localhost:3008
npm run lint    # ESLint
npm run build   # production build (includes type checking)
```

The backend runs at http://localhost:8008.

## Configuration

`.env.example` lists the environment variables. Phase 0 doesn't need any. Copy it to `.env.local` when a later phase needs one. Never commit real `.env` files, and never put secrets (such as the Anthropic API key) in `NEXT_PUBLIC_*` variables: those are visible to anyone using the site.
