import { Footer, Header } from "@/components/layout";
import { PersistedToastListener } from "@/components/ui/persisted-toast-listener";
import { requireAuth } from "@/lib/auth-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      <PersistedToastListener />
      <main className="flex-1 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
