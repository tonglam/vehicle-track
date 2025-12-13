import { ProfileForm } from "@/components/profile/profile-form";
import { requireAuth } from "@/lib/auth-utils";
import { getRoles, getUserById } from "@/lib/services/user.service";
import { notFound } from "next/navigation";

export default async function ProfilePage() {
  const { user: currentUser } = await requireAuth();

  // Fetch full user details
  const user = await getUserById(currentUser.id);
  if (!user) {
    notFound();
  }

  // If admin, fetch roles for role selection
  const roles = user.roleName === "admin" ? await getRoles() : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">Update your personal information</p>
      </div>

      <ProfileForm user={user} roles={roles} />
    </div>
  );
}

