import { Campaign } from "@/types/campaign";

/**
 * Shared Analytics Utility for MailForge AI
 * Provides a single source of truth for all metrics calculations across the application.
 */

export interface CampaignMetrics {
  totalLeads: number;
  emailsSent: number;
  emailsDelivered: number;
  opens: number;
  replies: number;
  bounces: number;
  
  openRate: number;
  replyRate: number;
  bounceRate: number;
  deliveryRate: number;
  progress: number;
}

export interface AggregatedMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  
  totalEmailsSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalReplied: number;
  totalBounces: number;
  
  avgOpenRate: number;
  avgReplyRate: number;
  bounceRate: number;
  avgDeliveryRate: number;
}

/**
 * Safely calculates a percentage, rounding it and clamping it to a maximum of 100%.
 */
function calculateRate(numerator: number, denominator: number, metricName: string = "Rate"): number {
  if (!denominator || denominator <= 0) return 0;
  
  const rawRate = (numerator / denominator) * 100;
  
  if (rawRate > 100) {
    console.warn(`[Analytics Anomaly] Calculated ${metricName} exceeded 100% (${rawRate.toFixed(2)}%). Clamping to 100%.`);
    return 100;
  }
  
  return rawRate;
}

/**
 * Extracts and calculates all relevant metrics for a single campaign.
 * Automatically falls back to emailsSent for legacy campaigns missing emailsDelivered.
 */
export function getCampaignMetrics(campaign: Partial<Campaign>): CampaignMetrics {
  const totalLeads = campaign.totalLeads ?? campaign.leadIds?.length ?? 0;
  const emailsSent = campaign.emailsSent || 0;
  // Legacy fallback: if emailsDelivered is falsy but we sent emails, assume they were delivered 
  // (bounce handling will naturally lower this if implemented later, or it accurately counts for old campaigns)
  const emailsDelivered = campaign.emailsDelivered || campaign.emailsSent || 0;
  const opens = campaign.opens || 0;
  const replies = campaign.replies || 0;
  const bounces = campaign.bounces || 0;

  return {
    totalLeads,
    emailsSent,
    emailsDelivered,
    opens,
    replies,
    bounces,
    
    openRate: calculateRate(opens, emailsDelivered, "Open Rate"),
    replyRate: calculateRate(replies, emailsDelivered, "Reply Rate"),
    bounceRate: calculateRate(bounces, emailsSent, "Bounce Rate"),
    deliveryRate: calculateRate(emailsDelivered, emailsSent, "Delivery Rate"),
    progress: calculateRate(emailsSent, totalLeads, "Progress")
  };
}

/**
 * Aggregates an array of campaigns into a single set of metrics.
 */
export function aggregateCampaignMetrics(campaigns: Campaign[]): AggregatedMetrics {
  let activeCampaigns = 0;
  let totalEmailsSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalReplied = 0;
  let totalBounces = 0;

  campaigns.forEach(camp => {
    if (camp.status === "Running" || camp.status === "Scheduled") {
      activeCampaigns++;
    }

    const metrics = getCampaignMetrics(camp);
    
    totalEmailsSent += metrics.emailsSent;
    totalDelivered += metrics.emailsDelivered;
    totalOpened += metrics.opens;
    totalReplied += metrics.replies;
    totalBounces += metrics.bounces;
  });

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    
    totalEmailsSent,
    totalDelivered,
    totalOpened,
    totalReplied,
    totalBounces,
    
    avgOpenRate: calculateRate(totalOpened, totalDelivered, "Aggregated Open Rate"),
    avgReplyRate: calculateRate(totalReplied, totalDelivered, "Aggregated Reply Rate"),
    bounceRate: calculateRate(totalBounces, totalEmailsSent, "Aggregated Bounce Rate"),
    avgDeliveryRate: calculateRate(totalDelivered, totalEmailsSent, "Aggregated Delivery Rate")
  };
}

/**
 * Returns strictly formatted funnel percentages relative to the total sent count.
 */
export function getFunnelMetrics(aggregated: AggregatedMetrics) {
  const { totalEmailsSent, totalDelivered, totalOpened, totalReplied } = aggregated;
  
  return {
    sentPerc: totalEmailsSent > 0 ? 100 : 0,
    deliveredPerc: calculateRate(totalDelivered, totalEmailsSent, "Funnel Delivery"),
    openedPerc: calculateRate(totalOpened, totalEmailsSent, "Funnel Open"), // Note: Funnel uses Sent as baseline, not Delivered
    repliedPerc: calculateRate(totalReplied, totalEmailsSent, "Funnel Reply")
  };
}
