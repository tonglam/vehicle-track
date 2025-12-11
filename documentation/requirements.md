# Vehicle Track – High-Level Requirements

## Functional (High Level only)

- Provide an internal dashboard secured by role-based access (admin/super user, manager, inspector, viewer).
- Support core vehicle and user management flows (detailed functions deferred to low-level design).
- Ensure reliable login and session handling.

## Functional – Admin Module (Low Level)

- Access: Admin has full CRUD on users and email config. Managers can access Operator Management and Email Configuration pages but cannot modify users (view-only for users). Admins may change their own role/status (assume at least one fixed admin exists).
- Operator Management list: Table columns Username, Full Name, Email, Role, Status (Active/Inactive), Actions (Edit, Delete). Pagination only, page size 10; no filters/sorting.
- Operator create/edit pages (`Create Operator`, `Edit Operator`): Fields required unless noted: Username, Email, Phone (AU formats: 0412345678, 02 1234 5678, or +61412345678), First Name, Last Name, Password (optional on edit; leave empty to keep existing), Confirm Password (when password provided), Role (Admin, Inspector, Manager, Viewer), Active Account checkbox, Back, Save. Role options are fixed to these four. Soft delete users (set inactive) rather than hard delete.
- Uniqueness: Only user id is guaranteed unique per spec; (recommendation: treat email as unique for auth, but spec leaves it open).
- Passwords: Standard policy (strong password); for new users, allow setting a password or sending an email to set it. On edit, blank password means no change.
- Email Configuration: Single configuration per user; fields as listed (SMTP Host/Port/Username/Password, From Email, From Name, Active, Test Connection, Save). Password stored securely (hashed/secret-managed). Test Connection should attempt SMTP auth/send and return result. Admin and managers can operate this page.
- Audit: Keep server-side audit logs for user create/edit/delete/role/status changes and email configuration changes.

## Functional – Fleet Module (Low Level)

- Roles: Admin and Manager can create/edit vehicles and manage groups; Inspector/Viewer are read-only.
- Status model: Fixed options — Available (default on create), Assigned, Under Maintenance, Temporarily Assigned, Leased Out, Retired, Sold. No VIN/license plate uniqueness validation.
- Ownership model: Owned, External (borrowed/leased), Leased out. Ownership is separate from status; no enforced coupling for now.

### Vehicle Management (list, create, edit)

- Actions: Add Vehicle (to `Add New Vehicle`), Manage Groups (to `Vehicle Groups`).
- Create/Edit form (2-column, 6 cards). Required fields marked (\*):
  - Vehicle Identity: Year*, Make*, Model*, License Plate*, VIN\*.
  - Technical Specifications: Fuel Type* (Petrol, Diesel, Electric, Hybrid, LPG), Transmission* (Manual, Automatic, CVT, Semi-Automatic), Engine Size (L) optional, Current Odometer optional.
  - Additional Information: Notes optional, Upload Attachments (single file; reasonable size aligned to storage; one file per vehicle create/edit).
  - Status & Ownership: Status* (default Available), Ownership Type* (Owned, External (borrowed/leased), Leased Out), Owner Company optional.
  - Service & Dates: Purchase Date optional, Last Service Date optional, Next Service Due optional.
  - Actions: Create/Save, Cancel. Delete button on Edit page (behavior TBD: soft removal vs status change).
- List view filters: Search (License plate/Make/Model), Status filter (options above, All default), Ownership filter (Owned, External, Leased out, All default). Filters combine. Buttons: Search, Reset.
- Table: columns License Plate, Make & Model, Year, Group, Status, Updated At, Actions. Pagination page size 10. Default sort Updated At desc.
- Actions in table: View, Edit. Delete behavior pending.

### Vehicle Details (view)

- Cards:
  - Vehicle Information: License Plate, Make, Model, Year, VIN, Group, Ownership, Status.
  - Attachments: show uploaded file or placeholder “No attachments uploaded.”
  - Service Information: Last Service, Next Service Due.
  - Lease Out History: list; button `New Leased Out` (details TBD).
  - Inspection History: list; button `New Inspection` (details TBD).
  - Related Agreements: list; button `New Agreements` (details TBD).

### Vehicle Edit

- Page `Edit Vehicle #{License Plate}` mirrors create form; includes Delete button (behavior TBD).

### Vehicle Groups

- `Vehicle Groups` page: list cards per group with Title, Total Vehicles, Active Vehicles; button `Create Group`; button `Manage Groups` entry from Vehicle Management.
- `Create Group`: fields TBD (proposed: Name\*, optional Description; adjust later).
- Group detail page `{Group Name}`:
  - Dashboard line: Total Vehicles, Active Vehicles, Assigned Users.
  - Card: Vehicles in this Group (list + Create Vehicle button scoped to group).
  - Card: Assigned Users (list + Assign User button; assign modal lists managers to select).
  - Card: Group Information: Created, Updated, Type, Contract ID, Area Manager Contact.
  - Back to `Vehicle Groups` button.
  - Assign Users modal: title `Assign Users to {Group Name}`, content: selectable list of managers.

### Attachments

- Single file per vehicle at create/edit. Reasonable size limit aligned to storage; exact cap TBD. Stored securely; show filename/link in details view.

### Drivers

- Drivers list: Search bar (placeholder “Search name, email, or phone”), table columns Name, Email, Phone, Created, Actions (View → Driver Details).
- Driver Details:
  - Contact Information card: Name, Email, Phone, Notes, Created.
  - Agreements card: VEHICLE RENTAL AGREEMENT entries with Template, Agreement status (e.g., Signed), Agreement signed (timestamp), Original vehicle, Current vehicle; button to view agreement (details TBD).
  - Statistics card: Total Agreements (count), Active Agreements (count).
  - Edit Driver button → `Edit Driver`.
- Edit Driver: Card with First Name, Last Name, Email, Phone Number, Notes; buttons Cancel, Save Changes; fields not required.
- Add Driver: Same fields as Edit Driver; create flow.

### Agreements

- Agreements list: Buttons `New Agreement`, `Manager Templates`; Status filter (All, Draft, Pending Signature, Signed, Terminated); table columns Vehicle, Agreement, Status, Created, Last Updated, Signed By, Actions.

- Create Agreement: 3-step flow with cards (each step enabled after previous):

  1. Select Vehicle: dropdown with vehicle options (default “Choose a vehicle...”).
  2. Select Inspection: list inspections for the vehicle; if none, button to create new inspection.
  3. Select Template: pick an existing agreement template.

- Vehicle Inspection (Create):
  - Cards: Vehicle Information (Vehicle*, plate number display), Exterior Condition* (text), Interior Condition* (text), Mechanical Condition* (text), each with Supporting Images (upload button); Additional Notes (text). Buttons: Save, Preview.
- Inspection Preview: same cards read-only; actions Back to Inspections, Edit Inspection, Delete Inspection, Submit Inspection (modal confirm).

- Agreement Templates list: columns Title (clickable to view), Status, Created At, Actions.
- Create Agreement Template: Title*; Content* (rich text); Available Variables listed:
  - Vehicle: {{ vehicle.make }}, {{ vehicle.model }}, {{ vehicle.year }}, {{ vehicle.vin }}, {{ vehicle.license_plate }}
  - Inspection: {{ inspection.date }}, {{ inspection.exterior_condition }}, {{ inspection.interior_condition }}, {{ inspection.mechanical_condition }}
  - Organisation: {{ organisation.name }}
  - Is active checkbox; Save, Cancel.
- Edit Agreement Template: same as create.
- Template view (title click, e.g., “VEHICLE RENTAL AGREEMENT”): shows Status (e.g., Active), Created at, Content, with Edit and Delete buttons.

### Inspections

- Inspections list page `Inspections`: New button; filters Search by License Plate (placeholder “Enter license plate...”), Status filter (All, Draft, Submitted); buttons Search, Clear. Table columns Vehicle, Last Updated, Inspector, Status, Actions (View, Edit, Delete).

### Compliance

- Compliance Management page: includes a card entry for Contractor Checks linking to Contractor Vehicle Checks.
- Contractor Vehicle Checks page:
  - Cycle context: week selector (e.g., Week of YYYY-MM-DD) with Previous/Next navigation.
  - Completion widget: shows % complete and “X of Y submissions marked complete.”
  - Actions: Download ZIP, Email export.
  - Metadata: “Initial notifications sent <timestamp>.”
  - Filters/search: search bar (driver/email/phone/vehicle); status pills/tabs (All, Complete, Pending) with counts.
  - Results: table/list of contractor vehicle checks; when empty, show placeholder “No contractor vehicle checks were generated for this cycle.”
  - Table columns (when present): Driver, Vehicle, Status, Submitted At, Updated At, Completed By, Actions (View, Mark Complete, Export).
  - Completion rule: “Complete” when the check is reviewed and explicitly marked complete (via action); otherwise Pending.
- Compliance Dashboard page (TBD content): include summary tiles (e.g., open contractor checks, completion rate, pending submissions) and recent compliance activity. Filters: date range or period selector (week/month). Role access same as Contractor Checks (admin/manager; others read-only).

### Home Dashboard

- Cards for recent activity with “View All” links:
  - Recent Vehicles: list items with plate/title and date.
  - Recent Inspections: list items with plate/title, status, date.
  - Recent Agreements: list items or placeholder when none.
- Management Center section with action cards:
  - Vehicle Groups: Manage vehicle groups and assignments.
  - User Management: Manage users and roles.
  - All Vehicles: View and manage all vehicles.

### Navigation & Layout

- Top navigation bar:
  - Brand: CarPulse with icon.
  - Modules (with dropdowns):
    - Dashboard (link `/`).
    - Fleet: Vehicles (`/vehicles/`), Vehicle Groups (`/vehicles/groups/`), Drivers (`/drivers/`).
    - Operations: Agreements (`/agreements/`), Inspections (Handover) (`/inspection/`).
    - Compliance: Compliance Dashboard (`/compliance/`), Contractor Checks (`/compliance/contractor-vehicle-checks/admin/`).
    - Admin: User Management (`/accounts/operators/`), Email Configuration (`/notifications/email-config/`).
  - User menu: avatar/initial, name, org/role text, links to Profile (`/accounts/profile/edit/`), Sign Out.
- Footer: copyright © 2025 Vehicle Track, “All rights reserved.”

## Non-Functional (High Level)

- Security: Email/password auth via Better Auth; enforce roles on all dashboard routes; keep secrets out of repo; standard AU website requirements.
- Reliability: Prioritize stable login and data management; basic health visibility.
- Performance: Adequate for ~100 users; no advanced tuning in MVP.
- Maintainability: Clear separation of concerns (routes -> services -> DB); no `any` types; DRY, single responsibility, clear dependencies.
- Deployability: Straightforward Vercel deploy with Cloudflare DNS; Supabase managed DB.

## Environments

- Dev and Prod only.

## Out of Scope (MVP)

- SSO/MFA, public marketing site, mobile apps, advanced analytics, multi-tenant, heavy performance/HA features.
