import { UserTable } from "@/components/admin/user-table";
import { DismissibleAlert } from "@/components/ui";
import { requireAuth } from "@/lib/auth-utils";
import { listUsers } from "@/lib/services/user.service";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user } = await requireAuth();

  const params = await searchParams;
  const statusMessage =
    typeof params.status === "string" ? params.status : undefined;

  // Check if user has permission to view this page
  if (!["admin", "manager"].includes(user.roleName)) {
    redirect("/dashboard");
  }

  const currentPage =
    typeof params.page === "string" ? parseInt(params.page) : 1;
  const search = typeof params.search === "string" ? params.search : undefined;
  const roleFilter = typeof params.role === "string" ? params.role : "all";
  const statusFilter =
    typeof params.active === "string" ? params.active : "all";
  const limit = 10;
  const offset = (currentPage - 1) * limit;

  // Fetch users
  const { users: userList, total } = await listUsers({
    limit,
    offset,
    search,
    role: roleFilter,
    active: statusFilter,
  });

  const totalPages = Math.ceil(total / limit);

  // Determine if current user is admin (for showing action buttons)
  const isAdmin = user.roleName === "admin";

  return (
    <div className="space-y-6">
      {statusMessage === "created" && (
        <DismissibleAlert
          type="success"
          message="User created successfully. The invite email (if selected) has been sent."
        />
      )}
      {statusMessage === "updated" && (
        <DismissibleAlert type="info" message="User updated successfully." />
      )}
      {statusMessage === "deleted" && (
        <DismissibleAlert type="error" message="User deleted successfully." />
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">Manage system users and roles</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/admin/users/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create User
          </Link>
        )}
      </div>

      <UserTable
        users={userList}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        isAdmin={isAdmin}
        currentUserId={user.id}
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
      />
    </div>
  );
}
