"use client";

import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/client";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { EmailHistory } from "@/types/history";
import { EmptyState } from "@/components/ui/empty-state";
import { useRouter } from "next/navigation";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function SentPage() {
  const { user, loading: authLoading } = useAuth();
  const [emails, setEmails] = useState<EmailHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !user) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    const q = query(
      collection(db, "users", user.uid, "emailHistory"),
      orderBy("sentAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailHistory));
      setEmails(data);
      setIsLoading(false);
    }, () => {
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const filteredEmails = useMemo(() => {
    if (!searchQuery) return emails;
    const term = searchQuery.toLowerCase();
    return emails.filter(e =>
      (e.subject?.toLowerCase().includes(term)) ||
      (e.leadId?.toLowerCase().includes(term)) ||
      (e.campaignId?.toLowerCase().includes(term))
    );
  }, [emails, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Sent Emails</h1>
          <p className="text-muted-foreground">Track delivery and replies in real-time.</p>
        </div>
        <Card className="bg-card">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Sent Emails</h1>
          <p className="text-muted-foreground">Track delivery and replies in real-time.</p>
        </div>
      </div>

      {emails.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="p-0 h-[400px]">
            <EmptyState
              icon={Mail}
              title="Track your sent emails"
              description="Once you launch a campaign, all emails sent to your leads will appear here. Track delivery status and replies in real-time."
              actionLabel="Launch Campaign"
              onAction={() => router.push("/campaigns/new")}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject..."
                className="pl-9 bg-card"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card className="bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-muted-foreground">Subject</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Step</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Sent At</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((email) => (
                    <TableRow key={email.id} className="border-border/50 group">
                      <TableCell>
                        <span className="text-sm font-medium truncate max-w-[300px] block">{email.subject}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Step {email.stepNumber || 1}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{timeAgo(email.sentAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`
                            ${email.status === 'Sent' ? 'text-muted-foreground border-border bg-muted/50' : ''}
                            ${email.status === 'Failed' ? 'text-destructive border-destructive/20 bg-destructive/10' : ''}
                            ${email.status === 'Bounced' ? 'text-destructive border-destructive/20 bg-destructive/10' : ''}
                            font-normal px-2 py-0 h-6 text-xs gap-1.5 rounded-full
                          `}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            email.status === 'Sent' ? 'bg-green-500' :
                            email.status === 'Bounced' ? 'bg-destructive' :
                            'bg-destructive'
                          }`} />
                          {email.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between p-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredEmails.length}</span> of {emails.length} emails
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
