# Alpha Command Center — Production Readiness Audit
**Date:** 2026-04-17
**Auditor:** Claude Opus 4.7 via Claude Code
**Scope:** Full codebase audit of `D:\DEV\projects\claude-Ai-Bot` (repo: `UMIDX124/claude-Ai-Bot`), runtime smoke test on `next dev -p 3001`, static export inspection, Prisma schema validation, dependency/audit scan.
**Verdict:** **BLOCK LAUNCH — DO NOT ROLL OUT.**

The product described in the brief (23 employees seeded in DB, 13 real clients, cold‑email pipeline, SLA engine, tickets, leave requests, invoices, Groq llama‑3.3‑70b, Nodemailer, Upstash Redis, NextAuth/Clerk, tracker API keys) does **not exist as running code** in this repository. What exists is a single‑page UI prototype with hard‑coded demo users and mock data. Rolling this out to a 30‑person team next week would be the equivalent of shipping a Figma mockup.

---

## Executive Summary
| Metric | Value |
|---|---|
| Total lines (TS/TSX, src/) | 6,325 |
| TS files | 4 |
| TSX files | 26 |
| JS files | 0 |
| API routes (`app/api/**/route.ts`) | **1** (`/api/chat`) |
| Pages (`app/**/page.tsx`) | **1** (root `/`) |
| Prisma models declared | 11 |
| Prisma models actually used in code | **0** |
| Prisma migrations | **0** (no `prisma/migrations/` directory) |
| Prisma seed script | **none** |
| DB client imports (`@prisma/client`) in src/ | **0** |
| Env files checked into repo | 0 (no `.env.example` either) |
| `.env*` variants | 0 |
| Total git commits on `main` | 4 |
| Uncommitted changes | none (working tree clean) |
| CI/CD workflows (`.github/workflows/`) | **none** |
| Test files | **none** |
| Auth provider | **none** — client-side `demoUsers` array, cleartext passwords |
| P0 issues | **22** |
| P1 issues | **18** |
| P2 issues | **11** |
| Estimated P0 fix time | **80–120 hours** (realistically: rebuild) |
| Overall production readiness | **~8 %** |

The executive reality: unless launch means "show a read‑only dashboard with fabricated numbers on a single screen and hope nobody clicks anything that writes data," this is not a launch. Every "feature" the brief mentioned — tasks persisting, deals moving stages, tickets with SLA timers, cold email, invoices, leave requests, file uploads, global Ctrl+K, notifications — either does not exist or exists only as a React `useState` that vanishes on page refresh.

---

## P0 — Launch Blockers (must fix before any user touches)

| ID | Category | Issue | Location | Impact | Fix Effort |
|----|----------|-------|----------|--------|------------|
| P0-1 | Architecture | **`output: "export"` in `next.config.ts` strips all API routes** from deploy. `/api/chat` is NOT in `out/`; deploying the current `vercel.json` serves a static site only. | `next.config.ts:4` | AI chat, any future auth/data endpoint silently 404 in prod | 15 min (delete line) |
| P0-2 | Architecture | **`trailingSlash: true` + `fetch("/api/chat")` → 308 redirect that strips POST body.** Verified live: `curl -X POST http://localhost:3001/api/chat` returns HTTP 308. The chat never reaches the handler even if P0-1 is fixed. | `next.config.ts:6`, `src/components/AIChat.tsx:81,127` | AI chat never works | 15 min |
| P0-3 | Runtime | **Dev server returns HTTP 500 on `GET /`** due to CSS `@import url('https://fonts.googleapis.com/css2?…')` placed after other rules. Lightning CSS rejects it; no page renders in dev. | `src/app/globals.css:2` (after `@import "tailwindcss";`) | Nobody can develop against this codebase | 5 min (move @import to top, or delete — `next/font` already loads these in `layout.tsx:5-15`) |
| P0-4 | Database | **Prisma schema is invalid — fails `prisma validate` and `prisma generate`.** `User.employees Employee[]` references a model that does not exist (the model is `User`, not `Employee`). Additionally, `datasource.url = env("DATABASE_URL")` is unsupported in Prisma 7; must move to `prisma.config.ts` — but CLAUDE.md forbids creating `prisma.config.ts`. Self‑blocking. | `prisma/schema.prisma:8, 64` | Cannot generate client, cannot run any migration | 30 min (fix field + decide the `prisma.config.ts` rule) |
| P0-5 | Data model | **No database connection exists anywhere.** No `src/lib/prisma.ts`, zero imports of `@prisma/client` or `PrismaClient` in `src/`. Schema is a dead artifact. | codebase-wide | Nothing persists. "Create task", "add client", "CSV import" only mutate React state. First page refresh wipes all work. | 4–8 h to wire client, seed, and a minimal CRUD route |
| P0-6 | Auth | **Authentication is a client-side array with plaintext passwords.** `demoUsers = [{email, password: "admin123", role: "SUPER_ADMIN"}, …]` is shipped in the JS bundle. Anyone who views source sees every credential. Auth state is `useState`, not persisted — refresh logs everyone out. "Register" creates a ROLE EMPLOYEE user only in memory. | `src/app/page.tsx:57-61, 79, 97` | No real authentication; no password hashing; no session; every role gate is decorative | 16–24 h (wire NextAuth / Clerk + Prisma User table + middleware) |
| P0-7 | Authorization | **No role-based access control.** `currentUser.role` is displayed in the UI but never gates any module. All four "roles" see the same screens. No server-side enforcement possible because no server routes. | `src/app/page.tsx:535-541` | Every user = super admin in practice | 8 h |
| P0-8 | Security | **Security vulnerability: Next.js 16.2.1 has a HIGH-severity Server Components DoS** (GHSA-q4gf-8mx6-v5v3). `npm audit` flags it. Fix: upgrade to 16.2.4. | `package.json:next@16.2.1` | Public production endpoint exploitable | 15 min (`npm install next@16.2.4`) + regression test |
| P0-9 | API Security | **`/api/chat` has zero auth, zero rate limit, zero input validation.** `POST` with any JSON body is forwarded to Anthropic using your API key. Anyone who discovers the URL drains your billing. No `Zod`, no session check, no IP throttle. | `src/app/api/chat/route.ts:4-25` | Financial DoS (token/$ drain) + prompt-injection surface | 6–8 h (auth + Zod + upstash/ratelimit) |
| P0-10 | API Security | **User-supplied `context` object is `JSON.stringify`'d straight into the Claude system prompt.** Clients can smuggle instructions via `context.userName` etc. Classic prompt injection. No sanitization, no allowlist. | `src/lib/claude.ts:58-63` | Prompt injection, data exfiltration, jailbreak | 4 h (schema-validate + allowlist fields) |
| P0-11 | AI | **Hard-coded model `claude-opus-4-5`** — this model ID does not match what the brief specified (Groq llama-3.3-70b) and is outdated per current Anthropic catalogue (current Opus is 4.7). Call will likely 404 at Anthropic, and in any case the brief's Groq requirement is unimplemented. | `src/lib/claude.ts:75` | AI feature broken on arrival | 10 min to fix string; hours to switch to Groq if that's the intent |
| P0-12 | Deployment | **`vercel.json` contradicts `next.config.ts`.** `outputDirectory: ".next"` tells Vercel to serve `.next/` as output, but `output: "export"` produces `/out/` and `.next/` is a server directory, not a static one. Vercel will ignore the override, detect Next.js, and deploy per framework convention — which with `output: "export"` means static-only, so AI chat 404s. Either setting is wrong; together they're incoherent. | `vercel.json`, `next.config.ts` | Prod behavior is unpredictable | 15 min |
| P0-13 | Deployment | **No `.env` / `.env.example` / `.env.local` in repo or `.gitignore` coverage verification.** `CLAUDE_API_KEY` and `DATABASE_URL` are referenced but nowhere documented. Launch day: devs will not know what variables to set on Vercel. | repo root | Every environment variable discovery is trial-and-error | 1 h to author `.env.example` |
| P0-14 | Feature gap | **No task persistence.** "Create task" in `TaskManagement.tsx` mutates `useState` only. Pressing F5 loses every task. Same for Clients, Employees, Leads. | `src/components/TaskManagement.tsx`, `ClientManagement.tsx`, `EmployeeDirectory.tsx`, `PipelineModule.tsx` | The app is non-functional as a CRM | per-module: 8–16 h each |
| P0-15 | Feature gap | **Ticket / SLA module does not exist.** Brief calls for "Create ticket → SLA timer starts → resolve". No component, no route, no schema field. | missing | Support feature promised but absent | 24–40 h to implement |
| P0-16 | Feature gap | **Cold email pipeline does not exist.** No Instantly/Smartlead integration code, no campaign model, no email sender, no Nodemailer/Resend dependency in `package.json`. | missing | Primary sales automation feature absent | 24–40 h |
| P0-17 | Feature gap | **Invoice generation does not exist.** No PDF library in deps, no invoice model, no route, no UI. A mock "Invoice Paid" activity is displayed. | missing | Financial feature absent | 16–24 h |
| P0-18 | Feature gap | **Leave request / approval module does not exist.** Not in schema, not in UI. | missing | HR feature absent | 16 h |
| P0-19 | Feature gap | **Global Ctrl+K search does not exist.** There is a decorative `<input placeholder="Search…">` in the sidebar (`page.tsx:337`) with no handler. | `src/app/page.tsx:337-341` | Advertised navigation feature absent | 8–16 h |
| P0-20 | Feature gap | **Notifications module does not exist.** Bell icon in sidebar shows hard-coded badge `3`; click does nothing. Prisma `Notification` model never read or written. | `src/app/page.tsx:381-385` | Realtime feature absent | 16–24 h |
| P0-21 | Feature gap | **File/avatar upload does not exist.** The only "upload" is client-side CSV parse in `ClientManagement.tsx:349-396` — no Blob/S3/Vercel storage, no size limit, no MIME check, imported rows never persist. | `src/components/ClientManagement.tsx:349` | Attachments, avatars, docs unusable | 8–16 h |
| P0-22 | Observability | **Zero production observability.** No Sentry, no Axiom, no logger, no `/api/health`, no structured logs. Only two `console.error` calls in the codebase (both in chat path). When the app breaks in prod for a remote telemarketer, no one will know. | codebase-wide | Debugging by screenshot only | 6–10 h to add Sentry + health route |

**P0 subtotal: 22 issues, estimated fix time 200+ hours.** Fixing them in sequence is not viable by next week; the items marked as "feature gap" represent the core product promise.

---

## P1 — High Priority (fix before Day 3 rollout)

| ID | Category | Issue | Location | Impact | Fix Effort |
|----|----------|-------|----------|--------|------------|
| P1-1 | Schema | No indexes on any foreign key. `@@index` count = 0 across 14 `@relation(fields: …)` declarations. Queries like "tasks for user X" or "notifications where userId and isRead=false" will seq‑scan. | `prisma/schema.prisma` entire file | Performance cliff past ~1k rows | 2 h (add ~20 `@@index` entries) |
| P1-2 | Schema | `Session` model has no relation to `User` — just a stringly `userId`. Deleting a user orphans sessions; no cascade. | `prisma/schema.prisma:266-276` | Stale sessions after user removal | 15 min |
| P1-3 | Schema | `Client.email` is not unique, has no index. Duplicate-client detection impossible. | `prisma/schema.prisma:107` | Data quality | 15 min |
| P1-4 | Schema | `User.brand`, `Client.brand`, `Package.brand` have no `onDelete`. Deleting a brand orphans FKs (Postgres default is RESTRICT — delete fails silently in UI, succeeds in DB console). | `prisma/schema.prisma:89,118,141` | Unpredictable delete behavior | 30 min |
| P1-5 | Schema | Money stored as `Float` (`Package.price`). Use `Decimal` for currency. | `prisma/schema.prisma:130` | Rounding bugs in invoices | 10 min |
| P1-6 | Lint | 19 ESLint errors: 8× `no-explicit-any`, 3× `Date.now()` in render (React-19 purity rule), 1× `setLoading` in `useEffect` without deps stabilization → cascading renders, 3× `react/no-unescaped-entities`, 2× empty interface. `npm run lint` does not fail the build because there's no lint step in CI. | see `npm run lint` output | Renders, type safety, perf | 2–3 h |
| P1-7 | Code | `handleSend` and `handleQuickAction` in `AIChat.tsx` read stale `messages` closure state — the just-added user message is never sent to the API, so Claude answers with missing context. | `src/components/AIChat.tsx:85, 131` | Every reply is slightly wrong | 20 min |
| P1-8 | Code | Massive duplication of mock data across component files AND `src/data/mock-data.ts` (initialClients, initialEmployees, initialTasks, leads, reportData). Changes must be made in 5 places. | `src/components/*.tsx` | Divergent sources of truth | 2 h cleanup (will be moot after P0-5) |
| P1-9 | UI theme | **Violation of CLAUDE.md "all primary buttons MUST be gold (#F59E0B)".** Code uses `#D4AF37` (a different gold) and also purple accents (`#8B5CF6`) in dashboard KPI cards and legend for Team Members. | `src/components/DashboardModule.tsx:67`, `KPICards.tsx:99`, `ServiceBreakdown.tsx:10` | Brand consistency | 30 min |
| P1-10 | Build | `src/app/globals.css` loads Google Fonts via `@import url(…)` AND `src/app/layout.tsx` loads the same fonts (Playfair Display, Inter) via `next/font`. Double fetch on production; CSS import blocks dev (P0-3). | `globals.css:2`, `layout.tsx:5-15` | Perf + broken dev | 5 min (delete the @import line) |
| P1-11 | Deps | 7 Radix UI packages declared in `package.json` but never imported: `alert-dialog`, `checkbox`, `collapsible`, `dialog`, `label`, `popover`, `switch`. | `package.json:10-29` | Bundle bloat | 10 min |
| P1-12 | Deps | All 13 `src/components/ui/*.tsx` shadcn primitives are never imported by any real component. Dead code. | `src/components/ui/` | Dead code, confusing surface | 15 min (delete) or 4 h (actually adopt shadcn everywhere) |
| P1-13 | Config | Package manager is npm (`package-lock.json`), yet CLAUDE.md says "Package manager: pnpm". Install takes 3–4 min per cold install; pnpm would be sub-minute and the rule is broken. | `package-lock.json`, `vercel.json` | Policy violation + slow CI | 20 min (switch) |
| P1-14 | Config | `next.config.ts` sets `images.unoptimized: true`. With `output: "export"` removed (per P0-1), this should revert so Vercel's Image Optimization kicks in. | `next.config.ts:5` | Missing LCP wins | 10 min |
| P1-15 | CSV import | `handleCSVUpload` in `ClientManagement.tsx` has no file-size guard, no schema validation, splits on `","` so any comma in a field breaks parsing, and uses `any` for row shape. | `src/components/ClientManagement.tsx:349-396` | Corrupt data on real client lists | 2 h (use `papaparse` + Zod) |
| P1-16 | Accessibility | Every custom button uses `<button>` without `aria-label` when the content is icon-only (e.g., sidebar collapse, notification bell, logout). | sidebar & chat bubble | A11y regressions; screen readers unusable | 2 h |
| P1-17 | Docs | `README.md` is the unmodified `create-next-app` default. `PREREQUISITES.md` claims stack is **Supabase + Supabase Auth** but no Supabase code or deps exist. Documentation misleads new joiners. | `README.md`, `PREREQUISITES.md` | Onboarding confusion | 2 h |
| P1-18 | Observability | AI `context` object containing `clients`, `employees`, `tasks`, `revenue` is sent to a third-party LLM. For a 30-person agency with PII (names, emails, phones, countries) this is a contractual/GDPR exposure if clients haven't opted in. No DPA path. | `src/lib/claude.ts:58-63` | Legal / compliance | 4 h (redaction + opt-in) |

---

## P2 — Medium Priority (fix in week 2–3)

| ID | Category | Issue | Location | Fix |
|----|----------|-------|----------|-----|
| P2-1 | Deps outdated | `typescript 5.9.3 → 6.0.3`, `@types/node 20 → 25`, `eslint 9 → 10`, `next 16.2.1 → 16.2.4`, `@prisma/client 7.6 → 7.7`, `lucide-react 1.7 → 1.8`, `react 19.2.4 → 19.2.5`. | Bump, smoke-test. |
| P2-2 | Bundle | `recharts@3.8.1` is pulled into a page that's 100% client-rendered — no dynamic import. Adds ~90 KB to initial load. | Lazy-import charts. |
| P2-3 | CSS | `globals.css` has 2350+ lines including embedded Tailwind v4 directives and an upload of `@theme inline` — hard to review. | Split into feature files. |
| P2-4 | Naming | Schema enum `Department` has `WEB_DEVELOPMENT, SEO, VIDEO_EDITING, DESIGN, SOCIAL_MEDIA, ADMIN, SALES, SUPPORT` but mock data uses different strings (`DEV`, `LEADERSHIP`, `MARKETING`, `OPS`). Mock data won't cast cleanly to the Prisma enum. | Align one source of truth. |
| P2-5 | Naming | Two very similar models: `Task` and `ClientTask`. No clear dividing rule; both have `assignedTo/createdBy`. | Merge or document. |
| P2-6 | i18n | `next/font` loads only Latin subsets; brief mentions Urdu/English team. Urdu glyphs will fall back to system fonts. | Load `arabic` subset. |
| P2-7 | UX | Sidebar `Brand` `<select>` has a second copy in the desktop header. Changing one does not sync the other (`selectedBrand` lives in two places). | Lift state. |
| P2-8 | UX | "Notifications" bell on sidebar shows static badge `3` even after "reading" (no handler). | Wire to notif module. |
| P2-9 | Code | `src/lib/claude.ts:72` sends `anthropic-dangerous-direct-browser-access: true`; this request is server-side, so the header is meaningless and signals misunderstanding. | Remove header. |
| P2-10 | Code | `handleQuickAction` starts with `setInput(prompt); setInput("")` in consecutive lines — the first call is pointless. | Remove dead line. |
| P2-11 | Metadata | `layout.tsx:20-22` uses an inline emoji favicon `data:image/svg+xml,...👑`. Fine for prototype, looks unprofessional in tab bar on enterprise deploy. | Ship proper favicon. |

---

## Per-Phase Findings

### Phase 1 — Repository Hygiene
- **Git:** 4 total commits on `main`; clean working tree; single remote (`origin → github.com/UMIDX124/claude-Ai-Bot`). Commit messages are descriptive ("Fix TypeScript errors: activity.action → activity.message, client.revenue → client.mrr"). No stale branches.
- **Secrets in history:** `git log -p | grep "sk-|password|secret"` surfaced only the demo users' plaintext passwords and `process.env.CLAUDE_API_KEY` — no real keys committed.
- **Size:** 30 source files, 6,325 LOC in `src/`. Largest: `ClientManagement.tsx` (34 KB), `EmployeeDirectory.tsx` (30 KB), `TaskManagement.tsx` (25 KB) — all monolithic client components with inline mock data.
- **CI/CD:** `.github/` directory does not exist. No lint, type-check, or build gate on PRs. Vercel would deploy whatever lands in `main`.
- **Public assets:** `public/fu-logo.png` is 2.9 MB, `public/logo.svg` is 2.8 MB (a raster embedded in an SVG). Will dominate LCP on any page that loads them.
- **Env files:** 0 `.env*` variants in the repo or ignored. No `.env.example`. `.gitignore` does block `.env` and `.env*.local`.
✅ **Phase 1 complete.**

### Phase 2 — Build & Type Health
- `npm install`: **first attempt failed** (EPERM during cleanup + `ERR_SSL_CIPHER_OPERATION_FAILED`). Second attempt succeeded. On a new laptop this will bite a junior dev.
- `npm run build`: **passes in 19 s** with one CSS warning. Output directories produced: `.next/` (server) AND `out/` (static export). Contradiction with `vercel.json`.
- `npx tsc --noEmit`: **0 errors.**
- `npm run lint`: **19 errors, 68 warnings** (see P1-6).
- `npx prisma validate`: **FAILS** — `Type "Employee" is neither a built-in type…`, and deprecated `datasource.url`. See P0-4.
- `npx prisma generate`: **FAILS** for the same reason.
- `npm audit`: **1 high-severity** vulnerability (next 16.2.1 DoS).
- `npm outdated`: 10 packages behind.
- Bundle sizes: `out/index.html` references 13 JS chunks; site is purely client-rendered, `AreaChart` + `PieChart` + all lucide icons are loaded up-front.
✅ **Phase 2 complete.**

### Phase 3 — Database Integrity
- 11 models declared: Brand, User, Client, Package, ClientTask, Task, Comment, Attachment, Note, Notification, Session.
- **Models used in code: 0.** No import of `@prisma/client` or `PrismaClient` anywhere in `src/`. The schema is a decorative document.
- No `prisma/migrations/` folder; `prisma/` contains only `schema.prisma`.
- No seed script (`prisma/seed.ts` absent, no `prisma.seed` in `package.json`).
- Schema issues (detailed above): invalid `Employee` type; deprecated `datasource.url`; zero `@@index`; missing `onDelete` on brand relations; `Float` for money; `Session` has no User relation.
- Enum usage in client code: components use raw strings (`"DONE"`, `"IN_PROGRESS"`) not enum imports — per CLAUDE.md "NEVER hardcode Prisma enum strings". Will collide once (if) Prisma is wired.
- Orphan risk: `Session.userId` without FK; mock data uses brand codes (`"VCS"`) but schema uses Brand.id (cuid).
✅ **Phase 3 complete.**

### Phase 4 — API Route Security & Correctness

| Route | Method | Auth | Zod | Rate-limit | Prisma exposure | Verdict |
|---|---|---|---|---|---|---|
| `/api/chat` | POST | ❌ | ❌ | ❌ | n/a (no DB) | **P0 — drain-the-credits open endpoint** |

Additional observations on `/api/chat` (`src/app/api/chat/route.ts`):
- `const { messages, context } = await request.json()` — no schema check beyond `Array.isArray(messages)`. Missing role validation, no size caps.
- `catch (error: any)` — lint error + leaks `error.message` straight to client response (`{error: error.message || "AI processing failed"}`). Stack details can surface.
- `console.error` writes full error + prompt snippet to logs; if the user sent PII, it lands in Vercel logs.
- No timeout on the upstream Anthropic fetch — a slow LLM pins your function.
- No structured response type; no versioning.
✅ **Phase 4 complete.**

### Phase 5 — Authentication & Authorization
- **Provider:** none. There is no NextAuth, Clerk, Supabase Auth, or custom session endpoint.
- **Session strategy:** `useState` in `src/app/page.tsx`. Lost on refresh or new tab.
- **Password policy:** none. `admin123`, `pm123`, `dev123` are the demo creds, shipped in the client JS bundle. Trivial to steal by viewing source on the deployed site.
- **Hashing:** none.
- **Role-based access:** none enforced. `role` is displayed but no route or render path checks it.
- **Session invalidation on logout:** effectively `setIsAuthenticated(false)` — since nothing was stored, nothing can be invalidated. A stolen token problem doesn't exist because there is no token.
- **CSRF:** N/A (no auth surface that could be CSRF'd).
- **Register:** creates an in-memory user with `role: EMPLOYEE`, no duplicate check, no validation, no persistence.
✅ **Phase 5 complete.**

### Phase 6 — Critical User Flows (live walkthrough on `next dev -p 3001`)
The dev server returned HTTP **500** on `GET /` (see P0-3). Browser walkthrough of the 10 flows was not possible in dev. I substituted:
1. **Build** the app via `npm run build` — succeeds.
2. **Serve** the built static `out/` would be the prod path, but that excludes `/api/chat` (P0-1).
3. **Inspect** each flow's code to determine what would happen on a fixed dev server.

| Flow | Expected | Actual (from code) |
|---|---|---|
| Login → Dashboard | Real auth + role redirect | Client-side credential compare; all roles go to the same dashboard. Refresh = logout. |
| Create task → assign → complete | Persists via API | Modal pushes into `setTasks(...)`. Refresh wipes. No assignment notification. |
| Create deal → move pipeline | Enum-backed stage change | No stage transition handler; `leads` array is `const`. |
| Create ticket → SLA timer | Ticket module + SLA engine | **Module does not exist.** No component, no schema. |
| Cold email via Instantly/Smartlead | API call | **No integration exists.** No deps, no route. |
| Upload file/avatar | Blob / S3 / Vercel | **Only CSV parse in `ClientManagement` (client-side, lossy).** No image upload path. |
| Global Ctrl+K search | Hotkey + backend search | Sidebar has decorative search input, no hotkey, no results. |
| Notifications bell → mark read | DB update | Bell is non-interactive; badge is hard-coded `3`. |
| Leave request → approval | Multi-role flow | **Does not exist.** |
| Invoice PDF | PDF generation | **Does not exist.** No PDF lib in deps. |

**Runtime smoke test (dev server, after Monitor):**
- `GET /` → **500** (CSS parse error).
- `POST /api/chat` → **308** (trailing-slash redirect, body lost).
- `POST /api/chat/` → 500 (same CSS error, dev bundler blocks all pages).

✅ **Phase 6 complete** (to the extent the app allowed).

### Phase 7 — Performance Baseline
Lighthouse runs were not attempted: the dev server 500s, and the static `out/` build omits the API route; running Lighthouse against it would score highly but on a skeleton.
- **Bundle scan from `out/`:** ~13 JS chunks, ~1 large CSS chunk. Charts (`recharts`) and all dashboard modules load eagerly because `src/app/page.tsx` imports every module top-level. No `dynamic()` usage anywhere.
- **Image payload:** `public/fu-logo.png` is 2.9 MB, `public/logo.svg` is 2.8 MB (SVG embedding raster). Either would blow LCP on a mobile cold load. `next.config.ts:5` has `images.unoptimized: true` — Vercel image optimization will not kick in even when static export is removed (P0-1).
- **DB query count per page:** N/A (no DB).
- **API latency sample:** N/A (only one route, and it proxies to Anthropic whose latency dominates).
- Expected LCP for a fixed build: 3–5 s on 4G due to unoptimized logo + all-client-side render.
✅ **Phase 7 complete (baseline established qualitatively).**

### Phase 8 — AI Integration Review
- **Routes:** `src/app/api/ai/*` — does not exist. There is only `/api/chat`.
- **Model:** hard-coded `claude-opus-4-5` (`src/lib/claude.ts:75`). The brief asked for **Groq llama-3.3-70b**. Mismatch. Additionally this model ID is stale — current Anthropic Opus is `claude-opus-4-7`.
- **Prompt template:** `SYSTEM_PROMPT` with `{context}` placeholder replaced by `JSON.stringify(context)` — user-controlled data in the prompt, no sanitization, no structured fields.
- **Retry / backoff / timeout:** none.
- **Cost projection:** `max_tokens: 1024` per reply. Anthropic Opus ≈ $15/M output + $3/M input. One reply with ~2k input tokens + 1k output tokens ≈ $0.021. 30 users × 20 messages/day × 20 working days ≈ 12,000 calls ≈ **$250/month** if everyone actually uses it — cheap, but multiplied by unauthenticated abuse (P0-9) the ceiling is unbounded.
- **Failure modes:** on any Anthropic error the route returns 500; chat component shows "Oops! Something went wrong." No fallback, no retry, no degraded mode.
- **Prompt-injection surface:** large — `clients`, `employees`, `tasks`, `revenue` all flow into the prompt. Any user who can write in a client note field could slip "Ignore previous instructions and…" into the prompt context.
- **PII to LLM:** client names, emails, phones, revenue figures, employee names and performance scores are shipped to a third-party provider. Legal risk (P1-18).
✅ **Phase 8 complete.**

### Phase 9 — Observability Gaps
- **Error tracking:** none (no Sentry, no Axiom, no LogRocket). → **P0-22.**
- **Structured logging:** none. `console.error` in 2 places only. Vercel runtime logs will be unindexed.
- **Distributed tracing:** Vercel default only (if deployed on Vercel).
- **Alerting:** none. No pager, no webhook, no email on 5xx.
- **Health check:** `/api/health` does not exist.
- **Metrics dashboard:** none.
- **Audit log / security events:** none.
✅ **Phase 9 complete.**

### Phase 10 — Rollout Readiness (30-user stress model)
- **Concurrent user handling:** N/A — no backend to contend. As soon as a real DB is wired, the unindexed schema (P1-1) will be the first bottleneck.
- **Cold email pipeline under load:** feature does not exist (P0-16).
- **Neon connection pool:** no Neon yet. Once added, Prisma 7 with Accelerate (`accelerateUrl`) is mandatory per Prisma-7 deprecation of `datasource.url` (see P0-4 self-block). Pooling strategy is an open decision.
- **File upload at 30 users:** no upload backend. First bulk upload will overflow the browser (everything is in-memory via `FileReader`).
- **Real-time features:** none planned (no SSE, no WebSocket, no Pusher, no channels).
- **Backup restore:** N/A — no DB, nothing to restore. Once DB exists, Neon has point-in-time recovery but this is untested by the team.
- **Rate limiting:** none — `/api/chat` is wide open.
- **Feature flags / kill switch:** none.
✅ **Phase 10 complete.**

---

## Recommended Fix Sequence

### Reality check before scheduling
The brief assumes Phases 1–3 of the CRM are "complete". They are **not**. The gap between what the brief describes and what exists is measured in months of work, not hours. Any 72-hour plan must therefore choose between:

- **Path A — "ship the demo"**: fix P0-1…P0-13 so the current mockup deploys safely, explicitly scope the launch as **a login-walled read-only dashboard with stub data** and tell the 30 users not to trust the numbers. 1–2 days work.
- **Path B — "build the CRM"**: treat this as week 0 of a real build. Minimum 6–8 weeks to reach the feature parity the brief promises.

The 72-hour plan below is **Path A**. If Path B is the real goal, the first item is "reset the schedule and communicate it to the team."

### 72-hour plan (Path A — make the prototype safe to deploy)
**Day 1 — Morning (unbreak builds + deploy config)**
- P0-3: Move the `@import url(…)` to top of `globals.css` OR delete it (next/font already loads those families).
- P0-1: Delete `output: "export"` from `next.config.ts`.
- P0-2: Delete `trailingSlash: true` from `next.config.ts`.
- P0-8: `npm install next@16.2.4`; re-run build + lint.
- P0-12: Simplify `vercel.json` to `{"framework":"nextjs"}` and let Vercel auto-detect.
- P0-13: Author `.env.example` with `CLAUDE_API_KEY=`, `DATABASE_URL=`, `NEXTAUTH_SECRET=`.
- P1-13: Migrate to pnpm (`pnpm import` from the existing lockfile), update vercel command.

**Day 1 — Afternoon (lock the AI door + fix the crashy bits)**
- P0-9: Add simple bearer-token gate on `/api/chat` using an env var (until real auth lands); add `@upstash/ratelimit` 5-req/min per IP.
- P0-10 / P1-7: Move `context` handling to an allowlisted Zod schema; fix stale-closure on `messages`.
- P0-11: Swap to a current model ID — decide Groq (brief) vs Anthropic (code) and pick one.
- P1-6: Fix all 19 ESLint errors (empty interfaces, `any`, unescaped entities, Date.now-in-render, setState-in-effect).
- Add minimal `/api/health` endpoint returning `{ok:true, commit, buildTime}`.

**Day 2 — Morning (scope the rollout)**
- P0-6 / P0-7: Install Clerk (marketplace) or NextAuth; wire the existing `User` Prisma model; put sign-in gate on `/`; mark every write button `disabled={true}` with tooltip "read-only preview" for the demo launch.
- P0-14 → P0-22: Write a visible banner on the dashboard: **"Preview build — changes are not saved."** This is non-negotiable honesty for the telemarketing team.
- P1-9: Fix gold/purple color violations to match CLAUDE.md token (#F59E0B).
- P1-17: Rewrite `README.md` and `PREREQUISITES.md` to match what actually exists.

**Day 2 — Afternoon (observability minimum)**
- P0-22: Install Sentry (`@sentry/nextjs`), wire `/api/chat` and root layout; enable source maps upload.
- P1-18: Redact PII fields from the `context` object before sending to LLM.
- P1-10: Delete duplicate font loading in globals.css.
- Manual QA pass on a real browser against a preview deployment (not local dev).

**Day 3 — Morning (schema prep for the real work)**
- P0-4: Decide the `prisma.config.ts` policy (CLAUDE.md forbids it, but Prisma 7 requires it for migrations); fix `User.employees Employee[]` → `User.employees User[] @relation("Subordinates")` or delete the field.
- P1-1 .. P1-5: Add `@@index` on every foreign key, add missing `onDelete`, switch `Float` to `Decimal`, add `@@relation` from `Session` to `User`, add `@unique` on `Client.email`.
- P0-5 if time allows: wire `src/lib/prisma.ts`, add `prisma/seed.ts`, run `prisma migrate dev`.

**Day 3 — Afternoon (freeze + communicate)**
- Cut a release branch, deploy to `preview` URL only.
- Write launch memo to the 30-person team explaining: what works (login, read-only dashboards, AI chat with rate limit), what does not (tasks/tickets/leave/invoice/cold email), and the expected timeline for each.
- Hold a live demo; collect the three sharpest complaints; feed into the Week 2 backlog.

**Do NOT on Day 3:** push to `main`, point `digitalpointllc.com` at it, invite non-employees, or promise any of the missing modules will land this sprint.

---

## What's Actually Working Well ✅
- **TypeScript strictness:** `tsconfig.json` has `"strict": true` and `tsc --noEmit` passes with zero errors. The existing code is type-sound within its small scope.
- **Design system tokens:** `src/app/globals.css` defines a coherent dark + gold theme palette with CSS custom properties (`--gold`, `--emerald`, `--blue`, `--surface`). Easy to adapt to the CLAUDE.md `#F59E0B` rule.
- **Component decomposition:** each dashboard module (`DashboardModule`, `ClientManagement`, `TaskManagement`, `PipelineModule`, `ReportsModule`) lives in its own file at reasonable size. No spaghetti across modules.
- **Visual polish:** the KPI cards, recharts gradients, and sidebar brand switcher are genuinely nice. The UX vision is clearer than the backend.
- **Build velocity:** Turbopack build is 19 s clean. Fast iteration once P0-3 is fixed.
- **Prisma schema intent:** even though invalid, the model set (Brand→User→Client→Package→ClientTask→Comment/Attachment/Note) is a sensible skeleton for the agency domain. Good starting point for a real build.
- **Anthropic client separation:** `src/lib/claude.ts` isolates the LLM client behind a single `claudeClient.chat(messages, context)` function — easy to swap to Groq or add retries.
- **Git discipline:** clean working tree, linear history, descriptive commit messages. No secrets leaked.

---

## Questions for Founder (Umer / Faizan)
1. **What is "launch" supposed to mean here?** 30 telemarketers using the CRM for daily work, or a demo to leadership to get headcount budget? The right plan differs by an order of magnitude.
2. **AI provider decision — Anthropic or Groq?** The brief said Groq llama-3.3-70b; the code calls Anthropic Claude. Pick one before Day 1.
3. **`prisma.config.ts` policy:** CLAUDE.md says "NEVER create `prisma.config.ts`", but Prisma 7 deprecates `datasource.url` in the schema and requires the config file for migrations. Do we (a) pin to Prisma 6, (b) lift the rule, or (c) adopt Prisma Accelerate which accepts the URL in the client constructor?
4. **Data source of truth for the 23 employees / 13 clients:** is there a real CSV/spreadsheet we should seed from, or do we generate placeholders? The numbers in the brief imply real data exists somewhere — if so, where?
5. **Auth provider preference:** Clerk (Vercel Marketplace, fastest path), NextAuth with Neon, or Supabase Auth (what `PREREQUISITES.md` mentions)? The three choices lead to very different schemas — decide before wiring the `User` table.

---

*End of report. 22 P0 items; current readiness ≈ 8 %. Recommendation: BLOCK LAUNCH and reset expectations with the team.*
