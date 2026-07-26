"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Pencil,
  Copy,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Lead } from "@/types/lead";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";
import { CsvImportDialog } from "@/components/leads/csv-import-dialog";
import { Users } from "lucide-react";

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  selectedLeadIds: Set<string>;
  onSelectLead: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (lead: Lead) => void;
  onDuplicate: (lead: Lead) => void;
  onArchive: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  totalCount: number;
  // Cursor pagination props
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  pageIndex: number; // 0-based
  pageSize: number;
}

export function LeadsTable({ 
  leads, 
  isLoading,
  selectedLeadIds,
  onSelectLead,
  onSelectAll,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  totalCount,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
  pageIndex,
  pageSize
}: LeadsTableProps) {
  
  const allSelected = leads.length > 0 && selectedLeadIds.size === leads.length;
  
  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'text-blue-500 border-blue-500/20 bg-blue-500/10';
      case 'Contacted': return 'text-orange-500 border-orange-500/20 bg-orange-500/10';
      case 'Follow-up Scheduled': return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10';
      case 'Replied': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
      case 'Interested': return 'text-green-600 border-green-600/20 bg-green-600/10';
      case 'Meeting Booked': return 'text-indigo-500 border-indigo-500/20 bg-indigo-500/10';
      case 'Closed Won': return 'text-green-700 border-green-700/20 bg-green-700/10';
      case 'Closed Lost': return 'text-red-500 border-red-500/20 bg-red-500/10';
      default: return 'text-gray-500 border-gray-500/20 bg-gray-500/10';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-500';
      case 'Contacted': return 'bg-orange-500';
      case 'Follow-up Scheduled': return 'bg-yellow-500';
      case 'Replied': return 'bg-emerald-500';
      case 'Interested': return 'bg-green-600';
      case 'Meeting Booked': return 'bg-indigo-500';
      case 'Closed Won': return 'bg-green-700';
      case 'Closed Lost': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12 text-center">
                <Checkbox 
                  checked={allSelected} 
                  onCheckedChange={(c) => onSelectAll(!!c)} 
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground w-[250px]">Contact Name</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Company</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Industry</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Added</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Loading leads...
                </TableCell>
              </TableRow>
            ) : leads.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 p-0">
                  <EmptyState 
                    icon={Users}
                    title="No leads found"
                    description="You haven't imported any leads yet, or none match your filters."
                  >
                    <div className="mt-4">
                      <CsvImportDialog existingLeads={leads} />
                    </div>
                  </EmptyState>
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const isSelected = selectedLeadIds.has(lead.id);
                return (
                  <TableRow key={lead.id} className={`border-border/50 group ${isSelected ? 'bg-muted/50' : ''}`}>
                    <TableCell className="text-center">
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={(c) => onSelectLead(lead.id, !!c)} 
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-background">
                          <AvatarFallback className="text-white text-xs bg-primary/80">
                            {getInitials(lead.firstName, lead.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col max-w-[180px]">
                          <span className="font-semibold truncate" title={`${lead.firstName} ${lead.lastName}`}>
                            {lead.firstName} {lead.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground truncate" title={lead.email}>
                            {lead.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[150px]" title={lead.company}>
                      {lead.company}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-muted text-[10px] font-semibold tracking-wider text-muted-foreground uppercase rounded-sm border-border/50 truncate max-w-[120px]">
                        {lead.industry}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`font-normal px-2 py-0 h-6 text-xs gap-1.5 rounded-full ${getStatusColor(lead.status)}`}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${getStatusDot(lead.status)}`} />
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(lead.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 data-[state=open]:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(lead)} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(lead)} className="cursor-pointer">
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onArchive(lead)} className="cursor-pointer">
                            <Archive className="mr-2 h-4 w-4" /> {lead.isArchived ? "Unarchive" : "Archive"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(lead)} className="cursor-pointer text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">
              {totalCount === 0 ? 0 : pageIndex * pageSize + 1}-
              {Math.min((pageIndex + 1) * pageSize, totalCount)}
            </span> of {totalCount} leads
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1" 
              disabled={!hasPrevPage || isLoading}
              onClick={onPrevPage}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1" 
              disabled={!hasNextPage || isLoading}
              onClick={onNextPage}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
