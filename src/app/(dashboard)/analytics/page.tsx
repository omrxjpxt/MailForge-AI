"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { ArrowUpRight, ArrowDownRight, Minus, Loader2 } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { getFunnelMetrics } from "@/lib/analytics";

export default function AnalyticsPage() {
  const { isLoading, metrics, performanceData } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate percentages for the funnel
  const sent = metrics.totalEmailsSent;
  const funnel = getFunnelMetrics(metrics as any);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Deep dive into your outreach performance metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Sent" 
          value={metrics.totalEmailsSent.toLocaleString()} 
          trend="0.0%" 
          trendDirection="flat" 
          subtitle="Lifetime" 
        />
        <MetricCard 
          title="Avg. Open Rate" 
          value={`${metrics.avgOpenRate.toFixed(1)}%`} 
          trend="0.0%" 
          trendDirection="flat" 
          subtitle="Lifetime" 
        />
        <MetricCard 
          title="Avg. Reply Rate" 
          value={`${metrics.avgReplyRate.toFixed(1)}%`} 
          trend="0.0%" 
          trendDirection="flat" 
          subtitle="Lifetime" 
        />
        <MetricCard 
          title="Bounce Rate" 
          value={`${metrics.bounceRate.toFixed(1)}%`} 
          trend="0.0%" 
          trendDirection="flat" 
          subtitle="Lifetime" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <PerformanceChart data={performanceData} />
        </div>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
            <CardDescription>From sent to positive reply</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <div className="space-y-6">
              <FunnelStep label="Sent" count={sent} percentage={funnel.sentPerc} color="bg-blue-500" />
              <FunnelStep label="Delivered" count={metrics.totalDelivered} percentage={funnel.deliveredPerc} color="bg-indigo-500" />
              <FunnelStep label="Opened" count={metrics.totalOpened} percentage={funnel.openedPerc} color="bg-purple-500" />
              <FunnelStep label="Replied" count={metrics.totalReplied} percentage={funnel.repliedPerc} color="bg-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down" | "flat";
  subtitle: string;
}

function MetricCard({ title, value, trend, trendDirection, subtitle }: MetricCardProps) {
  return (
    <Card className="bg-card">
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold">{value}</span>
          <span className={`text-xs flex items-center font-medium ${
            trendDirection === 'up' ? 'text-green-500' : 
            trendDirection === 'down' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {trendDirection === 'up' && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
            {trendDirection === 'down' && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
            {trendDirection === 'flat' && <Minus className="h-3 w-3 mr-0.5" />}
            {trend}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

interface FunnelStepProps {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

function FunnelStep({ label, count, percentage, color }: FunnelStepProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{count.toLocaleString()}</span>
          <span className="font-bold w-12 text-right">{percentage.toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage.toFixed(1)}%` }} />
      </div>
    </div>
  );
}
