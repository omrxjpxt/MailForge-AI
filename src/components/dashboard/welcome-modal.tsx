"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useAuth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/client";
import { doc, setDoc } from "firebase/firestore";
import { Sparkles, Mail, Users, BarChart3 } from "lucide-react";

export function WelcomeModal() {
  const { user } = useAuth();
  const { onboarding, isLoading, firstName } = useDashboardData();
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    if (!isLoading && user && !onboarding.welcomeModalSeen) {
      setTimeout(() => setIsOpen(true), 0);
    }
  }, [isLoading, onboarding.welcomeModalSeen, user]);

  const handleGetStarted = async () => {
    setIsOpen(false);
    if (user) {
      await setDoc(doc(db, "users", user.uid), {
        onboarding: { welcomeModalSeen: true }
      }, { merge: true });
    }
  };

  // Don't render the modal container until we know it's needed
  if (!isOpen && onboarding.welcomeModalSeen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleGetStarted();
      } else {
        setIsOpen(open);
      }
    }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="bg-primary/5 p-6 flex flex-col items-center justify-center text-center border-b border-border">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">Welcome to MailForge AI{firstName ? `, ${firstName}` : ""}!</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Your new intelligent outreach engine is ready. Let&apos;s get you set up to send your first AI-powered campaign in under 5 minutes.
          </DialogDescription>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-medium">Connect your inbox</h4>
              <p className="text-sm text-muted-foreground">Link your Gmail account to send emails directly from your own address.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h4 className="font-medium">Import your leads</h4>
              <p className="text-sm text-muted-foreground">Add your prospects manually or import them via CSV in seconds.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <BarChart3 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium">Generate & Launch</h4>
              <p className="text-sm text-muted-foreground">Use AI to generate highly personalized emails and track your success.</p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="p-6 pt-0 sm:justify-center">
          <Button size="lg" className="w-full" onClick={handleGetStarted}>
            Let&apos;s Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
