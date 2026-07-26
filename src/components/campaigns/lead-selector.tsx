"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/client";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Lead } from "@/types/lead";
import { Input } from "@/components/ui/input";
import { Search, Users, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface LeadSelectorProps {
  selectedLeadIds: string[];
  onChange: (leadIds: string[]) => void;
  onHasLeadsChange?: (hasLeads: boolean) => void;
  onPreviewLead?: (lead: Lead) => void;
}

export function LeadSelector({ selectedLeadIds, onChange, onHasLeadsChange, onPreviewLead }: LeadSelectorProps) {
  const { user, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;

    // eslint-disable-next-line
    setIsLoading(true);
    // Fetch all leads for the selector. In a huge CRM, we'd paginate this too, 
    // but a multi-select dropdown/table usually needs all selectable leads for 'select all' to work perfectly
    // or requires advanced server-side 'select all' logic.
    const q = query(
      collection(db, "users", user.uid, "leads"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(newLeads);
      setIsLoading(false);
      if (onHasLeadsChange) {
        onHasLeadsChange(newLeads.length > 0);
      }
    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error("Lead selector snapshot error:", error);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, onHasLeadsChange]);

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const term = searchQuery.toLowerCase();
    return leads.filter(lead => 
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(term) ||
      lead.email.toLowerCase().includes(term) ||
      lead.company.toLowerCase().includes(term)
    );
  }, [leads, searchQuery]);

  const allSelected = filteredLeads.length > 0 && 
    filteredLeads.every(lead => selectedLeadIds.includes(lead.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Add all filtered leads to selection
      const newSelections = new Set([...selectedLeadIds, ...filteredLeads.map(l => l.id)]);
      onChange(Array.from(newSelections));
    } else {
      // Remove all filtered leads from selection
      const filteredIds = new Set(filteredLeads.map(l => l.id));
      const newSelections = selectedLeadIds.filter(id => !filteredIds.has(id));
      onChange(newSelections);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedLeadIds, id]);
    } else {
      onChange(selectedLeadIds.filter(selectedId => selectedId !== id));
    }
  };

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-lg bg-muted/10">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No leads available</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Create or import leads before launching your first campaign.
        </p>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/leads?action=create">Add Lead</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/leads?action=import">Import CSV</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name, email, or company..." 
          className="pl-9 bg-card"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="max-h-[300px] overflow-y-auto">
          {filteredLeads.length === 0 ? (
            <div className="flex justify-center items-center h-32 text-sm text-muted-foreground">
              No leads found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                <tr className="border-b border-border text-left">
                  <th className="py-2 pl-4 pr-2 font-medium w-12 text-center">
                    <Checkbox 
                      checked={allSelected} 
                      onCheckedChange={(c) => handleSelectAll(!!c)} 
                    />
                  </th>
                  <th className="py-2 px-2 font-medium">Contact</th>
                  <th className="py-2 px-2 font-medium">Company</th>
                  <th className="py-2 px-4 font-medium text-right">Status</th>
                  {onPreviewLead && <th className="py-2 px-4 font-medium text-right">Preview</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 pl-4 pr-2 text-center">
                      <Checkbox 
                        checked={selectedLeadIds.includes(lead.id)}
                        onCheckedChange={(c) => handleSelectOne(lead.id, !!c)}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {getInitials(lead.firstName, lead.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[120px]" title={`${lead.firstName} ${lead.lastName}`}>
                            {lead.firstName} {lead.lastName}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={lead.email}>
                            {lead.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 truncate max-w-[100px] text-muted-foreground" title={lead.company}>
                      {lead.company}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Badge variant="outline" className="text-[10px] h-5 py-0 px-1.5 rounded-sm bg-background font-normal">
                        {lead.status}
                      </Badge>
                    </td>
                    {onPreviewLead && (
                      <td className="py-2 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={(e) => {
                            e.preventDefault();
                            onPreviewLead(lead);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
