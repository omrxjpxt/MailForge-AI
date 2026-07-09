"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X, TrendingUp } from "lucide-react";

export function LeadFilters() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-border bg-card rounded-lg mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
          <Filter className="h-4 w-4" />
          FILTERS:
        </div>
        
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
            <span className="text-muted-foreground mr-1">Industry:</span> <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="saas">SaaS</SelectItem>
            <SelectItem value="fintech">Fintech</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
            <SelectItem value="ai">AI</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
            <span className="text-muted-foreground mr-1">Status:</span> <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="month">
          <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
            <span className="text-muted-foreground mr-1">Date:</span> <SelectValue placeholder="This Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground px-2">
          Clear All
        </Button>
      </div>

      <div className="flex items-center gap-4 border-l border-border pl-4">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Total Leads</span>
          <span className="text-lg font-bold leading-none mt-1">1,284</span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
          <TrendingUp className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
