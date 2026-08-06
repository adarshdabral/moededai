# ModEd.ai — Roadmap

This is the authoritative phase tracker (`CLAUDE.md` §14). Each phase is independently testable
and ends with a working, documented, tested backend increment — never a partial state. Check
items off in the same PR that completes them. Do not start a phase while the previous one has
open items, unless explicitly directed otherwise.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 0 — Architecture & Foundation (current)

Goal: establish the conventions every later phase follows. No feature code.

- [x] Repository structure (`backend/`, `frontend/`, `docs/`)
- [x] `CLAUDE.md` — permanent project rules
- [x] `docs/ARCHITECTURE.md`
- [x] `docs/DATABASE.md`
- [x] `docs/ROADMAP.md`
- [x] Root `README.md`
- [x] Backend scaffold configs: `package.json`, `tsconfig.json`, `.eslintrc.json`, `.prettierrc`,
      `.env.example`, `.gitignore`, `jest.config.ts`, `Dockerfile`, `docker-compose.yml`

**Exit criteria:** documents reviewed and agreed; no `src/` implementation exists yet beyond
empty module folders.

---

## Phase 1 — Core Infrastructure ✅ (2026-08-02)

Goal: a running Express server with no business features — the skeleton every module plugs
into.

- [x] `src/config/env.ts` — typed, validated environment loader
- [x] `src/config/database.ts` — MongoDB connection via Mongoose, with startup retry/backoff
- [x] `src/config/logger.ts` — Winston setup (console + file transports, structured JSON in prod)
- [x] `src/config/swagger.ts` — OpenAPI scaffold, served at `/api-docs` in non-prod
- [x] `src/common/errors/AppError.ts` + subclasses (`NotFoundError`, `ValidationError`,
      `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `AIProviderError`,
      `ServiceUnavailableError`, `RateLimitedError`, `UnprocessableEntityError`)
- [x] `src/common/middlewares/error.middleware.ts` — centralized error handler
- [x] `src/common/middlewares/requestLogger.middleware.ts` — request ID + Morgan→Winston bridge
- [x] `src/common/utils/apiResponse.ts` — standard success/error envelope builder
- [x] `src/common/utils/asyncHandler.ts`
- [x] `src/database/baseRepository.ts` — generic CRUD base class
- [x] `src/app.ts` — Express app assembly (helmet, cors, compression, rate limiter, routers,
      error handler)
- [x] `src/server.ts` — entrypoint (env load → DB connect → listen)
- [x] `GET /api/v1/health` endpoint (DB connectivity check) — the one exception to "no features",
      needed to verify the skeleton works end-to-end
- [ ] Docker Compose brings up API + MongoDB successfully — **not verified**: Docker is not
      available in the current dev sandbox. Config is written and reviewed; verify on first
      run in an environment with Docker installed.
- [x] Unit tests: error classes, response envelope, asyncHandler
- [x] Integration test: `GET /health` returns `200` with DB connected

**Exit criteria:** met, except the Docker Compose smoke test (untestable in this environment —
see above). `tsc`, `eslint`, and the Jest suite all pass; Swagger scaffold serves at `/api-docs`.

---

## Phase 2 — Auth & User Management ✅ (2026-08-02)

Goal: accounts exist; roles are enforced; nothing else depends on this being incomplete.

- [x] `users` collection/model (per `docs/DATABASE.md` §1), including `anonymousId` generation
- [x] `student_profiles`, `teacher_profiles` collections/models (§2–3)
- [x] `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- [x] `POST /auth/verify-email`, `POST /auth/request-password-reset`, `POST /auth/reset-password`
- [x] `refresh_tokens`, `verification_tokens` collections (§22–23)
- [x] JWT auth middleware (`authenticate`) + role middleware (`authorize(...roles)`)
- [x] `GET /users/me`, `PATCH /users/me`, `POST /users/me/avatar` (profile self-read/update)
- [x] Password hashing, rate-limited auth routes, audit-safe error messages (no user enumeration)
- [x] Unit + integration tests for every endpoint above (happy path + failure modes)
- [x] Swagger docs for the full `auth`/`users` surface
- [x] **Added beyond original scope**: `EmailClient` abstraction (console-log dev implementation,
      swappable per `EMAIL_PROVIDER`) used for verification/reset emails; `StorageClient`
      abstraction (local-disk implementation, swappable per storage provider) plus a generic
      `upload` Multer middleware, used here for profile-image upload; idempotent admin bootstrap
      script (`npm run seed`) since registration can only ever create `student` accounts.

**Exit criteria:** met. A client can register, verify email, log in, refresh, log out, and reset
a password entirely through the API. Registration always issues a `student` role regardless of
client input (tested explicitly) — teacher/admin accounts are provisioned only by the seed
script (for the first admin) or, from Phase 8 onward, by an authenticated admin.

---

## Phase 3 — Course Management

Goal: teachers/admins can author content; students can see what they're enrolled in.

- [x] `courses`, `topics`, `resources`, `assignments`, `learning_paths`,
      `course_enrollments` collections/models (§4–9)
- [x] Course create/list/get/update (`teacher`/`admin` only for writes — a teacher-created course
      is always self-owned, ignoring any client-supplied `teacherIds`; public/student reads see
      published courses only, teachers additionally see their own drafts, admins see all)
- [x] Topic/resource/assignment/learning-path CRUD nested under a course (create/update/delete
      restricted to the course's owning teacher(s) or an admin)
- [x] Enrollment endpoints (`teacher`/`admin` enrolls a student, duplicate enrollment rejected
      with 409; student views own enrollments via `GET /enrollments/me`; a student may drop their
      own enrollment, only a teacher/admin may set any other status)
- [x] File upload support (Multer + the Phase 2 `StorageClient` abstraction) for `resources` of
      type `upload` and for assignment attachments
- [x] Tests + Swagger docs for the full surface

**Scope notes (decisions made during implementation):**
- No course `DELETE` endpoint yet — courses are moderated via `isPublished`, not hard-deleted;
  cascading deletion of topics/resources/assignments/enrollments is deferred until a real need
  appears (avoids speculative complexity per `CLAUDE.md` development rules).
- Topic/resource/assignment/learning-path visibility does not yet re-check the parent course's
  `isPublished` flag for reads (any authenticated caller can list them for any existing course
  ID). Acceptable for this phase; revisit if unpublished-course content leakage becomes a concern
  before Phase 8.
- `resources.storageKey` and `assignments.attachmentUrl`/`attachmentStorageKey` were added beyond
  the original `docs/DATABASE.md` design to support upload deletion — documented there now.

**Exit criteria:** met. A full course with topics, resources, assignments, learning paths, and
enrolled students can be created and retrieved via API, with correct role restrictions verified
in integration tests (11 passing).

---

## Phase 4 — AI Tutor

Goal: the first AI-integrated feature; establishes the Groq client pattern every later AI
feature reuses.

- [x] `src/ai/groq.client.ts` — Groq SDK wrapper (20s timeout via `Promise.race`, every
      failure translated to `AIProviderError`; throws immediately if `GROQ_API_KEY` unset)
- [x] `src/ai/prompts/tutor.prompts.ts`
- [x] `ai_tutor_conversations` collection/model (§10), including message-cap/archiving behavior
      (cap: 50 messages/document; beyond that a new conversation document is created and used
      transparently)
- [x] `POST /ai-tutor/conversations` (start), `POST /ai-tutor/conversations/:id/messages` (send),
      `GET /ai-tutor/conversations` (history list), `GET /ai-tutor/conversations/:id`
- [x] Topic-context injection (optional `topicId` shapes the system prompt via
      `buildTutorSystemInstruction`)
- [x] Groq client is mocked in the default test suite (`jest.spyOn(aiClient, ...)` against the
      `AIClient` interface — no real API calls in CI); no live-API test subset exists yet since
      no `GROQ_API_KEY` is available in CI
- [x] Swagger docs
- [x] **Scope decision:** all AI Tutor routes restricted to `role: student` (matches the feature
      spec's "AI Learning Assistant" framing as student-facing); teachers/admins do not get tutor
      access in this phase.

**Exit criteria:** met. A student can hold a multi-turn conversation with contextual continuity
entirely through the API; 5 integration tests cover start/send/list/get, cross-student access
denial, and AI-provider-failure → 502 translation, all with the AI client mocked.

---

## Phase 5 — AI Test Generation & Knowledge Score

Goal: the scoring engine — arguably the product's core loop.

- [x] `src/ai/prompts/testGeneration.prompts.ts` (quiz generation + subjective-answer grading
      prompts)
- [x] `ai_generated_tests`, `test_attempts` collections/models (§11–12)
- [x] `knowledge_scores`, `knowledge_score_history` collections/models (§13–14)
- [x] `POST /ai-test/generate` (topic-wise, difficulty param) — AI output validated against
      `generatedQuizSchema` (Zod) before persistence; Mongoose schema re-validates the
      points-sum-to-100 invariant as a second, independent layer
- [x] `POST /test-attempts` (start), `PATCH /test-attempts/:id/submit` (submit answers),
      server-side scoring only — `mcq` graded deterministically, `subjective` graded via the AI
      client with clamping to the question's max points; resubmission rejected
- [x] `KnowledgeScoreService` cross-module update triggered from `TestAttemptService` on grading
      (per `docs/ARCHITECTURE.md` §6)
- [x] `GET /knowledge-scores/me`, `GET /knowledge-scores/me/weak-topics`
- [x] Tests (including the 0–100 scoring invariant, resubmission rejection, cross-student
      ownership, and subjective-grading clamping) + Swagger docs
- [x] **Configurable scoring engine**: `ScoringEngine` interface
      (`modules/knowledge-score/scoringEngine.ts`) injected into `KnowledgeScoreService` via
      constructor DI, with `WeightedRecentAverageScoringEngine` as the default implementation —
      the aggregation algorithm can be swapped without touching the service's public interface or
      any caller.

**Scope note:** timed-test enforcement (rejecting a submission after `timeLimitMinutes` has
elapsed since `startedAt`) was **not** implemented in this phase — `docs/DATABASE.md` §12 defines
the fields needed (`startedAt`, and the test's `timeLimitMinutes`) but no deadline check exists
yet. Flagged as a follow-up; not blocking because no other phase depends on it.

**Exit criteria:** met. A student can request a generated quiz, submit it, and see their
Knowledge Score and weak topics update correctly and deterministically — verified in 7 integration
tests, all with the AI client mocked.

---

## Phase 6 — Monthly Assessments & Growth Analytics

Goal: the longitudinal, comparative layer on top of Phase 5's scoring engine.

- [x] `monthly_assessments` collection/model (§15 — with a `topicId` field added; see scope note)
- [x] `src/jobs/monthlyAssessment.job.ts` — scheduling job (opens `scheduled` → `open` once
      `scheduledFor` passes, closes `open` → `closed` once `windowClosesAt` passes); run on a
      5-minute `setInterval` from `server.ts` (skipped when `NODE_ENV=test`) — no queue system
      introduced, per the tech-stack decision
- [x] `POST/GET /courses/:courseId/monthly-assessments` (teacher/admin schedule + view),
      `GET /monthly-assessments/:id` (status), `POST /monthly-assessments/:id/attempts` (student
      starts their personalized attempt) — submission reuses the existing
      `PATCH /test-attempts/:id/submit` endpoint unchanged, since `attemptType` is already a
      first-class field on `test_attempts`
- [x] `GET /analytics/me/growth` — topic mastery, progress timeline, learning streak (reads
      `knowledge_score_history` via a new `KnowledgeScoreService.getHistoryMine`, and
      `student_profiles.learningStreakDays`)
- [x] `GET /analytics/courses/:id/comparative` (teacher-facing comparative report — per-student
      average Knowledge Score across the course, descending)
- [x] Tests (6 monthly-assessment + 4 analytics integration tests) + Swagger docs

**Scope notes (decisions made during implementation):**
- `monthly_assessments` gained a required `topicId` field not in the original `docs/DATABASE.md`
  design — `ai_generated_tests` requires exactly one topic per test, so "adaptive monthly
  assessment" is implemented here as scoped to one topic per scheduling call, not the whole
  course's syllabus at once. A teacher wanting course-wide coverage schedules one assessment per
  topic. Documented in `docs/DATABASE.md` §15.
- Scheduling generates all personalized tests synchronously within the `POST` request (one AI
  call per active enrolled student). Acceptable at current scale per `docs/ARCHITECTURE.md` §7
  ("AI-heavy modules must apply their own request-level guards to avoid runaway API usage") —
  revisit if class sizes make this request slow enough to need a background job.
- `GET /monthly-assessments/:id` has no ownership/role check beyond authentication (any logged-in
  user can view any assessment's status/topic/course, not its questions or answers). Low-risk
  information disclosure accepted for this phase; tighten later if needed.

**Exit criteria:** met. A monthly assessment can be scheduled, opened (manually via the scheduler
function or automatically once running), attempted and submitted by an enrolled student, and
produces both an individual growth timeline (`/analytics/me/growth`) and a teacher-facing
comparative report (`/analytics/courses/:id/comparative`) — verified in 10 integration tests.

---

## Phase 7 — Anonymous Doubts & Identity Protection

Goal: the hardest security requirement in the product — build and verify the anonymity boundary
itself, not just the CRUD around it.

- [x] `anonymous_doubts`, `doubt_replies` collections/models (§16–17)
- [x] `anonymous_identity_map`, `audit_logs` collections/models (§18, §20) — **not** created
      transactionally alongside user registration (see scope note below); a backfill script
      exists for any user created without a mapping
- [x] `abuse_reports` collection/model (§19)
- [x] `POST /doubts` (anonymous post), `GET /courses/:courseId/doubts` (teacher/admin inbox,
      course-scoped, `?status` filter), `GET /doubts/me` (student's own posts),
      `GET /doubts/:id` (owner or course teacher/admin), `POST /doubts/:id/replies` (teacher +
      anonymous follow-up), `GET /doubts/:id/replies` (thread), `PATCH /doubts/:id/status`
- [x] `POST /doubts/:id/report`, `POST /replies/:id/report` (abuse reporting, reporter identity
      **is** recorded — reporters are not anonymous); `GET /admin/reports`,
      `PATCH /admin/reports/:id/resolve` (admin-only, writes an audit log)
- [x] `POST /admin/identity/resolve` — the single, audited admin-only resolution endpoint;
      `GET /admin/audit-logs` (admin-only, paginated)
- [x] **Security tests specifically proving the boundary** (13 tests): a test asserts the full
      JSON response of the teacher inbox does not contain the author's real name, email, or
      userId anywhere (only `authorAnonymousId`); identity resolution always writes an
      `audit_logs` entry before returning, verified by querying `audit_logs` directly; a non-admin
      calling `/admin/identity/resolve` gets 403; an unknown `anonymousId` gets 404; a resolution
      `reason` under 10 characters is rejected (accountability requirement)
- [x] Swagger docs (resolution endpoint explicitly documented as admin-only + audited)

**Scope notes (decisions made during implementation):**
- Identity-map creation is **not** wrapped in a database transaction with the user insert (would
  require a replica-set-backed MongoDB even in tests, for no real benefit at this scale) — it's a
  second write immediately after `AuthService.register` creates the user, and immediately after
  the `npm run seed` bootstrap admin is created. `npm run backfill:identity`
  (`src/database/backfillIdentityMap.ts`) exists as an idempotent safety net for any user that
  somehow ends up without a mapping.
- `GET /doubts/:doubtId` and `GET /doubts/:doubtId/replies` are accessible to the anonymous author
  (matched via their own `anonymousId`, computed server-side from the requester's real ID — never
  from client input) or the course's teacher/admin — never to unrelated users.

**Exit criteria:** met. Doubts and replies work end-to-end while a dedicated test suite
demonstrates the anonymity boundary holds; every identity resolution is independently verifiable
in `audit_logs`.

---

## Phase 8 — Teacher & Admin Portals (API layer)

Goal: the dashboards' data needs, as APIs (no UI).

- [x] Teacher: `GET /teacher/classes` (courses owned by the teacher, via `CourseService.listMine`
      — no new query logic), `GET /teacher/students/:id/analytics` (reuses
      `AnalyticsService`'s growth-report builder, gated by an active shared enrollment check —
      a teacher can never query an arbitrary student ID); course/topic/resource/assignment
      content-management was already role-gated for `teacher` in Phase 3 — no new endpoints
      needed
- [x] Admin: `GET /admin/users` (paginated, filter by `role`/`isActive`), `POST /admin/users`
      (creates a `teacher`/`admin` account — the admin-provisioned flow documented but not
      implemented in Phase 2/`docs/ARCHITECTURE.md` §8a, closed here), `PATCH
      /admin/users/:id/deactivate` (revokes all sessions, audit-logged) and `.../reactivate`
      (audit-logged); `GET/PATCH /admin/settings` (platform-level config — see scope note);
      `GET /admin/reports`/`PATCH /admin/reports/:id/resolve` were already built in Phase 7
      (abuse reports are a doubt-module concern per `docs/DATABASE.md`, mounted under `/admin`)
- [x] Role-scoped analytics reused from Phase 6: `AnalyticsService.getStudentAnalyticsForTeacher`
      wraps the same `buildGrowth` helper `getMyGrowth` uses — no duplicated aggregation logic
- [x] Tests (11 integration tests across teacher + admin portals) + Swagger docs

**Scope notes (decisions made during implementation):**
- `platform_settings` is a new singleton collection not in the original `docs/DATABASE.md`
  design (documented now, §24) — needed since "Platform Settings" has no natural home in any of
  the 23 originally-designed collections.
- Settings updates are **not** audit-logged (unlike account/identity actions) — maintenance-mode
  toggles and announcement text are not identity- or security-sensitive in the way `CLAUDE.md`
  §10 requires auditing for; revisit if settings ever gain security-relevant fields.

**Exit criteria:** met. Every dashboard described in the feature spec has a fully-tested,
fully-documented API surface backing it — verified in 11 integration tests.

---

## Phase 9 — Notifications

Goal: users are told what they need to know, in-app and via email.

- [x] `notifications` collection/model (§21)
- [x] Notification-triggering hooks added as calls from the *owning* service (not new coupling
      into unrelated modules): `score_update` from `TestAttemptService.submit`; `test_reminder`
      from `MonthlyAssessmentService.runScheduler` when a window opens; `announcement` from a
      new admin-only broadcast endpoint. **`doubt_reply` was deliberately NOT wired — see scope
      note below.**
- [x] `GET /notifications` (unread-first), `PATCH /notifications/:id/read`,
      `POST /notifications/announce` (admin-only broadcast, optionally scoped to one role)
- [x] Email delivery integration — reuses the `EmailClient` abstraction already built in Phase 2
      (no new provider work needed); `NotificationService.notify(..., sendEmail)` sends via it
      when requested
- [x] Tests (5 integration tests) + Swagger docs

**Scope note — `doubt_reply` notifications intentionally not implemented:** notifying the
anonymous author of a doubt that a teacher replied would require resolving their `anonymousId` to
a real `userId` (to address a `notifications` document to them) *outside* the single audited
admin-only resolution path — which would silently reopen the exact identity boundary Phase 7
spent its effort closing. Rather than compromise that boundary or bolt on a parallel
anonymousId-addressed notification path (meaningfully expanding `docs/DATABASE.md`'s design for a
"nice to have" reminder), this trigger is skipped: the anonymous author still sees replies the
next time they open `GET /doubts/:id/replies` or `/doubts/me` themselves. Revisit only with an
explicit decision about how notification delivery interacts with the anonymity guarantee.

**Exit criteria:** met. Completing a test and an admin announcement each produce the correct
in-app notification (verified in tests); email delivery is exercised through the existing
`EmailClient` abstraction. Doubt-reply notification is a deliberate, documented exception (above).

---

## Phase 10 — Hardening & Scale-Readiness

Goal: production-readiness beyond individual features.

- [~] Load testing key endpoints — **tooling written, not executed**: `scripts/load-test.js`
      (`npm run load-test`, using `autocannon`) targets the readiness probe, published-course
      listing, and doubt inbox against a running instance. Not run in this environment — no
      long-running server or Docker was available in the sandbox this backend was built in (the
      same limitation noted for `docker-compose up` since Phase 1). Rate limits (`CLAUDE.md` §10,
      `common/middlewares/rateLimiter.middleware.ts`) are therefore still design-time defaults,
      not load-test-tuned. **Run this yourself before production traffic.**
- [x] Monitoring/observability hooks: split `GET /health` (readiness — checks MongoDB) from the
      new `GET /health/live` (liveness — process-only, never depends on the database, so an
      orchestrator doesn't restart a container over a database blip); Winston already emits
      structured JSON logs in production (Phase 1) with a per-request correlation ID, ready to
      ship to any log aggregator; `docker-compose.yml` now declares container healthchecks for
      both `api` (via `/health/live`) and `mongo` (via `mongosh` ping)
- [x] Backup strategy documented for MongoDB — `docs/ARCHITECTURE.md` §10 (mechanism, frequency,
      retention, what's/isn't covered, restore-drill cadence). **Documentation only** — no drill
      has actually been performed (no deployed environment to drill against)
- [x] Dependency audit and upgrade pass: `npm audit` is clean (0 vulnerabilities) after pinning a
      transitive `uuid` override to close a moderate advisory pulled in by the new `autocannon`
      dev dependency. `npm outdated` shows several available major bumps (Express 5, Mongoose 9,
      Zod 4, ESLint 10, TypeScript 7, etc.) — **deliberately not taken**: none are
      security-motivated, and bumping every major dependency at the end of a completed build
      risks destabilizing ~100 passing tests for no functional gain. Revisit as a deliberate,
      tested upgrade pass in its own change.
- [x] Full-system integration/e2e test pass across all modules together:
      `tests/e2e/fullJourney.test.ts` — one continuous scenario chains registration, admin user
      provisioning, course authoring, enrollment, AI tutor, AI test generation + scoring, monthly
      assessments, growth + comparative analytics, anonymous doubts + abuse reports + audited
      identity resolution, teacher portal, notifications, and account deactivation, in that order,
      through the real HTTP API. Passed on first run.
- [x] Reviewed `docs/ARCHITECTURE.md` §9 (Future Scalability) against actual measured
      bottlenecks — see the new paragraph appended there: no bottleneck data exists (load test
      wasn't executed), so §9 remains a design-time judgment, explicitly flagged as such rather
      than presented as validated.

**Exit criteria:** partially met. The backend is deployable behind a load balancer with
documented backup and monitoring practices (readiness/liveness probes, structured logs, backup
strategy) and a full e2e test pass with zero failures. **Open item:** load testing itself was not
executed — this requires an actual running deployment, which this build environment did not have.
The tooling and rate-limit defaults are in place and documented; running `npm run load-test`
against a real deployment and tuning `RATE_LIMIT_*` env vars from the results is the one
concrete task left before calling this phase fully closed.

---

## Explicitly Out of Scope (tracked, not forgotten)

These are named in the source feature documents as future enhancements, not part of this
roadmap's phases: voice AI tutor, AR/VR learning, gamification, certificates, parent dashboard,
mobile app, multilingual support, video summarization, AI study planner. Revisit only after
Phase 10, as new phases appended here — do not fold them into an earlier phase's scope.
