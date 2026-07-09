"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MoreVertical, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CampaignCardProps {
  name: string;
  status: "Active" | "Paused";
  openRate: number;
  openRateTrend: string;
  replyRate: number;
  replyRateTrend: string;
  sent: number;
  total: number;
  icon: "zap" | "sparkles";
}

export function CampaignCard({
  name,
  status,
  openRate,
  openRateTrend,
  replyRate,
  replyRateTrend,
  sent,
  total,
  icon
}: CampaignCardProps) {
  const percentage = Math.round((sent / total) * 100);

  return (
    <Card className="bg-card flex flex-col h-full border-border/50">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <div className="mt-1">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                {icon === 'zap' ? <Zap className="h-5 w-5" /> : <Sparkles className="h-5 w-5 text-blue-400" />}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`h-2 w-2 rounded-full ${status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-muted-foreground'}`}></div>
                <span className="text-xs text-muted-foreground font-medium">{status}</span>
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
              <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
              <DropdownMenuItem>{status === 'Active' ? 'Pause' : 'Resume'}</DropdownMenuItem>
              <DropdownMenuItem>View Leads</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/50 bg-muted/20">
            <span className="text-xs font-medium text-muted-foreground">Open Rate</span>
            <span className="text-xl font-bold">{openRate.toFixed(1)}%</span>
            <span className={`text-[10px] font-medium ${openRateTrend.startsWith('+') ? 'text-green-500' : 'text-muted-foreground'}`}>
              {openRateTrend.startsWith('+') ? <TrendingIcon up /> : openRateTrend === 'Static' ? '— Static' : <TrendingIcon up={false} />} {openRateTrend !== 'Static' && openRateTrend}
            </span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/50 bg-muted/20">
            <span className="text-xs font-medium text-muted-foreground">Reply Rate</span>
            <span className="text-xl font-bold">{replyRate.toFixed(1)}%</span>
            <span className={`text-[10px] font-medium ${replyRateTrend.startsWith('+') ? 'text-green-500' : replyRateTrend.startsWith('-') ? 'text-destructive' : 'text-muted-foreground'}`}>
              {replyRateTrend.startsWith('+') ? <TrendingIcon up /> : replyRateTrend.startsWith('-') ? <TrendingIcon up={false} /> : '— Static'} {replyRateTrend !== 'Static' && replyRateTrend}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border/30">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-muted-foreground font-medium">{sent} / {total} Emails Sent</span>
            <span className="font-semibold">{percentage}%</span>
          </div>
          <Progress value={percentage} className={`h-1.5 ${status === 'Active' ? 'bg-primary/20' : 'bg-muted'}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function TrendingIcon({ up }: { up: boolean }) {
  if (up) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-0.5">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-0.5">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}
