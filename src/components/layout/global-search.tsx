"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Users, Mail, LayoutTemplate, Command, LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, onSnapshot, limit, orderBy } from "firebase/firestore";
import { useDebounce } from "@/hooks/use-debounce";
import { Lead } from "@/types/lead";
import { Campaign } from "@/types/campaign";
import { EmailTemplate } from "@/types/template";

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Data caches
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Keyboard nav state
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcuts and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Firestore Subscriptions (Cache locally for speed)
  useEffect(() => {
    let unsubLeads: (() => void) | undefined;
    let unsubCampaigns: (() => void) | undefined;
    let unsubTemplates: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoading(true);
        const uid = user.uid;
        
        const leadsQ = query(collection(db, "users", uid, "leads"), orderBy("createdAt", "desc"), limit(200));
        const campaignsQ = query(collection(db, "users", uid, "campaigns"), orderBy("createdAt", "desc"), limit(200));
        const templatesQ = query(collection(db, "users", uid, "templates"), orderBy("updatedAt", "desc"), limit(200));

        let leadsLoaded = false;
        let campaignsLoaded = false;
        let templatesLoaded = false;

        const checkLoading = () => {
          if (leadsLoaded && campaignsLoaded && templatesLoaded) {
            setIsLoading(false);
          }
        };
        
        unsubLeads = onSnapshot(leadsQ, (snap) => {
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
          console.log(`[GlobalSearch] Loaded ${data.length} leads.`);
          setLeads(data);
          leadsLoaded = true;
          checkLoading();
        }, (error) => {
          console.error("Error fetching leads for search:", error);
          leadsLoaded = true;
          checkLoading();
        });
        
        unsubCampaigns = onSnapshot(campaignsQ, (snap) => {
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
          console.log(`[GlobalSearch] Loaded ${data.length} campaigns.`);
          setCampaigns(data);
          campaignsLoaded = true;
          checkLoading();
        }, (error) => {
          console.error("Error fetching campaigns for search:", error);
          campaignsLoaded = true;
          checkLoading();
        });
        
        unsubTemplates = onSnapshot(templatesQ, (snap) => {
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailTemplate));
          console.log(`[GlobalSearch] Loaded ${data.length} templates.`);
          setTemplates(data);
          templatesLoaded = true;
          checkLoading();
        }, (error) => {
          console.error("Error fetching templates for search:", error);
          templatesLoaded = true;
          checkLoading();
        });
      } else {
        // User logged out, clean up data
        setLeads([]);
        setCampaigns([]);
        setTemplates([]);
        setIsLoading(false);
        if (unsubLeads) unsubLeads();
        if (unsubCampaigns) unsubCampaigns();
        if (unsubTemplates) unsubTemplates();
      }
    });
    
    return () => {
      unsubscribeAuth();
      if (unsubLeads) unsubLeads();
      if (unsubCampaigns) unsubCampaigns();
      if (unsubTemplates) unsubTemplates();
    };
  }, []);

  // Filter Results locally
  const filteredResults = useMemo(() => {
    if (!debouncedQuery.trim()) return { leads: [], campaigns: [], templates: [], total: 0 };
    
    console.log(`[GlobalSearch] --- Search Diagnostics ---`);
    console.log(`[GlobalSearch] Query: "${debouncedQuery}"`);
    console.log(`[GlobalSearch] Raw Leads available:`, leads.length);
    console.log(`[GlobalSearch] Raw Campaigns available:`, campaigns.length);
    console.log(`[GlobalSearch] Raw Templates available:`, templates.length);

    const term = debouncedQuery.toLowerCase();
    
    const matchedLeads = leads.filter(l => {
      const isMatch = (l.firstName || "").toLowerCase().includes(term) ||
        (l.lastName || "").toLowerCase().includes(term) ||
        (l.email || "").toLowerCase().includes(term) ||
        (l.company || "").toLowerCase().includes(term);
      if (isMatch) console.log(`[GlobalSearch] Matched Lead:`, { id: l.id, email: l.email });
      return isMatch;
    }).slice(0, 5);
    
    const matchedCampaigns = campaigns.filter(c => {
      const isMatch = (c.name || "").toLowerCase().includes(term) ||
        (c.description || "").toLowerCase().includes(term);
      if (isMatch) console.log(`[GlobalSearch] Matched Campaign:`, { id: c.id, name: c.name });
      return isMatch;
    }).slice(0, 5);
    
    const matchedTemplates = templates.filter(t => {
      const isMatch = (t.name || "").toLowerCase().includes(term) ||
        (t.subject || "").toLowerCase().includes(term);
      if (isMatch) console.log(`[GlobalSearch] Matched Template:`, { id: t.id, name: t.name });
      return isMatch;
    }).slice(0, 5);
    
    console.log(`[GlobalSearch] Total Matches - Leads: ${matchedLeads.length}, Campaigns: ${matchedCampaigns.length}, Templates: ${matchedTemplates.length}`);

    return {
      leads: matchedLeads,
      campaigns: matchedCampaigns,
      templates: matchedTemplates,
      total: matchedLeads.length + matchedCampaigns.length + matchedTemplates.length
    };
  }, [debouncedQuery, leads, campaigns, templates]);

  // Flatten results for keyboard nav
  const flatResults = useMemo(() => {
    const flat: { type: "lead" | "campaign" | "template", id: string, title: string, subtitle?: string, url: string, icon: LucideIcon }[] = [];
    filteredResults.leads.forEach(l => flat.push({ type: "lead", id: l.id, title: `${l.firstName || ""} ${l.lastName || ""}`.trim() || l.email, subtitle: l.company || l.email, url: `/leads?id=${l.id}`, icon: Users }));
    filteredResults.campaigns.forEach(c => flat.push({ type: "campaign", id: c.id || "", title: c.name, subtitle: c.status, url: `/campaigns?id=${c.id}`, icon: Mail }));
    filteredResults.templates.forEach(t => flat.push({ type: "template", id: t.id, title: t.name, subtitle: t.subject, url: `/templates?id=${t.id}`, icon: LayoutTemplate }));
    return flat;
  }, [filteredResults]);

  // Handle keyboard up/down resets are handled in onChange

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex].url);
      }
    }
  };

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setSearchQuery("");
    inputRef.current?.blur();
    router.push(url);
  };

  const showDropdown = isOpen && searchQuery.trim().length > 0;

  return (
    <div className="relative w-full max-w-md hidden md:flex flex-col" ref={containerRef}>
      <div className="relative flex items-center w-full">
        <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search campaigns, leads, templates..."
          className="w-full bg-muted/50 pl-9 pr-12 border-none focus-visible:ring-1 transition-all duration-200"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
        <div className="absolute right-2.5 flex items-center pointer-events-none text-muted-foreground opacity-50">
          <Command className="h-3 w-3 mr-1" />
          <span className="text-xs font-medium">K</span>
        </div>
      </div>

      {showDropdown && (
        <div 
          id="search-results"
          className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground rounded-md border border-border shadow-md overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
        >
          {searchQuery.trim() !== debouncedQuery.trim() || isLoading ? (
            <div className="p-4 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Searching...
            </div>
          ) : flatResults.length === 0 ? (
            <div className="p-4 text-center flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm font-medium mb-1">No results found</p>
              {leads.length === 0 && campaigns.length === 0 && templates.length === 0 && (
                <p className="text-xs max-w-[200px] mt-1">No Leads, Campaigns, or Templates exist yet. Create your first item to enable search.</p>
              )}
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {filteredResults.leads.length > 0 && (
                <div className="px-2 mb-2">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                    Leads
                  </div>
                  {filteredResults.leads.map(lead => {
                    const idx = flatResults.findIndex(r => r.id === lead.id && r.type === "lead");
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={lead.id}
                        className={`flex items-center gap-3 px-2 py-2 rounded-sm cursor-pointer transition-colors ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                        onClick={() => handleSelect(`/leads?id=${lead.id}`)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0 overflow-hidden">
                          <span className="text-sm font-medium truncate">{`${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email}</span>
                          <span className="text-xs text-muted-foreground truncate">{lead.company || lead.email}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {filteredResults.campaigns.length > 0 && (
                <div className="px-2 mb-2">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                    Campaigns
                  </div>
                  {filteredResults.campaigns.map(campaign => {
                    const idx = flatResults.findIndex(r => r.id === campaign.id && r.type === "campaign");
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={campaign.id}
                        className={`flex items-center gap-3 px-2 py-2 rounded-sm cursor-pointer transition-colors ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                        onClick={() => handleSelect(`/campaigns?id=${campaign.id}`)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <div className="h-8 w-8 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0 overflow-hidden">
                          <span className="text-sm font-medium truncate">{campaign.name}</span>
                          <span className="text-xs text-muted-foreground truncate">{campaign.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {filteredResults.templates.length > 0 && (
                <div className="px-2">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                    Templates
                  </div>
                  {filteredResults.templates.map(template => {
                    const idx = flatResults.findIndex(r => r.id === template.id && r.type === "template");
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={template.id}
                        className={`flex items-center gap-3 px-2 py-2 rounded-sm cursor-pointer transition-colors ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                        onClick={() => handleSelect(`/templates?id=${template.id}`)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <div className="h-8 w-8 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                          <LayoutTemplate className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0 overflow-hidden">
                          <span className="text-sm font-medium truncate">{template.name}</span>
                          <span className="text-xs text-muted-foreground truncate">{template.subject}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
