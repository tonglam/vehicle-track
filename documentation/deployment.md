# Vehicle Track – Deployment (High Level)

## Targets
- App: Vercel (Next.js).
- DNS/Edge: Cloudflare.
- Database: Supabase Postgres.

## Environments
- Dev and Prod only. Environment variables managed in Vercel; DNS via Cloudflare.

## Release Approach (MVP)
- Simple main-branch deploys to prod after checks (lint/typecheck/build). Feature flags not required at this scale.
- Rollback: Vercel deployment reversion.

## Secrets
- No secrets in repo. Configure auth/DB/env keys in Vercel; Supabase keys managed in env vars.

## Observability (MVP)
- Basic logging for errors; no advanced APM required at this scale.

