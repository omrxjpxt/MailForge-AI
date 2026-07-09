"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const leads = [
  {
    id: "1",
    name: "Alex Sterling",
    email: "alex@nebula.io",
    company: "Nebula Systems",
    industry: "CYBERSECURITY",
    status: "Sent",
    initials: "AS",
    color: "bg-blue-500",
  },
  {
    id: "2",
    name: "Marcus Lowen",
    email: "marcus@quantum.ai",
    company: "Quantum Leap AI",
    industry: "ARTIFICIAL INTEL",
    status: "Generated",
    initials: "ML",
    color: "bg-orange-500",
  },
  {
    id: "3",
    name: "Sarah Chen",
    email: "s.chen@finflo.co",
    company: "FinFlo Finance",
    industry: "FINTECH",
    status: "Pending",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    initials: "SC",
    color: "bg-gray-500",
  },
  {
    id: "4",
    name: "David Jenkins",
    email: "dave@healthvault.org",
    company: "HealthVault",
    industry: "HEALTHCARE",
    status: "Generated",
    initials: "DJ",
    color: "bg-gray-500",
  }
];

export function LeadsTable() {
  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground w-[300px]">Contact Name</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Company</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Industry</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="border-border/50 group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-background">
                      {lead.avatar ? (
                        <AvatarImage src={lead.avatar} alt={lead.name} />
                      ) : null}
                      <AvatarFallback className={`text-white text-xs ${lead.color}`}>{lead.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold">{lead.name}</span>
                      <span className="text-xs text-muted-foreground">{lead.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{lead.company}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-muted text-[10px] font-semibold tracking-wider text-muted-foreground uppercase rounded-sm border-border/50">
                    {lead.industry}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`
                      ${lead.status === 'Sent' ? 'text-green-500 border-green-500/20 bg-green-500/10' : ''}
                      ${lead.status === 'Generated' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' : ''}
                      ${lead.status === 'Pending' ? 'text-orange-500 border-orange-500/20 bg-orange-500/10' : ''}
                      font-normal px-2 py-0 h-6 text-xs gap-1.5 rounded-full
                    `}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      lead.status === 'Sent' ? 'bg-green-500' :
                      lead.status === 'Generated' ? 'bg-blue-500' :
                      'bg-orange-500'
                    }`} />
                    {lead.status}
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
            Showing <span className="font-semibold text-foreground">1-4</span> of 1,284 leads
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-primary/20 border-primary/30 text-foreground">1</Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">2</Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">3</Button>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
