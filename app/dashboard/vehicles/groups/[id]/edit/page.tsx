import { GroupForm } from "@/components/vehicle-group/group-form";
import { auth } from "@/lib/auth";
import { getVehicleGroupById } from "@/lib/services/vehicle-group.service";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function EditVehicleGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const group = await getVehicleGroupById(id);

  if (!group) {
    notFound();
  }

  // Extract only the fields needed for the form
  const formGroup = {
    id: group.id,
    name: group.name,
    description: group.description,
    type: group.type,
    contractId: group.contractId,
    areaManagerContact: group.areaManagerContact,
    signatureMode: group.signatureMode,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    createdBy: group.createdBy,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Form */}
        <GroupForm group={formGroup} isEdit={true} />
      </div>
    </div>
  );
}
