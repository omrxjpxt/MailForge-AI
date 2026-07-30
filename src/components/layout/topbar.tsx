"use client";
import { useState } from "react";

import { Menu, User, Settings, CreditCard, HelpCircle, Keyboard, LogOut } from "lucide-react";
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
import { useAuth } from "@/lib/firebase/auth";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { GlobalSearch } from "./global-search";
import { NotificationDropdown } from "./notification-dropdown";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useConfirm } from "@/components/ui/confirm-modal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Search, MoveUp, MoveDown, CornerDownLeft, X } from "lucide-react";

export function Topbar() {
  const router = useRouter();
  const { user } = useAuth();
  const { metrics, isLoading } = useDashboardData();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-9 w-9 border border-border/50 shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-background relative"
            >
              <Avatar className="h-full w-full">
                <AvatarImage src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt={user?.displayName || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "JD"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500 shadow-sm"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            sideOffset={8}
            className="w-[320px] rounded-2xl border border-border/40 bg-background/70 backdrop-blur-xl p-2 shadow-2xl shadow-black/40"
          >
            <div className="flex flex-col space-y-3 p-3 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border border-border/50 shadow-sm">
                    <AvatarImage src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "JD"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500 shadow-sm"></span>
                </div>
                <div className="flex flex-col space-y-0.5 min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.displayName || "Om Gangwar"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate font-medium">
                    {user?.email || "omgangster9@gmail.com"}
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-primary uppercase">
                  Pro Workspace
                </div>
              </div>
            </div>

            <DropdownMenuSeparator className="bg-border/50 mx-1" />
            <div className="p-1 space-y-0.5">
              <DropdownMenuItem 
                onClick={() => router.push("/settings")} 
                className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors duration-200 hover:bg-accent focus:bg-accent"
              >
                <Settings className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground group-focus:text-foreground" />
                <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground group-focus:text-foreground">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/settings?tab=billing")} 
                className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors duration-200 hover:bg-accent focus:bg-accent"
              >
                <CreditCard className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground group-focus:text-foreground" />
                <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground group-focus:text-foreground">Billing</span>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-border/50 mx-1" />
            <div className="p-1 space-y-0.5">
              <DropdownMenuItem 
                onClick={() => setShowHelpModal(true)}
                className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors duration-200 hover:bg-accent focus:bg-accent"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground group-focus:text-foreground" />
                <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground group-focus:text-foreground">Help</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowShortcutsModal(true)}
                className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors duration-200 hover:bg-accent focus:bg-accent"
              >
                <Keyboard className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground group-focus:text-foreground" />
                <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground group-focus:text-foreground">Keyboard Shortcuts</span>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-border/50 mx-1" />
            <div className="p-1">
              <DropdownMenuItem 
                onClick={handleLogoutClick}
                className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors duration-200 hover:bg-destructive/10 focus:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-destructive group-focus:text-destructive" />
                <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-destructive group-focus:text-destructive">Log Out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Help Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="sm:max-w-md p-6 bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl rounded-2xl">
          <DialogHeader className="mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl text-center">Help Center</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Documentation and support will be available soon.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 rounded-xl p-4 text-center border border-border/50 mt-2">
            <p className="text-sm text-muted-foreground mb-1">Need immediate assistance?</p>
            <a href="mailto:gangwarom973@gmail.com" className="text-primary font-medium hover:underline">
              gangwarom973@gmail.com
            </a>
          </div>
          
          <DialogFooter className="sm:justify-center mt-6">
            <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => setShowHelpModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Modal */}
      <Dialog open={showShortcutsModal} onOpenChange={setShowShortcutsModal}>
        <DialogContent className="sm:max-w-md p-6 bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl rounded-2xl">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                <Keyboard className="h-5 w-5 text-foreground" />
              </div>
              <DialogTitle className="text-xl">Keyboard Shortcuts</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="space-y-3">
            {[
              { keys: ["⌘K", "Ctrl+K"], desc: "Global search" },
              { keys: ["Esc"], desc: "Close dialogs & menus" },
              { keys: ["↑", "↓"], desc: "Navigate menus" },
              { keys: ["Enter"], desc: "Confirm selection" },
              { keys: ["?"], desc: "Open shortcuts" },
            ].map((shortcut, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <span className="text-sm font-medium text-muted-foreground">{shortcut.desc}</span>
                <div className="flex items-center gap-1.5">
                  {shortcut.keys.map((k, j) => (
                    <span key={j} className="inline-flex h-6 min-w-6 px-1.5 items-center justify-center rounded bg-muted border border-border/50 text-[11px] font-mono font-medium text-foreground">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter className="mt-8 hidden">
            <Button type="button" variant="ghost" onClick={() => setShowShortcutsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="sm:max-w-[480px] p-8 bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl rounded-[16px]">
          <DialogHeader className="mb-6 flex flex-row items-center gap-4 space-y-0 text-left">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <LogOut className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-[20px] font-semibold">Sign out?</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                You'll be signed out of MailForge AI on this device.
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="bg-muted/30 rounded-xl p-5 border border-border/50 mb-8">
            <p className="text-sm font-medium text-foreground mb-3">You will:</p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                End your current session
              </li>
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                Return to the login screen
              </li>
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                Keep all campaigns and data safely stored
              </li>
            </ul>
          </div>
          
          <DialogFooter className="sm:justify-between w-full gap-3 sm:space-x-0 grid grid-cols-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12 rounded-xl text-base font-medium" 
              onClick={() => setShowLogoutModal(false)}
              autoFocus
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              className="w-full h-12 rounded-xl text-base font-medium bg-destructive hover:bg-destructive/90 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200" 
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
