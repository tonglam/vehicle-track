import { DriverSigningView } from "@/components/agreements/driver-signing";
import { getAgreementSigningContext } from "@/lib/services/agreement.service";
import { notFound } from "next/navigation";

export default async function DriverSigningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agreement = await getAgreementSigningContext(id);

  if (!agreement) {
    notFound();
  }

  return <DriverSigningView context={agreement} />;
}
