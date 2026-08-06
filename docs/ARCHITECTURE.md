# ModEd.ai — Architecture

This document describes the backend system architecture. It is binding — see `CLAUDE.md` §3 for
the enforceable rules derived from it. This document explains the *why* and the *shape*;
`CLAUDE.md` states the *rules*.

---

## 1. High-Level Architecture

ModEd.ai's backend is a modular monolith: a single Express/Node.js/TypeScript service, organized
into feature modules that each own a full vertical slice (route → controller → service →
repository → model), talking to a single MongoDB database, with AI capabilities (tutoring, test
generation, scoring) delegated to Groq through one internal abstraction layer.

```
                              ┌───────────────────────────┐
                              │        Client (future)    │
                              │  (frontend, mobile, etc.) │
                              └─────────────┬─────────────┘
                                            │ HTTPS / JSON
                                            ▼
                              ┌───────────────────────────┐
                              │        Express App        │
                              │  helmet · cors · morgan   │
                              │  rate-limit · body-parser │
                              └─────────────┬─────────────┘
                                            ▼
                              ┌───────────────────────────┐
                              │      Route Layer          │
                              │  (per-module routers)     │
                              └─────────────┬─────────────┘
                                            ▼
                              ┌───────────────────────────┐
                              │   Validation Middleware    │
                              │        (Zod schemas)       │
                              └─────────────┬─────────────┘
                                            ▼
                              ┌───────────────────────────┐
                              │      Auth Middleware       │
                              │   (JWT verify + RBAC)      │
                              └─────────────┬─────────────┘
                                            ▼
                              ┌───────────────────────────┐
                              │        Controller          │
                              │   (thin, HTTP-shaped)      │
                              └─────────────┬─────────────┘
                                            ▼
                              ┌───────────────────────────┐
                              │          Service            │
                              │   (business logic, rules)   │
                              └──────┬──────────────┬──────┘
                                     ▼              ▼
                       ┌───────────────────┐  ┌──────────────────┐
                       │    Repository      │  │   AI Client       │
                       │ (Mongoose queries) │  │  (Groq wrapper)   │
                       └─────────┬─────────┘  └────────┬─────────┘
                                 ▼                      ▼
                       ┌───────────────────┐  ┌──────────────────┐
                       │      MongoDB        │  │       Groq        │
                       └───────────────────┘  └──────────────────┘
```

Cross-cutting concerns (logging, error handling, request IDs) wrap every request via middleware
and a centralized error handler, not per-route boilerplate.

---

## 2. Layers

| Layer | Responsibility | May depend on | Must never do |
|---|---|---|---|
| **Route** | Bind HTTP verb+path to controller, attach validation & auth middleware | Controller, middleware | Business logic, DB access |
| **Middleware** | Cross-cutting: validation, auth, error handling, logging, rate limiting | common/ utilities | Module-specific business logic |
| **Controller** | Translate HTTP request → service call → HTTP response | Service (same module only) | DB access, other modules' internals |
| **Service** | Business logic, orchestration, rule enforcement | Repository (same module), other modules' **services**, AI client | Express `req`/`res`, Mongoose models directly |
| **Repository** | Data access — the only layer building Mongoose queries | Mongoose model (same module) | Business logic, other modules' models |
| **Model** | Mongoose schema/model definition + persistence-level validation | Mongoose | Business rules beyond data integrity |
| **AI Client** (`src/ai/`) | Wraps Groq SDK; prompt templating; response parsing | `groq-sdk` | Being imported by anything outside feature services |

This is a strict layered architecture: each layer only talks to the layer directly below it (or
across to another module's service, never lower). This makes every layer independently testable
and swappable — e.g., the AI client can be mocked in tests, or Groq swapped for another
provider, without touching services.

---

## 3. Request Flow (Example: Student Submits a Test Attempt)

1. `POST /api/v1/test-attempts` hits the Express app; `helmet`, `cors`, rate limiter, and Morgan
   logging apply globally first.
2. The module router (`modules/ai-test/ai-test.routes.ts`) matches the route and attaches:
   - `validate(submitTestAttemptSchema)` — Zod validates the request body shape.
   - `authenticate` — verifies the JWT, attaches `req.user`.
   - `authorize('student')` — rejects non-students.
3. `AiTestController.submitAttempt` receives the now-trusted request, extracts `userId` and
   validated body, and calls `AiTestService.submitAttempt(userId, payload)`. No logic here beyond
   shaping the call and the response.
4. `AiTestService.submitAttempt`:
   - Loads the test definition via `AiTestRepository`.
   - Applies scoring business rules (may call `KnowledgeScoreService` — another module's service
     — to update the student's aggregate score).
   - Persists the attempt via `AiTestRepository.createAttempt`.
   - Returns a plain domain result object (not an HTTP response).
5. Any failure at any layer throws a typed `AppError` subclass. It propagates up through the
   `asyncHandler`-wrapped controller to the centralized error middleware, which logs it and
   writes the standard error envelope.
6. On success, the controller wraps the service's result in the standard success envelope and
   sends `201 Created`.
7. Winston logs the outcome (info-level) with the request's correlation ID; Morgan already logged
   the access-log line when the response was sent.

Every endpoint in the system follows this same shape. There are no exceptions or "special case"
routes that skip layers.

---

## 4. Folder Responsibilities

```
backend/
├── src/
│   ├── app.ts                 # Express app assembly: middleware, routers, error handler
│   ├── server.ts              # Process entrypoint: loads env, connects DB, starts HTTP server
│   ├── config/                # Singletons: env parsing, DB connection factory, logger, swagger
│   ├── routes/                # Top-level router that mounts each module's router under /api/v1
│   ├── modules/                # One folder per feature, each a full vertical slice
│   │   └── <feature>/
│   │       ├── <feature>.routes.ts
│   │       ├── <feature>.controller.ts
│   │       ├── <feature>.service.ts
│   │       ├── <feature>.repository.ts
│   │       ├── <feature>.model.ts        # Mongoose schema (if the module owns a collection)
│   │       ├── <feature>.validation.ts   # Zod schemas
│   │       └── <feature>.types.ts        # DTOs / domain types
│   ├── common/
│   │   ├── middlewares/       # auth, validate, error handler, rate limiter, request logger
│   │   ├── errors/             # AppError + subclasses, error code enum
│   │   ├── utils/              # response envelope builder, asyncHandler, pagination helpers
│   │   ├── types/              # shared ambient types (e.g. Express Request augmentation)
│   │   ├── constants/          # roles, shared message strings
│   │   └── interfaces/         # shared contracts (e.g. base repository interface)
│   ├── database/              # Mongo connection bootstrap, base repository class
│   ├── ai/                     # Groq client wrapper, prompt templates, AI-domain types
│   └── jobs/                   # Scheduled/background tasks (e.g. monthly assessment trigger)
├── tests/
│   ├── unit/                   # Service/repository logic, dependencies mocked
│   ├── integration/            # Route → DB round-trips against a test Mongo instance
│   └── e2e/                    # Full user-journey flows across multiple endpoints
├── uploads/                    # Multer destination (git-ignored contents)
└── logs/                       # Winston file transport output (git-ignored contents)
```

A module never has partial layers — if it has a controller, it has a service and repository,
even if the repository is thin, so the pattern stays predictable across the codebase.

---

## 5. Dependency Rules

1. **Downward only.** `route → controller → service → repository → model`. No layer imports
   from a layer above it.
2. **Sideways only through services.** Module A's service may call Module B's service. Module A
   must never import Module B's repository, model, controller, or routes.
3. **`common/` is the only shared dependency.** If two modules need the same helper, it moves to
   `common/` — it is never duplicated or imported cross-module.
4. **Singletons are created once.** The DB connection, logger, and Express app instance are
   created in `config/`/`app.ts`/`server.ts` and imported, never re-instantiated inside a module.
5. **The AI client is a leaf dependency.** `src/ai/` depends on nothing in `modules/`. Modules
   depend on it, never the reverse.
6. **No circular dependencies.** Because dependencies only flow downward and sideways-via-service,
   cycles should be structurally impossible; a cycle appearing is a sign a boundary was violated.

---

## 6. Service Communication

- **In-process only, in this phase.** All modules run in the same Node process; module-to-module
  "communication" is a direct TypeScript function call between services (`await
  otherModule.someService.method(...)`), not HTTP or a message queue. There is no network hop
  and no queue in this architecture (per the tech stack decision: no Redis, no queues).
- Services expose a small, explicit public interface (exported class methods). Everything else
  in the module (repository, model) is a private implementation detail from another module's
  point of view.
- If a cross-module call needs to be transactional (e.g., recording a test attempt AND updating
  a knowledge score must both succeed or both fail), the orchestrating service uses a Mongoose
  session/transaction spanning both repositories' calls, coordinated at the service layer that
  initiated the action.
- This in-process design is intentionally simple for the current scale. See §10 for how it
  evolves if/when the system needs to split into separate services.

---

## 7. AI Architecture

```
modules/ai-tutor/      modules/ai-test/      modules/knowledge-score/
        │                     │                        │
        └─────────────────────┼────────────────────────┘
                              ▼
                    src/ai/groq.client.ts     ← single Groq SDK integration point
                              │
                    src/ai/prompts/*.ts       ← prompt templates per use case
                              │
                           groq-sdk
                              │
                          Groq API
```

- **One client, many prompt templates.** `src/ai/groq.client.ts` exposes a small interface
  (e.g. `generateText`, `generateStructuredJSON`) that every AI-dependent module calls. Prompt
  construction for a specific feature (tutor conversation, quiz generation, scoring rationale)
  lives in `src/ai/prompts/`, keeping prompt engineering out of business-logic services.
- **Structured outputs.** Where a feature needs structured data back (e.g. a generated quiz as
  JSON), the client requests and validates structured output, and the calling service validates
  the parsed result against a Zod schema before persisting it — AI output is treated as
  untrusted input, exactly like a request body.
- **Timeouts & fallbacks.** Every Groq call has an explicit timeout. Failures are translated
  into a domain `AIProviderError` (see `CLAUDE.md` §8) — callers get a typed error, never a raw
  SDK exception or an unhandled rejection.
- **No client-side API key exposure.** All Groq calls are server-side only; the API key lives
  only in backend environment configuration.
- **Cost/rate awareness.** Since there is no cache/queue layer in this stack, AI-heavy modules
  (test generation) must apply their own request-level guards (e.g. one generation per topic per
  request, not batch-fan-out) to avoid runaway API usage — enforced in the service layer.
- **Conversation history** (AI Tutor) and **generated content** (AI Test) are persisted in
  MongoDB like any other domain data — the AI client itself is stateless between calls.

---

## 7a. Other Provider Abstractions (Email, Storage)

The same "one interface, one factory, swappable implementation" pattern used for the AI client
(§7) is applied to every other external capability, so no feature module ever imports a concrete
SDK/provider directly:

- **`src/common/email/`** — `EmailClient` interface (`send(message)`), with a `ConsoleEmailClient`
  implementation (writes the message to Winston) selected by default. Used by the `auth` module
  for verification/password-reset emails, and will be used by the `notification` module (Phase 9)
  for test reminders and announcements. A real provider (SES, SendGrid, etc.) is added by
  implementing `EmailClient` and branching on `EMAIL_PROVIDER` in `email/index.ts` — no call site
  changes.
- **`src/common/storage/`** — `StorageClient` interface (`save(file)`, `delete(key)`), with a
  `LocalStorageClient` implementation (writes to `UPLOAD_DIR`, served via `express.static` in
  `app.ts`) selected by default. Used for profile-image uploads (`user` module) and will be used
  for course resource/assignment attachments (Phase 3). A cloud provider (S3, GCS, Azure Blob) is
  added the same way — implement `StorageClient`, branch in `storage/index.ts`.
- Both are dev-appropriate, fully working implementations (not stubs) so the platform runs
  end-to-end with zero external accounts configured; production deployments swap the
  implementation, not the calling code.

---

## 8. Security Architecture

- **Perimeter:** `helmet` (secure headers), whitelisted `CORS_ORIGIN`, global + auth-specific
  rate limiting, HTTPS termination assumed at the infra/reverse-proxy layer in deployment.
- **AuthN:** JWT access + refresh token pair. Access tokens are short-lived and carry `userId`
  and `role`. Refresh tokens are long-lived, used only to mint new access tokens.
- **AuthZ:** Role-based (`student`, `teacher`, `admin`), enforced by a shared `authorize(...role)`
  middleware applied per route — never re-implemented ad hoc inside a controller.
- **Anonymity boundary (Anonymous Doubts / Anonymous ID Tracking):** This is the platform's
  hardest security requirement, and it's structural, not cosmetic:
  - Every user has a stable **Anonymous ID** generated at account creation, stored in the `users`
    collection.
  - Doubt/activity records reference only the Anonymous ID, never the real user's `_id`/name.
  - The reverse mapping (Anonymous ID → real identity) is never joinable from the doubt/activity
    query path — teacher-facing queries physically cannot resolve identity because they never
    touch the identity collection.
  - Only a dedicated `admin`-only service method resolves Anonymous ID → identity, and every call
    to it writes an `audit_logs` entry (who, when, which anonymous ID, why).
  - See `docs/DATABASE.md` §"Anonymous ID Mapping" and §"Audit Logs" for the collection design.
- **Data-at-rest:** passwords hashed (bcrypt); no plaintext secrets in the database; MongoDB
  itself is assumed encrypted-at-rest at the infra layer in production (Atlas/managed provider).
- **Data-in-transit:** HTTPS everywhere in deployed environments.
- **Least privilege:** service accounts / DB credentials used by the backend have only the
  privileges the backend needs — no shared superuser credentials.

## 8a. Authentication Flow

```
1. POST /api/v1/auth/register
   → validate input → hash password → generate Anonymous ID
   → create user (role is always `student` - never taken from client input)
   → issue access + refresh token pair → 201 Created

   Teacher/admin accounts are never created through this endpoint. The very
   first admin is created by the idempotent `npm run seed` bootstrap script
   (src/database/seed.ts, from ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD); every
   subsequent teacher/admin account is created by an authenticated admin via
   the Admin Portal API (Phase 8).

2. POST /api/v1/auth/login
   → validate credentials → verify password hash → issue access + refresh token pair
   → 200 OK

3. Authenticated request
   → Authorization: Bearer <access token>
   → auth middleware verifies signature + expiry → attaches req.user = { id, role }
   → authorize(role) middleware checks req.user.role against route's allowed roles

4. POST /api/v1/auth/refresh
   → validate refresh token → issue new access token (rotate refresh token)
   → 200 OK

5. POST /api/v1/auth/logout
   → invalidate/blacklist the refresh token (server-side record or short-lived denylist)
   → 204 No Content
```

Password reset and email verification follow the same shape: a signed, time-limited token
delivered out-of-band (email), redeemed once against a dedicated endpoint.

---

## 9. Future Scalability

The current architecture is a modular monolith by design — the right choice for this stage of
the product. It's structured so each of the following is a *targeted* change, not a rewrite:

- **Horizontal scaling:** the API is stateless (JWT-based auth, no server-side session), so it
  can already run as multiple replicas behind a load balancer without any code change.
- **Extracting a service:** because modules only ever communicate through their service's public
  interface (§6), any module (e.g. `ai-tutor`, given its distinct AI-cost/scaling profile) can be
  extracted into its own deployable service later by turning its in-process service calls into
  HTTP/RPC calls — the call sites don't need to change shape, only their transport.
- **Caching:** none exists today by design (per the current tech-stack decision). If read-heavy
  endpoints (e.g. leaderboards, analytics) become a bottleneck, a cache can be introduced at the
  repository layer without touching services or controllers.
- **Queues:** none exist today. AI test generation and notifications are synchronous. If these
  need to become async (e.g. bulk monthly assessment generation for a whole class), a queue can
  be introduced behind the existing service interface — the controller/service call shape doesn't
  need to change, only what happens inside the service.
- **Database scaling:** MongoDB's native sharding/replica-set support can be adopted without an
  application rewrite, since all access already goes through repositories with explicit,
  indexed queries (see `docs/DATABASE.md`).
- **Multi-region/i18n, mobile apps, parent dashboards** (see feature doc's "Future Enhancements"):
  all consume the same versioned REST API — none of them require backend architecture changes,
  only new modules or new roles layered onto the existing RBAC system.

**Reviewed against measured bottlenecks (Phase 10):** no production traffic or load-test data
exists yet for this backend (see `docs/ROADMAP.md` Phase 10 scope notes — load testing was
written as tooling but not executed against a live deployment in the environment this backend was
built in). Every point above is therefore still a *design-time* judgment, not one validated
against a measured bottleneck. Nothing here has been implemented speculatively beyond that
judgment (no cache, no queue, no sharding config exists in code) — re-visit this section itself,
not just the system, once real traffic data exists.

---

## 10. Backup & Disaster Recovery

No backup automation exists in this repository (there is nothing to configure — MongoDB backup
is an infrastructure-layer concern, not application code). This section documents the intended
strategy so it's a deliberate decision when a deployment target is chosen, not an afterthought.

- **Mechanism:** prefer a managed provider's built-in backup (e.g. MongoDB Atlas continuous
  backup with point-in-time recovery) over self-managed `mongodump` cron jobs — it removes an
  entire class of "the backup script silently stopped running" failure. If self-hosting MongoDB
  is unavoidable, use `mongodump --oplog` against a replica set secondary (never the primary) so
  backups don't compete with production traffic.
- **Frequency:** continuous oplog-based point-in-time recovery where available (Atlas); otherwise
  a full `mongodump` daily plus oplog capture between fulls.
- **Retention:** 30 rolling days of point-in-time recovery / daily snapshots, plus one retained
  monthly snapshot for 12 months — adjust to whatever data-retention policy the product's legal
  requirements settle on (not yet defined for ModEd.ai).
- **What's backed up vs. what isn't:** MongoDB data is backed up; uploaded files under
  `UPLOAD_DIR` (local `StorageClient`) are **not** covered by a database backup and are lost if
  the disk is — this is exactly the gap a cloud `StorageClient` implementation (S3, GCS) closes,
  since those providers have their own durability/versioning. Treat local disk storage as
  dev/single-instance-only for this reason, not just for scaling.
- **Secrets** (`.env` values — JWT secrets, `GROQ_API_KEY`, `MONGO_URI`) are never in the
  database and so are out of scope for a DB backup; they belong in whatever secret manager the
  deployment platform provides, with its own backup/rotation policy.
- **Restore drill cadence:** quarterly — restoring a backup to a scratch environment and running
  the test suite / a smoke check against it is the only way to know a backup is actually
  restorable, not just that the job "succeeded." No drill has been performed yet (no deployed
  environment exists to drill against).
