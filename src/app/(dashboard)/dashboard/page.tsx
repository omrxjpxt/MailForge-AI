import { StatsCards } from "@/components/dashboard/stats-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RecentCampaigns } from "@/components/dashboard/recent-campaigns";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Good Morning, Om</h1>
        <p className="text-muted-foreground">Here's what is happening with your outreach today.</p>
      </div>
      
      <div className="grid gap-6">
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          <div className="flex flex-col gap-6 xl:col-span-2">
            <StatsCards />
            <PerformanceChart />
          </div>
          <div className="flex flex-col gap-6">
            <QuickActions />
            <div className="flex-1">
              <RecentActivity />
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 grid-cols-1">
          <RecentCampaigns />
        </div>
      </div>
    </div>
  );
}
