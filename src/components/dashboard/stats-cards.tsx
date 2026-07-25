"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Send, Clock, Users, Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DashboardData } from "@/hooks/use-dashboard-data";

interface StatsCardsProps {
  metrics: DashboardData["metrics"];
}

export function StatsCards({ metrics }: StatsCardsProps) {
  const percentageSent = Math.min((metrics.emailsSentToday / metrics.dailyLimit) * 100, 100);
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
              <div className="text-2xl font-bold">{metrics.emailsSentToday}/{metrics.dailyLimit}</div>
              <Progress value={percentageSent} className="mt-2 h-1.5" />
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
              <div className="text-2xl font-bold">{Math.max(metrics.dailyLimit - metrics.emailsSentToday, 0)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Emails left today</p>
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
              <div className="text-2xl font-bold">{metrics.pendingLeads.toLocaleString()}</div>
              <p className="mt-1 text-xs text-muted-foreground">Awaiting outreach</p>
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
              <div className="text-2xl font-bold">{metrics.totalCampaigns}</div>
              <p className="mt-1 text-xs text-muted-foreground">{metrics.activeCampaigns} active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
