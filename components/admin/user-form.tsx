"use client";

import { Toast, ToastType } from "@/components/ui/toast";
import type { RoleOption, UserWithRole } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserFormProps {
  mode: "create" | "edit";
  user?: UserWithRole;
  roles: RoleOption[];
}

interface ToastState {
  message: string;
  type: ToastType;
}

export function UserForm({ mode, user, roles }: UserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sendInvite, setSendInvite] = useState(mode === "create");
  const [toast, setToast] = useState<ToastState | null>(null);

  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    password: "",
    confirmPassword: "",
    roleId: user?.roleId || "",
    active: user?.active ?? true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCredentialModeChange = (invite: boolean) => {
    setSendInvite(invite);
    if (invite) {
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.password;
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
    const newErrors: Record<string, string> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, dots, underscores, and hyphens";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Invalid Australian phone number format";
    }

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Role validation
    if (!formData.roleId) {
      newErrors.roleId = "Role is required";
    }

    const passwordRequired = mode === "create" && !sendInvite;
    const passwordProvided = formData.password.trim() !== "";

    if (passwordRequired || passwordProvided) {
      if (!formData.password.trim()) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleId: formData.roleId,
        active: formData.active,
      };

      // Only include password if it's filled
      if (formData.password.trim() !== "") {
        payload.password = formData.password;
        payload.confirmPassword = formData.confirmPassword;
      }

      if (mode === "create") {
        payload.sendInvite = sendInvite;
      }

      const url =
        mode === "create" ? "/api/admin/users" : `/api/admin/users/${user?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          // Zod validation errors
          const zodErrors: Record<string, string> = {};
          data.details.forEach((issue: any) => {
            const field = issue.path[0];
            zodErrors[field] = issue.message;
          });
          setErrors(zodErrors);
          setToast({
            message: "Please fix the validation errors.",
            type: "error",
          });
        } else {
          setToast({
            message: data.error || "Failed to save user",
            type: "error",
          });
        }
        return;
      }

      // Success - show toast and redirect
      setToast({
        message:
          mode === "create"
            ? "User created successfully!"
            : "User updated successfully!",
        type: "success",
      });

      // Delay redirect to show success message
      setTimeout(() => {
        const redirectTarget =
          mode === "create"
            ? "/dashboard/admin/users?status=created"
            : "/dashboard/admin/users?status=updated";

        router.push(redirectTarget);
        // Remove router.refresh() as it might cause issues
      }, 1500);
    } catch (error) {
      console.error("Error saving user:", error);
      setToast({
        message: "Failed to save user. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.username ? "border-red-500" : "border-gray-300"
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0412345678 or 02 1234 5678 or +61412345678"
              className={`mt-1 block w-full rounded-md border ${
                errors.phone ? "border-red-500" : "border-gray-300"
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* First Name */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.firstName ? "border-red-500" : "border-gray-300"
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.lastName ? "border-red-500" : "border-gray-300"
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>

          {mode === "create" && (
            <div className="md:col-span-2 rounded-md border border-dashed border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700">
                Password Delivery
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Choose how the new operator will get access.
              </p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row">
                <label className="flex cursor-pointer items-start gap-2 rounded-md border bg-white px-3 py-2 text-sm shadow-sm">
                  <input
                    type="radio"
                    name="passwordOption"
                    value="invite"
                    checked={sendInvite}
                    onChange={() => handleCredentialModeChange(true)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-gray-900">
                      Send password setup email
                    </span>
                    <span className="mt-1 block text-gray-600">
                      A secure link will be emailed so the user can set their
                      password themselves.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border bg-white px-3 py-2 text-sm shadow-sm">
                  <input
                    type="radio"
                    name="passwordOption"
                    value="manual"
                    checked={!sendInvite}
                    onChange={() => handleCredentialModeChange(false)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-gray-900">
                      Set password now
                    </span>
                    <span className="mt-1 block text-gray-600">
                      Enter a password manually if you need to share it over a
                      secure channel.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password{" "}
              {mode === "create" && !sendInvite && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={
                mode === "edit" ? "Leave blank to keep current password" : ""
              }
              disabled={mode === "create" && sendInvite}
              className={`mt-1 block w-full rounded-md border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password{" "}
              {((mode === "create" && !sendInvite) ||
                formData.password.trim() !== "") && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={mode === "create" && sendInvite}
              className={`mt-1 block w-full rounded-md border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="roleId"
              className="block text-sm font-medium text-gray-700"
            >
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="roleId"
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.roleId ? "border-red-500" : "border-gray-300"
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </option>
              ))}
            </select>
            {errors.roleId && (
              <p className="mt-1 text-sm text-red-600">{errors.roleId}</p>
            )}
          </div>

          {/* Active Account */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="active"
              className="ml-2 block text-sm text-gray-700"
            >
              Active Account
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create User"
                  : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
