"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight, Loader2 } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/client";
import { doc, setDoc } from "firebase/firestore";

export function OnboardingChecklist() {
  const { onboarding, isLoading } = useDashboardData();
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  if (isLoading || onboarding.isComplete) return null;

  const steps = [
    {
      id: "gmail",
      title: "Connect your Gmail account",
      description: "Allow MailForge AI to send emails on your behalf.",
      href: "/settings?tab=integrations",
      isComplete: onboarding.steps.gmailConnected,
    },
    {
      id: "lead",
      title: "Import your first lead",
      description: "Add a prospect to your pipeline manually or via CSV.",
      href: "/leads?action=create",
      isComplete: onboarding.steps.leadCreated,
    },
    {
      id: "template",
      title: "Create an AI template",
      description: "Design a high-converting email using our AI builder.",
      href: "/templates",
      isComplete: onboarding.steps.templateCreated,
    },
    {
      id: "campaign",
      title: "Build a campaign",
      description: "Combine your leads and templates into an outreach sequence.",
      href: "/campaigns/new",
      isComplete: onboarding.steps.campaignCreated,
    },
    {
      id: "launch",
      title: "Launch your campaign",
      description: "Start sending emails and track your success in real-time.",
      href: "/campaigns",
      isComplete: onboarding.steps.campaignLaunched,
    },
  ];

  const allComplete = steps.every((s) => s.isComplete);
  const completedCount = steps.filter((s) => s.isComplete).length;
  const progress = (completedCount / steps.length) * 100;

  const handleComplete = async () => {
    if (!user) return;
    setIsCompleting(true);
    await setDoc(doc(db, "users", user.uid), {
      onboarding: { isComplete: true }
    }, { merge: true });
    setIsCompleting(false);
  };

  return (
    <Card className="bg-primary/5 border-primary/20 mb-6">
      <CardHeader className="pb-4 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-primary flex items-center gap-2">
              <span role="img" aria-label="rocket">🚀</span> Getting Started
            </CardTitle>
            <CardDescription className="mt-1">
              Complete these steps to launch your first campaign.
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-primary">{completedCount} / {steps.length} completed</span>
            <div className="w-32 h-2 bg-primary/20 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`flex items-center justify-between p-4 border-b border-primary/10 last:border-0 hover:bg-primary/5 transition-colors ${step.isComplete ? 'opacity-70' : ''}`}
            >
              <div className="flex items-center gap-3">
                {step.isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div>
                  <h4 className={`font-medium ${step.isComplete ? 'line-through text-muted-foreground' : ''}`}>
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              <Button variant={step.isComplete ? "ghost" : "secondary"} size="sm" asChild className="shrink-0 ml-4">
                <Link href={step.href}>
                  {step.isComplete ? "Review" : "Start"} <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      {allComplete && (
        <CardFooter className="p-4 bg-primary/10 border-t border-primary/20 flex justify-end">
          <Button onClick={handleComplete} disabled={isCompleting}>
            {isCompleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Complete Onboarding
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
