"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Send, RefreshCw, X, ChevronRight, Zap } from "lucide-react";
import { toast } from "sonner";

const leads = [
  { id: "1", name: "Alex Sterling", company: "Nebula Systems", role: "CTO", status: "draft" },
  { id: "2", name: "Marcus Lowen", company: "Quantum AI", role: "VP Eng", status: "generated" },
  { id: "3", name: "Sarah Chen", company: "FinFlo", role: "Founder", status: "pending" },
  { id: "4", name: "David Jenkins", company: "HealthVault", role: "Director", status: "pending" },
  { id: "5", name: "Emily Watson", company: "RetailTech", role: "CMO", status: "pending" },
];

export default function WorkspacePage() {
  const [selectedLead, setSelectedLead] = useState(leads[0]);
  const [emailSubject, setEmailSubject] = useState("Quick question about Nebula Systems' outreach");
  const [emailBody, setEmailBody] = useState("Hi Alex,\n\nI noticed Nebula Systems is growing fast in the cybersecurity space.\n\nMany teams like yours struggle with scaling personalized outreach. We've built an AI-powered platform that automates this while keeping the human touch.\n\nWould you be open to a quick 10-min chat next week to see if we can help?\n\nBest,\nOm");
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          context: `Target: ${selectedLead.name}, ${selectedLead.role} at ${selectedLead.company}`
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setEmailBody(data.text);
        toast.success("Email generated!");
      } else {
        throw new Error(data.error);
      }
    } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      toast.error(error.message || "Failed to generate");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Column 1: Lead List (Left) */}
      <div className="w-64 border-r border-border flex flex-col bg-card/50">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm">Campaign Leads</h2>
          <p className="text-xs text-muted-foreground mt-1">Tech Founders Q4</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedLead.id === lead.id ? "bg-muted font-medium" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{lead.name}</span>
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    lead.status === 'draft' ? 'bg-primary' : 
                    lead.status === 'generated' ? 'bg-blue-500' : 'bg-muted-foreground'
                  }`} />
                </div>
                <div className="text-xs text-muted-foreground truncate">{lead.company}</div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Column 2: Editor (Middle) */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {selectedLead.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-sm">{selectedLead.name}</h2>
              <p className="text-xs text-muted-foreground">{selectedLead.role} at {selectedLead.company}</p>
            </div>
          </div>
          <Button size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            Send Email
          </Button>
        </div>
        
        <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto max-w-3xl mx-auto w-full">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Subject</label>
            <Input 
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="font-medium bg-transparent border-border/50 focus-visible:ring-1 text-base h-12" 
            />
          </div>
          <div className="space-y-1 flex-1 flex flex-col">
            <label className="text-xs font-medium text-muted-foreground ml-1">Message Body</label>
            <Textarea 
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="flex-1 min-h-[400px] resize-none font-sans text-base leading-relaxed bg-transparent border-border/50 focus-visible:ring-1 p-4"
            />
          </div>
        </div>
      </div>

      {/* Column 3: AI Assistant (Right) */}
      <div className="w-80 border-l border-border flex flex-col bg-card/50">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h2 className="font-semibold text-sm">AI Assistant</h2>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prospect Context</h3>
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2 border border-border/50">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry:</span>
                  <span className="font-medium">Cybersecurity</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recent News:</span>
                  <span className="font-medium truncate ml-2">Raised $15M Series A</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Generate Draft</h3>
              <div className="space-y-2">
                <Textarea 
                  placeholder="e.g. Write a friendly follow up mentioning their recent funding round..."
                  className="text-sm min-h-[100px] resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <Button 
                  className="w-full gap-2" 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt}
                >
                  {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Generate
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Prompts</h3>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="justify-start text-left h-auto py-2 whitespace-normal font-normal text-xs text-muted-foreground hover:text-foreground">
                  Make it more persuasive and urgent
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-left h-auto py-2 whitespace-normal font-normal text-xs text-muted-foreground hover:text-foreground">
                  Shorten to under 100 words
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-left h-auto py-2 whitespace-normal font-normal text-xs text-muted-foreground hover:text-foreground">
                  Focus on pain point: low conversion rates
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
