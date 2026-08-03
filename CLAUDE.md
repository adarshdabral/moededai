# CLAUDE.md — ModEd.ai Permanent Project Memory

This file is the single source of truth for how ModEd.ai is built. It is loaded into every
future conversation. If a rule here conflicts with a convenient shortcut, the rule wins.
When in doubt, re-read this file before writing code.

Companion documents (read these before implementing anything in their domain):

- `docs/ARCHITECTURE.md` — system architecture, layers, request flow
- `docs/DATABASE.md` — MongoDB collection design
- `docs/ROADMAP.md` — phased delivery plan

---

## 1. Project Vision

ModEd.ai is an AI-powered learning platform that gives every student a personal AI tutor,
automatically generated assessments, and a transparent "Knowledge Score" that tracks mastery
over time — while giving teachers and admins the visibility and moderation tools they need to
run a classroom safely.

The product differentiator is **trustworthy anonymity**: students can raise doubts and be scored
without fear of judgment, because identity is decoupled from activity at the data layer, not
just hidden in the UI. Only admins can ever re-link an anonymous ID to a real identity, and doing
so must be audited.

This repository is being built in phases. Each phase produces a working, tested, documented
backend increment — never a partial or throwaway prototype. Assume the code you write today will
still be running in production two years from now, maintained by engineers who are not you.

**Non-negotiables:**
- Production quality from the first commit. There is no "MVP throwaway" tier of code.
- The backend is being built standalone. The frontend does not exist yet — do not let its
  absence justify cutting corners (e.g. do not skip validation because "no UI calls this yet").
- AI features (tutor, test generation, scoring) are provider-integrated via Google Gemini, but
  the AI provider must always sit behind an internal abstraction — never call the Gemini SDK
  directly from a controller or service that isn't the dedicated AI module.

---

## 2. Development Rules

- Always build production-ready code. No demo code, no placeholder implementations, no `TODO`
  stubs left in place of real logic.
- Never duplicate logic. If similar logic appears twice, extract it — but only once it appears
  a third time do you generalize into a shared abstraction (see Development Rules in the root
  guidance: avoid premature abstraction).
- Never create giant files. If a file exceeds ~300 lines or does more than one job, split it.
- Prefer composition over inheritance-heavy designs.
- Use dependency injection for services and repositories (constructor injection is sufficient —
  no DI framework/container needed at this scale).
- Separate business logic from routes. Routes only wire HTTP to controllers.
- Controllers stay thin: parse/validate input (via middleware), call one service method, shape
  the response. No business logic, no direct database access in a controller.
- Services contain all business logic. Services never touch `req`/`res` and never import
  Express types.
- Repositories are the only layer allowed to import Mongoose models or build Mongoose queries.
- Validation is centralized in per-module Zod schemas, applied via a shared validation
  middleware. Controllers never manually check `req.body` fields.
- Every API response uses the same JSON envelope (see §6 API Conventions).
- Every API is documented in Swagger as part of the same PR that introduces it — not after.
- Every module (controller, service, repository) must be unit-testable in isolation, using
  interfaces/dependency injection so dependencies can be mocked.
- Everything is strongly typed. `any` is not allowed (see Coding Standards).
- Every error path is handled explicitly; nothing fails silently.
- Design for extensibility within a module's own boundary — do not build cross-cutting
  "framework" abstractions speculatively for features that don't exist yet.

---

## 3. Architecture Rules

Full detail lives in `docs/ARCHITECTURE.md`. The binding rules are:

- **Service-Repository pattern**, enforced per module: `Route → Controller → Service → Repository
  → Mongoose Model → MongoDB`.
- Dependency direction is one-way: `routes → controllers → services → repositories → database`.
  A lower layer never imports from a higher layer. Services never import controllers.
  Repositories never import services.
- Modules are feature-oriented (`modules/course`, `modules/ai-tutor`, etc.), not layer-oriented.
  Each module owns its full vertical slice: routes, controller, service, repository, validation
  schemas, types, and Mongoose model.
- Cross-module calls go through a module's **service** interface only. A module must never
  reach into another module's repository or model directly. If module A needs data owned by
  module B, A's service calls B's service.
- Shared, reusable code (middleware, error classes, response helpers, base repository, constants)
  lives in `src/common/`, and only there. If it's used by more than one module, it belongs in
  `common/`, not copy-pasted.
- The AI provider (Gemini) is wrapped by a single client in `src/ai/`. Feature modules
  (`ai-tutor`, `ai-test`, `knowledge-score`) depend on that client's interface, never on the
  `@google/generative-ai` package directly. This keeps a future provider swap to one file.
- No feature module may register its own Express app, its own DB connection, or its own logger
  instance. Those are singletons created once in `config/` and imported everywhere.

---

## 4. Coding Standards

- **Language:** TypeScript in strict mode (`strict: true`). No `any`, no implicit `any`, no
  `@ts-ignore` without a comment explaining why and a linked follow-up.
- **Modules:** CommonJS via `ts-node`/`tsc` as configured in `tsconfig.json`. Use path aliases
  (`@modules/*`, `@common/*`, etc.) instead of long relative `../../../` chains.
- **Functions:** small and single-purpose. If a function needs a comment to explain what it does
  (not why), it should be split or renamed instead.
- **Comments:** only for non-obvious *why* — a subtle constraint, a workaround, an invariant that
  isn't visible from the code. Never comment what the code already says.
- **Async:** `async/await` only. No raw `.then()` chains. Every `async` function that can throw
  is either wrapped in the shared `asyncHandler` (controllers) or has an explicit `try/catch`
  that rethrows a typed `AppError` (services/repositories).
- **Immutability:** prefer `const`, avoid mutating function arguments, avoid shared mutable
  module-level state outside of singletons explicitly designed for it (DB connection, logger).
- **Exports:** one primary export per file, named (no default exports), so imports are
  grep-able and refactor-safe.
- **File length:** soft cap ~300 lines. If a service outgrows this, split by sub-responsibility
  (e.g. `aiTutor.service.ts` + `aiTutor.promptBuilder.ts`), not by arbitrary chunking.
- **No dead code:** if something is unused, delete it. Don't comment it out "just in case" —
  git history is the safety net.

---

## 5. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files | `kebab-case` with role suffix | `ai-tutor.service.ts`, `course.repository.ts` |
| Classes | `PascalCase` | `CourseService`, `AppError` |
| Interfaces/Types | `PascalCase`, no `I`-prefix hedging except contracts implemented by multiple concrete classes | `CourseRepository` (interface) vs `MongoCourseRepository` (impl) |
| Variables/functions | `camelCase` | `getStudentScore`, `activeUser` |
| Constants | `SCREAMING_SNAKE_CASE` for true constants | `MAX_UPLOAD_SIZE_MB` |
| Mongoose models | Singular `PascalCase` | `User`, `Course`, `TestAttempt` |
| MongoDB collections | Plural `snake_case` (Mongoose default pluralization overridden explicitly) | `users`, `test_attempts` |
| Routes (URL paths) | Plural `kebab-case` nouns | `/api/v1/courses`, `/api/v1/test-attempts` |
| Env vars | `SCREAMING_SNAKE_CASE` | `JWT_ACCESS_SECRET` |
| Test files | mirror source name + `.test.ts` | `course.service.test.ts` |
| Branches | `type/short-description` | `feature/knowledge-score-engine` |

Booleans read as predicates: `isActive`, `hasSubmitted`, `canResolveDoubt` — never `active`,
`submittedFlag`, `flag1`.

---

## 6. API Conventions

- Base path: `/api/v1`. Version bumps to `/api/v2` only on breaking changes; additive changes
  never bump the version.
- REST resource-oriented routes. Verbs live in HTTP methods, not URLs (`POST /doubts`, not
  `POST /doubts/create`).
- **Every** response — success or error — uses this envelope:

```jsonc
// Success
{
  "success": true,
  "data": { /* payload */ },
  "meta": { "pagination": { "page": 1, "limit": 20, "total": 134 } } // omitted if not applicable
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable, safe-to-display message",
    "details": [ { "field": "email", "issue": "Invalid email format" } ] // omitted if not applicable
  }
}
```

- HTTP status codes are meaningful and consistent: `200` OK, `201` Created, `204` No Content,
  `400` validation, `401` unauthenticated, `403` unauthorized, `404` not found, `409` conflict,
  `422` semantically invalid, `429` rate-limited, `500` unhandled.
- Pagination via `?page=&limit=` query params, capped `limit` (default 20, max 100). List
  endpoints always return `meta.pagination`.
- Filtering/sorting via explicit, whitelisted query params per endpoint — never pass raw query
  objects into Mongoose `find()`.
- Every endpoint requires an explicit auth policy: `public`, `authenticated`, or
  `role:<student|teacher|admin>`. There is no implicit default — routes without a declared
  policy fail code review.
- All request/response shapes are documented with Swagger/OpenAPI annotations co-located with
  the route definition, kept in sync as part of the same change.

---

## 7. MongoDB Conventions

- One Mongoose model per collection, defined inside the module that owns it
  (`modules/course/course.model.ts`).
- Collection name is set explicitly in the schema options — never rely on Mongoose's automatic
  pluralization guessing silently doing the right thing.
- Every schema declares `timestamps: true` (`createdAt`, `updatedAt`).
- Every schema uses explicit Mongoose validation (`required`, `enum`, `min`/`max`, custom
  validators) — Zod validates the HTTP boundary, Mongoose validates the persistence boundary.
  Both layers are required; neither substitutes for the other.
- Foreign references use `Schema.Types.ObjectId` with an explicit `ref`. Prefer storing a
  reference and populating over denormalizing, unless a documented read-performance reason
  says otherwise (documented in `docs/DATABASE.md`, not invented ad hoc).
- Every collection that is queried by a field other than `_id` must have an explicit index
  defined in the schema — no relying on incidental unindexed scans. Indexes are declared in
  `docs/DATABASE.md` and mirrored in the schema.
- Anonymous-identity collections (see `docs/DATABASE.md`) never store the real user reference
  next to anonymized activity data in the same document or collection. The mapping lives in a
  single, separately access-controlled collection.
- No business logic in Mongoose middleware (`pre`/`post` hooks) beyond data-integrity concerns
  (e.g. hashing a password before save). Anything resembling a business rule belongs in the
  service layer.
- Migrations/seed scripts (once introduced) live under `backend/src/database/` and are never run
  automatically on app boot in production.

---

## 8. Error Handling Rules

- All errors extend a single `AppError` base class (`src/common/errors/AppError.ts`) carrying
  `statusCode`, `code`, `message`, and optional `details`.
- Services and repositories throw `AppError` subclasses (`NotFoundError`, `ValidationError`,
  `UnauthorizedError`, `ConflictError`, etc.) — they never throw raw strings or generic `Error`.
- Controllers never `try/catch` — they're wrapped by a shared `asyncHandler` that forwards
  errors to Express's error pipeline via `next(err)`.
- A single centralized error-handling middleware (`src/common/middlewares/error.middleware.ts`)
  is the only place that turns an error into an HTTP response. It:
  - Logs the full error (with stack trace) via Winston.
  - Returns the standard error envelope, using a generic message for unhandled/5xx errors
    (never leaks stack traces or internal details to the client).
  - Maps known `AppError` subclasses to their declared status code; unknown errors default to
    `500`.
- Async code paths (including AI provider calls) must never produce an unhandled promise
  rejection — every awaited call that can fail is inside a function ultimately wrapped by
  `asyncHandler` or an explicit `try/catch` that rethrows as `AppError`.
- External calls (Gemini API, future third-party integrations) are wrapped with timeouts and
  translated into a domain-specific `AppError` (e.g. `AIProviderError`) — callers never see raw
  SDK exceptions.

---

## 9. Logging Rules

- **Morgan** logs HTTP access logs (method, path, status, response time) in development
  (`dev` format) and a structured format in production, piped into Winston.
- **Winston** is the single structured application logger, configured once in
  `src/config/logger.ts` and injected/imported everywhere — no ad hoc `console.log`.
- Log levels are used meaningfully: `error` (needs attention), `warn` (unexpected but handled),
  `info` (significant business events: user registered, test submitted, doubt resolved), `debug`
  (verbose, dev-only).
- Never log secrets, passwords, tokens, or full request bodies containing PII. Log identifiers
  (user ID, request ID), not payloads.
- Anonymous-identity-sensitive actions (identity unmasking by an admin) must always log an
  audit entry — see `docs/DATABASE.md` `audit_logs` collection — in addition to normal app logs.
- Every request gets a correlation/request ID (generated in middleware) included in all logs
  emitted while handling that request, to make tracing a single request possible across layers.
- Production logs are structured JSON (so they're machine-parseable); development logs are
  human-readable.

---

## 10. Security Rules

- Passwords hashed with `bcrypt` (cost factor ≥ 12). Plaintext passwords never logged, stored,
  or returned in any response.
- Authentication via JWT: short-lived access token + long-lived refresh token, both signed with
  separate secrets. Refresh tokens are stored hashed if persisted server-side.
- Authorization is role-based (`student`, `teacher`, `admin`) enforced by shared middleware —
  never re-implemented per route.
- All input is validated with Zod at the HTTP boundary before it reaches a service. No exceptions.
- `helmet` is applied globally for secure HTTP headers; CORS is explicitly whitelisted via
  `CORS_ORIGIN`, never `*` in production.
- Rate limiting (`express-rate-limit`) applies globally and with stricter limits on
  auth endpoints (login, register, password reset) to resist brute force.
- File uploads (Multer) are restricted by MIME type and size (`MAX_FILE_SIZE_MB`), written to a
  non-executable, non-web-served `uploads/` directory.
- The anonymous-identity system is a security boundary, not just a UI feature: application code
  paths that render doubts/activity to teachers must be structurally incapable of joining back
  to the real user (i.e. the query itself has no access to the identity collection), rather than
  merely omitting the name in the response.
- Only admin-role-authorized, audited actions may resolve an anonymous ID to a real identity.
  Every such resolution is written to `audit_logs`.
- Secrets live only in `.env` (git-ignored) and are read via `src/config/env.ts`. Never commit
  `.env`, only `.env.example` with placeholder values.
- Dependencies are kept current; no known-vulnerable package is knowingly introduced.

---

## 11. Documentation Rules

- Every route is documented with Swagger/OpenAPI JSDoc annotations at the point of definition —
  documentation and implementation are never separate PRs.
- Swagger UI is served at `/api-docs` in non-production environments.
- Every module gets a short `README.md` once it's built, describing its purpose, its public
  service interface, and any non-obvious business rules it enforces.
- `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, and `docs/ROADMAP.md` are living documents —
  update them in the same PR that changes the architecture, schema, or plan they describe.
  Stale docs are treated as bugs.
- This file (`CLAUDE.md`) is updated whenever a rule changes — not left to drift from practice.

---

## 12. Testing Rules

- **Jest + Supertest.** Unit tests for services/repositories (mocked dependencies), integration
  tests for full request→response flows against a test MongoDB instance, in `backend/tests/`.
- Every service method has unit tests covering: the happy path, each validation/business-rule
  failure, and at least one edge case.
- Every API endpoint has at least one integration test covering: success, validation failure,
  and unauthorized/forbidden access.
- Repositories are tested against a real (test/in-memory) MongoDB instance, not mocked — mocking
  the database hides schema and query bugs.
- AI provider calls are mocked in tests by default via the internal AI client interface (see
  §3); a small, explicitly-marked set of tests may hit the real Gemini API and are excluded from
  the default CI run.
- No PR merges with failing tests or reduced coverage on the files it touches.
- Tests must be deterministic — no reliance on wall-clock time, random values, or external
  network state without seeding/mocking.

---

## 13. Git Commit Convention

Conventional Commits, enforced by convention (not necessarily tooling, in this phase):

```
<type>(<scope>): <short summary>

[optional body — the why, not the what]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.
Scope is the module or area: `feat(course): add topic reordering endpoint`,
`fix(auth): reject expired refresh tokens`, `docs(database): add index for test_attempts`.

- One logical change per commit. Don't bundle unrelated modules in one commit.
- Commit messages explain *why* the change was made when it isn't obvious from the diff alone.
- No `--no-verify`, no force-pushing shared branches, no amending commits already pushed/shared.

---

## 14. Progress Tracking

- `docs/ROADMAP.md` is the authoritative phase tracker. Each phase has a checklist of
  deliverables; check items off in the same PR that completes them.
- At the start of any new working session, read `docs/ROADMAP.md` to determine the current
  phase and what's already done before proposing new work.
- Do not start Phase N+1 work while Phase N has open, unresolved items unless explicitly told to.
- If scope changes mid-phase (a feature is added, cut, or redefined), update `docs/ROADMAP.md`
  in the same change — don't let the roadmap silently drift out of sync with reality.

---

## 15. Development Phases

Full detail in `docs/ROADMAP.md`. Summary:

0. **Architecture & Foundation** (this phase) — folder structure, conventions, docs. No code.
1. **Core Infrastructure** — Express app skeleton, config, DB connection, logger, error
   middleware, health check, Swagger scaffold, Docker. No features yet.
2. **Auth & User Management** — registration, login, JWT issuance/refresh, role-based access,
   password reset, email verification.
3. **Course Management** — courses, topics, resources, assignments, learning paths (admin/teacher
   authored content, CRUD).
4. **AI Tutor** — Gemini-backed chatbot, conversation history, topic explanations.
5. **AI Test Generation & Knowledge Score** — AI-generated quizzes, scoring engine, weak-topic
   identification.
6. **Monthly Assessments & Growth Analytics** — adaptive scheduling, comparative reports,
   progress timelines.
7. **Anonymous Doubts & Identity Protection** — anonymous posting, teacher responses, admin-only
   identity mapping, audit logging.
8. **Teacher & Admin Portals (API layer)** — class dashboards, student analytics, user/course
   management, flagged-account resolution.
9. **Notifications** — in-app + email notifications for tests, scores, announcements.
10. **Hardening & Scale-readiness** — rate limiting tuning, load testing, monitoring hooks,
    backup strategy documentation.

Each phase ends with: passing tests, updated Swagger docs, updated `docs/ROADMAP.md` checklist,
and a working backend that can be run end-to-end via Docker.

---

## 16. Token-Saving Strategy (for AI-assisted development)

- Don't re-read files already open in context in the same session unless they may have changed.
- Prefer targeted reads (specific line ranges, `Grep` for symbols) over reading entire large
  files when only one function/section is relevant.
- Reference existing conventions from this file instead of re-deriving them each session
  ("per CLAUDE.md §6" is enough justification — don't re-explain the API envelope every time).
- When implementing a new module, copy the established pattern from the most recently completed
  module rather than reasoning architecture from scratch each time.
- Batch independent reads/searches in parallel rather than sequentially.
- Summarize completed work in commit messages and `docs/ROADMAP.md` checkboxes — future sessions
  should be able to resume from those instead of re-reading full diffs.

---

## 17. Context Recap Format

When resuming work in a new session, open with a short recap in this shape before doing
anything else:

```
Phase: <current phase from docs/ROADMAP.md>
Last completed: <last checked-off deliverable>
In progress: <what's partially done, if anything>
Next: <the next deliverable to tackle>
Blockers: <none | description>
```

Keep it to these five lines. Don't restate the entire roadmap or architecture — this file and
the docs are already available for full detail.

---

## 18. Rules You Must Follow in Future Conversations

- Always follow the Service-Repository pattern and layering rules in §3 for any new code.
- Always validate with Zod at the boundary and with Mongoose at the schema — never skip either.
- Always use the standard response envelope (§6) — never invent a one-off response shape.
- Always add/update Swagger docs and tests in the same change as the feature.
- Always update `docs/ROADMAP.md` when a deliverable is completed or scope changes.
- Always treat the anonymous-identity boundary (§10) as a hard security constraint, not a
  formatting detail.
- Always check `docs/ROADMAP.md` for current phase before proposing new work; don't jump ahead.
- When a requirement is ambiguous, ask rather than guessing — especially for anything touching
  auth, identity anonymization, or data retention.

## 19. Things You Must Never Do

- Never write placeholder, mock, or "fake it for now" implementations and call them done.
- Never put business logic in a controller, route file, or Mongoose middleware hook.
- Never call the Gemini SDK directly outside `src/ai/`.
- Never let one module import another module's repository or Mongoose model directly.
- Never store or log plaintext passwords, tokens, or secrets.
- Never store a direct, queryable link between an anonymous doubt/activity record and the real
  user identity outside the single, access-controlled identity-mapping collection.
- Never skip input validation because "the frontend doesn't exist yet" — this backend must be
  safe to call directly.
- Never bump the API version for a non-breaking change, and never break a shipped endpoint
  without a version bump.
- Never commit `.env`, credentials, or API keys.
- Never use `any`, `@ts-ignore` without justification, or disable strict mode.
- Never start building features, APIs, models, or auth during an architecture-only phase — when
  a task is explicitly scoped to design/planning, stop at the documents and wait for direction.
