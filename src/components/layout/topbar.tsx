"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { GlobalSearch } from "./global-search";
import { NotificationDropdown } from "./notification-dropdown";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function Topbar() {
  const router = useRouter();
  const { metrics, isLoading } = useDashboardData();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear session cookie via API
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background px-6 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle mobile menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 border-r-0 sm:max-w-[280px]">
            <div className="sr-only">
              <SheetTitle>Mobile Navigation</SheetTitle>
              <SheetDescription>Mobile navigation menu</SheetDescription>
            </div>
            <Sidebar className="w-full border-none" />
          </SheetContent>
        </Sheet>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-4">
        {/* Usage Badge */}
        {!isLoading && (
          <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            <span>Usage: {metrics.emailsSentToday}/{metrics.dailyLimit} Sent</span>
            <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
              <div 
                className={`h-full ${metrics.emailsSentToday >= metrics.dailyLimit ? 'bg-destructive' : 'bg-primary'}`} 
                style={{ width: `${Math.min((metrics.emailsSentToday / metrics.dailyLimit) * 100, 100)}%` }} 
              />
            </div>
          </div>
        )}

        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive w-full cursor-pointer" onClick={() => handleLogout()}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
