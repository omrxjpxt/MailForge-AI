"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Mail, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardData } from "@/hooks/use-dashboard-data";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RecentCampaignsProps {
  campaigns: DashboardData["recentCampaigns"];
}

export function RecentCampaigns({ campaigns }: RecentCampaignsProps) {
  const router = useRouter();
  const hasData = campaigns.length > 0;
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base font-semibold">Recent Campaigns</CardTitle>
          <CardDescription>Managing your active outreach pipelines</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1" asChild>
          <Link href="/campaigns">
            <span className="sr-only sm:not-sr-only">View All</span>
            <ArrowRight className="h-3.5 w-3.5 sm:ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-muted-foreground w-[300px]">CAMPAIGN NAME</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground text-right">PROSPECTS</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground text-right">OPEN RATE</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground text-right">REPLIES</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground text-right w-[60px]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="border-border/50 group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-2 rounded-full bg-blue-500`} />
                        <div className="flex flex-col">
                          <span className="font-medium">{campaign.name}</span>
                          <span className="text-xs text-muted-foreground">Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`
                          ${campaign.status === 'Running' ? 'text-green-500 border-green-500/20 bg-green-500/10' : ''}
                          ${campaign.status === 'Paused' || campaign.status === 'Draft' ? 'text-muted-foreground border-border bg-muted/50' : ''}
                          ${campaign.status === 'Completed' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' : ''}
                          font-normal px-2 py-0 h-6 text-xs gap-1.5 rounded-full
                        `}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          campaign.status === 'Running' ? 'bg-green-500' :
                          campaign.status === 'Paused' || campaign.status === 'Draft' ? 'bg-muted-foreground' :
                          'bg-blue-500'
                        }`} />
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {(campaign.totalLeads ?? campaign.leadIds?.length ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {(campaign.emailsDelivered || 0) > 0 ? (((campaign.opens || 0) / (campaign.emailsDelivered || 0)) * 100).toFixed(1) + '%' : '0%'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{campaign.replies}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                        <Link href="/campaigns">
                          <ArrowRight className="h-4 w-4" />
                          <span className="sr-only">View Campaigns</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <div className="text-xs text-muted-foreground">
                Showing {campaigns.length} campaigns
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled>Prev</Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled>Next</Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={Mail}
            title="No campaigns found"
            description="You haven't created any campaigns yet. Start your first outreach campaign."
            actionLabel="Create Campaign"
            onAction={() => router.push("/campaigns/new")}
          />
        )}
      </CardContent>
    </Card>
  );
}
