"use client";

import { Users, Mailbox, Activity, CheckCircle2 } from "lucide-react";
import { Campaign } from "@/types/campaign";

interface CampaignStatsProps {
  campaigns: Campaign[];
}

export function CampaignStats({ campaigns }: CampaignStatsProps) {
  const activeCampaigns = campaigns.filter(c => c.status === "Running" || c.status === "Scheduled").length;
  
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.totalLeads ?? c.leadIds?.length ?? 0), 0);
  const emailsSent = campaigns.reduce((acc, c) => acc + c.emailsSent, 0);
  
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.emailsDelivered || c.emailsSent || 0), 0);
  const totalOpens = campaigns.reduce((acc, c) => acc + (c.opens || 0), 0);
  
  const avgOpenRate = totalDelivered > 0 ? Math.min((totalOpens / totalDelivered) * 100, 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Activity className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Active Campaigns</span>
        </div>
        <div className="text-3xl font-bold mb-1">{activeCampaigns}</div>
        <div className="text-xs font-medium text-muted-foreground">Out of {campaigns.length} total</div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">Total Enrolled Leads</span>
        </div>
        <div className="text-3xl font-bold mb-1">{totalLeads.toLocaleString()}</div>
        <div className="text-xs font-medium text-muted-foreground">Across all campaigns</div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Mailbox className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Emails Sent</span>
        </div>
        <div className="text-3xl font-bold mb-1">{emailsSent.toLocaleString()}</div>
        <div className="text-xs font-medium text-muted-foreground">All time volume</div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">Avg. Open Rate</span>
        </div>
        <div className="text-3xl font-bold mb-1">{avgOpenRate.toFixed(1)}%</div>
        <div className="text-xs font-medium text-muted-foreground">Based on deliveries</div>
      </div>
    </div>
  );
}
