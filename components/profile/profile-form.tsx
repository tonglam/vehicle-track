"use client";

import { Toast, ToastType } from "@/components/ui/toast";
import type { RoleOption, UserWithRole } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProfileFormProps {
  user: UserWithRole;
  roles?: RoleOption[]; // only used for admin role selection
}

interface ToastState {
  message: string;
  type: ToastType;
}

export function ProfileForm({ user, roles = [] }: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const isAdmin = user.roleName?.toLowerCase() === "admin";

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || "",
    roleId: user.roleId,
  });

  // Organisation UI state
  const [orgName, setOrgName] = useState("");
  const [orgLogoPreview, setOrgLogoPreview] = useState<string | null>(null);
  const [originalOrgName, setOriginalOrgName] = useState("");
  const [originalOrgLogo, setOriginalOrgLogo] = useState<string | null>(null);

  // Track if form has unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.firstName !== user.firstName ||
      formData.lastName !== user.lastName ||
      formData.email !== user.email ||
      formData.phone !== (user.phone || "") ||
      formData.roleId !== user.roleId ||
      orgName !== originalOrgName ||
      orgLogoPreview !== originalOrgLogo;
    setIsDirty(hasChanges);
  }, [
    formData,
    orgLogoPreview,
    orgName,
    user,
    originalOrgName,
    originalOrgLogo,
  ]);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Load organization data on mount
  useEffect(() => {
    const loadOrganization = async () => {
      try {
        console.log("🔍 Loading organization data...");
        const response = await fetch("/api/organizations");
        const data = await response.json();

        console.log("📦 Organization response:", data);

        if (response.ok && data.organization) {
          console.log("✅ Organization loaded:", {
            name: data.organization.name,
            logoUrl: data.organization.logoUrl,
          });

          setOrgName(data.organization.name);
          setOriginalOrgName(data.organization.name);

          if (data.organization.logoUrl) {
            console.log("🖼️ Setting logo preview:", data.organization.logoUrl);
            setOrgLogoPreview(data.organization.logoUrl);
            setOriginalOrgLogo(data.organization.logoUrl);
          } else {
            console.log("⚠️ No logoUrl in organization data");
          }
        } else {
          console.log("⚠️ No organization found or response not ok");
        }
      } catch (error) {
        console.error("❌ Error loading organization:", error);
      }
    };

    loadOrganization();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Hide toast when user makes changes after save
    if (toast) {
      setToast(null);
    }
  };

  const validateForm = () => {
    const phoneRegex = /^(\+61|0)[2-478](\s?\d{4}\s?\d{4}|(?:\d{8}))$/;
    const newErrors: Record<string, string> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length > 50) {
      newErrors.firstName = "First name must not exceed 50 characters";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length > 50) {
      newErrors.lastName = "Last name must not exceed 50 characters";
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

    // Role validation (admin only)
    if (isAdmin && (!formData.roleId || formData.roleId.trim() === "")) {
      newErrors.roleId = "Role is required";
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
      const payload: Record<string, any> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      };

      if (isAdmin && formData.roleId) {
        payload.roleId = formData.roleId;
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
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
            message: data.error || "Failed to update profile",
            type: "error",
          });
        }
        return;
      }

      // Save organization data if it has been modified
      if (orgName.trim() || orgLogoPreview) {
        try {
          const orgPayload: Record<string, any> = {
            name: orgName.trim() || "Unnamed Organization",
          };

          if (orgLogoPreview) {
            orgPayload.logoUrl = orgLogoPreview;
          }

          console.log("Saving organization data:", orgPayload);

          const orgResponse = await fetch("/api/organizations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orgPayload),
          });

          const orgData = await orgResponse.json();
          console.log("Organization save response:", orgData);

          if (!orgResponse.ok) {
            console.error("Failed to save organization:", orgData.error);
            setToast({
              message: `Warning: Organization data was not saved: ${orgData.error}`,
              type: "warning",
            });
          } else {
            console.log("✅ Organization saved successfully!");
          }
        } catch (orgError) {
          console.error("Error saving organization:", orgError);
          setToast({
            message: `Warning: Error saving organization: ${orgError}`,
            type: "warning",
          });
        }
      } else {
        console.log(
          "No organization data to save (orgName or logo not provided)"
        );
      }

      // Success
      setToast({
        message: "Profile updated successfully!",
        type: "success",
      });
      setIsDirty(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      setToast({
        message: "Failed to update profile. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) {
        return;
      }
    }
    router.back();
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setToast({
        message: "Please upload a JPG, PNG, or GIF image.",
        type: "error",
      });
      return;
    }

    // Check file size (5MB max for logos, though Supabase allows up to 50MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setToast({
        message: "File too large. Maximum size is 5MB for organization logos. Please optimize your image or choose a smaller file.",
        type: "error",
      });
      return;
    }

    try {
      // Show a local preview first
      const reader = new FileReader();
      reader.onload = (event) => {
        setOrgLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload the file to the server
      console.log("Uploading logo file:", file.name);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/organization-logo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Upload failed:", data);
        setToast({
          message: `Failed to upload logo: ${data.error || "Unknown error"}`,
          type: "error",
        });
        // Clear the preview on error
        setOrgLogoPreview(null);
        return;
      }

      console.log("✅ Logo uploaded successfully:", data.url);
      // Update the preview to the uploaded URL
      setOrgLogoPreview(data.url);
      setToast({
        message: "Logo uploaded successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      setToast({
        message: "Failed to upload logo. Please try again.",
        type: "error",
      });
      setOrgLogoPreview(null);
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
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* User Avatar Section */}
        <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
          <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
            {user.firstName.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Read-Only Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-600 border border-gray-200">
              {user.username}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            {isAdmin ? (
              <div>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.roleId ? "border-red-500" : "border-gray-300"
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  <option value="">
                    {user.roleName.charAt(0).toUpperCase() +
                      user.roleName.slice(1)}
                  </option>
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
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-md">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                    user.roleName === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : user.roleName === "manager"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.roleName}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Status
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {user.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Since
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-600 border border-gray-200">
              {formatDate(user.createdAt)}
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <p className="mt-1 text-sm text-gray-500">
              Australian format: 0412345678, 02 1234 5678, or +61412345678
            </p>
          </div>
        </div>

        {/* Organisation Settings */}
        <div className="space-y-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Organisation Settings
          </h3>

          {/* Organisation Name */}
          <div>
            <label
              htmlFor="organisationName"
              className="block text-sm font-medium text-gray-700"
            >
              Organisation Name
            </label>
            <input
              type="text"
              id="organisationName"
              name="organisationName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter organisation name"
            />
          </div>

          {/* Organisation Logo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Organisation Logo
                </div>
                <p className="text-xs text-gray-500">
                  Upload organisation logo (JPG, PNG, GIF). Recommended size:
                  200x60px.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-md bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="h-16 w-32 border border-dashed border-gray-300 rounded-md bg-gray-50 flex items-center justify-center overflow-hidden">
                {orgLogoPreview ? (
                  <img
                    src={orgLogoPreview}
                    alt="Organisation logo preview"
                    className="max-h-14 max-w-28 object-contain"
                    onLoad={() => console.log("✅ Logo loaded successfully")}
                    onError={(e) => {
                      console.error("❌ Failed to load logo:", orgLogoPreview);
                      console.error("Image error event:", e);
                    }}
                  />
                ) : (
                  <span className="text-xs text-gray-400">Current logo</span>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <label
                  htmlFor="organisationLogo"
                  className="block text-sm font-medium text-gray-700"
                >
                  Update logo image
                </label>
                <input
                  type="file"
                  id="organisationLogo"
                  name="organisationLogo"
                  accept=".jpg,.jpeg,.png,.gif"
                  onChange={handleLogoChange}
                  className="mt-1 block w-full text-sm"
                />
                <p className="text-xs text-gray-500">
                  JPG, PNG, GIF supported. Recommended: 200x60px.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
      </div>
    </>
  );
}
