"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Send, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNext = () => setStep(s => Math.min(3, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));
  
  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("AI generated campaign sequence!");
    }, 2000);
  };

  const handleSave = () => {
    toast.success("Campaign saved successfully!");
    router.push("/campaigns");
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Create New Campaign</h1>
          <p className="text-muted-foreground text-sm">Launch a new targeted outreach sequence.</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-2 px-2">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= 1 ? 'border-primary bg-primary/10' : 'border-border'}`}>1</div>
          <span className="font-medium text-sm">Details</span>
        </div>
        <div className={`h-px flex-1 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-border'}`}></div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-primary bg-primary/10' : 'border-border'}`}>2</div>
          <span className="font-medium text-sm">Audience</span>
        </div>
        <div className={`h-px flex-1 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-border'}`}></div>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= 3 ? 'border-primary bg-primary/10' : 'border-border'}`}>3</div>
          <span className="font-medium text-sm">Sequence</span>
        </div>
      </div>

      {step === 1 && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Give your campaign a name and set its primary objective.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input id="name" placeholder="e.g. Q4 SaaS Founders Outreach" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">Objective</Label>
              <Select defaultValue="meeting">
                <SelectTrigger>
                  <SelectValue placeholder="Select objective" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Book a Meeting</SelectItem>
                  <SelectItem value="demo">Product Demo</SelectItem>
                  <SelectItem value="feedback">User Feedback</SelectItem>
                  <SelectItem value="newsletter">Newsletter Signup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">AI Writing Tone</Label>
              <Select defaultValue="professional">
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional & Direct</SelectItem>
                  <SelectItem value="friendly">Friendly & Casual</SelectItem>
                  <SelectItem value="persuasive">Persuasive & Urgent</SelectItem>
                  <SelectItem value="curious">Curious & Questioning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleNext}>Next Step</Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Target Audience</CardTitle>
            <CardDescription>Select which leads will receive this campaign.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">No Audience Selected</h3>
                <p className="text-sm text-muted-foreground mt-1">Choose a segment or import new leads.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Select Segment</Button>
                <Button variant="outline">Import CSV</Button>
              </div>
            </div>
            
            <div className="space-y-2 pt-4">
              <Label>Filter rules (Optional)</Label>
              <div className="flex gap-2">
                <Select defaultValue="industry">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="industry">Industry</SelectItem>
                    <SelectItem value="title">Job Title</SelectItem>
                    <SelectItem value="company">Company Size</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="equals">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Value" className="flex-1" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handlePrev}>Back</Button>
            <Button onClick={handleNext}>Next Step</Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Email Sequence</CardTitle>
                <CardDescription>Write your emails or let AI generate them for you.</CardDescription>
              </div>
              <Button 
                variant="secondary" 
                className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Auto-Generate with AI"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="step1">
              <TabsList>
                <TabsTrigger value="step1">Email 1 (Day 1)</TabsTrigger>
                <TabsTrigger value="step2">Follow up 1 (Day 4)</TabsTrigger>
                <TabsTrigger value="step3">Follow up 2 (Day 8)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="step1" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input placeholder="Quick question about {{companyName}}'s outreach" defaultValue="Quick question about {{companyName}}'s outreach" />
                </div>
                <div className="space-y-2">
                  <Label>Email Body</Label>
                  <Textarea 
                    className="min-h-[250px] font-mono text-sm" 
                    placeholder="Hi {{firstName}},..."
                    defaultValue={`Hi {{firstName}},

I noticed {{companyName}} is growing fast in the {{industry}} space. 

Many teams like yours struggle with scaling personalized outreach. We've built an AI-powered platform that automates this while keeping the human touch.

Would you be open to a quick 10-min chat next week to see if we can help?

Best,
Om`}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="step2" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Wait time</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue="3" className="w-[80px]" />
                    <span className="text-sm text-muted-foreground">days after previous step</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Body</Label>
                  <Textarea 
                    className="min-h-[200px] font-mono text-sm" 
                    placeholder="Just bubbling this up..."
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="step3" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Wait time</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue="4" className="w-[80px]" />
                    <span className="text-sm text-muted-foreground">days after previous step</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Body</Label>
                  <Textarea 
                    className="min-h-[200px] font-mono text-sm" 
                    placeholder="Final follow up..."
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border pt-6">
            <Button variant="ghost" onClick={handlePrev}>Back</Button>
            <Button className="gap-2" onClick={handleSave}>
              <Send className="h-4 w-4" />
              Launch Campaign
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
