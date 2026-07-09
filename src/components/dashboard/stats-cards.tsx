"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Send, Clock, Users, Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Emails Sent</span>
              <Send className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">6/10</div>
              <Progress value={60} className="mt-2 h-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Remaining</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">4</div>
              <p className="mt-1 text-xs text-primary font-medium">Next batch in 2h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Pending Leads</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">1,248</div>
              <p className="mt-1 text-xs text-muted-foreground">+12 today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Campaigns</span>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">12</div>
              <p className="mt-1 text-xs text-muted-foreground">4 active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
