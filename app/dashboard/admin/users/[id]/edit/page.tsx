import { UserForm } from "@/components/admin/user-form";
import { requireAuth } from "@/lib/auth-utils";
import { getRoles, getUserById } from "@/lib/services/user.service";
import { notFound, redirect } from "next/navigation";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user: currentUser } = await requireAuth();
  const { id } = await params;

  // Only admins can edit users
  if (currentUser.roleName !== "admin") {
    redirect("/dashboard/admin/users");
  }

  // Fetch the user to edit
  const user = await getUserById(id);
  if (!user) {
    notFound();
  }

  // Fetch roles for the dropdown
  const roles = await getRoles();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Operator</h1>
        <p className="mt-2 text-gray-600">
          Update user information for {user.firstName} {user.lastName}
        </p>
      </div>

      <UserForm mode="edit" user={user} roles={roles} />
    </div>
  );
}

