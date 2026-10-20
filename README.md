# DocuMind Frontend

The Next.js frontend for DocuMind, an educational RAG (Retrieval-Augmented Generation) app: upload documents, ask questions, and get Claude-generated answers with source citations you can check. The FastAPI backend lives in a separate repository (`documind-backend`).

**Current status: Phase 1 (document upload and text extraction).** You can upload PDF, DOCX, and TXT files and inspect the extracted text and metadata. Nothing is stored yet, and there's no chunking, embedding, vector-store, or Claude functionality. See [docs/architecture.md](docs/architecture.md) for the plan and [docs/documind_product_requirements_and_phases.md](docs/documind_product_requirements_and_phases.md) for the full spec.

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

`.env.example` lists the environment variables. Every variable has a default, so no `.env.local` file is required yet.

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8008` | Backend address used by the browser |

To override it, copy `.env.example` to `.env.local` (Next.js loads it automatically) and restart `npm run dev`. Never commit real `.env` files, and never put secrets (such as the Anthropic API key) in `NEXT_PUBLIC_*` variables: those are visible to anyone using the site.

## Known limitations (Phase 1)

- The document list lives in the browser and clears on page refresh; nothing is stored on the server.
- The app only works when opened at `http://localhost:3008`. Opening it at the network address (`http://192.168.x.x:3008`) is blocked by CORS unless the backend adds that origin to `CORS_ALLOWED_ORIGINS`.
