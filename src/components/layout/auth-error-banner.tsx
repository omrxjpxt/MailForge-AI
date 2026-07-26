"use client";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function AuthErrorBanner() {
  const { gmailConnected, gmailAuthError, isLoading } = useDashboardData();
  const router = useRouter();

  if (isLoading || gmailConnected || !gmailAuthError) {
    return null;
  }

  const handleReconnect = () => {
    // Redirect to the auth endpoint to start OAuth flow
    router.push("/api/auth/google");
  };

  return (
    <div className="bg-destructive/15 border-b border-destructive/20 px-4 py-3 flex items-center justify-between text-sm">
      <div className="flex items-center text-destructive font-medium">
        <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
        {gmailAuthError}
      </div>
      <Button variant="destructive" size="sm" onClick={handleReconnect} className="flex-shrink-0 ml-4">
        Reconnect Gmail
      </Button>
    </div>
  );
}
