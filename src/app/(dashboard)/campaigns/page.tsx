import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { ArchivedTable } from "@/components/campaigns/archived-table";
import { CampaignStats } from "@/components/campaigns/campaign-stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Orchestrate and automate your outreach at scale.</p>
        </div>
        <Button className="h-9 gap-2" asChild>
          <Link href="/campaigns/new">
            <Plus className="h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      <CampaignStats />

      <Tabs defaultValue="active" className="w-full mt-6">
        <TabsList className="mb-4 bg-muted/50 w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="active" className="rounded-sm">Active (2)</TabsTrigger>
          <TabsTrigger value="paused" className="rounded-sm">Paused (1)</TabsTrigger>
          <TabsTrigger value="archived" className="rounded-sm">Archived (4)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <CampaignCard 
              name="Tech Founders Q4"
              status="Active"
              openRate={68.2}
              openRateTrend="+5.2%"
              replyRate={12.5}
              replyRateTrend="+1.1%"
              sent={450}
              total={1000}
              icon="zap"
            />
            <CampaignCard 
              name="SaaS Integrations"
              status="Active"
              openRate={72.4}
              openRateTrend="+2.4%"
              replyRate={18.2}
              replyRateTrend="+3.4%"
              sent={120}
              total={300}
              icon="sparkles"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="paused" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <CampaignCard 
              name="Cold Outreach - Marketing"
              status="Paused"
              openRate={41.0}
              openRateTrend="-2.1%"
              replyRate={2.5}
              replyRateTrend="-0.5%"
              sent={850}
              total={2000}
              icon="zap"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="archived" className="mt-0">
          <ArchivedTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
