"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const archivedCampaigns = [
  {
    id: "1",
    name: "Summer Outreach 2023",
    status: "Archived",
    audience: "Growth Leads",
    openRate: "58.2%",
    replyRate: "8.4%",
    dateArchived: "Sep 12, 2023"
  },
  {
    id: "2",
    name: "Product Hunt Launch",
    status: "Archived",
    audience: "Early Adopters",
    openRate: "91.0%",
    replyRate: "42.2%",
    dateArchived: "Aug 05, 2023"
  },
  {
    id: "3",
    name: "VC Networking Q2",
    status: "Archived",
    audience: "Top Tier VCs",
    openRate: "45.8%",
    replyRate: "5.1%",
    dateArchived: "Jun 30, 2023"
  },
  {
    id: "4",
    name: "Cold Email Experiment",
    status: "Archived",
    audience: "General Tech",
    openRate: "32.1%",
    replyRate: "2.4%",
    dateArchived: "May 15, 2023"
  }
];

export function ArchivedTable() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between p-6">
        <h3 className="text-base font-semibold">Archived Campaigns</h3>
        <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted font-medium">Total: 4</Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">CAMPAIGN NAME</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">STATUS</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">AUDIENCE</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">OPEN RATE</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">REPLY RATE</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">DATE ARCHIVED</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {archivedCampaigns.map((campaign) => (
            <TableRow key={campaign.id} className="border-border/50">
              <TableCell className="font-medium text-sm text-foreground/90">{campaign.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-muted/50 border-border/50 text-muted-foreground font-normal text-xs px-2 h-6">
                  {campaign.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{campaign.audience}</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">{campaign.openRate}</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">{campaign.replyRate}</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground font-mono text-xs">{campaign.dateArchived}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
