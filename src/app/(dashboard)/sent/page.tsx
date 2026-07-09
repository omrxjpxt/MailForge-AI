import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const sentEmails = [
  {
    id: "1",
    recipient: "alex@nebula.io",
    subject: "Quick question about Nebula Systems' outreach",
    campaign: "Tech Founders Q4",
    sentAt: "10 mins ago",
    status: "Opened",
    color: "bg-blue-500"
  },
  {
    id: "2",
    recipient: "marcus@quantum.ai",
    subject: "Scaling AI ops at Quantum Leap",
    campaign: "SaaS Integrations",
    sentAt: "1 hour ago",
    status: "Replied",
    color: "bg-green-500"
  },
  {
    id: "3",
    recipient: "s.chen@finflo.co",
    subject: "FinFlo's recent Series B",
    campaign: "Tech Founders Q4",
    sentAt: "3 hours ago",
    status: "Delivered",
    color: "bg-muted-foreground"
  },
  {
    id: "4",
    recipient: "dave@healthvault.org",
    subject: "Improving patient outreach?",
    campaign: "Tech Founders Q4",
    sentAt: "Yesterday",
    status: "Bounced",
    color: "bg-destructive"
  }
];

export default function SentPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Sent Emails</h1>
          <p className="text-muted-foreground">Track delivery, opens, and replies in real-time.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by recipient, subject, or campaign..." 
            className="pl-9 bg-card"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <Card className="bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground w-[250px]">Recipient</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Subject & Campaign</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Sent At</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sentEmails.map((email) => (
                <TableRow key={email.id} className="border-border/50 group">
                  <TableCell className="font-medium text-sm text-foreground/90">{email.recipient}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{email.subject}</span>
                      <span className="text-xs text-muted-foreground">{email.campaign}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{email.sentAt}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${email.status === 'Opened' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' : ''}
                        ${email.status === 'Replied' ? 'text-green-500 border-green-500/20 bg-green-500/10' : ''}
                        ${email.status === 'Delivered' ? 'text-muted-foreground border-border bg-muted/50' : ''}
                        ${email.status === 'Bounced' ? 'text-destructive border-destructive/20 bg-destructive/10' : ''}
                        font-normal px-2 py-0 h-6 text-xs gap-1.5 rounded-full
                      `}
                    >
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        email.status === 'Opened' ? 'bg-blue-500' :
                        email.status === 'Replied' ? 'bg-green-500' :
                        email.status === 'Bounced' ? 'bg-destructive' :
                        'bg-muted-foreground'
                      }`} />
                      {email.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">1-4</span> of 12,450 emails
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
