"use client";

import { Toast, ToastType } from "@/components/ui/toast";
import type { EmailConfig } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface EmailConfigFormProps {
  initialConfig: EmailConfig | null;
  userEmail: string;
}

interface ToastState {
  message: string;
  type: ToastType;
}

export function EmailConfigForm({
  initialConfig,
  userEmail,
}: EmailConfigFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    smtpHost: initialConfig?.smtpHost || "",
    smtpPort: initialConfig?.smtpPort || 587,
    smtpUsername: initialConfig?.smtpUsername || "",
    smtpPassword: initialConfig
      ? (initialConfig as any).smtpPassword || ""
      : "",
    fromEmail: initialConfig?.fromEmail || "",
    fromName: initialConfig?.fromName || "",
    active: initialConfig?.active ?? true,
  });

  // Track if form has unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.smtpHost !== (initialConfig?.smtpHost || "") ||
      formData.smtpPort !== (initialConfig?.smtpPort || 587) ||
      formData.smtpUsername !== (initialConfig?.smtpUsername || "") ||
      formData.smtpPassword !== ((initialConfig as any)?.smtpPassword || "") ||
      formData.fromEmail !== (initialConfig?.fromEmail || "") ||
      formData.fromName !== (initialConfig?.fromName || "") ||
      formData.active !== (initialConfig?.active ?? true);
    setIsDirty(hasChanges);
  }, [formData, initialConfig]);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear test result when form changes
    if (testResult) {
      setTestResult(null);
    }

    // Hide toast when user makes changes
    if (toast) {
      setToast(null);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.smtpHost.trim()) {
      newErrors.smtpHost = "SMTP host is required";
    }

    if (
      !formData.smtpPort ||
      formData.smtpPort < 1 ||
      formData.smtpPort > 65535
    ) {
      newErrors.smtpPort = "Port must be between 1 and 65535";
    }

    if (!formData.smtpUsername.trim()) {
      newErrors.smtpUsername = "SMTP username is required";
    }

    if (!formData.smtpPassword.trim()) {
      newErrors.smtpPassword = "SMTP password is required";
    }

    if (!formData.fromEmail.trim()) {
      newErrors.fromEmail = "From email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.fromEmail)) {
      newErrors.fromEmail = "Invalid email address";
    }

    if (!formData.fromName.trim()) {
      newErrors.fromName = "From name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "send",
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({
          success: true,
          message:
            data.message || `Test email sent successfully to ${userEmail}`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Test failed",
        });
      }
    } catch (error) {
      console.error("Error testing email:", error);
      setTestResult({
        success: false,
        message: "Failed to test email connection. Please try again.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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
            message: data.error || "Failed to save email configuration",
            type: "error",
          });
        }
        return;
      }

      // Success
      setToast({
        message: "Email configuration saved successfully!",
        type: "success",
      });
      setIsDirty(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving email config:", error);
      setToast({
        message: "Failed to save email configuration. Please try again.",
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
    router.push("/dashboard/admin/users");
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
      <div className="space-y-6">
        {/* Test Result Message */}
      {testResult && (
        <div
          className={`border-l-4 p-4 rounded ${
            testResult.success
              ? "bg-green-50 border-green-400"
              : "bg-red-50 border-red-400"
          }`}
        >
          <div className="flex">
            <div className="shrink-0">
              {testResult.success ? (
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p
                className={`text-sm font-medium ${
                  testResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {testResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* SMTP Settings Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              SMTP Server Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SMTP Host */}
              <div className="md:col-span-2">
                <label
                  htmlFor="smtpHost"
                  className="block text-sm font-medium text-gray-700"
                >
                  SMTP Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="smtpHost"
                  name="smtpHost"
                  value={formData.smtpHost}
                  onChange={handleChange}
                  placeholder="smtp.gmail.com"
                  className={`mt-1 block w-full rounded-md border ${
                    errors.smtpHost ? "border-red-500" : "border-gray-300"
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.smtpHost && (
                  <p className="mt-1 text-sm text-red-600">{errors.smtpHost}</p>
                )}
              </div>

              {/* SMTP Port */}
              <div>
                <label
                  htmlFor="smtpPort"
                  className="block text-sm font-medium text-gray-700"
                >
                  SMTP Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="smtpPort"
                  name="smtpPort"
                  value={formData.smtpPort}
                  onChange={handleChange}
                  placeholder="587"
                  min="1"
                  max="65535"
                  className={`mt-1 block w-full rounded-md border ${
                    errors.smtpPort ? "border-red-500" : "border-gray-300"
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.smtpPort && (
                  <p className="mt-1 text-sm text-red-600">{errors.smtpPort}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Common: 587 (TLS), 465 (SSL), 25 (Plain)
                </p>
              </div>

              {/* SMTP Username */}
              <div>
                <label
                  htmlFor="smtpUsername"
                  className="block text-sm font-medium text-gray-700"
                >
                  SMTP Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="smtpUsername"
                  name="smtpUsername"
                  value={formData.smtpUsername}
                  onChange={handleChange}
                  placeholder="your-email@example.com"
                  className={`mt-1 block w-full rounded-md border ${
                    errors.smtpUsername ? "border-red-500" : "border-gray-300"
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.smtpUsername && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.smtpUsername}
                  </p>
                )}
              </div>

              {/* SMTP Password */}
              <div className="md:col-span-2">
                <label
                  htmlFor="smtpPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  SMTP Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="smtpPassword"
                    name="smtpPassword"
                    value={formData.smtpPassword}
                    onChange={handleChange}
                    placeholder="Enter SMTP password"
                    className={`mt-1 block w-full rounded-md border ${
                      errors.smtpPassword ? "border-red-500" : "border-gray-300"
                    } px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.smtpPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.smtpPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Email Settings Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Email Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Email */}
              <div>
                <label
                  htmlFor="fromEmail"
                  className="block text-sm font-medium text-gray-700"
                >
                  From Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="fromEmail"
                  name="fromEmail"
                  value={formData.fromEmail}
                  onChange={handleChange}
                  placeholder="noreply@example.com"
                  className={`mt-1 block w-full rounded-md border ${
                    errors.fromEmail ? "border-red-500" : "border-gray-300"
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.fromEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.fromEmail}
                  </p>
                )}
              </div>

              {/* From Name */}
              <div>
                <label
                  htmlFor="fromName"
                  className="block text-sm font-medium text-gray-700"
                >
                  From Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fromName"
                  name="fromName"
                  value={formData.fromName}
                  onChange={handleChange}
                  placeholder="Vehicle Track"
                  className={`mt-1 block w-full rounded-md border ${
                    errors.fromName ? "border-red-500" : "border-gray-300"
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.fromName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fromName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="active"
                className="ml-2 block text-sm text-gray-700"
              >
                Active Configuration
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Testing...
              </>
            ) : (
              "Test & Send Email"
            )}
          </button>

          <div className="space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting || isTesting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isTesting || !isDirty}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </form>
      </div>
    </>
  );
}
