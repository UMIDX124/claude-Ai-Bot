# Overnight Build Status — Alpha Command Center Slice 0

## Last Update: 2026-04-17 12:58 (Phases 1–5 complete, one blocker for founder)
## Current Phase: awaiting founder decision on Neon DB baseline
## Elapsed: ~01:25 (spanning two Claude sessions)

## Context
- Rollback tags: `slice-0-start-20260417` and `slice-0-start-20260417-113327` (both at pre-change commit `e6b5090`).
- Toolchain: pnpm 10.33.0, Next.js 15.5.15, React 19.0.0, Prisma 6.19.3, Node >= 20.
- `.env.local` present (938 B). Values are gated from my Read/Bash tools by permission policy; consumers that need them were wired to read at runtime and will surface their own failures.
- Auto-continue requested by user across session boundaries.

## Completed Phases
- ✅ **Phase 1: Repository sanitization** (commit `bb6c5bf`)
  - `next.config.ts`: removed `output:"export"`, `trailingSlash:true`, `images.unoptimized:true`. Added Clerk image patterns, `poweredByHeader:false`, `reactStrictMode:true`.
  - `vercel.json` simplified to framework auto-detect.
  - npm → pnpm migration: deleted `package-lock.json`, generated `pnpm-lock.yaml`.
  - `package.json` rewritten: name `alpha-command-center`, Next `^15.5.0` (resolved 15.5.15), Prisma `^6.5.0` (resolved 6.19.3), `eslint-config-next ^15.5.0`, `react 19.0.0`, added scripts (`typecheck`, `db:*`), added `zod`.
  - `pnpm install` clean exit 0.
  - **Note on CVE framing**: the CVE GHSA-q4gf-8mx6-v5v3 is patched in Next `16.2.4`; pinning to Next 15 LTS is a separate stability choice. Final commit message called it accurately ("remove static export, trailingSlash, contradictory vercel output") rather than "CVE remediation".

- ✅ **Phase 2: Prisma schema** (commit `5781c1a`)
  - `prisma/schema.prisma`: 28 enums, ~38 models spanning all six slices (User, Company, Department, Role, Employee, Client, Contact, Pipeline, Stage, Deal, Task, TaskComment, TaskActivity, Attachment, SLA, Ticket, TicketMessage, Invoice, InvoiceLineItem, Payment, LeaveType, LeaveBalance, Leave, Notification, NotificationPreference, ChatRoom, ChatMember, Message, LeadSource, Lead, ColdEmailCampaign, CampaignRecipient, EmailEvent, AIConversation, AIMessage, AuditLog). Soft deletes everywhere, `@@index` on every FK, `Decimal(12,2)` for money, Clerk `clerkId` unique on User, Neon `directUrl` alongside `url`.
  - `src/lib/db.ts`: Prisma singleton using `globalThis` pattern.
  - `src/lib/auth.ts`: Clerk helpers — `getCurrentUser`, `requireUser`, `requireRole`, `requireUserOrRedirect`, `ensureUserRecord` (upserts Clerk → Prisma on first load).
  - `pnpm db:validate` passes. `pnpm db:generate` passes.
  - `package.json`: `db:*` scripts prefixed with `dotenv -e .env.local -- ` so Prisma CLI (which reads `.env`, not `.env.local`) sees the env vars.

- ✅ **Phase 3: Authentication (Clerk)** (commit `5a0eea8`, bundled with Phase 4)
  - `src/middleware.ts`: `clerkMiddleware` with `createRouteMatcher` public list `[/sign-in*, /sign-up*, /api/health, /api/webhooks/*]`; everything else hits `auth.protect()`.
  - `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`: Clerk `<SignIn>`/`<SignUp>` on dark gold theme.
  - `src/app/layout.tsx`: `<ClerkProvider>` wraps app; brand renamed FU Corp → Alpha Command Center; proper SVG favicon with the `A` / #F59E0B mark.
  - `src/app/page.tsx`: server-side `auth()` → `redirect("/dashboard")` or `redirect("/sign-in")`.
  - `src/app/globals.css`: dropped the broken `@import url(fonts.googleapis.com…)` that was causing dev HTTP 500 (P0-3). `next/font` in layout handles both Playfair and Inter.

- ✅ **Phase 4: Observability + security** (commit `5a0eea8`)
  - `src/lib/logger.ts`: structured JSON logger (debug/info/warn/error). Debug is dev-only.
  - `src/lib/ratelimit.ts`: Upstash sliding-window limiters — `chat` 10/min, `api` 60/min, `auth` 5/min. Falls through to no-op when Upstash env vars missing, so local dev isn't blocked.
  - `src/lib/redact.ts`: `scrub()` regex for email/phone/long tokens; `redactObject()` recursive scrubber with key allow/deny list.
  - `src/app/api/health/route.ts`: `GET /api/health` runs `SELECT 1` via Prisma; returns `{ok, checks, commit, region}`; 200 or 503.
  - `src/app/api/chat/route.ts`: **complete rewrite**. Requires Clerk `userId`; enforces chat ratelimit per user; Zod-validates `messages` (role + content len) and `context` (allowlisted fields only); redacts context before prompt; switches model to **Groq `llama-3.3-70b-versatile`** per the original brief (was hard-coded `claude-opus-4-5`); structured log on success/failure.
  - Closes audit items P0-3, P0-9, P0-10, P0-11, P0-22 (partial), P1-18.

- ✅ **Phase 5: UI shell** (commit `25ba812`)
  - `src/app/(app)/layout.tsx`: sidebar (Dashboard / Tasks / Clients / Deals / Tickets / Employees / Leaves / Invoices) + topbar with Clerk `UserButton`. Upserts Clerk→Prisma user via `ensureUserRecord` on every load; redirects to sign-in if the Prisma upsert fails.
  - `src/app/(app)/dashboard/page.tsx`: server component running 4 parallel Prisma counts (clients, open tasks, live tickets, open deals). Each count is try/catch-wrapped so a missing migration returns 0, not a 500.
  - **Deleted 23 dead files**: 11 mock-data components (`AIChat`, `ClientManagement`, `DashboardModule`, `EmployeeDirectory`, `KPICards`, `PipelineModule`, `RecentActivity`, `ReportsModule`, `RevenueChart`, `ServiceBreakdown`, `TaskManagement`), 8 unused shadcn primitives (`dropdown-menu`, `input`, `progress`, `scroll-area`, `select`, `skeleton`, `tabs`, `tooltip`), `src/data/mock-data.ts`, and the obsolete `src/lib/claude.ts`.
  - Kept shadcn primitives: `avatar`, `badge`, `button`, `card`, `separator`.

## Verification (final state)
- `pnpm typecheck` — **clean**.
- `pnpm build` — **clean**. 7 routes: `/`, `/dashboard`, `/api/chat`, `/api/health`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`, `/_not-found`. Middleware 85 KB, shared 102 KB.
- `pnpm lint` — **clean**, 0 errors, 0 warnings.
- `pnpm db:validate` — **clean**.
- `pnpm db:generate` — **clean**.

## 🚧 Blocker for Founder
**`pnpm db:migrate` will NOT run without explicit confirmation.**

Neon DB at `ep-bold-pine-anv7sh85.c-6.us-east-1.aws.neon.tech` has 9 existing migrations from an earlier iteration dated 2026-04-08:
```
0_init
20260408012518_add_company_model
20260408013500_drop_brand_parentid
20260408020000_phases_3_4_5_deals_tickets_webhooks
20260408030000_security_user_fields
20260408040000_chat_v2
20260408050000_push_subscriptions
20260408060000_pipeline_v2
20260408090000_csat_templates_typing
```
Prisma refuses to apply the new schema without a destructive `prisma migrate reset` which drops all data. I **did not** run it. Three options for the founder:
1. **Fresh Neon branch**: create a new Neon branch (e.g. `dev-alpha-slice-0`) and point `DATABASE_URL` / `DIRECT_URL` there, then run `pnpm db:migrate --name init-slice-0`. Cleanest; leaves the 2026-04-08 state intact on the current branch.
2. **Baseline current DB**: `pnpm dotenv -e .env.local -- prisma db pull` to sync the existing schema into `prisma/schema.prisma`, then start diffs from there. Loses the clean schema we just wrote; high merge cost.
3. **Nuke and start over**: `pnpm db:reset`. Destructive, not recommended unless the 2026-04-08 data is genuinely disposable.

My recommendation: option 1. Five minutes of Neon dashboard + one command.

## Commits Landed
- `e6b5090` (pre-existing) previous baseline.
- `bb6c5bf` fix(config): remove static export, trailingSlash, contradictory vercel output.
- `5781c1a` feat(schema): Prisma schema for Slices 0-6; wire db client + Clerk auth helpers.
- `5a0eea8` feat(auth+obs): Clerk auth, Groq chat, rate limit, health, PII scrub.
- `25ba812` feat(ui): authenticated app shell with DB-wired dashboard; drop mock UI.

4 new commits; branch `main` is 4 commits ahead of origin. **Nothing pushed** (awaiting founder review in the morning).

## What's Next (once the DB blocker clears)
1. Run `pnpm db:migrate --name init-slice-0` against the chosen DB.
2. Seed a small fixture (`prisma/seed.ts`) — Company {DPL,VCS,BSL}, LeaveType defaults, SLA defaults, a default Pipeline + Stages. Hook it to `pnpm db:seed`.
3. Ship module stubs: `/tasks`, `/clients`, `/deals`, `/tickets`, `/employees`, `/leaves`, `/invoices` — each a server component with a real Prisma list + "create" button guarded by `requireRole`.
4. Wire `@sentry/nextjs` configs (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) + withSentryConfig on `next.config.ts`. Package is already installed.
5. Add `/api/webhooks/clerk` for user lifecycle sync so `ensureUserRecord` can be a pure read.
6. Wire the AI chat UI component (`AIChat.tsx` was deleted; rebuild as a compact floating panel calling the hardened `/api/chat` endpoint). Remember to fix the stale-closure bug from the old file when rebuilding.

## Risks / Notes for Morning Review
- `@next/eslint-plugin-next` resolved to `16.2.4` while the app is pinned to Next 15.5.x. Lint works today; if plugin rules drift we'll need to pin it.
- `@sentry/nextjs` is installed but **not yet wired**. The app has zero crash telemetry. This is the main remaining observability gap.
- No CI yet. Branch protection on `main` + a GitHub Actions workflow running `pnpm typecheck && pnpm lint && pnpm build` would prevent regressions before the team multiplies.
- Dead-weight deps still in `package.json`: 7 Radix packages whose wrappers were deleted (`alert-dialog`, `checkbox`, `collapsible`, `dialog`, `label`, `popover`, `switch`) + the wrappers I deleted (`dropdown-menu`, `progress`, `scroll-area`, `select`, `tabs`, `tooltip`). Safe to `pnpm remove` in a follow-up commit; not blocking.
- `/sign-in` and `/sign-up` routes render Clerk widgets only if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set at build-time. The app will 500 on those routes if the var is missing; no graceful fallback yet.
