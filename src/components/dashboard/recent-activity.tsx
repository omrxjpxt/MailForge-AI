"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { ActivitySquare } from "lucide-react";
import { DashboardData } from "@/hooks/use-dashboard-data";

interface LatestChangesProps {
  activities: DashboardData["latestChanges"];
}

export function LatestChanges({ activities }: LatestChangesProps) {
  const hasData = activities.length > 0;
  return (
    <Card className="bg-card h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-semibold">Latest Changes</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {hasData ? (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {activities.map((activity) => (
              <div key={activity.id} className="relative flex items-center gap-4">
                <div className={`absolute left-0 h-2.5 w-2.5 rounded-full ring-4 ring-background ${activity.color}`} />
                <div className="ml-6 flex flex-col">
                  <span className="text-sm text-foreground/90 leading-tight">
                    {activity.title}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ActivitySquare}
            title="No recent changes"
            description="Your recent campaign and lead updates will appear here."
          />
        )}
      </CardContent>
    </Card>
  );
}
