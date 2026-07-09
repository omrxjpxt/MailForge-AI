"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const campaigns = [
  {
    id: "1",
    name: "Tech Founders Q4",
    created: "2 days ago",
    status: "Active",
    prospects: 420,
    openRate: "68.2%",
    replies: 12,
    color: "bg-blue-500"
  },
  {
    id: "2",
    name: "SaaS Integration Beta",
    created: "5 days ago",
    status: "Paused",
    prospects: 1050,
    openRate: "41.0%",
    replies: 45,
    color: "bg-green-500"
  },
  {
    id: "3",
    name: "Cold Outreach - Marketing",
    created: "1 week ago",
    status: "Completed",
    prospects: 150,
    openRate: "82.5%",
    replies: 8,
    color: "bg-orange-500"
  }
];

export function RecentCampaigns() {
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base font-semibold">Recent Campaigns</CardTitle>
          <CardDescription>Managing your active outreach pipelines</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Filter className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">Filter</span>
        </Button>
      </CardHeader>
      <CardContent>
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
                    <div className={`h-8 w-2 rounded-full ${campaign.color}`} />
                    <div className="flex flex-col">
                      <span className="font-medium">{campaign.name}</span>
                      <span className="text-xs text-muted-foreground">Created {campaign.created}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`
                      ${campaign.status === 'Active' ? 'text-green-500 border-green-500/20 bg-green-500/10' : ''}
                      ${campaign.status === 'Paused' ? 'text-muted-foreground border-border bg-muted/50' : ''}
                      ${campaign.status === 'Completed' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' : ''}
                      font-normal px-2 py-0 h-6 text-xs gap-1.5 rounded-full
                    `}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      campaign.status === 'Active' ? 'bg-green-500' :
                      campaign.status === 'Paused' ? 'bg-muted-foreground' :
                      'bg-blue-500'
                    }`} />
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{campaign.prospects.toLocaleString()}</TableCell>
                <TableCell className="text-right text-muted-foreground">{campaign.openRate}</TableCell>
                <TableCell className="text-right text-muted-foreground">{campaign.replies}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <div className="text-xs text-muted-foreground">
            Showing 3 of 12 campaigns
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" disabled>Prev</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs">Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
