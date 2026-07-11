"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadStatusEnum } from "@/types/lead";

interface LeadFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  industryFilter: string;
  setIndustryFilter: (val: string) => void;
  sourceFilter: string;
  setSourceFilter: (val: string) => void;
}

export function LeadFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  industryFilter,
  setIndustryFilter,
  sourceFilter,
  setSourceFilter
}: LeadFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 py-4 mb-2">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name, email, or company..." 
          className="pl-9 bg-card"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-[140px] bg-card">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LeadStatusEnum.options.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={industryFilter} onValueChange={(v) => setIndustryFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-[140px] bg-card">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {/* Real app would dynamically generate this from data, or have a predefined list */}
            <SelectItem value="SaaS">SaaS</SelectItem>
            <SelectItem value="Fintech">Fintech</SelectItem>
            <SelectItem value="Healthcare">Healthcare</SelectItem>
            <SelectItem value="E-commerce">E-commerce</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-[130px] bg-card">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
            <SelectItem value="CSV">CSV</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
