import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";

export default async function DashboardPage() {
  const { user } = await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user.firstName} {user.lastName}
        </p>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Vehicles */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Vehicles
            </h2>
            <Link
              href="/dashboard/vehicles"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <p className="text-sm text-gray-500">No vehicles yet</p>
        </div>

        {/* Recent Inspections */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Inspections
            </h2>
            <Link
              href="/dashboard/inspections"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <p className="text-sm text-gray-500">No inspections yet</p>
        </div>

        {/* Recent Agreements */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Agreements
            </h2>
            <Link
              href="/dashboard/agreements"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <p className="text-sm text-gray-500">No agreements yet</p>
        </div>
      </div>

      {/* Management Center */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Management Center
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/vehicles/groups"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Vehicle Groups
            </h3>
            <p className="text-sm text-gray-600">
              Manage vehicle groups and assignments
            </p>
          </Link>

          {user.roleName === "admin" && (
            <Link
              href="/dashboard/accounts/operators"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                User Management
              </h3>
              <p className="text-sm text-gray-600">Manage users and roles</p>
            </Link>
          )}

          <Link
            href="/dashboard/vehicles"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              All Vehicles
            </h3>
            <p className="text-sm text-gray-600">
              View and manage all vehicles
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
