"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadDialog } from "@/components/leads/lead-dialog";
import { CsvImportDialog } from "@/components/leads/csv-import-dialog";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useConfirm } from "@/components/ui/confirm-modal";
import { useAuth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/client";
import { 
  collection, query, where, orderBy, onSnapshot, 
  limit, startAfter, QueryDocumentSnapshot, getCountFromServer
} from "firebase/firestore";
import { Lead, LeadStatusEnum } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { deleteLead, duplicateLead, archiveLead, bulkDeleteLeads, bulkUpdateStatus } from "@/lib/firebase/leads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "next/navigation";

const PAGE_SIZE = 50;

function LeadsPageContent() {
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
  const confirm = useConfirm();
  const lastSelectedIdRef = React.useRef<string | null>(null);

  // Dialog states
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("action") === "create") {
      setTimeout(() => setIsLeadDialogOpen(true), 0);
    }
  }, [searchParams]);

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

  }, [user, authLoading, statusFilter]);

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, statusFilter, pageIndex]); // Excluded pageCursors on purpose to prevent loops

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search
      if (searchQuery) {
        const term = searchQuery.toLowerCase();
        const matchName = `${lead.firstName || ""} ${lead.lastName || ""}`.toLowerCase().includes(term);
        const matchEmail = (lead.email || "").toLowerCase().includes(term);
        const matchCompany = (lead.company || "").toLowerCase().includes(term);
        if (!matchName && !matchEmail && !matchCompany) return false;
      }
      
      // Client-side Industry filter
      if (industryFilter !== "all" && lead.industry !== industryFilter) {
        // Simple exact match logic
        // In a real app with freeform industry text, you'd probably lowercase match or normalize
        if (industryFilter === "Other") {
          const known = ["SaaS", "Fintech", "Healthcare", "E-commerce"];
          if (known.includes(lead.industry || "")) return false;
        } else if ((lead.industry || "").toLowerCase() !== industryFilter.toLowerCase()) {
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

  const handleSelectLead = (id: string, selected: boolean, shiftKey?: boolean) => {
    const next = new Set(selectedLeadIds);
    
    if (shiftKey && lastSelectedIdRef.current && selected) {
      // Range select: find the range between lastSelected and current
      const lastIdx = filteredLeads.findIndex(l => l.id === lastSelectedIdRef.current);
      const currIdx = filteredLeads.findIndex(l => l.id === id);
      if (lastIdx !== -1 && currIdx !== -1) {
        const [from, to] = lastIdx < currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
        for (let i = from; i <= to; i++) {
          next.add(filteredLeads[i].id);
        }
        setSelectedLeadIds(next);
        lastSelectedIdRef.current = id;
        return;
      }
    }
    
    if (selected) next.add(id);
    else next.delete(id);
    setSelectedLeadIds(next);
    if (selected) lastSelectedIdRef.current = id;
    else if (lastSelectedIdRef.current === id) lastSelectedIdRef.current = null;
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    else setSelectedLeadIds(new Set());
  };

  const handleBulkDelete = () => {
    if (!user || selectedLeadIds.size === 0) return;
    
    const selectedLeadsList = leads.filter(l => selectedLeadIds.has(l.id));
    const count = selectedLeadIds.size;
    const leadItems = selectedLeadsList.map(l => ({
      name: `${l.firstName || ""} ${l.lastName || ""}`.trim() || "Unknown",
      email: l.email || undefined,
    }));

    confirm({
      title: count === 1 ? "Delete 1 Lead?" : `Delete ${count} Leads?`,
      description: count === 1
        ? "You're about to permanently delete this lead. This action cannot be undone."
        : `You're about to permanently delete ${count} leads. This action cannot be undone.`,
      leadItems,
      actionButtonText: count === 1 ? "Delete Lead" : `Delete ${count} Leads`,
      onConfirm: async () => {
        setIsBulkLoading(true);
        try {
          await bulkDeleteLeads(user.uid, Array.from(selectedLeadIds));
          setSelectedLeadIds(new Set());
        } finally {
          setIsBulkLoading(false);
        }
      },
      successToast: count === 1 ? "Lead deleted successfully." : `${count} leads deleted successfully.`
    });
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

  const handleDelete = (lead: Lead) => {
    if (!user) return;
    const name = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Unknown";
    confirm({
      title: `Delete ${name}?`,
      description: "You're about to permanently delete this lead. This action cannot be undone.",
      leadItems: [{ name, email: lead.email || undefined }],
      actionButtonText: "Delete Lead",
      onConfirm: async () => {
        await deleteLead(user.uid, lead.id);
      },
      successToast: "Lead deleted successfully."
    });
  };

  const handleArchive = async (lead: Lead) => {
    if (!user) return;
    try {
      await archiveLead(user.uid, lead.id, !lead.isArchived);
      toast.success(`Lead ${lead.isArchived ? "unarchived" : "archived"}`);
    } catch {
      toast.error("Failed to archive lead");
    }
  };

  const handleDuplicate = async (lead: Lead) => {
    if (!user) return;
    try {
      await duplicateLead(user.uid, lead);
      toast.success("Lead duplicated");
    } catch {
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

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LeadsPageContent />
    </Suspense>
  );
}
