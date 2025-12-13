import { EmailConfigForm } from "@/components/admin/email-config-form";
import { requireAuth } from "@/lib/auth-utils";
import { getEmailConfigForUser } from "@/lib/services/email-config.service";
import { redirect } from "next/navigation";

export default async function EmailConfigPage() {
  const { user } = await requireAuth();

  // Check if user has permission to view this page
  if (!["admin", "manager"].includes(user.roleName)) {
    redirect("/dashboard");
  }

  // Fetch current email configuration
  const emailConfig = await getEmailConfigForUser(user.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Email Configuration
        </h1>
        <p className="mt-2 text-gray-600">
          Configure SMTP settings for sending emails from the system
        </p>
      </div>

      {/* Status Info Box */}
      {emailConfig && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Current Configuration Status
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Status:{" "}
                  <span
                    className={`font-semibold ${
                      emailConfig.active ? "text-green-700" : "text-gray-700"
                    }`}
                  >
                    {emailConfig.active ? "Active" : "Inactive"}
                  </span>
                </p>
                <p>
                  Last Updated:{" "}
                  {emailConfig.updatedAt
                    ? new Date(emailConfig.updatedAt).toLocaleString("en-AU", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </p>
                <p>
                  From: {emailConfig.fromName} &lt;{emailConfig.fromEmail}&gt;
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <EmailConfigForm
            initialConfig={emailConfig as any}
            userEmail={user.email}
          />
        </div>

        {/* Help Sidebar */}
        <div className="space-y-6">
          {/* Common Providers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Common SMTP Providers
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Gmail</p>
                <p className="text-gray-600">smtp.gmail.com:587</p>
                <p className="text-xs text-gray-500 mt-1">
                  Use App Password, not regular password
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="font-medium text-gray-900">Office 365</p>
                <p className="text-gray-600">smtp.office365.com:587</p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="font-medium text-gray-900">Outlook.com</p>
                <p className="text-gray-600">smtp-mail.outlook.com:587</p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="font-medium text-gray-900">SendGrid</p>
                <p className="text-gray-600">smtp.sendgrid.net:587</p>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Security Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-yellow-500 shrink-0 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Passwords are encrypted in the database</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-yellow-500 shrink-0 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Use app-specific passwords for Gmail</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-yellow-500 shrink-0 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Test before saving to verify settings</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-yellow-500 shrink-0 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Admins and managers can configure their own SMTP</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
