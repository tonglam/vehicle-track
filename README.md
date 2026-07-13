# Vehicle Operations & Compliance Platform

A role-secured web platform for managing vehicles, drivers, inspections, agreements, supporting documents, signatures, and compliance workflows.

[Live deployment](https://vehicle-track-amber.vercel.app)

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
npm install
```

2. Copy the environment template and provide local values:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

Additional database and testing notes are available under [database](./database) and [documentation](./documentation).
