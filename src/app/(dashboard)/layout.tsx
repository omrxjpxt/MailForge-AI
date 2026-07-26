import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { WelcomeModal } from "@/components/dashboard/welcome-modal";
import { Celebration } from "@/components/dashboard/celebration";

import { AuthErrorBanner } from "@/components/layout/auth-error-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <AuthErrorBanner />
        <main className="flex-1 overflow-y-auto bg-background/50">
          {children}
        </main>
        <WelcomeModal />
        <Celebration />
      </div>
    </div>
  );
}
