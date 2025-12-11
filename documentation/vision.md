# Vehicle Track – Vision

## Purpose
Deliver a secure, internal vehicle tracking and management system that supports a small user base (~100 users) with clear roles, reliable access, and straightforward operations.

## Audience & Roles
- Admin / Super user: full control and configuration.
- Manager: manage operational data.
- Inspector: review and verify data.
- Viewer: read-only access.

## Scope (High Level)
- In: Internal admin/dashboard experience; role-gated access; core vehicle and user management; basic health/monitoring visibility for reliability.
- Out (MVP): Public marketing site, mobile apps, advanced analytics, multi-tenant, SSO/MFA, heavy performance tuning.

## Success Criteria (High Level)
- Reliable login and session handling.
- Data management works without errors or data loss.
- Clear separation of roles and permissions.
- Deployable and maintainable with minimal overhead on Vercel + Cloudflare + Supabase.

## Assumptions
- Scale: ~100 users; optimize for simplicity and maintainability.
- Auth: email/password only (Better Auth).
- Environments: dev and prod only.
- Compliance: standard AU website requirements; keep secrets out of repo.

## Risks (High Level)
- Role/permission drift if not centralized.
- Data quality issues without clear validation rules (to be defined in low-level design).
- Scope creep into advanced analytics or multi-tenant needs.

