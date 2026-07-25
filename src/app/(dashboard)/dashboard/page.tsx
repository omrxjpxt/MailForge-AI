"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { LatestChanges } from "@/components/dashboard/recent-activity";
import { RecentCampaigns } from "@/components/dashboard/recent-campaigns";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { isLoading, metrics, performanceData, latestChanges, recentCampaigns, firstName } = useDashboardData();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground">Here's what is happening with your outreach today.</p>
      </div>
      
      <div className="grid gap-6">
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          <div className="flex flex-col gap-6 xl:col-span-2">
            <StatsCards metrics={metrics} />
            <PerformanceChart data={performanceData} />
          </div>
          <div className="flex flex-col gap-6">
            <QuickActions />
            <div className="flex-1">
              <LatestChanges activities={latestChanges} />
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 grid-cols-1">
          <RecentCampaigns campaigns={recentCampaigns} />
        </div>
      </div>
    </div>
  );
}
