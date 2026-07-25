"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StepperInput } from "@/components/ui/stepper-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Send, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/firebase/auth";
import { createCampaign } from "@/lib/firebase/campaigns";
import { CampaignInputSchema, CampaignInput } from "@/types/campaign";
import { LeadSelector } from "@/components/campaigns/lead-selector";
import { EmailTemplate } from "@/types/template";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function NewCampaignPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLeads, setHasLeads] = useState(false);
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(CampaignInputSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "Draft",
      leadIds: [],
      steps: [
        { stepId: crypto.randomUUID(), subject: "", body: "", waitDays: 0, status: "Pending" }
      ],
      dailyLimit: 50,
      delayBetweenEmails: 0,
      timezone: "UTC",
    }
  });

  const { fields: steps, append, remove } = useFieldArray({
    control,
    name: "steps"
  });

  const selectedLeadIds = watch("leadIds") || [];
  const formSteps = watch("steps") || [];

  useEffect(() => {
    if (authLoading || !user) return;
    
    const fetchTemplates = async () => {
      setIsTemplatesLoading(true);
      try {


        const q = query(
          collection(db, "users", user.uid, "templates"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const fetchedTemplates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailTemplate));
        setTemplates(fetchedTemplates);
      } catch (error) {
        console.error("Failed to load templates:", error);
      } finally {
        setIsTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, [user, authLoading]);

  const handleNext = () => {
    if (step === 1) {
      if (!watch("name")) return toast.error("Campaign name is required");
    }
    if (step === 2) {
      if (!selectedLeadIds || selectedLeadIds.length === 0) return toast.error("Please select at least one lead");
    }
    setStep(s => Math.min(3, s + 1));
  };
  
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      // Create a prompt summarizing the campaign
      const prompt = `Write a cold outreach sequence for a campaign named "${watch("name")}". Include a subject and body.`;
      
      const res = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      
      // Update first step with AI generation
      setValue("steps.0.subject", data.template.subject);
      setValue("steps.0.body", data.template.body);
      
      toast.success("AI generated campaign sequence!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateSelect = (templateId: string | null) => {
    if (!templateId) return;
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    setValue("templateId", templateId);
    // Snapshot template to step 1
    setValue("steps.0.subject", template.subject);
    setValue("steps.0.body", template.body);
    toast.success("Template applied to Step 1");
  };

  const onSubmit = async (data: any) => {
    if (!user) return toast.error("You must be logged in");
    if (!data.leadIds || data.leadIds.length === 0) return toast.error("Select at least one lead");
    
    // Validate steps
    for (const [index, stepData] of (data.steps || []).entries()) {
      if (!stepData.subject || !stepData.body) {
        return toast.error(`Email step ${index + 1} is missing subject or body`);
      }
    }

    setIsSaving(true);
    try {
      // Schedule immediately vs draft logic can be added here
      data.totalLeads = data.leadIds ? data.leadIds.length : 0;
      data.status = "Scheduled"; // Launching sets to scheduled/running
      
      await createCampaign(user.uid, data);
      
      toast.success("Campaign launched successfully!");
      router.push("/campaigns");
    } catch (error: any) {
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setIsSaving(false);
    }
  };

  const saveAsDraft = async () => {
    if (!user) return;
    const data = watch();
    if (!data.name) return toast.error("Campaign name is required to save draft");

    setIsSaving(true);
    try {
      data.totalLeads = data.leadIds ? data.leadIds.length : 0;
      data.status = "Draft";
      await createCampaign(user.uid, data as CampaignInput);
      toast.success("Draft saved");
      router.push("/campaigns");
    } catch (error: any) {
      toast.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
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
        
        <Button variant="outline" onClick={saveAsDraft} disabled={isSaving}>
          {isSaving && step !== 3 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save as Draft
        </Button>
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
            <CardDescription>Give your campaign a name and set sending limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input id="name" {...register("name")} placeholder="e.g. Q4 SaaS Founders Outreach" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input id="description" {...register("description")} placeholder="Briefly describe the campaign" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Daily Email Limit</Label>
                <StepperInput 
                  id="dailyLimit" 
                  min={1}
                  {...register("dailyLimit", { valueAsNumber: true })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delayBetweenEmails">Delay between emails (seconds)</Label>
                <StepperInput 
                  id="delayBetweenEmails" 
                  min={0}
                  {...register("delayBetweenEmails", { valueAsNumber: true })} 
                />
              </div>
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Target Audience</CardTitle>
                <CardDescription>Select which leads will receive this campaign.</CardDescription>
              </div>
              {selectedLeadIds && selectedLeadIds.length > 0 && (
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                  {selectedLeadIds.length} leads selected
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
              <Controller
                control={control}
                name="leadIds"
                render={({ field }) => (
                  <LeadSelector 
                    selectedLeadIds={field.value || []} 
                    onChange={field.onChange} 
                    onHasLeadsChange={setHasLeads}
                  />
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col items-stretch border-t border-border pt-6 gap-4">
              <div className="flex justify-between w-full">
                <Button variant="ghost" onClick={handlePrev}>Back</Button>
                <Button 
                  onClick={handleNext}
                  disabled={!hasLeads || !selectedLeadIds || selectedLeadIds.length === 0}
                >
                  Next Step
                </Button>
              </div>
              
              {!hasLeads && (
                <p className="text-sm text-muted-foreground text-right w-full">
                  You need at least one lead before creating a campaign.
                </p>
              )}
              {hasLeads && (!selectedLeadIds || selectedLeadIds.length === 0) && (
                <p className="text-sm text-muted-foreground text-right w-full">
                  Select at least one lead to continue.
                </p>
              )}
            </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Email Sequence</CardTitle>
                <CardDescription>Write your emails, use templates, or let AI generate them.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select disabled={isTemplatesLoading} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Use Template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="secondary" 
                  className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate AI
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue={steps[0]?.id || "step1"}>
              <TabsList className="w-full justify-start overflow-x-auto">
                {steps.map((field, index) => (
                  <TabsTrigger key={field.id} value={field.id}>
                    {index === 0 ? "Email 1" : `Follow Up ${index} (Wait ${formSteps[index]?.waitDays || 0}d)`}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {steps.map((field, index) => (
                <TabsContent key={field.id} value={field.id} className="space-y-4 mt-4">
                  {index > 0 && (
                    <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                      <div className="space-y-1">
                        <Label>Wait time before sending</Label>
                        <div className="flex items-center gap-2">
                          <StepperInput 
                            id={`days-${index}`} 
                            min={1}
                            {...register(`steps.${index}.waitDays`, { valueAsNumber: true })} 
                          />
                          <span className="text-sm text-muted-foreground">days after previous step</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Step
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Subject Line *</Label>
                    <Input 
                      {...register(`steps.${index}.subject`)} 
                      placeholder="Enter subject line..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Body *</Label>
                    <Textarea 
                      {...register(`steps.${index}.body`)}
                      className="min-h-[250px] font-mono text-sm" 
                      placeholder="Hi {{firstName}},..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Use placeholders: <code className="bg-muted px-1 py-0.5 rounded">{"{{firstName}}"}</code>, <code className="bg-muted px-1 py-0.5 rounded">{"{{company}}"}</code>
                    </p>
                  </div>
                </TabsContent>
              ))}

              <div className="pt-4 border-t border-border mt-6">
                <Button 
                  variant="outline" 
                  className="w-full border-dashed"
                  onClick={() => append({ stepId: crypto.randomUUID(), subject: "", body: "", waitDays: 3, status: "Pending" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Follow-up Step
                </Button>
              </div>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border pt-6">
            <Button variant="ghost" onClick={handlePrev} disabled={isSaving}>Back</Button>
            <Button className="gap-2" onClick={handleSubmit(onSubmit)} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Launch Campaign
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
