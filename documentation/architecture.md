# Vehicle Track – Architecture (High Level)

## Overview
- Stack: Next.js (App Router, Server Components by default), Tailwind + shadcn UI, TanStack Query/Table, Better Auth, Drizzle ORM on Supabase Postgres.
- Hosting: Vercel (app), Cloudflare (DNS/performance), Supabase (DB).
- Scale target: ~100 users; prioritize simplicity and maintainability over heavy-scale patterns.

## Key Components
- Frontend: Server Components for data-heavy views; Client Components only where interactivity is required (forms, tables, inputs).
- Auth: Better Auth with email/password; middleware guards `/dashboard/*`; role checks at route/service boundaries.
- API Layer: `app/api/*/route.ts` for request parsing, auth/role enforcement, Zod validation, thin mapping to services; error shape `{ error: string }`.
- Services: `lib/services/*` for business logic; no DB/auth logic in route files.
- Data: Drizzle schema/migrations on Supabase Postgres; no raw SQL; caching for safe reads.
- UI: Tailwind + shadcn; small, composable components; tables via TanStack Table.

## Environments
- Dev and Prod only. Environment variables managed via Vercel; Cloudflare for DNS.

## Quality & Operations (High Level)
- TypeScript strict, ESLint; Prettier if configured.
- Basic observability: log errors; avoid leaking sensitive data.
- CI (planned): lint, typecheck, build (and tests when added).

## Constraints & Deferrals
- No SSO/MFA in MVP; email/password only.
- Availability/performance: good-enough for internal use; no advanced HA/DR yet.
- Data model and detailed flows to be defined in low-level design.

