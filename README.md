# DocuMind Frontend

The Next.js frontend for DocuMind, an educational RAG (Retrieval-Augmented Generation) app: upload documents, ask questions, and get Claude-generated answers with source citations you can check. The FastAPI backend lives in a separate repository (`documind-backend`).

**Current status: Phase 1 (document upload and text extraction).** You can upload PDF, DOCX, and TXT files and inspect the extracted text and metadata. Nothing is stored yet, and there's no chunking, embedding, vector-store, or Claude functionality.

- [docs/architecture.md](docs/architecture.md): how the whole system is designed
- [docs/adr/](docs/adr/README.md): why it is designed that way (Architecture Decision Records)
- [docs/documind_product_requirements_and_phases.md](docs/documind_product_requirements_and_phases.md): the full product spec

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS.

## Structure

```text
src/
├── app/                     Next.js routes (pages); they compose features
├── features/
│   └── documents/           one folder per feature
│       ├── index.ts         public API: the only path other code may import from
│       ├── api.ts           backend calls (through lib/http)
│       ├── types.ts         API contract (mirrors the backend's app/api/v1/schemas.py)
│       └── components/      DocumentUpload, DocumentResult
└── lib/                     shared, feature-agnostic code
    ├── http.ts              requestJson() and ApiError (code, status, requestId)
    └── format.ts            display helpers
```

ESLint enforces the boundaries: other code imports a feature only through its `index.ts`, and `lib/` never imports features.

## Prerequisites

- Node.js 20+ and npm

## Run

```bash
npm install     # install dependencies
npm run dev     # start the dev server at http://localhost:3008
npm run check   # lint + type check; run before every commit
npm run lint    # ESLint (including the architecture boundary rules)
npm run typecheck  # TypeScript
npm run build   # production build
```

Node.js version: `.nvmrc` pins it; run `nvm use` in this folder.

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull request and on every push to `main`: `npm ci`, then `npm run lint`, `npm run typecheck`, and `npm run build`. `typecheck` runs `next typegen` first, so it works from a fresh clone, where `.next/` doesn't exist yet. See [ADR 0008](docs/adr/0008-continuous-integration.md).

To make a failing check **block merging**: on GitHub, open the repository's **Settings → Branches → Add branch protection rule** (or **Rules → Rulesets**) for `main`, enable **Require status checks to pass before merging**, and select **Lint, types, build**.

When a request fails, the error shows a **Reference** ID. The same ID appears in every backend log line for that request.

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
