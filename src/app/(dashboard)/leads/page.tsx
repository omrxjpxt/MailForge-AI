"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadDialog } from "@/components/leads/lead-dialog";
import { CsvImportDialog } from "@/components/leads/csv-import-dialog";
import { useAuth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/client";
import { 
  collection, query, where, orderBy, onSnapshot, 
  limit, startAfter, endBefore, QueryDocumentSnapshot, getCountFromServer
} from "firebase/firestore";
import { Lead, LeadStatusEnum } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { deleteLead, duplicateLead, archiveLead, bulkDeleteLeads, bulkUpdateStatus } from "@/lib/firebase/leads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 50;

export default function LeadsPage() {
  const { user, loading: authLoading } = useAuth();
  
  // Real-time Firestore state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination state (Firestore)
  const [pageCursors, setPageCursors] = useState<QueryDocumentSnapshot[]>([]);
  const [pageIndex, setPageIndex] = useState(0);

  // Firestore Filters (Server-side)
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // React Filters (Client-side)
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Dialog states
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPageIndex(0);
    setPageCursors([]);
    
    const fetchTotal = async () => {
      try {
        let q = query(collection(db, "users", user.uid, "leads"));
        if (statusFilter !== "all") {
          q = query(q, where("status", "==", statusFilter));
        }
        const snapshot = await getCountFromServer(q);
        setTotalCount(snapshot.data().count);
      } catch (err) {
        console.error("Failed to fetch count:", err);
      }
    };
    fetchTotal();

  }, [user, statusFilter]);

  useEffect(() => {
    if (authLoading || !user) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingLeads(true);

    const baseQ = collection(db, "users", user.uid, "leads");
    const constraints: import("firebase/firestore").QueryConstraint[] = [];

      if (statusFilter !== "all") {
        constraints.push(where("status", "==", statusFilter));
      }
      
      constraints.push(orderBy("createdAt", "desc"));
      constraints.push(limit(PAGE_SIZE));

      if (pageIndex > 0 && pageCursors[pageIndex - 1]) {
        constraints.push(startAfter(pageCursors[pageIndex - 1]));
      }

      const q = query(baseQ, ...constraints);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
        setLeads(newLeads);
        
        if (snapshot.docs.length > 0) {
          const lastVisible = snapshot.docs[snapshot.docs.length - 1];
          setPageCursors(prev => {
            const next = [...prev];
            next[pageIndex] = lastVisible;
            return next;
          });
        }
        
        setIsLoadingLeads(false);
      }, (error) => {
        console.error("Firestore leads error:", error);
        toast.error("Failed to load leads");
        setIsLoadingLeads(false);
      });

      return () => unsubscribe();
  }, [user, statusFilter, pageIndex]); // Excluded pageCursors on purpose to prevent loops

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search
      if (searchQuery) {
        const term = searchQuery.toLowerCase();
        const matchName = `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(term);
        const matchEmail = lead.email.toLowerCase().includes(term);
        const matchCompany = lead.company.toLowerCase().includes(term);
        if (!matchName && !matchEmail && !matchCompany) return false;
      }
      
      // Client-side Industry filter
      if (industryFilter !== "all" && lead.industry !== industryFilter) {
        // Simple exact match logic
        // In a real app with freeform industry text, you'd probably lowercase match or normalize
        if (industryFilter === "Other") {
          const known = ["SaaS", "Fintech", "Healthcare", "E-commerce"];
          if (known.includes(lead.industry)) return false;
        } else if (lead.industry.toLowerCase() !== industryFilter.toLowerCase()) {
          return false;
        }
      }

      // Client-side Source filter
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;

      return true;
    });
  }, [leads, searchQuery, industryFilter, sourceFilter]);

  const handleNextPage = () => setPageIndex(p => p + 1);
  const handlePrevPage = () => setPageIndex(p => Math.max(0, p - 1));

  const handleSelectLead = (id: string, selected: boolean) => {
    const next = new Set(selectedLeadIds);
    if (selected) next.add(id);
    else next.delete(id);
    setSelectedLeadIds(next);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    else setSelectedLeadIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (!user || selectedLeadIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.size} leads?`)) return;
    
    setIsBulkLoading(true);
    try {
      await bulkDeleteLeads(user.uid, Array.from(selectedLeadIds));
      toast.success(`Deleted ${selectedLeadIds.size} leads`);
      setSelectedLeadIds(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk delete failed");
    }
    setIsBulkLoading(false);
  };

  const handleBulkStatusUpdate = async () => {
    if (!user || selectedLeadIds.size === 0 || !bulkStatus) return;
    
    setIsBulkLoading(true);
    try {
      await bulkUpdateStatus(user.uid, Array.from(selectedLeadIds), bulkStatus);
      toast.success(`Updated status for ${selectedLeadIds.size} leads`);
      setSelectedLeadIds(new Set());
      setBulkStatus("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk update failed");
    }
    setIsBulkLoading(false);
  };

  const handleDelete = async (lead: Lead) => {
    if (!user) return;
    if (confirm(`Delete ${lead.firstName} ${lead.lastName}?`)) {
      try {
        await deleteLead(user.uid, lead.id);
        toast.success("Lead deleted");
      } catch (e) {
        toast.error("Failed to delete lead");
      }
    }
  };

  const handleArchive = async (lead: Lead) => {
    if (!user) return;
    try {
      await archiveLead(user.uid, lead.id, !lead.isArchived);
      toast.success(`Lead ${lead.isArchived ? "unarchived" : "archived"}`);
    } catch (e) {
      toast.error("Failed to archive lead");
    }
  };

  const handleDuplicate = async (lead: Lead) => {
    if (!user) return;
    try {
      await duplicateLead(user.uid, lead);
      toast.success("Lead duplicated");
    } catch (e) {
      toast.error("Failed to duplicate lead");
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Manage and segment your prospect universe with AI-powered insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <CsvImportDialog existingLeads={leads} />
          <Button className="h-9 gap-2" onClick={() => {
            setLeadToEdit(null);
            setIsLeadDialogOpen(true);
          }}>
            <UserPlus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col w-full">
        {selectedLeadIds.size > 0 ? (
          <div className="flex items-center gap-4 py-4 mb-2 bg-primary/10 rounded-md px-4 border border-primary/20">
            <span className="font-semibold text-primary">{selectedLeadIds.size} selected</span>
            
            <div className="flex items-center gap-2 ml-4 border-l border-primary/20 pl-4">
              <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v || "")}>
                <SelectTrigger className="w-[180px] h-8 bg-background">
                  <SelectValue placeholder="Update Status..." />
                </SelectTrigger>
                <SelectContent>
                  {LeadStatusEnum.options.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8" 
                disabled={!bulkStatus || isBulkLoading}
                onClick={handleBulkStatusUpdate}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Apply
              </Button>
            </div>

            <Button 
              variant="destructive" 
              size="sm" 
              className="h-8 ml-auto"
              disabled={isBulkLoading}
              onClick={handleBulkDelete}
            >
              {isBulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete Selected
            </Button>
          </div>
        ) : (
          <LeadFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            industryFilter={industryFilter}
            setIndustryFilter={setIndustryFilter}
            sourceFilter={sourceFilter}
            setSourceFilter={setSourceFilter}
          />
        )}
        
        <LeadsTable 
          leads={filteredLeads}
          isLoading={isLoadingLeads}
          selectedLeadIds={selectedLeadIds}
          onSelectLead={handleSelectLead}
          onSelectAll={handleSelectAll}
          onEdit={(lead) => {
            setLeadToEdit(lead);
            setIsLeadDialogOpen(true);
          }}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onDelete={handleDelete}
          totalCount={totalCount}
          hasNextPage={leads.length === PAGE_SIZE}
          hasPrevPage={pageIndex > 0}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          pageIndex={pageIndex}
          pageSize={PAGE_SIZE}
        />
      </div>

      <LeadDialog 
        isOpen={isLeadDialogOpen} 
        onOpenChange={setIsLeadDialogOpen} 
        leadToEdit={leadToEdit} 
      />
    </div>
  );
}
