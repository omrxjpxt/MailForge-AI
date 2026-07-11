"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { ArchivedTable } from "@/components/campaigns/archived-table";
import { CampaignStats } from "@/components/campaigns/campaign-stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/client";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Campaign } from "@/types/campaign";
import { toast } from "sonner";
import { launchCampaign, pauseCampaign, duplicateCampaign, archiveCampaign, deleteCampaign, updateCampaign } from "@/lib/firebase/campaigns";

export default function CampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEngineRunning, setIsEngineRunning] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    setIsLoading(true);
    const q = query(
      collection(db, "users", user.uid, "campaigns"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newCampaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
      setCampaigns(newCampaigns);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore campaigns error:", error);
      toast.error("Failed to load campaigns");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLaunch = async (id: string) => {
    if (!user) return;
    try {
      await launchCampaign(user.uid, id);
      toast.success("Campaign launched");
    } catch (e: any) {
      toast.error(e.message || "Failed to launch campaign");
    }
  };

  const handlePause = async (id: string) => {
    if (!user) return;
    try {
      await pauseCampaign(user.uid, id);
      toast.success("Campaign paused");
    } catch (e: any) {
      toast.error(e.message || "Failed to pause campaign");
    }
  };

  const handleDuplicate = async (campaign: Campaign) => {
    if (!user) return;
    try {
      await duplicateCampaign(user.uid, campaign);
      toast.success("Campaign duplicated to Draft");
    } catch (e: any) {
      toast.error(e.message || "Failed to duplicate campaign");
    }
  };

  const handleArchive = async (id: string) => {
    if (!user) return;
    try {
      await archiveCampaign(user.uid, id);
      toast.success("Campaign archived");
    } catch (e: any) {
      toast.error(e.message || "Failed to archive campaign");
    }
  };

  const handleUnarchive = async (id: string) => {
    if (!user) return;
    try {
      await updateCampaign(user.uid, id, { status: "Draft" });
      toast.success("Campaign restored to Drafts");
    } catch (e: any) {
      toast.error(e.message || "Failed to unarchive campaign");
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to permanently delete this campaign?")) {
      try {
        await deleteCampaign(user.uid, id);
        toast.success("Campaign deleted");
      } catch (e: any) {
        toast.error(e.message || "Failed to delete campaign");
      }
    }
  };

  const handleRunEngine = async () => {
    setIsEngineRunning(true);
    try {
      const res = await fetch("/api/cron/process-campaigns", {
        method: "POST",
        headers: {
          "x-cron-secret": "dev-secret-123"
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Engine cycle complete! Processed ${data.processedUsers} users.`);
      } else {
        toast.error(`Engine failed: ${data.error}`);
      }
    } catch (e: any) {
      toast.error("Failed to connect to engine");
    } finally {
      setIsEngineRunning(false);
    }
  };

  const activeCampaigns = useMemo(() => campaigns.filter(c => c.status === "Running" || c.status === "Scheduled"), [campaigns]);
  const pausedCampaigns = useMemo(() => campaigns.filter(c => c.status === "Paused" || c.status === "Completed" || c.status === "Draft"), [campaigns]);
  const archivedCampaigns = useMemo(() => campaigns.filter(c => c.status === "Archived"), [campaigns]);

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
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Orchestrate and automate your outreach at scale.</p>
        </div>
        <div className="flex gap-2">
          {process.env.NODE_ENV === "development" && (
            <Button variant="secondary" className="h-9 gap-2" onClick={handleRunEngine} disabled={isEngineRunning}>
              {isEngineRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Engine Now
            </Button>
          )}
          <Button className="h-9 gap-2" asChild>
            <Link href="/campaigns/new">
              <Plus className="h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      <CampaignStats campaigns={campaigns} />

      {isLoading ? (
        <div className="flex items-center justify-center h-32 mt-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="active" className="w-full mt-6">
          <TabsList className="mb-4 bg-muted/50 w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="active" className="rounded-sm">
              Active ({activeCampaigns.length})
            </TabsTrigger>
            <TabsTrigger value="paused" className="rounded-sm">
              Drafts & Paused ({pausedCampaigns.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="rounded-sm">
              Archived ({archivedCampaigns.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-0">
            {activeCampaigns.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">No active campaigns running right now.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/campaigns/new">Launch a new campaign</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeCampaigns.map(campaign => (
                  <CampaignCard 
                    key={campaign.id}
                    campaign={campaign}
                    onPause={handlePause}
                    onDuplicate={handleDuplicate}
                    onArchive={handleArchive}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="paused" className="mt-0">
            {pausedCampaigns.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">No drafts or paused campaigns.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pausedCampaigns.map(campaign => (
                  <CampaignCard 
                    key={campaign.id}
                    campaign={campaign}
                    onLaunch={handleLaunch}
                    onDuplicate={handleDuplicate}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="archived" className="mt-0">
            <ArchivedTable 
              campaigns={campaigns} 
              onDelete={handleDelete}
              onUnarchive={handleUnarchive}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
