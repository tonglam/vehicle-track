# Vehicle Track – Architecture & Delivery Plan

## Purpose

Establish a clear, enforceable plan for delivering the Vehicle Track admin system that aligns with the agreed architecture, quality bar, and operating constraints (Vercel + Cloudflare + Supabase).

## Objectives & Success Criteria

- Secure login with Better Auth; enforce role-based access (`admin`, `user`) on all dashboard pages.
- Deliver core dashboard with CRUD for vehicles, users, and operational data using Drizzle ORM + Supabase.
- Maintain clean, composable UI (Tailwind + shadcn) and data handling (TanStack Query/Table).
- Production-ready posture: Zod validation on inputs, typed APIs, zero `any`, secrets kept out of repo, eslint/tsc clean builds.

## Scope

- In: Next.js App Router stack; Supabase PostgreSQL with Drizzle schema/migrations; API routes under `app/api/*/route.ts`; services in `lib/services/*`; reusable UI in `components/*`; types in `types/*`.
- Out (initial phase): public marketing site, mobile apps, advanced analytics, multi-tenant features.

## Scale Assumptions (current)

- Target footprint: ~100 users; optimize for simplicity and maintainability over heavy-scale patterns.
- Favor built-in Next.js caching and straightforward Supabase usage; defer complex sharding/queueing/observability until scale demands it.

## High-Level Clarifications (MVP)

- Audience & roles: Internal management system; roles include admin/super user, manager (data management), inspector, viewer.
- Success focus: Highest reliability for login, health, and data management at this scale.
- Data domains: Detailed models/functions deferred to low-level design.
- Compliance & security: Standard AU website requirements; keep secrets out of repo; baseline best practices.
- Availability & performance: Not primary for MVP; keep architecture simple, monitor basics.
- Environments: Dev and Prod only (small scale).
- Auth: Email/password only (Better Auth); no SSO/MFA for MVP.

## Architecture Overview

- **Frontend**: Next.js App Router. Server Components by default; Client Components only for interactivity (forms, tables, inputs). TanStack Query for data fetching/mutations; TanStack Table for data grids. Tailwind + shadcn UI.
- **Auth**: Better Auth with email/password. Middleware to gate `/dashboard/*`; role checks at route/service boundaries. Session storage aligned with Better Auth defaults; avoid `any`.
- **API Layer**: `app/api/*/route.ts` for request parsing, auth/role enforcement, Zod validation, and mapping to services. Return `{ error: string }` for failures; hide internals.
- **Services**: `lib/services/*` for business logic. No DB or auth logic in route files.
- **Data**: Supabase Postgres, Drizzle ORM (schema + migrations). No raw SQL. Caching where safe for reads.
- **Styling/UX**: Tailwind config aligned with shadcn tokens; keep components small and composable.
- **Deployment**: Vercel (free tier initially), Cloudflare DNS in front. Env vars via Vercel. Production checks: `pnpm lint`, `pnpm test` (when added), `pnpm typecheck`, `pnpm build`.

## Initial Domain Model (proposed)

- `users`: id, email, password_hash (Better Auth managed), role_id, metadata (name, contact), created_at/updated_at.
- `roles`: id, name (`admin`, `user`), description.
- `vehicles`: id, vin/rego, make, model, year, status_id, assigned_user_id (nullable), notes, created_at/updated_at.
- `vehicle_statuses`: id, name (`active`, `maintenance`, `inactive`), description.
- `assignments` (optional early): id, vehicle_id, user_id, start/end, purpose, notes.
- `activity_logs` (optional early): id, actor_user_id, action, entity_type/id, metadata JSON, created_at.

## Page & Feature Plan (MVP)

- Auth: login form, forgot/reset flow (per Better Auth capabilities).
- Dashboard home: KPIs + recent activity.
- Vehicles: list (TanStack Table with filters/sorting), create/edit, status changes, optional assignment to user.
- Users: list + role management (admin only).
- Audit/Activity (lightweight): recent actions list (if `activity_logs` enabled).

## Data & API Conventions

- All route handlers: `try/catch`, Zod-validated inputs, role checks first, no `any`. Return typed success payload or `{ error: string }`.
- Services: pure, side-effect-limited; clear dependency injection (DB client, auth context).
- Drizzle: schema per table, migrations checked in; avoid drift; prefer enums for statuses where practical.

## Operational & Quality Gates

- Tooling: TypeScript strict mode; ESLint; Prettier (if configured); no secrets committed.
- CI (planned): lint, typecheck, unit tests, build. Block merges on failures.
- Observability (later): basic logging in services; avoid leaking sensitive data.

## Risks & Mitigations

- Auth/role drift: centralize checks in middleware + shared helpers.
- Data inconsistencies: enforce FK constraints and enum-driven statuses; use migrations only via Drizzle.
- Performance: prefer server components for heavy reads; paginate tables; cache stable reads when safe.
- Scope creep: MVP boundaries above; defer analytics/advanced workflows.

## Open Questions

- Do we need per-tenant or per-organization separation? (Assumed single-tenant for now.)
- Required fields for vehicles (VIN vs registration) and validation rules per locale?
- Do we need file uploads (e.g., documents, images) in MVP?
- Do we track maintenance schedules or just statuses?

## Next Steps (Execution Plan)

1. Scaffold Next.js App Router project with baseline tooling (ts strict, eslint) and workspace conventions.
2. Integrate Better Auth (email/password) with middleware guarding `/dashboard/*`; set role seeds.
3. Add Drizzle + Supabase config; define schemas/migrations for `users`, `roles`, `vehicles`, `vehicle_statuses` (and optional `assignments`/`activity_logs`).
4. Build services in `lib/services/*` for auth-aware CRUD.
5. Expose API routes in `app/api/*/route.ts` using Zod validation and `{ error: string }` error shape.
6. Implement dashboard UI (shadcn + TanStack Table/Query) for Vehicles and Users.
7. Add basic activity logging if enabled; ship dashboard home widgets.
8. Wire CI (lint/typecheck/build) and prepare Vercel + Cloudflare envs.

## Documentation Plan (what to produce)

- **High-level**: `documentation/vision.md` (goals, success criteria, scope), `documentation/architecture.md` (logical + physical views, auth/data flows), `documentation/requirements.md` (functional + non-functional, priorities), `documentation/testing.md` (test strategy, smoke/acceptance/regression), `documentation/deployment.md` (Vercel/Cloudflare, env vars, rollout).
- **Low-level**: `documentation/app-structure.md` (folders, module boundaries, component/server conventions), `documentation/types.md` (typing guidelines, shared types, no `any`), `documentation/apis.md` (route contracts, Zod schemas, error model), `documentation/tooling.md` (lint/format/tsconfig, git flow, GitHub Actions/CI).
- **Living docs**: `documentation/changelog.md` (notable decisions), `documentation/open-questions.md` (track and resolve).

## Documentation Ordering (suggested)

1. Finalize `vision.md` and `requirements.md` to lock scope.
2. Draft `architecture.md` and `app-structure.md` to guide implementation.
3. Define `apis.md` alongside early service/API work.
4. Lock in `tooling.md` before adding CI and lint/typecheck gates.
5. Maintain `open-questions.md` and `changelog.md` throughout.
