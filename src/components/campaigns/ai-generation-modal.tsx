import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Wand2, Loader2, Globe, RefreshCcw, Check, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useBrandProfile } from "@/hooks/use-brand-profile";
import { AIGenerationContext, GeneratedEmail, SubjectQuality, SpamAnalysis, RewriteAction } from "@/types/ai-generation";
import { AIRewriteToolbar } from "./ai-rewrite-toolbar";
import { SpamAnalysisPanel } from "./spam-analysis-panel";
import { SubjectLineSuggestions } from "./subject-line-suggestions";
import { PersonalizationPreview } from "./personalization-preview";
import { Lead } from "@/types/lead";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: Lead[];
  onApply: (emails: GeneratedEmail[]) => void;
}

export function AIGenerationModal({ isOpen, onClose, selectedLeads, onApply }: AIGenerationModalProps) {
  const { brandProfile, isLoading: isBrandLoading } = useBrandProfile();
  
  const [context, setContext] = useState<AIGenerationContext>({
    productName: "",
    productDescription: "",
    targetAudience: "",
    campaignGoal: "",
    cta: "",
    tone: "Professional",
    emailLength: "Medium",
    personalizationLevel: "Basic",
    websiteUrl: "",
    useBrandProfile: true,
  });

  const [isScraping, setIsScraping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Generation Results
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [activeTab, setActiveTab] = useState<string>("0");
  
  // Advanced AI Features
  const [subjectSuggestions, setSubjectSuggestions] = useState<SubjectQuality[]>([]);
  const [isGeneratingSubjects, setIsGeneratingSubjects] = useState(false);
  const [spamAnalysis, setSpamAnalysis] = useState<SpamAnalysis | null>(null);
  const [isAnalyzingSpam, setIsAnalyzingSpam] = useState(false);
  
  // Auto-fill from brand profile
  useEffect(() => {
    if (brandProfile && context.useBrandProfile && !context.productName) {
      setContext(prev => ({
        ...prev,
        productName: brandProfile.companyName || prev.productName,
        productDescription: brandProfile.description || prev.productDescription,
        websiteUrl: brandProfile.website || prev.websiteUrl,
        targetAudience: brandProfile.targetCustomer || prev.targetAudience,
        cta: brandProfile.preferredCTA || prev.cta,
        tone: brandProfile.tone || prev.tone,
      }));
    }
  }, [brandProfile, context.useBrandProfile]);

  const handleAutoFill = async () => {
    if (!context.websiteUrl) return toast.error("Please enter a website URL");
    
    setIsScraping(true);
    try {
      const res = await fetch("/api/ai/scrape-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: context.websiteUrl })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setContext(prev => ({
        ...prev,
        productName: data.result.companyName || prev.productName,
        productDescription: data.result.productDescription || prev.productDescription,
        targetAudience: data.result.targetAudience || prev.targetAudience,
        tone: data.result.brandTone || prev.tone,
      }));
      toast.success("Context auto-filled from website");
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze website");
    } finally {
      setIsScraping(false);
    }
  };

  const handleGenerate = async (mode: "single" | "sequence") => {
    setIsGenerating(true);
    setIsStreaming(true);
    setGeneratedEmails(mode === "sequence" ? [
      { id: "0", label: "Initial Email", subject: "", body: "" },
      { id: "1", label: "Follow-up 1", subject: "", body: "" },
      { id: "2", label: "Follow-up 2", subject: "", body: "" },
      { id: "3", label: "Breakup", subject: "", body: "" }
    ] : [{ id: "0", label: "Email", subject: "", body: "" }]);
    setActiveTab("0");
    setSubjectSuggestions([]);
    setSpamAnalysis(null);

    try {
      const res = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          brandProfile: context.useBrandProfile ? brandProfile : null,
          mode
        })
      });

      if (!res.ok || !res.body) throw new Error("Failed to start generation");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              setIsStreaming(false);
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                fullText += parsed.text;
                parseStreamedTextIntoEmails(fullText, mode);
              }
            } catch (e) {
              // Ignore parse errors on chunks
            }
          }
        }
      }

      // Generate subjects and spam score automatically after generation
      if (mode === "single") {
        analyzeSpam(fullText);
        generateSubjects();
      }

    } catch (error: any) {
      toast.error(error.message || "Generation failed");
      setIsStreaming(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const parseStreamedTextIntoEmails = (text: string, mode: "single" | "sequence") => {
    if (mode === "single") {
      // Basic extraction if it contains Subject:
      let subject = "";
      let body = text;
      
      const subjMatch = text.match(/Subject: (.*)\n/i) || text.match(/\[Subject\]:? (.*)\n/i);
      if (subjMatch) {
        subject = subjMatch[1].trim();
        body = text.replace(subjMatch[0], "").trim();
      }
      
      setGeneratedEmails([{ id: "0", label: "Email", subject, body }]);
      return;
    }

    // Sequence parsing logic
    const sections = text.split(/\[(?:Initial Email|Follow-up 1|Follow-up 2|Breakup)\]/i).filter(Boolean);
    const newEmails = [...generatedEmails];
    
    sections.forEach((section, i) => {
      if (i >= newEmails.length) return;
      let subject = "";
      let body = section;
      const subjMatch = section.match(/Subject: (.*)\n/i) || section.match(/\[Subject\]:? (.*)\n/i);
      if (subjMatch) {
        subject = subjMatch[1].trim();
        body = section.replace(subjMatch[0], "").trim();
      }
      newEmails[i] = { ...newEmails[i], subject, body };
    });
    
    setGeneratedEmails(newEmails);
  };

  const analyzeSpam = async (text?: string) => {
    const currentEmail = generatedEmails[parseInt(activeTab)];
    if (!currentEmail && !text) return;
    
    setIsAnalyzingSpam(true);
    try {
      const bodyToUse = text || currentEmail.body;
      const res = await fetch("/api/ai/analyze-spam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: currentEmail?.subject || "", body: bodyToUse })
      });
      const data = await res.json();
      if (res.ok) setSpamAnalysis(data.analysis);
    } finally {
      setIsAnalyzingSpam(false);
    }
  };

  const generateSubjects = async () => {
    setIsGeneratingSubjects(true);
    try {
      const res = await fetch("/api/ai/generate-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          brandProfile: context.useBrandProfile ? brandProfile : null
        })
      });
      const data = await res.json();
      if (res.ok) setSubjectSuggestions(data.subjects);
    } finally {
      setIsGeneratingSubjects(false);
    }
  };

  const handleRewrite = async (action: RewriteAction) => {
    const currentEmail = generatedEmails[parseInt(activeTab)];
    if (!currentEmail || !currentEmail.body) return;

    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: currentEmail.subject, body: currentEmail.body, action })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      const newEmails = [...generatedEmails];
      newEmails[parseInt(activeTab)] = { 
        ...currentEmail, 
        subject: data.subject, 
        body: data.body 
      };
      setGeneratedEmails(newEmails);
      toast.success("Email rewritten successfully");
      
      // Re-run spam analysis
      analyzeSpam(data.body);
    } catch (error: any) {
      toast.error(error.message || "Rewrite failed");
    }
  };

  const currentEmail = generatedEmails[parseInt(activeTab)];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()} >
      <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden bg-background border-border" showCloseButton={false}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">AI Generation Studio</h2>
              <p className="text-xs text-muted-foreground">Craft high-converting sequences with AI</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Left Panel - Context Form */}
          <ScrollArea className="w-full md:w-[400px] border-r border-border bg-muted/10 shrink-0">
            <div className="p-4 space-y-6">
              
              {/* Website Auto-fill */}
              <div className="space-y-2">
                <Label>Website URL <span className="text-muted-foreground font-normal">(Auto-fill)</span></Label>
                <div className="flex gap-2">
                  <Input 
                    value={context.websiteUrl} 
                    onChange={e => setContext({...context, websiteUrl: e.target.value})}
                    placeholder="https://acme.com"
                  />
                  <Button variant="secondary" onClick={handleAutoFill} disabled={isScraping || !context.websiteUrl}>
                    {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Core Context */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Product / Service *</Label>
                  <Input 
                    value={context.productName} 
                    onChange={e => setContext({...context, productName: e.target.value})}
                    placeholder="e.g. MailForge AI"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Product Description</Label>
                  <Textarea 
                    value={context.productDescription} 
                    onChange={e => setContext({...context, productDescription: e.target.value})}
                    placeholder="What does it do? Why should they care?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input 
                    value={context.targetAudience} 
                    onChange={e => setContext({...context, targetAudience: e.target.value})}
                    placeholder="e.g. SaaS Founders, VPs of Sales"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select value={context.tone} onValueChange={v => setContext({...context, tone: v || "Professional"})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Friendly">Friendly</SelectItem>
                        <SelectItem value="Direct">Direct</SelectItem>
                        <SelectItem value="Consultative">Consultative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Length</Label>
                    <Select value={context.emailLength} onValueChange={v => setContext({...context, emailLength: v as any})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Short">Short</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Call to Action (CTA)</Label>
                  <Input 
                    value={context.cta} 
                    onChange={e => setContext({...context, cta: e.target.value})}
                    placeholder="e.g. Schedule a 15min call"
                  />
                </div>

                {brandProfile && (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Apply Brand Profile</Label>
                      <p className="text-xs text-muted-foreground">Use global style & voice rules</p>
                    </div>
                    <Switch 
                      checked={context.useBrandProfile} 
                      onCheckedChange={v => setContext({...context, useBrandProfile: v})}
                    />
                  </div>
                )}
              </div>

            </div>
          </ScrollArea>

          {/* Right Panel - Generation & Preview */}
          <div className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden">
            {generatedEmails.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground flex-col gap-4">
                <Wand2 className="h-12 w-12 opacity-20" />
                <p>Fill out the context on the left, then click Generate to create your campaign.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                  <div className="px-4 pt-3 border-b border-border bg-muted/10 shrink-0">
                    <TabsList className="bg-transparent h-9 p-0 gap-4 border-b-0">
                      {generatedEmails.map((email, idx) => (
                        <TabsTrigger 
                          key={email.id} 
                          value={idx.toString()}
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 h-9"
                        >
                          {email.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                    {generatedEmails.map((email, idx) => (
                      <TabsContent key={email.id} value={idx.toString()} className="m-0 space-y-4">
                        <AIRewriteToolbar 
                          onRewrite={handleRewrite} 
                          disabled={isStreaming || isGenerating}
                        />
                        
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase">Subject Line</Label>
                            <Input 
                              value={email.subject} 
                              onChange={(e) => {
                                const newE = [...generatedEmails];
                                newE[idx].subject = e.target.value;
                                setGeneratedEmails(newE);
                              }}
                              className="font-medium bg-card"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase">Body</Label>
                            <Textarea 
                              value={email.body}
                              onChange={(e) => {
                                const newE = [...generatedEmails];
                                newE[idx].body = e.target.value;
                                setGeneratedEmails(newE);
                              }}
                              className="min-h-[250px] font-mono text-sm leading-relaxed bg-card resize-y"
                            />
                          </div>
                        </div>

                        {idx === 0 && (
                          <div className="pt-4 space-y-6">
                            <PersonalizationPreview 
                              subject={email.subject}
                              body={email.body}
                              leads={selectedLeads}
                            />
                            
                            <SubjectLineSuggestions 
                              subjects={subjectSuggestions}
                              isLoading={isGeneratingSubjects}
                              onSelect={(subj) => {
                                const newE = [...generatedEmails];
                                newE[idx].subject = subj;
                                setGeneratedEmails(newE);
                              }}
                              onRegenerate={generateSubjects}
                            />
                            
                            <SpamAnalysisPanel 
                              analysis={spamAnalysis} 
                              isLoading={isAnalyzingSpam} 
                            />
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              </div>
            )}
            
            {/* Streaming Overlay */}
            {isStreaming && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="bg-card p-4 rounded-lg shadow-lg border border-border flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">AI is typing...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/10 shrink-0 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={() => handleGenerate("single")}
              disabled={isGenerating || !context.productName}
            >
              Generate Single
            </Button>
            <Button 
              onClick={() => {
                if (generatedEmails.length > 0 && !isGenerating) {
                  onApply(generatedEmails);
                  onClose();
                } else {
                  handleGenerate("sequence");
                }
              }}
              disabled={isGenerating || !context.productName}
            >
              {generatedEmails.length > 0 && !isGenerating ? "Apply to Campaign" : "Generate Sequence"}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
