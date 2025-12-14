# Vehicle Track Client Guide

Welcome! This short guide walks you through the major areas of the Vehicle Track portal so you know where to go for each task.

## Dashboard Overview
- **Status cards & activity feed**: The landing page highlights open agreements, inspections, and upcoming actions. Use it as your daily starting point.
- **Quick links**: Shortcuts take you to create a new agreement, register a driver, or schedule an inspection.

## Agreements
- **Agreement List**: See every agreement with its template, vehicle, current status, and last update. Filter by status or search by plate/template.
- **Create Agreement**: Start from `/dashboard/agreements/new` by selecting a vehicle, an inspection, and a template. The system blocks duplicates if a vehicle already has an active agreement.
- **Edit / Generate**: On `/dashboard/agreements/[id]` you can tailor the content and click **Generate Agreement** to save the final copy.
- **Preview & Actions**: `/dashboard/agreements/[id]/preview` shows the completed agreement, supporting documents, and inspection details. From here you can:
  - **Finalize** (send signing link) when the agreement is pending.
  - **Export** (ZIP or PDF, optional email delivery) once it is signed.
  - **Terminate** a signed agreement, optionally adding a reason. The driver receives a notice.
- **Driver Signing Portal**: Drivers open the emailed link (`/agreements/driver/sign/{token}`) to review the agreement, view inspection photos, and sign digitally. Signed agreements cannot be re-signed.

## Drivers
- **Driver Directory**: `/dashboard/drivers` lists every driver with contact info and agreement count.
- **Driver Profile**: Shows assigned agreements, contact details, and notes. You can add/edit drivers from here.

## Vehicles & Inspections
- **Vehicles**: `/dashboard/vehicles` tracks each vehicle’s status, group, and key dates. Details pages show linked inspections and agreements.
- **Inspections**: `/dashboard/inspections` lets you view, edit, or create inspection reports. These feed directly into agreement templates.

## Compliance & Admin
- **Compliance**: Contractor checks and other compliance tasks live under `/dashboard/compliance`.
- **Admin Tools**: Manage user access, roles, and email settings under `/dashboard/admin`.

## Exporting & Notifications
- **Exports**: Signed agreements can be exported as ZIP bundles (agreement PDF + supporting docs) or as standalone PDFs. You can also send the exported files via email.
- **Emails**: Drivers receive signing links, reminders, and termination notices automatically. Admins can configure SMTP/Vercel email settings in the Admin area.

## Tips
- The status badge on each agreement tells you where it sits (Draft, Pending Signature, Signed, Terminated).
- Supporting documents can be added or removed at any time from the agreement edit page.
- Use the search and filters in each module (agreements, drivers, vehicles) to narrow down long lists quickly.

That’s it! Explore the dashboard to familiarize yourself with each module, and reach out to your admin contact if you need a new template or access level.
