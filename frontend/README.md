# ModEd.ai — Frontend

A production-quality React frontend for the ModEd.ai backend (`../backend`), covering the
Student, Teacher, and Admin portals end to end. Built against the real backend API — no mock
data, no fake endpoints.

## Design system

Grounded in the schoolroom/gradebook, not a generic SaaS dashboard look:

- **Palette** — warm paper background, chalkboard-green primary accent, chalk-gold for
  achievement/score states, pencil-graphite neutrals. The green/gold/coral trio is validated for
  color-vision-deficiency safety (see `src/index.css` comments — checked with the dataviz skill's
  palette validator, not eyeballed).
- **Type** — Fraunces (display serif, used sparingly for headlines and score numbers), Manrope
  (body/UI), IBM Plex Mono (scores, timestamps, code blocks).
- **Signature component** — `KnowledgeScoreGauge` (`src/components/knowledge-score/`): a
  grade-dial with chalk-tick marks, appears on the student dashboard, a teacher's student-detail
  view, and attempt results. The one visual thread tying every portal together.
- **Theme** — light/dark/system, persisted, applied pre-paint (no flash) via an inline script in
  `index.html` plus `src/stores/themeStore.ts`.

## Tech stack

React 19 + TypeScript (strict) + Vite, Tailwind CSS v4 (CSS-first `@theme` config, no
`tailwind.config.js`), React Router v6 (see "Known limitations" for why not v7), TanStack Query
for server state, Zustand for auth/theme state, Axios (with a JWT refresh-token interceptor
mirroring the backend's rotation flow), React Hook Form + Zod (validation mirrors the backend's
Zod schemas), Recharts, Framer Motion, `react-markdown` + `react-syntax-highlighter` (AI Tutor
chat), Lucide icons.

## Getting started

The backend must be running first (see `../backend/README.md`). Then:

```bash
npm install
npm run dev
```

Vite proxies `/api/v1/*` to `http://localhost:5000` by default (see `vite.config.ts`) — set
`VITE_API_PROXY_TARGET` to point elsewhere, or `VITE_API_BASE_URL` to bypass the proxy entirely
(e.g. for a production build talking to a deployed backend).

```bash
npm run build      # production build (tsc -b && vite build)
npm run dev        # dev server on :5173
npm run lint       # oxlint
npx tsc -b --noEmit  # typecheck only
```

Bootstrap the first admin account from the backend (`npm run seed` there), then register a
student normally via the app's `/register` page, and use the admin account to create a teacher
via Admin → Users → "New teacher/admin".

## Known limitations (backend contract, not frontend bugs)

The frontend was built to only call real, existing backend endpoints — never mock data. A few
real gaps in the current backend surface shaped specific UI decisions, documented here rather
than papered over:

- **No student names in a teacher's roster.** `EnrollmentDTO` carries only a `studentId`, and
  there is no `GET /users/:id` a teacher/admin can call to resolve a name from it (only
  `GET /users/me` for self, and `GET /admin/users` for admins). The Teacher Portal's Students
  list therefore shows `Student #<id suffix>` rather than a name. A student's own Profile page
  shows their full ID so they can share it with a teacher for enrollment.
- **No student self-enrollment.** `POST /courses/:id/enrollments` is teacher/admin-only by
  design (see backend `docs/ARCHITECTURE.md`). The student Courses page is browse-only; a teacher
  or admin enrolls students from the course's Roster tab using the student's ID.
- **No "list my assessments" endpoint for students.** A student can only reach a specific
  monthly assessment by ID (via `GET /monthly-assessments/:id`), which they normally learn about
  through a `test_reminder` notification. The Assessments page reflects this honestly: it shows
  recent reminders plus a manual "enter an assessment ID" field, rather than a fabricated list.
- **No topic-title enrichment.** `KnowledgeScoreDTO`/`GrowthAnalyticsDTO` return a bare `topicId`
  with no title (there's no `GET /topics/:id` — topics are only ever listed nested under a
  course). `src/hooks/useTopicLookup.ts` resolves titles client-side by fetching each relevant
  course's topic list once and joining locally — real data, joined outside the database.
- **Practice-quiz answers never show the correct answer**, even after grading — the backend's
  `AiGeneratedTestDTO` never includes `correctAnswer` in any response, by design (prevents
  trivial reuse). The results page is explicit about this and points the student to the AI Tutor
  instead.
- **The take-test countdown timer is a client-side visual only.** The backend does not yet
  enforce the time limit server-side (a documented gap in the backend's own `docs/ROADMAP.md`
  Phase 5 notes) — submission still succeeds after time "expires."
- **`react-router-dom` is pinned to v6**, not the latest v7. Every v7 release currently carries
  advisories (`npm audit`) that are exclusively about its SSR/RSC/server-action feature set,
  which this app — a pure client-rendered SPA with no server component — never touches. v6
  predates that surface entirely and has only two moderate, non-applicable-to-us advisories
  remaining (an SSR hydration issue, and a `Link`/`useNavigate` open-redirect that requires
  attacker-controlled route targets, which this app never passes). Revisit if a patched v7 lands.
- **Large AI Tutor chunk.** `react-syntax-highlighter` is wired through its async build
  (`prism-async`) specifically to keep language grammars out of the main bundle, but the shared
  vendor chunk that includes Recharts is still ~330KB (~99KB gzipped) — acceptable for a
  lazy-loaded, authenticated dashboard app, but a candidate for further chunk-splitting if initial
  load time ever matters more than it does today.

## Folder structure

```
src/
├── api/            One file per backend module - thin fetch wrappers, typed request/response
├── hooks/          TanStack Query hooks per domain (wraps api/)
├── stores/         Zustand: auth session, theme
├── types/          DTOs mirroring the backend's *.types.ts 1:1, plus the response envelope
├── components/
│   ├── ui/          Design-system primitives (Button, Dialog, Table, Toaster, ...)
│   ├── layout/       AppShell, Sidebar, Navbar, ProtectedRoute, ...
│   ├── charts/        Recharts wrappers (single-hue magnitude, single-series timeline)
│   ├── chat/           AI Tutor chat UI (message bubbles, typing indicator, sidebar)
│   ├── knowledge-score/  The KnowledgeScoreGauge signature component
│   └── upload/          FileDropzone
├── pages/
│   ├── auth/ shared/ student/ teacher/ admin/
└── routes/router.tsx   Full route tree, lazy-loaded per page
```
