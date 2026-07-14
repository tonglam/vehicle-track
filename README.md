# Vehicle Operations & Compliance Platform

A role-secured web platform for managing vehicles, drivers, inspections, agreements, supporting documents, signatures, and compliance workflows.

[Live deployment](https://vehicle-track-amber.vercel.app)

## Problem and users

Small operations teams often spread vehicle records, inspections, driver agreements, signatures, and supporting documents across disconnected files and tools. This project brings those workflows into one organisation-aware application for administrators, managers, inspectors, and read-only viewers.

## What it demonstrates

- Organisation-aware access for administrators, managers, inspectors, and viewers
- Vehicle and driver records with grouped operational ownership
- Multi-step inspections with image and attachment handling
- Agreement templates, previews, finalisation, termination, and driver signatures
- Supporting documents, audit-oriented records, and compliance views
- Administrative user, role, and email configuration

## Architecture

The application uses the Next.js App Router. Route handlers expose the application API, service and validation logic enforce workflow rules, and Drizzle ORM provides typed PostgreSQL access. Better Auth handles authentication, while Supabase supports hosted infrastructure and file workflows.

## Technology

- Next.js 16, React 19, and TypeScript
- PostgreSQL and Drizzle ORM
- Better Auth and role-based permission checks
- Zod validation
- Supabase storage and Vercel deployment
- Tailwind CSS, TanStack Query, and TanStack Table
- Resend and Nodemailer for configurable email delivery

## Local development

1. Install dependencies:

```bash
pnpm install --frozen-lockfile
```

2. Copy the environment template and provide local values:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification status

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Additional database and testing notes are available under [database](./database) and [documentation](./documentation).

The public `main` branch currently passes TypeScript type-checking. It does not yet contain an automated test suite, and the existing lint baseline contains unresolved errors. A production build also requires the documented Supabase, database, authentication, storage, and email environment configuration. These are open engineering gaps; this README does not present the validation pipeline as fully green.

## Design trade-offs and limitations

- Route handlers stay thin while service modules own workflow rules, which adds structure but keeps validation and permission decisions testable outside the UI.
- Role checks are enforced at route and service boundaries; the MVP does not claim enterprise SSO, MFA, or high-availability operation.
- PostgreSQL, object storage, and configurable email delivery are external dependencies. Local development therefore requires explicit environment configuration rather than embedded credentials.
- The public deployment and employer-facing evidence must use synthetic or sanitised records only. Real driver, vehicle, signature, or operational data does not belong in the repository.

## Current status

The implemented MVP covers authentication, role-aware access, vehicle and driver records, inspections, agreement workflows, signatures, supporting documents, and compliance views. It is suitable for demonstrating workflow modelling and access-control decisions; it is not presented as a regulated or high-availability production system.
