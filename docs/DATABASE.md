# ModEd.ai — Database Design (MongoDB)

This document is a **design specification**, not an implementation. No schemas, models, or
migrations exist yet — they are built module-by-module per `docs/ROADMAP.md`, each time
referencing the relevant section here. If implementation ever diverges from this document,
this document is updated in the same change (`CLAUDE.md` §11).

Conventions used throughout (see `CLAUDE.md` §7 for the binding rules):
- All collections use `snake_case` plural names, declared explicitly (never Mongoose's guessed
  pluralization).
- Every collection has `createdAt`/`updatedAt` (`timestamps: true`).
- `ref` fields store a `Schema.Types.ObjectId` referencing another collection's `_id`.
- Every field marked **required** is enforced at both the Zod (HTTP) and Mongoose (persistence)
  layers.

---

## 0. Entity Relationship Overview

```
users ──1:1── student_profiles
users ──1:1── teacher_profiles
users ──1:N── refresh_tokens
users ──1:N── verification_tokens
users ──1:N── notifications

courses ──N:M── users (via course_enrollments)         [students]
courses ──1:N── topics
courses ──1:N── assignments
courses ──1:N── learning_paths
topics ──1:N── resources
courses ──N:M── teacher (embedded teacherIds[])

topics ──1:N── ai_generated_tests
ai_generated_tests ──1:N── test_attempts
test_attempts ──N:1── users [student]
test_attempts ──N:1── monthly_assessments (optional, when attempt is a monthly assessment)

users ──1:N── ai_tutor_conversations
topics ──1:N── ai_tutor_conversations (optional context)

users ──1:1── knowledge_scores (current aggregate)
users ──1:N── knowledge_score_history (time series)

monthly_assessments ──N:1── courses

anonymous_doubts ──1:N── doubt_replies
anonymous_doubts (anonymousId) ──resolves via── anonymous_identity_map ──N:1── users
                                                  [admin-only, never joined from doubt path]

abuse_reports ──N:1── anonymous_doubts (or doubt_replies)
audit_logs ──N:1── users [admin who performed the audited action]
```

---

## 1. `users`

**Purpose:** Single identity record for every account (student, teacher, admin). Holds
authentication credentials, role, and the stable Anonymous ID used to decouple identity from
anonymous activity elsewhere in the system.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `name` | String | ✔ | 2–100 chars |
| `email` | String | ✔ | unique, lowercase, validated format |
| `passwordHash` | String | ✔ | bcrypt hash; never selected by default (`select: false`) |
| `role` | String enum | ✔ | `student` \| `teacher` \| `admin` |
| `anonymousId` | String | ✔ | unique, generated at creation (e.g. `anon_<nanoid>`), immutable |
| `isEmailVerified` | Boolean | ✔ | default `false` |
| `isActive` | Boolean | ✔ | default `true`; `false` = deactivated/flagged account |
| `avatarUrl` | String | ✘ | |
| `lastLoginAt` | Date | ✘ | |

**Relationships:** referenced by `student_profiles`/`teacher_profiles` (1:1), `refresh_tokens`,
`verification_tokens`, `notifications`, `course_enrollments`, `test_attempts`,
`ai_tutor_conversations`, `knowledge_scores`, `knowledge_score_history` (all 1:N). Referenced
*only* by `anonymous_identity_map` for anonymous-identity resolution — no other collection may
store both `userId` and anonymized activity together.

**Indexes:** unique on `email`; unique on `anonymousId`; index on `role` (frequent admin filter).

**Validation rules:** `email` format + uniqueness enforced at both layers; `role` restricted to
enum; `passwordHash` never returned in any serialized response (enforced at the DTO/service
layer, not just schema `select: false`).

---

## 2. `student_profiles`

**Purpose:** Student-specific extension data, kept out of `users` to keep the base identity
collection role-agnostic.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `userId` | ObjectId (`ref: users`) | ✔ | unique — 1:1 |
| `gradeLevel` | String | ✔ | e.g. `"Grade 9"` |
| `enrolledCourseIds` | [ObjectId] (`ref: courses`) | ✘ | denormalized for fast dashboard reads; source of truth is `course_enrollments` |
| `learningStreakDays` | Number | ✔ | default `0` |
| `lastActivityAt` | Date | ✘ | drives streak calculation |

**Relationships:** 1:1 with `users`. Denormalized pointer into `courses` for read performance;
`course_enrollments` remains authoritative.

**Indexes:** unique on `userId`.

**Validation rules:** `gradeLevel` from a whitelisted set (defined alongside course-catalog
config); `learningStreakDays` ≥ 0.

---

## 3. `teacher_profiles`

**Purpose:** Teacher-specific extension data.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `userId` | ObjectId (`ref: users`) | ✔ | unique — 1:1 |
| `subjectSpecialization` | [String] | ✘ | |
| `assignedCourseIds` | [ObjectId] (`ref: courses`) | ✘ | denormalized; source of truth is `courses.teacherIds` |

**Relationships:** 1:1 with `users`.

**Indexes:** unique on `userId`.

**Validation rules:** none beyond referential existence of `assignedCourseIds`, checked at the
service layer on assignment.

---

## 4. `courses`

**Purpose:** Top-level content container (a "class"/subject offering).

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `title` | String | ✔ | 3–150 chars |
| `description` | String | ✘ | |
| `subject` | String | ✔ | whitelisted subject taxonomy |
| `gradeLevel` | String | ✔ | |
| `teacherIds` | [ObjectId] (`ref: users`) | ✔ | at least one; embedded since typically few teachers/course |
| `isPublished` | Boolean | ✔ | default `false` — draft vs. visible to students |

**Relationships:** 1:N with `topics`, `assignments`, `learning_paths`; N:M with students via
`course_enrollments`.

**Indexes:** index on `subject`, `gradeLevel` (catalog filtering); index on `teacherIds`.

**Validation rules:** `teacherIds` entries must resolve to `users` with `role: teacher`
(service-layer check, not just schema-level).

---

## 5. `topics`

**Purpose:** A unit of content within a course; the anchor for AI tutoring, AI-generated tests,
and knowledge scoring (all are scoped "per topic").

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `courseId` | ObjectId (`ref: courses`) | ✔ | |
| `title` | String | ✔ | |
| `order` | Number | ✔ | position within course, for sequencing |
| `learningObjectives` | [String] | ✘ | feeds AI prompt context |

**Relationships:** N:1 with `courses`; 1:N with `resources`; referenced by
`ai_generated_tests`, `ai_tutor_conversations`, `knowledge_scores`.

**Indexes:** compound index on `(courseId, order)`.

**Validation rules:** `order` unique within a `courseId`.

---

## 6. `resources`

**Purpose:** Learning material attached to a topic (documents, links, uploaded files).

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `topicId` | ObjectId (`ref: topics`) | ✔ | |
| `type` | String enum | ✔ | `document` \| `video` \| `link` \| `upload` |
| `title` | String | ✔ | |
| `url` | String | ✔ | external URL, or the `StorageClient`-returned URL when `type: upload` |
| `storageKey` | String | ✘ | set only when `type: upload` — the `StorageClient` key, needed to delete the underlying file when the resource is deleted (see `docs/ARCHITECTURE.md` §7a) |
| `uploadedBy` | ObjectId (`ref: users`) | ✔ | |

**Relationships:** N:1 with `topics`.

**Indexes:** index on `topicId`.

**Validation rules:** `url` required and format-checked; `type: upload` files validated against
Multer size/MIME constraints at upload time (`CLAUDE.md` §10), not re-validated in this schema.
`storageKey` is set only by the service layer (never client-supplied) and is used exclusively to
call `StorageClient.delete()` on removal.

---

## 7. `assignments`

**Purpose:** Teacher-authored graded/ungraded work items attached to a course (distinct from
AI-generated tests).

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `courseId` | ObjectId (`ref: courses`) | ✔ | |
| `title` | String | ✔ | |
| `description` | String | ✔ | |
| `dueAt` | Date | ✔ | |
| `attachmentUrl` | String | ✘ | set when the assignment has a file attachment; the `StorageClient`-returned URL |
| `attachmentStorageKey` | String | ✘ | set alongside `attachmentUrl` — used to delete the file via `StorageClient.delete()` |
| `createdBy` | ObjectId (`ref: users`) | ✔ | teacher |

**Relationships:** N:1 with `courses`.

**Indexes:** index on `(courseId, dueAt)`.

**Validation rules:** `dueAt` must be a future date at creation time (service-layer check).

---

## 8. `learning_paths`

**Purpose:** An ordered sequence of topics/resources recommended for a student's progression
through (or across) courses — supports personalized study plans.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `courseId` | ObjectId (`ref: courses`) | ✔ | |
| `title` | String | ✔ | |
| `topicSequence` | [ObjectId] (`ref: topics`) | ✔ | ordered array |

**Relationships:** N:1 with `courses`; references `topics`.

**Indexes:** index on `courseId`.

**Validation rules:** every ID in `topicSequence` must belong to the same `courseId`.

---

## 9. `course_enrollments`

**Purpose:** Many-to-many join between students and courses; source of truth for who is
enrolled where (drives dashboards, teacher class rosters, and access checks).

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `studentId` | ObjectId (`ref: users`) | ✔ | |
| `courseId` | ObjectId (`ref: courses`) | ✔ | |
| `status` | String enum | ✔ | `active` \| `completed` \| `dropped` |
| `enrolledAt` | Date | ✔ | |

**Relationships:** N:1 with `users`, N:1 with `courses`.

**Indexes:** unique compound index on `(studentId, courseId)` (no duplicate enrollment); index
on `courseId` (roster lookups).

**Validation rules:** `studentId` must resolve to a `user` with `role: student`.

---

## 10. `ai_tutor_conversations`

**Purpose:** A student's chat session with the AI Learning Assistant, including message history,
for continuity and "recent AI conversations" dashboard display.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `studentId` | ObjectId (`ref: users`) | ✔ | |
| `topicId` | ObjectId (`ref: topics`) | ✘ | optional context if launched from a topic |
| `title` | String | ✔ | auto-generated summary of the first message |
| `messages` | [Subdocument] | ✔ | see below |
| `lastMessageAt` | Date | ✔ | for sorting "recent conversations" |

**`messages[]` subdocument:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `role` | String enum | ✔ | `student` \| `assistant` |
| `content` | String | ✔ | |
| `sentAt` | Date | ✔ | |

**Relationships:** N:1 with `users`; N:1 (optional) with `topics`.

**Indexes:** compound index on `(studentId, lastMessageAt desc)` (recent-conversations query).

**Validation rules:** `messages` capped at an application-enforced max length per document (e.g.
500); beyond that, the service layer archives/splits into a new conversation document rather
than growing one document unbounded (MongoDB 16MB document limit awareness).

---

## 11. `ai_generated_tests`

**Purpose:** A generated quiz/test definition for a topic — the question set itself, independent
of any student's attempt at it.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `topicId` | ObjectId (`ref: topics`) | ✔ | |
| `generatedFor` | ObjectId (`ref: users`) | ✘ | set if personalized to one student; null if reusable |
| `difficulty` | String enum | ✔ | `easy` \| `medium` \| `hard` \| `adaptive` |
| `timeLimitMinutes` | Number | ✔ | |
| `questions` | [Subdocument] | ✔ | see below |
| `generationSource` | String enum | ✔ | `ai` \| `manual` (future-proofing for teacher-authored tests reusing this shape) |

**`questions[]` subdocument:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | String enum | ✔ | `mcq` \| `subjective` |
| `prompt` | String | ✔ | |
| `options` | [String] | ✘ | required if `type: mcq` (2–6 options) |
| `correctAnswer` | String | ✔ | option text/key for `mcq`; model-graded rubric reference for `subjective` |
| `points` | Number | ✔ | |

**Relationships:** N:1 with `topics`; 1:N with `test_attempts`.

**Indexes:** index on `topicId`; index on `generatedFor` (sparse, since usually null).

**Validation rules:** `options` required and length-validated when `type: mcq`;
`sum(questions.points)` must equal 100 (so raw score maps directly onto the /100 Knowledge
Score) — enforced at generation time in the service layer.

---

## 12. `test_attempts`

**Purpose:** A single student's submission/result for a given `ai_generated_tests` document —
covers both ad hoc topic quizzes and monthly assessments (distinguished by `attemptType`).

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `testId` | ObjectId (`ref: ai_generated_tests`) | ✔ | |
| `studentId` | ObjectId (`ref: users`) | ✔ | |
| `attemptType` | String enum | ✔ | `practice` \| `monthly_assessment` |
| `monthlyAssessmentId` | ObjectId (`ref: monthly_assessments`) | ✘ | required if `attemptType: monthly_assessment` |
| `answers` | [Subdocument] | ✔ | `{ questionIndex, response, isCorrect, pointsAwarded }` |
| `score` | Number | ✔ | 0–100 |
| `weakTopicsIdentified` | [String] | ✘ | derived at grading time |
| `startedAt` | Date | ✔ | |
| `submittedAt` | Date | ✘ | null until submitted; drives timed-test enforcement |

**Relationships:** N:1 with `ai_generated_tests`, N:1 with `users`, optional N:1 with
`monthly_assessments`.

**Indexes:** compound index on `(studentId, submittedAt desc)` (dashboard "recent tests");
index on `monthlyAssessmentId` (sparse).

**Validation rules:** `score` derived server-side from `answers`, never trusted from client
input; `monthlyAssessmentId` required exactly when `attemptType: monthly_assessment` (custom
validator).

---

## 13. `knowledge_scores`

**Purpose:** The student's *current* aggregate Knowledge Score per topic (and overall), powering
the dashboard's live `/100` display and weak-topic identification.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `studentId` | ObjectId (`ref: users`) | ✔ | |
| `topicId` | ObjectId (`ref: topics`) | ✔ | |
| `currentScore` | Number | ✔ | 0–100 |
| `attemptsCount` | Number | ✔ | number of `test_attempts` contributing to this score |
| `lastUpdatedAt` | Date | ✔ | |

**Relationships:** N:1 with `users`, N:1 with `topics`. Updated whenever a relevant
`test_attempts` document is graded (via `KnowledgeScoreService`, called from `AiTestService` —
cross-module service call per `docs/ARCHITECTURE.md` §6).

**Indexes:** unique compound index on `(studentId, topicId)`.

**Validation rules:** `currentScore` clamped 0–100; recalculation formula (e.g. weighted average
of recent attempts) is a service-layer concern, not stored logic.

---

## 14. `knowledge_score_history`

**Purpose:** Append-only time series behind Growth Analytics (performance graphs, progress
timeline) — kept separate from `knowledge_scores` so the current-state collection stays small
and the history can grow independently.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `studentId` | ObjectId (`ref: users`) | ✔ | |
| `topicId` | ObjectId (`ref: topics`) | ✔ | |
| `score` | Number | ✔ | snapshot value at `recordedAt` |
| `recordedAt` | Date | ✔ | |
| `triggeredBy` | ObjectId (`ref: test_attempts`) | ✔ | the attempt that caused this snapshot |

**Relationships:** N:1 with `users`, `topics`, `test_attempts`.

**Indexes:** compound index on `(studentId, topicId, recordedAt)` (timeline queries).

**Validation rules:** append-only — the service layer never updates or deletes existing history
documents.

---

## 15. `monthly_assessments`

**Purpose:** Scheduling/definition of the recurring adaptive monthly test per student or class,
plus the comparative-report anchor.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `courseId` | ObjectId (`ref: courses`) | ✔ | |
| `topicId` | ObjectId (`ref: topics`) | ✔ | **added beyond the original design** — `ai_generated_tests` requires a single `topicId` per test, so a monthly assessment in this implementation is scoped to one topic within the course rather than the whole course's syllabus. See `docs/ROADMAP.md` Phase 6 scope notes. |
| `scheduledFor` | Date | ✔ | first day of the assessment window |
| `windowClosesAt` | Date | ✔ | |
| `generatedTestIds` | [ObjectId] (`ref: ai_generated_tests`) | ✔ | one per active enrolled student at schedule time (personalized — each references `generatedFor`) |
| `status` | String enum | ✔ | `scheduled` \| `open` \| `closed` |

**Relationships:** N:1 with `courses`; N:1 with `topics`; 1:N with `ai_generated_tests`
(personalized per student); referenced by `test_attempts.monthlyAssessmentId`.

**Indexes:** index on `(courseId, scheduledFor)`.

**Validation rules:** `windowClosesAt` must be after `scheduledFor`; automatic scheduling job
(see `src/jobs/`) is the only writer of `status` transitions.

---

## 16. `anonymous_doubts`

**Purpose:** A student's anonymously posted question. The core of the "trustworthy anonymity"
product requirement — see `docs/ARCHITECTURE.md` §8 for the security boundary this enforces.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `authorAnonymousId` | String | ✔ | **not** a `ref` to `users` — copied value of `users.anonymousId`, intentionally unjoinable |
| `courseId` | ObjectId (`ref: courses`) | ✔ | |
| `topicId` | ObjectId (`ref: topics`) | ✘ | |
| `question` | String | ✔ | |
| `status` | String enum | ✔ | `open` \| `answered` \| `closed` |

**Relationships:** N:1 with `courses`/`topics`. Deliberately **not** related to `users` by
`ObjectId` reference — only `anonymous_identity_map` (below) can resolve `authorAnonymousId`
back to a user, and only for admins.

**Indexes:** index on `(courseId, status)` (teacher inbox query); index on `authorAnonymousId`
(a student viewing their own posted doubts, matched client-side against their own known
Anonymous ID — never exposed to teachers).

**Validation rules:** `authorAnonymousId` must exist in `users.anonymousId` at write time
(service-layer check calling the user lookup by anonymous ID, which is a different, permitted
query direction than the forbidden reverse lookup — see `docs/ARCHITECTURE.md` §8).

---

## 17. `doubt_replies`

**Purpose:** Threaded responses to an anonymous doubt (teacher replies, follow-up from the
anonymous author).

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `doubtId` | ObjectId (`ref: anonymous_doubts`) | ✔ | |
| `authorRole` | String enum | ✔ | `teacher` \| `anonymous_student` |
| `authorRef` | String | ✔ | teacher's real `userId` (string) if `authorRole: teacher`; the poster's `anonymousId` if `authorRole: anonymous_student` — **never** the reverse |
| `message` | String | ✔ | |

**Relationships:** N:1 with `anonymous_doubts`.

**Indexes:** compound index on `(doubtId, createdAt)` (thread ordering).

**Validation rules:** when `authorRole: teacher`, `authorRef` must resolve to a real `users._id`
with `role: teacher`; when `authorRole: anonymous_student`, `authorRef` is validated only as a
well-formed anonymous ID, never resolved to an identity in this code path.

---

## 18. `anonymous_identity_map`

**Purpose:** The **only** collection in the system permitted to hold both a real `userId` and
an `anonymousId` together. This is a hard security boundary (`CLAUDE.md` §10) — access to this
collection is restricted to a single admin-only service method, and every read is audited.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `userId` | ObjectId (`ref: users`) | ✔ | unique |
| `anonymousId` | String | ✔ | unique — mirrors `users.anonymousId` |

**Relationships:** 1:1 with `users`. No other collection may replicate this pairing.

**Indexes:** unique on `userId`; unique on `anonymousId`.

**Validation rules:** rows are created only alongside user creation (in the same transaction as
the `users` insert); never updated; deletion only on account deletion (cascading, admin-audited).
Application-level access control (not just a DB permission) restricts reads of this collection to
one service method: `AdminService.resolveAnonymousIdentity(anonymousId, requestingAdminId,
reason)`, which writes to `audit_logs` before returning the result.

---

## 19. `abuse_reports`

**Purpose:** Flagging mechanism for abusive anonymous doubts/replies, escalated to admins for
review — supports the Admin Portal's "resolve flagged accounts" feature without breaking
anonymity for non-abusive content.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `reportedDoubtId` | ObjectId (`ref: anonymous_doubts`) | ✘ | one of these two is required |
| `reportedReplyId` | ObjectId (`ref: doubt_replies`) | ✘ | |
| `reportedByUserId` | ObjectId (`ref: users`) | ✔ | the reporter is **not** anonymous — accountability for reports |
| `reason` | String | ✔ | |
| `status` | String enum | ✔ | `pending` \| `reviewing` \| `resolved` \| `dismissed` |
| `resolvedByAdminId` | ObjectId (`ref: users`) | ✘ | |
| `resolutionNotes` | String | ✘ | |

**Relationships:** N:1 with `anonymous_doubts` or `doubt_replies` (exactly one); N:1 with `users`
(reporter and resolving admin).

**Indexes:** index on `status` (admin queue); index on `reportedDoubtId`, `reportedReplyId`
(sparse).

**Validation rules:** exactly one of `reportedDoubtId`/`reportedReplyId` set (custom validator).
Resolving a report that requires identity resolution goes through
`anonymous_identity_map`/`audit_logs`, not by adding a shortcut field here.

---

## 20. `audit_logs`

**Purpose:** Immutable record of sensitive admin actions — most importantly, every anonymous
identity resolution, but also account deactivation, role changes, and report resolutions.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `actorAdminId` | ObjectId (`ref: users`) | ✔ | |
| `action` | String enum | ✔ | e.g. `IDENTITY_RESOLVED`, `ACCOUNT_DEACTIVATED`, `REPORT_RESOLVED`, `ROLE_CHANGED` |
| `targetType` | String | ✔ | collection name of the affected entity |
| `targetId` | ObjectId | ✔ | |
| `reason` | String | ✔ | required free-text justification |
| `metadata` | Mixed | ✘ | action-specific extra context |

**Relationships:** N:1 with `users` (the acting admin).

**Indexes:** index on `(actorAdminId, createdAt)`; index on `action`.

**Validation rules:** append-only — no update or delete operations are ever exposed through the
application (enforced by omission: no repository method exists to update/delete audit logs).

---

## 21. `notifications`

**Purpose:** In-app (and email-triggering) notifications: test reminders, score updates,
announcements.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `userId` | ObjectId (`ref: users`) | ✔ | |
| `type` | String enum | ✔ | `test_reminder` \| `score_update` \| `announcement` \| `doubt_reply` |
| `title` | String | ✔ | |
| `body` | String | ✔ | |
| `isRead` | Boolean | ✔ | default `false` |
| `deliveredViaEmail` | Boolean | ✔ | default `false` |

**Relationships:** N:1 with `users`.

**Indexes:** compound index on `(userId, isRead, createdAt desc)` (unread-first inbox query).

**Validation rules:** `type` enum restricted; email delivery is a side effect handled by the
service layer, not a DB trigger.

---

## 22. `refresh_tokens`

**Purpose:** Server-side record of issued JWT refresh tokens, enabling rotation and revocation
(logout, security incidents) — see `docs/ARCHITECTURE.md` §8a.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `userId` | ObjectId (`ref: users`) | ✔ | |
| `tokenHash` | String | ✔ | hashed, never the raw token |
| `expiresAt` | Date | ✔ | |
| `revokedAt` | Date | ✘ | null while active |

**Relationships:** N:1 with `users`.

**Indexes:** index on `userId`; TTL index on `expiresAt` (automatic cleanup of expired tokens).

**Validation rules:** raw refresh token never persisted, only its hash.

---

## 23. `verification_tokens`

**Purpose:** Single-use, time-limited tokens for email verification and password reset flows.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | |
| `userId` | ObjectId (`ref: users`) | ✔ | |
| `type` | String enum | ✔ | `email_verification` \| `password_reset` |
| `tokenHash` | String | ✔ | hashed |
| `expiresAt` | Date | ✔ | |
| `usedAt` | Date | ✘ | null until redeemed; redemption is one-time |

**Relationships:** N:1 with `users`.

**Indexes:** index on `(userId, type)`; TTL index on `expiresAt`.

**Validation rules:** a token with non-null `usedAt` is rejected on any further redemption
attempt (service-layer check).

---

## 24. `platform_settings`

**Purpose:** Singleton document holding platform-wide Admin Portal configuration. **Added in
Phase 8** — not part of the original 23-collection design; see `docs/ROADMAP.md` Phase 8 scope
notes.

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | String | ✔ | fixed value `"platform"` — enforces exactly one document |
| `maintenanceMode` | Boolean | ✔ | default `false` |
| `announcement` | String | ✘ | shown platform-wide when set |

**Relationships:** none — deliberately standalone.

**Indexes:** none beyond the default `_id` index (a fixed string `_id` already guarantees
singleton behavior).

**Validation rules:** `AdminSettingsService.get()` creates the document with defaults on first
read if it doesn't exist yet (lazy initialization) — there is no seed/migration step for it.

---

## Cross-Cutting Notes

- **No collection ever stores both an `anonymousId` and its owning `userId` except
  `anonymous_identity_map`.** This is the single most important invariant in the schema and must
  be checked in review for every new collection added in future phases.
- **TTL indexes** (`refresh_tokens`, `verification_tokens`) rely on MongoDB's native expiry —
  no application-level cleanup job needed for these two collections.
- **Denormalized fields** (`student_profiles.enrolledCourseIds`,
  `teacher_profiles.assignedCourseIds`) exist purely for read performance on dashboards; the
  join-table collections (`course_enrollments`, `courses.teacherIds`) are always the source of
  truth and the denormalized copies are kept in sync by the owning service, not by the client.
- **Scoring integrity:** `test_attempts.score` and `knowledge_scores.currentScore` are always
  computed server-side from stored answers/question point values — never accepted as
  client-supplied input.
