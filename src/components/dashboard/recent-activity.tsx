"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

const activities = [
  {
    id: 1,
    title: "SaaS Growth campaign finished 10 sends",
    time: "14 minutes ago",
    type: "campaign",
    color: "bg-green-500"
  },
  {
    id: 2,
    title: "New reply from sarah@acme.co",
    time: "2 hours ago",
    type: "reply",
    color: "bg-blue-500"
  },
  {
    id: 3,
    title: "Imported 500 leads from CSV",
    time: "4 hours ago",
    type: "import",
    color: "bg-orange-500"
  },
  {
    id: 4,
    title: "Gmail connection established",
    time: "Yesterday",
    type: "system",
    color: "bg-gray-500"
  }
];

export function RecentActivity() {
  return (
    <Card className="bg-card h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <Link href="/analytics" className="text-xs text-primary hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {activities.map((activity) => (
            <div key={activity.id} className="relative flex items-center gap-4">
              <div className={`absolute left-0 h-2.5 w-2.5 rounded-full ring-4 ring-background ${activity.color}`} />
              <div className="ml-6 flex flex-col">
                <span className="text-sm text-foreground/90 leading-tight">
                  {activity.title.includes("sarah@acme.co") ? (
                    <>New reply from <span className="font-semibold text-foreground">sarah@acme.co</span></>
                  ) : activity.title.includes("500 leads") ? (
                    <>Imported <span className="font-semibold text-foreground">500 leads</span> from CSV</>
                  ) : activity.title.includes("SaaS Growth") ? (
                    <><span className="font-semibold text-foreground">SaaS Growth</span> campaign finished 10 sends</>
                  ) : (
                    activity.title
                  )}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
