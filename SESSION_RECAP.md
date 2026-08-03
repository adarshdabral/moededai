# SESSION_RECAP.md

Running log of session-level progress. Append a new dated entry per session — never rewrite
history, only add to it. See `docs/ROADMAP.md` for the authoritative phase checklist this recap
tracks against.

---

## 2026-08-03 (cont'd) — Frontend: Student/Teacher/Admin Portals

Built via `/frontend-design`, on top of the now-complete backend, in the same session. Backend
was explicitly not modified.

### Completed Work

- **Design system**: warm-paper/chalkboard-green/chalk-gold palette (validated CVD-safe via the
  dataviz skill's `validate_palette.js` — the initial green failed the chroma-floor and
  green/coral CVD-separation checks and was re-picked until it passed both light and dark mode),
  Fraunces/Manrope/IBM Plex Mono type system, Tailwind v4 CSS-first `@theme` tokens, light/dark/
  system theme with pre-paint application (no flash).
- **Signature component**: `KnowledgeScoreGauge` — a custom SVG grade-dial with chalk-tick marks,
  used on the student dashboard, teacher student-detail view, and attempt results.
- **Foundation**: full API client layer (`src/api/*`, one file per backend module, DTOs mirrored
  1:1 from the backend's own `*.types.ts`), Axios JWT-refresh interceptor with a mutex so
  concurrent 401s share one refresh call, TanStack Query hooks per domain, Zustand auth/theme
  stores, ~20 reusable UI primitives (Button/Dialog/Drawer/Toaster/Table/Tabs/Dropdown/
  CommandPalette/FileDropzone/...), role-aware `AppShell` with a notebook-tab sidebar.
- **All three portals fully wired to the real backend** — Student (dashboard, ChatGPT-comparable
  AI Tutor with markdown+code blocks, courses, quiz-taking with results, Knowledge Score,
  analytics, monthly assessments, anonymous doubts, notifications, profile/settings), Teacher
  (dashboard, students, course management with topics/resources/assignments/learning-paths/
  roster/assessments tabs, doubt inbox+thread, class performance reports), Admin (dashboard,
  user management incl. the admin-provisioned teacher/admin creation flow, course oversight,
  abuse reports, platform analytics, audited identity-mapping resolution, audit logs, platform
  settings, announcement broadcast).
- **Verified against a real running instance**, not just typecheck: started a standalone
  in-memory MongoDB + the actual backend dev server + `npm run seed`, then curl-tested the exact
  request/response shapes the frontend calls (register, login, list users, create course,
  create topic, post doubt, list notifications, knowledge scores, AI tutor conversation+message)
  against the live API and confirmed they match the frontend's TypeScript types byte-for-byte.
  Chrome extension wasn't connected in this sandbox, so no visual/click-through browser
  verification was possible — flagged as a gap below, not silently skipped.
- Full production build (`npm run build`) succeeds; `tsc -b --noEmit` and `oxlint` both clean.

### Real Bugs Found and Fixed During Verification

- **Course creation was broken for every teacher-authored course**: the backend's Zod schema
  requires `teacherIds` to have ≥1 element even though the service always overrides it to
  `[requester.id]` for a teacher caller — sending `[]` from the frontend (a reasonable first
  guess, since the value is ignored anyway) failed validation before ever reaching that override.
  Caught by curl-testing the real endpoint, not by typecheck. Fixed by sending `[me.id]`.
- **`react-syntax-highlighter`'s default `Prism` export** pulled every language grammar into the
  main AI Tutor chunk (801KB). Switched to its `prism-async` build (loads grammars on demand),
  cutting that chunk to 193KB; added a small ambient `.d.ts` since `@types/react-syntax-highlighter`
  doesn't cover the deep import path.
- **`react-router-dom` v7** pulled in a chain of SSR/RSC-only CVEs via `npm audit` — none
  reachable from this pure client-rendered SPA, but rather than accept the vulnerable range,
  pinned to v6 (predates that entire feature surface, only 2 moderate non-applicable advisories
  remain).

### Known Issues / Open Items

- **No browser-based visual/interaction verification** — the Claude-in-Chrome extension was not
  connected in this sandbox. Everything was verified via typecheck, lint, production build, and
  direct API contract testing (curl against the live backend), but no one has actually clicked
  through the rendered UI in this session. Recommend a manual pass before considering this
  launch-ready.
- Several backend-contract gaps shaped specific frontend UX decisions rather than being hidden —
  see `frontend/README.md` "Known limitations" for the full list (no teacher-visible student
  names, no student self-enrollment, no list-my-assessments endpoint, no topic-title enrichment,
  no server-side timed-test enforcement). None of these are frontend bugs; all are documented
  backend-surface constraints worked around honestly rather than faked.
- A dev-only standalone MongoDB + backend + frontend were left running in the background
  (`backend/scripts/dev-mongo.js`, `npm run dev` in both folders) for manual follow-up testing —
  not something to deploy from, just a convenience for continuing this session.

### Next Steps

Manual click-through in a real browser (once Chrome extension connects) across all three
portals, especially the AI Tutor and quiz-taking flows. A real `GEMINI_API_KEY` is needed to see
actual AI responses — verified the *error path* (502 `AI_PROVIDER_ERROR` surfaces as a clean
toast) but never a real completion, since no key was configured in this sandbox.

---

## 2026-08-03 — Phases 3–10: Complete Backend (Course Mgmt through Hardening)

Continued straight through from the prior session's Phases 1–2, per explicit direction to build
all remaining phases without stopping for per-phase approval.

### Completed Work

- **Phase 3 (Course Management):** courses/topics/resources/assignments/learning_paths/
  course_enrollments, full CRUD with role/ownership checks, file uploads via the `StorageClient`
  abstraction. 11 tests.
- **Phase 4 (AI Tutor):** `src/ai/gemini.client.ts` (the one Gemini integration point, 20s
  timeout, errors translated to `AIProviderError`), multi-turn conversations with a 50-message
  cap/auto-split, topic-context injection. 5 tests.
- **Phase 5 (AI Test Generation & Knowledge Score):** AI-generated quizzes validated against a
  Zod schema before persistence (never trusted raw), deterministic MCQ + AI-assisted subjective
  grading, and a **configurable, dependency-injected `ScoringEngine`** so the aggregation
  algorithm is swappable without touching `KnowledgeScoreService` or any caller. 7 tests.
- **Phase 6 (Monthly Assessments & Analytics):** scheduling job (open/close windows, no queue —
  a 5-minute `setInterval`), personalized per-student AI test generation at schedule time,
  growth timeline + teacher comparative reports reusing the same aggregation helper. 10 tests.
- **Phase 7 (Anonymous Doubts & Identity Protection):** the anonymity boundary is structural —
  `anonymous_doubts`/`doubt_replies` never store a real `userId`; `anonymous_identity_map` is the
  only collection permitted to pair one, resolvable only through one audited admin-only service
  method. A dedicated security test asserts the full JSON of the teacher inbox never contains the
  author's real name/email/userId. 13 tests.
- **Phase 8 (Teacher & Admin Portals):** `GET /teacher/classes`, `GET /teacher/students/:id/
  analytics` (gated on an actual shared active enrollment); admin user management including
  `POST /admin/users` — the admin-provisioned teacher/admin creation flow documented in
  `docs/ARCHITECTURE.md` since Phase 2 but only implemented now; account deactivation/reactivation
  (session revocation + audit log); platform settings. 11 tests.
- **Phase 9 (Notifications):** `score_update` and `test_reminder` hooks added from the owning
  services; admin broadcast announcements; email delivery reuses the Phase 2 `EmailClient`
  abstraction unchanged. **`doubt_reply` notifications deliberately not wired** — see the
  security rationale below. 5 tests.
- **Phase 10 (Hardening):** split liveness (`/health/live`) from readiness (`/health`) probes;
  Docker healthchecks for both services; `docs/ARCHITECTURE.md` §10 Backup & Disaster Recovery
  strategy documented; dependency audit clean (0 vulnerabilities, incl. patching a transitive
  `uuid` advisory via `overrides`); a full end-to-end test (`tests/e2e/fullJourney.test.ts`)
  chains every module together in one realistic user journey — passed first try. 1 e2e test.
- **104 tests passing total** (unit + integration + e2e); `tsc`, `eslint`, `npm run build` clean
  at every phase boundary, not just at the end.

### Important Decisions Made Mid-Build

- **Anonymity vs. notifications conflict, resolved in favor of anonymity:** notifying a doubt's
  anonymous author of a teacher's reply would require resolving their `anonymousId` outside the
  single audited admin-only path. Rather than compromise the boundary Phase 7 built, this
  notification trigger was skipped — documented as a deliberate exception, not an oversight.
  Author still sees replies via `GET /doubts/me` / the thread itself.
  See [[anonymity-boundary]] if that memory exists, or `docs/ROADMAP.md` Phase 9.
- **Identity-map creation is not transactional** with user creation (would require a
  replica-set-backed MongoDB for no real benefit at this scale) — a second write immediately
  after, plus an idempotent `npm run backfill:identity` safety net.
- **`monthly_assessments` gained a required `topicId`** not in the original `docs/DATABASE.md`
  design, because `ai_generated_tests` requires exactly one topic per test — "adaptive monthly
  assessment" is scoped to one topic per scheduling call in this implementation.
- **`platform_settings` is a new singleton collection**, not in the original 23-collection design
  — added because "Platform Settings" had no natural home elsewhere.
- Every schema/scope deviation from the original `docs/DATABASE.md`/`docs/ROADMAP.md` design is
  documented at the point it was made, in the same change — never left implicit.

### Known Issues / Open Items

- **Load testing was not executed** — `scripts/load-test.js` (`npm run load-test`) is written and
  documented but requires a running deployed instance, which this sandbox never had (same root
  cause as `docker-compose up` never being run — no Docker available here). Rate limits remain
  design-time defaults, not load-test-tuned. This is the one concrete item before Phase 10 is
  fully closed.
- No backup restore drill has actually been performed (no deployed environment to drill against)
  — the strategy is documented in `docs/ARCHITECTURE.md` §10 but unverified in practice.
- Several dependencies have available major-version bumps (Express 5, Mongoose 9, Zod 4, ESLint
  10, TypeScript 7, etc.) — deliberately deferred; `npm audit` is clean so none are
  security-motivated, and bumping them now risks destabilizing ~100 passing tests for no
  functional gain.
- No git repository has been initialized in `moded-ai/` yet — nothing has been committed across
  either session.
- `GEMINI_API_KEY` remains a placeholder — every AI-dependent test mocks `aiClient` directly; the
  real Gemini API has never actually been called end-to-end.

### Next Steps

Backend is feature-complete per the original 10-phase roadmap and ready for frontend integration.
Recommended before production: (1) run `npm run load-test` against a real deployment and tune
`RATE_LIMIT_*`; (2) perform one backup restore drill; (3) initialize git and set up CI running
`typecheck`/`lint`/`test`/`build` on every PR (no CI config exists yet — flagged as a gap since
Phase 0).

---

## 2026-08-02 — Phases 1–2: Core Infrastructure, Auth & User Management

### Completed Work

- **Phase 1 (Core Infrastructure):** env/DB/logger/Swagger config singletons, `AppError`
  hierarchy, error/request-logging/rate-limit/validate/auth middlewares, response envelope,
  `asyncHandler`, generic `BaseRepository`, JWT sign/verify utils, `app.ts`/`server.ts`,
  `GET /api/v1/health`.
- **Phase 2 (Auth & User Management):** `users`, `student_profiles`, `teacher_profiles`,
  `refresh_tokens`, `verification_tokens` models; full auth surface (register/login/refresh/
  logout/verify-email/request-password-reset/reset-password); `GET/PATCH /users/me`,
  `POST /users/me/avatar`; `EmailClient` and `StorageClient` provider abstractions (console/local
  dev implementations); idempotent admin bootstrap (`npm run seed`).
- Installed all dependencies (patched `bcrypt`→6.x and `multer`→2.x during install to clear
  critical/high `npm audit` findings — 0 vulnerabilities now); added `tsc-alias`/`tsconfig-paths`
  so the `@alias/*` import paths used throughout resolve correctly in both `ts-node` (dev) and
  compiled `dist/` (prod) output — verified by loading compiled `dist/app.js` directly.
- Added `mongodb-memory-server`-backed Jest integration setup (`tests/setup/`) so integration
  tests run against a real (in-memory) MongoDB per `CLAUDE.md` §12, no external DB required.
- 41 tests passing (unit + integration); `tsc --noEmit`, `eslint`, and `npm run build` all clean.
- Fixed a real bug found via testing: `signRefreshToken` had no `jti`, so two refresh tokens
  issued for the same user within the same second (identical `iat`) were byte-identical JWTs,
  causing a duplicate-key error against the unique `tokenHash` index. Fixed by adding a random
  `jti` to every refresh token.
- Docs synced: `docs/ROADMAP.md` Phase 1/2 checklists marked complete; `docs/ARCHITECTURE.md` §7a
  added (Email/Storage provider-abstraction pattern) and §8a updated (admin provisioning via seed
  script, never via `/auth/register`); `.env.example` updated with `EMAIL_PROVIDER` and
  `ADMIN_SEED_*` vars.

### Pending Work

- Phases 3–10 (Course Management, AI Tutor, AI Test Generation & Knowledge Score, Monthly
  Assessments & Analytics, Anonymous Doubts & Identity Protection, Teacher/Admin Portals,
  Notifications, Hardening) — not started, per `docs/ROADMAP.md`.

### Known Issues

- Docker was not available in this dev sandbox, so `docker-compose up` has not been actually run
  — the Dockerfile/compose config is written but unverified end-to-end. Verify on first run in an
  environment with Docker.
- No git repository initialized yet in `moded-ai/` — nothing has been committed.
- `GEMINI_API_KEY` remains a placeholder; no AI-dependent code exists yet (starts Phase 4).

### Next Phase to Implement

**Phase 3 — Course Management** (see `docs/ROADMAP.md`): courses, topics, resources,
assignments, learning paths, enrollments, with role-restricted CRUD and file-upload wiring via
the storage abstraction. **Paused for direction** — see conversation: the task brief contained
conflicting instructions on whether to continue through all phases unattended or stop after each
one for approval.

---

## 2026-08-02 — Phase 0: Architecture & Foundation

### Completed Work

- Created repository skeleton: `moded-ai/{backend,frontend,docs}` plus root `README.md`.
- Authored `CLAUDE.md` — binding rules for architecture, coding standards, naming, API/MongoDB
  conventions, error handling, logging, security, testing, git convention, and the
  always/never lists.
- Authored `docs/ARCHITECTURE.md` — layered request flow, folder responsibilities, dependency
  rules, AI (Gemini) architecture, security/auth architecture, scalability path.
- Authored `docs/DATABASE.md` — full design (fields, relationships, indexes, validation) for all
  23 planned MongoDB collections. No schemas implemented yet.
- Authored `docs/ROADMAP.md` — Phases 0–10 defined, each independently testable.
- Authored `frontend/README.md` placeholder (frontend work deferred).
- Scaffolded backend tooling only (no application code): `package.json`, `tsconfig.json`,
  `.eslintrc.json`, `.prettierrc`, `.env.example`, `.gitignore`, `jest.config.ts`, `Dockerfile`,
  `docker-compose.yml`, and empty `src/` module folders (`.gitkeep` placeholders) matching the
  architecture doc's folder layout.

### Pending Work

- **Phase 1 — Core Infrastructure**: Express app assembly, env/DB/logger config, centralized
  error middleware, Swagger scaffold, `GET /api/v1/health`. Not started.
- Phases 2–10 (Auth, Course Management, AI Tutor, AI Test Generation & Knowledge Score, Monthly
  Assessments & Analytics, Anonymous Doubts & Identity Protection, Teacher/Admin Portals,
  Notifications, Hardening) — all not started, per `docs/ROADMAP.md`.
- No dependencies installed yet (`npm install` not run — no lockfile present).
- No git repository initialized yet in `moded-ai/`.

### Important Architectural Decisions

- **Modular monolith, Service-Repository pattern**: strict one-way dependency flow
  (`route → controller → service → repository → model`); modules communicate cross-module only
  through each other's service interfaces.
- **Anonymity is a data-layer boundary, not a UI concern**: `anonymous_identity_map` is the only
  collection permitted to pair a real `userId` with an `anonymousId`; doubt/activity queries are
  structurally incapable of resolving identity; every admin resolution is audited via
  `audit_logs`.
- **AI isolation**: all Gemini calls go through a single `src/ai/` client; feature modules never
  import the SDK directly; AI-generated output is treated as untrusted input and Zod-validated
  before persistence (e.g. generated test question points must sum to 100).
- **No cache, no queue** in this stack by design (per tech-stack decision) — everything is
  synchronous in-process for now; `docs/ARCHITECTURE.md` §9 documents how each could be added
  later without a rewrite.
- **Standard response envelope + typed `AppError` hierarchy** enforced everywhere so error
  handling and API shape never drift module-to-module.
- **JWT access + refresh token pair**, refresh tokens tracked server-side (hashed) for rotation
  and revocation.

### Known Issues

- No git repository has been initialized in `moded-ai/` yet — commit-convention rules in
  `CLAUDE.md` §13 aren't yet enforceable by tooling.
- Backend dependencies are declared in `package.json` but not installed; no lockfile exists yet,
  so exact resolved versions are unverified.
- `GEMINI_API_KEY` and JWT secrets in `.env.example` are placeholders only — a real `.env` must
  be created locally before Phase 1's health check can validate DB connectivity end-to-end.
- No CI pipeline configured yet (deferred to Phase 10 per roadmap, but flagged here as an open
  gap in the meantime).

### Next Phase to Implement

**Phase 1 — Core Infrastructure** (see `docs/ROADMAP.md`): Express app skeleton, config
singletons (env/DB/logger), centralized error handling, Swagger scaffold, Dockerized health
check. No business features. Awaiting approval to proceed.
