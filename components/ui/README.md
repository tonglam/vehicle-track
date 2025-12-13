# Unified UI Components

This directory contains reusable UI components with consistent styling across the entire application.

---

## Components

### 1. Modal Component

A flexible modal dialog for confirmations, warnings, and information.

#### Import

```tsx
import { Modal } from "@/components/ui";
```

#### Props

| Prop              | Type                                                        | Required | Description                      |
| ----------------- | ----------------------------------------------------------- | -------- | -------------------------------- |
| `isOpen`          | `boolean`                                                   | Yes      | Controls modal visibility        |
| `onClose`         | `() => void`                                                | Yes      | Callback when modal should close |
| `title`           | `string`                                                    | Yes      | Modal title                      |
| `children`        | `ReactNode`                                                 | Yes      | Modal content                    |
| `type`            | `"danger" \| "warning" \| "info" \| "success"`              | No       | Modal theme (default: `"info"`)  |
| `primaryAction`   | `{ label: string, onClick: () => void, loading?: boolean }` | No       | Primary action button            |
| `secondaryAction` | `{ label: string, onClick: () => void }`                    | No       | Secondary action button          |

#### Examples

**Delete Confirmation:**

```tsx
const [showModal, setShowModal] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Delete Item"
  type="danger"
  primaryAction={{
    label: "Delete",
    onClick: handleDelete,
    loading: isDeleting,
  }}
  secondaryAction={{
    label: "Cancel",
    onClick: () => setShowModal(false),
  }}
>
  <p>
    Are you sure you want to delete this item? This action cannot be undone.
  </p>
</Modal>;
```

**Warning Message:**

```tsx
<Modal
  isOpen={showWarning}
  onClose={() => setShowWarning(false)}
  title="Unsaved Changes"
  type="warning"
  primaryAction={{
    label: "Leave Anyway",
    onClick: handleLeave,
  }}
  secondaryAction={{
    label: "Stay",
    onClick: () => setShowWarning(false),
  }}
>
  <p>You have unsaved changes. Are you sure you want to leave?</p>
</Modal>
```

**Info Dialog:**

```tsx
<Modal
  isOpen={showInfo}
  onClose={() => setShowInfo(false)}
  title="Information"
  type="info"
  primaryAction={{
    label: "Got it",
    onClick: () => setShowInfo(false),
  }}
>
  <p>Here's some important information about this feature.</p>
</Modal>
```

**Success Confirmation:**

```tsx
<Modal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  title="Success!"
  type="success"
>
  <p>Your operation completed successfully.</p>
</Modal>
```

#### Features

- ✅ Escape key closes modal
- ✅ Click backdrop to close
- ✅ Body scroll prevented when open
- ✅ Loading state support
- ✅ Keyboard accessible
- ✅ Responsive design

---

### 2. Alert Component

Status messages for success, errors, warnings, and information.

#### Import

```tsx
import { Alert } from "@/components/ui";
```

#### Props

| Prop      | Type                                          | Required | Description                              |
| --------- | --------------------------------------------- | -------- | ---------------------------------------- |
| `type`    | `"success" \| "error" \| "warning" \| "info"` | Yes      | Alert theme                              |
| `message` | `string`                                      | Yes      | Alert message                            |
| `title`   | `string`                                      | No       | Optional alert title                     |
| `onClose` | `() => void`                                  | No       | Optional close callback (shows X button) |

#### Examples

**Success Alert:**

```tsx
<Alert type="success" message="User created successfully." />
```

**Error Alert:**

```tsx
<Alert
  type="error"
  title="Error"
  message="Failed to save changes. Please try again."
/>
```

**Warning Alert:**

```tsx
<Alert type="warning" message="Your session will expire in 5 minutes." />
```

**Info Alert:**

```tsx
<Alert
  type="info"
  title="Notice"
  message="System maintenance scheduled for tonight at 2 AM."
/>
```

**Dismissible Alert:**

```tsx
const [showAlert, setShowAlert] = useState(true);

{
  showAlert && (
    <Alert
      type="info"
      message="This is a dismissible alert."
      onClose={() => setShowAlert(false)}
    />
  );
}
```

---

### 3. DismissibleAlert Component

A wrapper around Alert for server components that automatically dismisses by removing URL parameters.

#### Import

```tsx
import { DismissibleAlert } from "@/components/ui";
```

#### Props

| Prop      | Type                                          | Required | Description          |
| --------- | --------------------------------------------- | -------- | -------------------- |
| `type`    | `"success" \| "error" \| "warning" \| "info"` | Yes      | Alert theme          |
| `message` | `string`                                      | Yes      | Alert message        |
| `title`   | `string`                                      | No       | Optional alert title |

#### Usage in Server Components

Perfect for page-level status messages that can be dismissed:

```tsx
// app/some-page/page.tsx (Server Component)
import { DismissibleAlert } from "@/components/ui";

export default async function SomePage({ searchParams }: any) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;

  return (
    <div className="space-y-6">
      {status === "created" && (
        <DismissibleAlert type="success" message="Item created successfully." />
      )}
      {status === "deleted" && (
        <DismissibleAlert type="error" message="Item deleted successfully." />
      )}
    </div>
  );
}
```

When dismissed, the alert removes the `?status=...` parameter from the URL.

---

## Usage Guidelines

### When to Use Modal

- Confirming destructive actions (delete, cancel)
- Important warnings that need user attention
- Collecting quick input from users
- Displaying critical information that requires acknowledgment

### When to Use Alert

- Success confirmations after actions
- Error messages from API calls
- Warning messages for user awareness
- Informational messages about system state

---

## Common Patterns

### Page-Level Status Messages (Dismissible)

```tsx
// app/dashboard/some-page/page.tsx
import { DismissibleAlert } from "@/components/ui";

export default async function SomePage({ searchParams }: any) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;

  return (
    <div className="space-y-6">
      {status === "created" && (
        <DismissibleAlert type="success" message="Item created successfully." />
      )}
      {status === "updated" && (
        <DismissibleAlert type="info" message="Item updated successfully." />
      )}
      {status === "deleted" && (
        <DismissibleAlert type="error" message="Item deleted successfully." />
      )}

      {/* Page content */}
    </div>
  );
}
```

### Delete Confirmation Pattern

```tsx
"use client";

import { Modal } from "@/components/ui";
import { useState } from "react";

export function ItemActions({ item }: { item: Item }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      router.push("/items?status=deleted");
    } catch (error) {
      alert("Failed to delete item");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowDeleteModal(true)}>Delete</button>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Item"
        type="danger"
        primaryAction={{
          label: "Delete",
          onClick: handleDelete,
          loading: isDeleting,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setShowDeleteModal(false),
        }}
      >
        <p>
          Are you sure you want to delete <strong>{item.name}</strong>? This
          action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
```

---

## Styling Customization

Both components use Tailwind CSS and follow the application's design system:

- **Colors**: Consistent with app theme (blue, red, yellow, green)
- **Spacing**: Standard padding and margins
- **Typography**: Consistent font sizes and weights
- **Transitions**: Smooth animations for all state changes

To customize, modify the respective component files in `components/ui/`.

---

## Accessibility

Both components follow accessibility best practices:

- Proper ARIA roles and attributes
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Color contrast compliance

---

## Migration Guide

### Updating Existing Modals

**Before:**

```tsx
{
  showModal && (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      {/* Custom modal HTML */}
    </div>
  );
}
```

**After:**

```tsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Modal Title"
  type="danger"
  primaryAction={{
    label: "Confirm",
    onClick: handleConfirm,
  }}
  secondaryAction={{
    label: "Cancel",
    onClick: () => setShowModal(false),
  }}
>
  <p>Modal content here</p>
</Modal>
```

### Updating Existing Alerts

**Before:**

```tsx
<div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
  Success message
</div>
```

**After:**

```tsx
<Alert type="success" message="Success message" />
```

---

## Support

For questions or issues, contact the development team or create an issue in the repository.
