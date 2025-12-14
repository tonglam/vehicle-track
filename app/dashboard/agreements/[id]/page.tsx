import { AgreementFinaliseForm } from "@/components/agreements/agreement-finalise-form";
import { requireAuth } from "@/lib/auth-utils";
import { getAgreementFinaliseContext } from "@/lib/services/agreement.service";
import { notFound } from "next/navigation";

export default async function AgreementFinalisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const agreement = await getAgreementFinaliseContext(id);

  if (!agreement) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AgreementFinaliseForm agreement={agreement} />
    </div>
  );
}
