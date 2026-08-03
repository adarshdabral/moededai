# ModEd.ai

An AI-powered learning platform providing an AI Tutor, AI-generated tests, Knowledge Scoring,
monthly adaptive assessments, an anonymous doubt-raising system, and role-based dashboards for
students, teachers, and admins.

> **Status:** Backend complete (Phases 0–10 of `docs/ROADMAP.md`) — 104 tests passing. Frontend
> complete — Student, Teacher, and Admin portals wired to the real API, see `frontend/README.md`
> for its design system and a list of backend-contract limitations that shaped a few UI decisions.
> Load testing is written but not yet executed against a live deployment; see `docs/ROADMAP.md`
> Phase 10 for the one open item before the backend is fully production-hardened.

## Repository Structure

```
moded-ai/
├── backend/     # Node.js / TypeScript / Express API (Service-Repository architecture)
├── frontend/    # React / TypeScript / Vite SPA — see frontend/README.md
├── docs/        # Architecture, database design, and roadmap documentation
└── CLAUDE.md    # Binding project conventions and rules (read this first)
```

## Documentation

Read in this order before contributing:

1. [`CLAUDE.md`](./CLAUDE.md) — project vision, rules, and conventions (binding)
2. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — system design, layers, request flow
3. [`docs/DATABASE.md`](./docs/DATABASE.md) — MongoDB collection design
4. [`docs/ROADMAP.md`](./docs/ROADMAP.md) — phased delivery plan and current progress

## Tech Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js (>= 20) |
| Language | TypeScript (strict mode) |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (access + refresh) |
| Validation | Zod |
| API Docs | Swagger / OpenAPI |
| Logging | Morgan + Winston |
| Testing | Jest + Supertest |
| File Upload | Multer |
| AI Provider | Google Gemini API |
| Architecture | Service-Repository pattern |
| Containerization | Docker + Docker Compose |

## Prerequisites

- Node.js 20 or later
- Docker & Docker Compose (recommended, for a consistent local MongoDB + API environment)
- A Google Gemini API key (only required once AI-dependent phases begin)

## Getting Started (Backend)

```bash
cd backend
cp .env.example .env      # fill in real values, especially JWT secrets and GEMINI_API_KEY
npm install
```

### Run with Docker (recommended)

```bash
docker compose up
```

This starts the API and a local MongoDB instance together, with source-mounted for live reload.

### Run locally without Docker

Requires a MongoDB instance reachable at the `MONGO_URI` set in `.env`.

```bash
npm run dev
```

### Bootstrap the first admin account

Registration (`POST /auth/register`) always creates a `student` — there is no self-service way
to become a teacher or admin. Create the first admin from `ADMIN_SEED_EMAIL`/
`ADMIN_SEED_PASSWORD` in `.env`:

```bash
npm run seed
```

Every subsequent teacher/admin account is created by an authenticated admin via
`POST /admin/users`.

### Other useful scripts

```bash
npm run build              # compile TypeScript to dist/
npm start                  # run the compiled build
npm run seed                # idempotent: creates the first admin from ADMIN_SEED_EMAIL/PASSWORD
npm run backfill:identity   # idempotent: ensures every user has an anonymous_identity_map entry
npm run load-test           # autocannon against a running instance (see scripts/load-test.js)
npm run lint                # ESLint
npm run format              # Prettier
npm run typecheck            # tsc --noEmit
npm test                     # Jest + Supertest (104 tests: unit + integration + e2e)
npm run test:coverage         # Jest with coverage report
```

The API is reachable at `http://localhost:5000/api/v1`, with interactive Swagger docs at
`http://localhost:5000/api-docs` (non-production only). Liveness/readiness probes are at
`GET /api/v1/health/live` and `GET /api/v1/health`.

## Contributing

All contributions must follow the conventions in [`CLAUDE.md`](./CLAUDE.md) — architecture
layering, naming, API/error/response conventions, testing requirements, and commit message
format are all binding, not suggestions. Check [`docs/ROADMAP.md`](./docs/ROADMAP.md) for the
current phase before starting new work.

## License

Proprietary — all rights reserved.
