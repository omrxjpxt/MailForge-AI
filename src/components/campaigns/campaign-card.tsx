"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MoreVertical, Zap, Sparkles, Play, Pause, Copy, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Campaign } from "@/types/campaign";

interface CampaignCardProps {
  campaign: Campaign;
  onLaunch?: (id: string) => void;
  onPause?: (id: string) => void;
  onDuplicate?: (campaign: Campaign) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function CampaignCard({
  campaign,
  onLaunch,
  onPause,
  onDuplicate,
  onArchive,
  onDelete
}: CampaignCardProps) {
  const safeTotalLeads = campaign.totalLeads ?? campaign.leadIds?.length ?? 0;
  const percentage = safeTotalLeads > 0 
    ? Math.round((campaign.emailsSent / safeTotalLeads) * 100)
    : 0;

  const openRate = campaign.emailsDelivered > 0 
    ? (campaign.opens / campaign.emailsDelivered) * 100 
    : 0;
    
  const replyRate = campaign.emailsDelivered > 0 
    ? (campaign.replies / campaign.emailsDelivered) * 100 
    : 0;

  const isActive = campaign.status === "Running" || campaign.status === "Scheduled";
  const icon = campaign.emailsSent > 0 ? "zap" : "sparkles"; // just a visual heuristic

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Running": return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]";
      case "Scheduled": return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]";
      case "Paused": return "bg-yellow-500";
      case "Completed": return "bg-emerald-600";
      case "Failed": return "bg-destructive";
      case "Draft": return "bg-muted-foreground";
      default: return "bg-muted-foreground";
    }
  };

  return (
    <Card className="bg-card flex flex-col h-full border-border/50 transition-all hover:border-primary/20 hover:shadow-sm">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <div className="mt-1">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                {icon === 'zap' ? <Zap className="h-5 w-5" /> : <Sparkles className="h-5 w-5 text-blue-400" />}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg truncate max-w-[180px]" title={campaign.name}>
                {campaign.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`h-2 w-2 rounded-full ${getStatusColor(campaign.status)}`}></div>
                <span className="text-xs text-muted-foreground font-medium">{campaign.status}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground -mr-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(campaign.status === 'Draft' || campaign.status === 'Paused') && onLaunch && (
                <DropdownMenuItem onClick={() => onLaunch(campaign.id!)} className="cursor-pointer">
                  <Play className="mr-2 h-4 w-4 text-green-500" /> Launch
                </DropdownMenuItem>
              )}
              {isActive && onPause && (
                <DropdownMenuItem onClick={() => onPause(campaign.id!)} className="cursor-pointer">
                  <Pause className="mr-2 h-4 w-4 text-yellow-500" /> Pause
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(campaign)} className="cursor-pointer">
                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                </DropdownMenuItem>
              )}
              {onArchive && campaign.status !== "Archived" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onArchive(campaign.id!)} className="cursor-pointer">
                    <Archive className="mr-2 h-4 w-4" /> Archive
                  </DropdownMenuItem>
                </>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(campaign.id!)} className="cursor-pointer text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/50 bg-muted/20">
            <span className="text-xs font-medium text-muted-foreground">Open Rate</span>
            <span className="text-xl font-bold">{openRate.toFixed(1)}%</span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {campaign.opens} / {campaign.emailsDelivered}
            </span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/50 bg-muted/20">
            <span className="text-xs font-medium text-muted-foreground">Reply Rate</span>
            <span className="text-xl font-bold">{replyRate.toFixed(1)}%</span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {campaign.replies} / {campaign.emailsDelivered}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border/30">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-muted-foreground font-medium">{campaign.emailsSent} / {campaign.totalLeads ?? campaign.leadIds?.length ?? 0} Emails Sent</span>
            <span className="font-semibold">{percentage}%</span>
          </div>
          <Progress value={percentage} className={`h-1.5 ${isActive ? 'bg-primary/20' : 'bg-muted'}`} />
        </div>
      </CardContent>
    </Card>
  );
}
