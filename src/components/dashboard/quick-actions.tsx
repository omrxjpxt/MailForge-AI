"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Mail, Sparkles, Plus } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  return (
    <Card className="bg-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="flex h-20 flex-col items-center justify-center gap-2 border-border/50 bg-background hover:bg-muted/50 hover:border-primary/50 transition-colors" asChild>
            <Link href="/leads">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs">Import CSV</span>
            </Link>
          </Button>
          <Button variant="outline" className="flex h-20 flex-col items-center justify-center gap-2 border-border/50 bg-background hover:bg-muted/50 hover:border-primary/50 transition-colors" asChild>
            <a href="/api/gmail/auth">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-center leading-tight">Connect<br/>Gmail</span>
            </a>
          </Button>
          <Button variant="outline" className="flex h-20 flex-col items-center justify-center gap-2 border-border/50 bg-background hover:bg-muted/50 hover:border-primary/50 transition-colors" asChild>
            <Link href="/campaigns">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-center leading-tight">Generate<br/>Copy</span>
            </Link>
          </Button>
          <Button variant="outline" className="flex h-20 flex-col items-center justify-center gap-2 border-border/50 bg-background hover:bg-muted/50 hover:border-primary/50 transition-colors" asChild>
            <Link href="/campaigns/new">
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-center leading-tight">New<br/>Campaign</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
