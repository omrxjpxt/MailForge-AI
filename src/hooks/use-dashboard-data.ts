import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, getDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth";
import { Campaign } from "@/types/campaign";
import { Lead } from "@/types/lead";
import { EmailHistory } from "@/types/history";
import { EmailTemplate } from "@/types/template";

interface UserDocData {
  firstName?: string;
  gmailConnected?: boolean;
  gmailAuthError?: string | null;
  onboardingCompleted?: boolean;
  onboarding?: {
    welcomeModalSeen?: boolean;
    hasSeenCelebration?: boolean;
    isComplete?: boolean;
  };
}

export interface DashboardData {
  isLoading: boolean;
  error: Error | null;
  firstName: string;
  onboardingCompleted: boolean;
  gmailConnected: boolean;
  gmailAuthError: string | null;
  metrics: {
    emailsSentToday: number;
    dailyLimit: number;
    pendingLeads: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalEmailsSent: number;
    avgOpenRate: number;
    avgReplyRate: number;
    bounceRate: number;
    totalDelivered: number;
    totalOpened: number;
    totalReplied: number;
  };
  recentCampaigns: Campaign[];
  latestChanges: { id: string; title: string; time: string; type: "campaign" | "lead" | "template" | "history"; timestamp: number; color: string }[];
  performanceData: { name: string; sent: number; replies: number }[];
  onboarding: {
    welcomeModalSeen?: boolean;
    hasSeenCelebration?: boolean;
    isComplete?: boolean;
    steps?: {
      gmailConnected?: boolean;
      leadCreated?: boolean;
      templateCreated?: boolean;
      campaignCreated?: boolean;
      campaignLaunched?: boolean;
    };
  };
}

export function useDashboardData(): DashboardData {
  const { user, loading: authLoading } = useAuth();
  
  const [error, setError] = useState<Error | null>(null);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [recentHistory, setRecentHistory] = useState<EmailHistory[]>([]);
  const [dailyLimit, setDailyLimit] = useState<number>(50); // Default to Free plan
  const [firstName, setFirstName] = useState("");
  const [userDocData, setUserDocData] = useState<UserDocData | null>(null);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "users", user.uid, "settings", "default"));
        if (settingsDoc.exists()) {
          setDailyLimit(settingsDoc.data().dailyLimit || 50);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };

    fetchSettings();

    const unsubscribeUser = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserDocData;
          setFirstName(data.firstName || "");
          setUserDocData(data);
        } else {
          setUserDocData({} as UserDocData);
        }
        setLoadedUid(user.uid);
      },
      (err) => {
        setError(err);
        setLoadedUid(user.uid);
      }
    );

    const unsubscribeCampaigns = onSnapshot(
      query(collection(db, "users", user.uid, "campaigns")),
      (snapshot) => {
        const camps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
        setCampaigns(camps);
      },
      (err) => setError(err)
    );

    const unsubscribeLeads = onSnapshot(
      query(collection(db, "users", user.uid, "leads")),
      (snapshot) => {
        const lds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
        setLeads(lds);
      },
      (err) => setError(err)
    );
    
    const unsubscribeTemplates = onSnapshot(
      query(collection(db, "users", user.uid, "templates")),
      (snapshot) => {
        const tmpls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailTemplate));
        setTemplates(tmpls);
      },
      (err) => setError(err)
    );
    
    // Fetch last 7 days of email history for the chart
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const unsubscribeHistory = onSnapshot(
      query(collection(db, "users", user.uid, "emailHistory"), where("sentAt", ">=", sevenDaysAgo)),
      (snapshot) => {
        const hist = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailHistory));
        setRecentHistory(hist);
      },
      (err) => setError(err)
    );

    return () => {
      unsubscribeUser();
      unsubscribeCampaigns();
      unsubscribeLeads();
      unsubscribeTemplates();
      unsubscribeHistory();
    };
  }, [user]);

  // Calculate loading state
  // 1. Wait for Auth to finish resolving (authLoading)
  // 2. If user exists, wait until their Firestore user document snapshot arrives (loadedUid === user.uid)
  const isLoading = authLoading || (user ? loadedUid !== user.uid : false);

  // Derived Metrics
  const todayDateString = new Date().toISOString().split("T")[0];
  
  let emailsSentToday = 0;
  let totalEmailsSent = 0;
  let totalDelivered = 0; // Approximate with sent minus bounces for now
  let totalOpened = 0;
  let totalReplied = 0;
  let totalBounces = 0;
  
  let activeCampaigns = 0;

  campaigns.forEach(camp => {
    if (camp.dailyEmailsSentDate === todayDateString) {
      emailsSentToday += (camp.dailyEmailsSent || 0);
    }
    totalEmailsSent += (camp.emailsSent || 0);
    totalDelivered += (camp.emailsDelivered || camp.emailsSent || 0);
    totalOpened += (camp.opens || 0);
    totalReplied += (camp.replies || 0);
    totalBounces += (camp.bounces || 0);
    
    if (camp.status === "Running") {
      activeCampaigns++;
    }
  });

  const pendingLeads = leads.filter(l => l.status === "New").length;
  
  const avgOpenRate = totalDelivered > 0 ? Math.min((totalOpened / totalDelivered) * 100, 100) : 0;
  const avgReplyRate = totalDelivered > 0 ? Math.min((totalReplied / totalDelivered) * 100, 100) : 0;
  const bounceRate = totalEmailsSent > 0 ? ((totalBounces / totalEmailsSent) * 100) : 0;

  // Recent Campaigns (top 5)
  const recentCampaigns = [...campaigns]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  // Latest Changes
  const latestChangesRaw: { id: string; title: string; time: string; type: "campaign" | "lead" | "template" | "history"; timestamp: number; color: string; }[] = [];
  
  campaigns.forEach(camp => {
    const statusText = camp.status === "Running" ? "started" : camp.status === "Paused" ? "paused" : camp.status === "Completed" ? "completed" : "created/updated";
    latestChangesRaw.push({
      id: `camp-${camp.id}`,
      title: `Campaign "${camp.name}" ${statusText}`,
      time: new Date(camp.updatedAt).toLocaleString(),
      timestamp: camp.updatedAt,
      type: "campaign",
      color: "bg-blue-500"
    });
  });
  
  leads.forEach(lead => {
    latestChangesRaw.push({
      id: `lead-${lead.id}`,
      title: `Lead "${lead.email}" updated`,
      time: new Date(lead.updatedAt).toLocaleString(),
      timestamp: lead.updatedAt,
      type: "lead",
      color: "bg-green-500"
    });
  });

  templates.forEach(tmpl => {
    latestChangesRaw.push({
      id: `tmpl-${tmpl.id}`,
      title: tmpl.isAI ? `AI Template "${tmpl.name}" generated` : `Template "${tmpl.name}" created`,
      time: new Date(tmpl.updatedAt).toLocaleString(),
      timestamp: tmpl.updatedAt,
      type: "template",
      color: "bg-purple-500"
    });
  });
  
  recentHistory.forEach(hist => {
    if (hist.status === "Sent" || hist.status === "Replied") {
      const lead = leads.find(l => l.id === hist.leadId);
      const emailAddr = lead ? lead.email : "a lead";
      latestChangesRaw.push({
        id: `hist-${hist.id}`,
        title: hist.status === "Sent" ? `Email sent to ${emailAddr}` : `Reply received from ${emailAddr}`,
        time: new Date(hist.sentAt).toLocaleString(),
        timestamp: hist.sentAt,
        type: "history",
        color: hist.status === "Replied" ? "bg-amber-500" : "bg-gray-400"
      });
    }
  });

  const latestChanges = latestChangesRaw
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  // Performance Chart (Trailing 7 days)
  const performanceData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0); // Start of day
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1); // Start of next day
    
    const dayHistory = recentHistory.filter(h => h.sentAt >= d.getTime() && h.sentAt < nextD.getTime());
    
    performanceData.push({
      name: d.toLocaleDateString("en-US", { weekday: "short" }),
      sent: dayHistory.filter(h => h.status === "Sent").length,
      replies: dayHistory.filter(h => h.status === "Replied").length // Depends on reply tracking later
    });
  }

  // Derive Onboarding State
  const onboarding = {
    welcomeModalSeen: userDocData?.onboarding?.welcomeModalSeen || false,
    hasSeenCelebration: userDocData?.onboarding?.hasSeenCelebration || false,
    isComplete: userDocData?.onboarding?.isComplete || false,
    steps: {
      gmailConnected: userDocData?.gmailConnected || false,
      leadCreated: leads.length > 0,
      templateCreated: templates.length > 0,
      campaignCreated: campaigns.length > 0,
      campaignLaunched: campaigns.some(c => c.status === "Running" || c.status === "Completed" || c.status === "Paused"),
    }
  };

  return {
    isLoading,
    error,
    firstName,
    onboardingCompleted: userDocData?.onboardingCompleted || false,
    gmailConnected: userDocData?.gmailConnected || false,
    gmailAuthError: userDocData?.gmailAuthError || null,
    metrics: {
      emailsSentToday,
      dailyLimit,
      pendingLeads,
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalEmailsSent,
      avgOpenRate,
      avgReplyRate,
      bounceRate,
      totalDelivered,
      totalOpened,
      totalReplied
    },
    recentCampaigns,
    latestChanges,
    performanceData,
    onboarding,
  };
}
