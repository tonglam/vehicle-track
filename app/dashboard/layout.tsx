import { Navigation } from "@/components/layout/navigation";
import { requireAuth } from "@/lib/auth-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
      <footer className="bg-white border-t mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 Vehicle Track. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
