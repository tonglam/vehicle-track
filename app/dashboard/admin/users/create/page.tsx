import { UserForm } from "@/components/admin/user-form";
import { requireAuth } from "@/lib/auth-utils";
import { getRoles } from "@/lib/services/user.service";
import { redirect } from "next/navigation";

export default async function CreateUserPage() {
  const { user } = await requireAuth();

  // Only admins can create users
  if (user.roleName !== "admin") {
    redirect("/dashboard/admin/users");
  }

  // Fetch roles for the dropdown
  const roles = await getRoles();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create User</h1>
        <p className="mt-2 text-gray-600">Add a new user to the system</p>
      </div>

      <UserForm mode="create" roles={roles} />
    </div>
  );
}
