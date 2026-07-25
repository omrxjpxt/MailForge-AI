import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

// Server Component (can fetch real data later)
export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Deep dive into your outreach performance metrics.</p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Sent" 
          value="12,450" 
          trend="+14.2%" 
          trendDirection="up" 
          subtitle="vs previous period" 
        />
        <MetricCard 
          title="Avg. Open Rate" 
          value="48.2%" 
          trend="+2.1%" 
          trendDirection="up" 
          subtitle="vs previous period" 
        />
        <MetricCard 
          title="Avg. Reply Rate" 
          value="8.4%" 
          trend="-0.5%" 
          trendDirection="down" 
          subtitle="vs previous period" 
        />
        <MetricCard 
          title="Bounce Rate" 
          value="1.2%" 
          trend="0.0%" 
          trendDirection="flat" 
          subtitle="vs previous period" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <PerformanceChart />
        </div>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
            <CardDescription>From sent to positive reply</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <div className="space-y-6">
              <FunnelStep label="Sent" count={12450} percentage={100} color="bg-blue-500" />
              <FunnelStep label="Delivered" count={12300} percentage={98.8} color="bg-indigo-500" />
              <FunnelStep label="Opened" count={5930} percentage={47.6} color="bg-purple-500" />
              <FunnelStep label="Replied" count={1045} percentage={8.4} color="bg-primary" />
              <FunnelStep label="Positive" count={320} percentage={2.6} color="bg-green-500" />
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
          <span className="font-bold w-12 text-right">{percentage}%</span>
        </div>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
