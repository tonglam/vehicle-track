import { AgreementPreview } from "@/components/agreements/agreement-preview";
import { requireAuth } from "@/lib/auth-utils";
import { getAgreementDetailContext } from "@/lib/services/agreement.service";
import { notFound } from "next/navigation";

export default async function AgreementPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const agreement = await getAgreementDetailContext(id);

  if (!agreement) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AgreementPreview agreement={agreement} />
    </div>
  );
}
