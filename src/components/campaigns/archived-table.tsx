"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Campaign } from "@/types/campaign";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";

interface ArchivedTableProps {
  campaigns: Campaign[];
  onDelete?: (id: string) => void;
  onUnarchive?: (id: string) => void; // Unarchiving sets it back to Draft
}

export function ArchivedTable({ campaigns, onDelete, onUnarchive }: ArchivedTableProps) {
  const archivedCampaigns = campaigns.filter(c => c.status === "Archived");

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between p-6">
        <h3 className="text-base font-semibold">Archived Campaigns</h3>
        <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted font-medium">
          Total: {archivedCampaigns.length}
        </Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">CAMPAIGN NAME</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">STATUS</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">LEADS</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">OPEN RATE</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">REPLY RATE</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">DATE ARCHIVED</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {archivedCampaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-48 p-0">
                <EmptyState
                  icon={Trash2}
                  title="No archived campaigns"
                  description="Archived campaigns will appear here."
                />
              </TableCell>
            </TableRow>
          ) : (
            archivedCampaigns.map((campaign) => {
              const openRate = campaign.emailsDelivered > 0 ? ((campaign.opens / campaign.emailsDelivered) * 100).toFixed(1) + "%" : "0%";
              const replyRate = campaign.emailsDelivered > 0 ? ((campaign.replies / campaign.emailsDelivered) * 100).toFixed(1) + "%" : "0%";

              return (
                <TableRow key={campaign.id} className="border-border/50">
                  <TableCell className="font-medium text-sm text-foreground/90 max-w-[200px] truncate" title={campaign.name}>
                    {campaign.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted/50 border-border/50 text-muted-foreground font-normal text-xs px-2 h-6">
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{campaign.totalLeads}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{openRate}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{replyRate}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground font-mono text-xs">
                    {format(campaign.updatedAt, "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onUnarchive && (
                          <DropdownMenuItem onClick={() => onUnarchive(campaign.id!)} className="cursor-pointer">
                            <Play className="mr-2 h-4 w-4" /> Unarchive to Draft
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem onClick={() => onDelete(campaign.id!)} className="cursor-pointer text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
