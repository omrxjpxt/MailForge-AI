"use client";

import { Users, MessageSquarePlus, Bot, ShieldCheck } from "lucide-react";

export function CampaignStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">Total Prospects</span>
        </div>
        <div className="text-3xl font-bold mb-1">2,480</div>
        <div className="text-xs font-medium text-green-500">+140 this week</div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <MessageSquarePlus className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">Positive Replies</span>
        </div>
        <div className="text-3xl font-bold mb-1">312</div>
        <div className="text-xs font-medium text-green-500">12.5% Conversion</div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Bot className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium">AI Drafter Active</span>
        </div>
        <div className="text-3xl font-bold mb-1">86%</div>
        <div className="text-xs font-medium text-muted-foreground">Automating responses</div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 w-32 h-32 translate-x-8 -translate-y-8">
          <ShieldCheck className="w-full h-full" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <span className="text-sm font-medium">Global Health</span>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-500/30 bg-green-500/10 text-green-500 font-bold text-lg shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            A+
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">High deliverability</span>
            <span className="text-xs text-muted-foreground mt-0.5">Sender score optimal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
