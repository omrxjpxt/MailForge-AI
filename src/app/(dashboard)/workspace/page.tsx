"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PencilLine } from "lucide-react";
import Link from "next/link";

export default function WorkspacePage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">AI Workspace</h1>
        <p className="text-muted-foreground">Write and preview personalized emails for individual leads.</p>
      </div>

      <Card className="bg-card">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <PencilLine className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              The AI Workspace will let you compose, refine, and preview personalized emails for individual prospects — powered by Gemini. In the meantime, use the Campaign Builder to send emails at scale.
            </p>
            <Button asChild>
              <Link href="/campaigns/new">Create a Campaign</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
