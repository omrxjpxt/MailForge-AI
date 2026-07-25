"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/firebase/auth";
import { createTemplate, updateTemplate } from "@/lib/firebase/templates";
import { EmailTemplate, TemplateInput } from "@/types/template";
import { Loader2, Wand2, X, Eye, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  template?: EmailTemplate | null;
}

export function TemplateEditor({ isOpen, onClose, template }: TemplateEditorProps) {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<Partial<TemplateInput>>({
    name: "",
    description: "",
    category: "Cold Outreach",
    subject: "",
    body: "",
    tags: [],
    isAI: false,
  });
  
  const [currentTag, setCurrentTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [mode, setMode] = useState<"edit" | "preview">("edit");
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || "",
        category: template.category,
        subject: template.subject,
        body: template.body,
        tags: template.tags || [],
        isAI: template.isAI || false,
        createdWithPrompt: template.createdWithPrompt || ""
      });
      if (template.createdWithPrompt) {
        setAiPrompt(template.createdWithPrompt);
        setShowAIPrompt(true);
      }
    } else {
      setFormData({
        name: "",
        description: "",
        category: "Cold Outreach",
        subject: "",
        body: "",
        tags: [],
        isAI: false,
      });
      setShowAIPrompt(false);
      setAiPrompt("");
      setMode("edit");
    }
  }, [template, isOpen]);

  // Handle auto-growing textarea up to 600px
  useLayoutEffect(() => {
    if (textareaRef.current && mode === "edit") {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 600)}px`;
    }
  }, [formData.body, mode]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, body: e.target.value });
    e.target.style.height = "auto";
    const scrollHeight = e.target.scrollHeight;
    e.target.style.height = `${Math.min(scrollHeight, 600)}px`;
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!formData.tags?.includes(currentTag.trim())) {
        setFormData({ ...formData, tags: [...(formData.tags || []), currentTag.trim()] });
      }
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tagToRemove) });
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return toast.error("Please enter a prompt");
    
    setIsGenerating(true);
    try {
      const res = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      
      setFormData(prev => ({
        ...prev,
        name: data.template.templateName || prev.name,
        description: data.template.description || prev.description,
        subject: data.template.subject,
        body: data.template.body,
        category: "Cold Outreach",
        tags: data.template.tags,
        isAI: true,
        createdWithPrompt: aiPrompt
      }));
      
      toast.success("Template generated!");
      setMode("edit");
      
      // Auto-scroll to the populated content
      setTimeout(() => {
        editorTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user) return toast.error("You must be logged in");
    if (!formData.name || !formData.subject || !formData.body) {
      return toast.error("Name, subject, and body are required");
    }

    setIsSaving(true);
    try {
      if (template) {
        await updateTemplate(user.uid, template.id, formData);
        toast.success("Template updated");
      } else {
        await createTemplate(user.uid, formData as TemplateInput);
        toast.success("Template created");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const renderPreview = (text: string) => {
    let result = text;
    result = result.replace(/\{\{firstName\}\}/gi, "John");
    result = result.replace(/\{\{lastName\}\}/gi, "Smith");
    result = result.replace(/\{\{company\}\}/gi, "Acme Inc.");
    result = result.replace(/\{\{jobTitle\}\}/gi, "VP of Sales");
    result = result.replace(/\{\{industry\}\}/gi, "SaaS");
    result = result.replace(/\{\{email\}\}/gi, "john@acme.com");
    return result;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col h-full w-full sm:max-w-xl p-0 gap-0">
        
        <SheetHeader className="p-6 pb-2 shrink-0 border-b border-border bg-background z-10">
          <div className="flex justify-between items-center w-full">
            <div>
              <SheetTitle>{template ? "Edit Template" : "Create Template"}</SheetTitle>
              <SheetDescription>
                Create highly converting email templates for your campaigns.
              </SheetDescription>
            </div>
            <Tabs value={mode} onValueChange={(val) => setMode(val as "edit" | "preview")} className="w-[160px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" className="text-xs">
                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" /> Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {!showAIPrompt ? (
            <Button 
              variant="outline" 
              className="w-full gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary shrink-0"
              onClick={() => setShowAIPrompt(true)}
            >
              <Wand2 className="h-4 w-4" />
              Generate with Gemini AI
            </Button>
          ) : (
            <div className="flex flex-col gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5 shrink-0">
              <Label htmlFor="ai-prompt" className="text-primary font-medium">Describe your ideal email</Label>
              <Textarea 
                id="ai-prompt"
                placeholder="e.g. Write a cold email to VPs of Sales pitching our AI scheduling tool..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="bg-background resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAIPrompt(false)}>Cancel</Button>
                <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Generate
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-3 shrink-0" ref={editorTopRef}>
            <Label htmlFor="name">Template Name *</Label>
            <Input 
              id="name" 
              placeholder={mode === "preview" ? "Template Name" : "e.g. SaaS Cold Outreach (Meeting)"} 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              readOnly={mode === "preview"}
            />
          </div>

          <div className="grid gap-3 shrink-0">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input 
              id="description" 
              placeholder={mode === "preview" ? "Description" : "Briefly describe when to use this template..."} 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              readOnly={mode === "preview"}
            />
          </div>

          <div className="grid gap-3 shrink-0">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  {mode === "edit" && (
                    <button onClick={() => removeTag(tag)} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {mode === "edit" && (
              <Input 
                placeholder="Type a tag and press Enter..." 
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleAddTag}
              />
            )}
          </div>

          <div className="border-t border-border pt-6 mt-2 grid gap-3 shrink-0">
            <Label htmlFor="subject">Subject Line *</Label>
            {mode === "edit" ? (
              <Input 
                id="subject" 
                placeholder="e.g. Quick question about {{company}}" 
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            ) : (
              <div className="p-3 border rounded-md bg-muted/50 text-sm">
                {formData.subject ? renderPreview(formData.subject) : <span className="text-muted-foreground">Subject preview...</span>}
              </div>
            )}
          </div>

          <div className="grid gap-3 shrink-0">
            <Label htmlFor="body">Email Body *</Label>
            {mode === "edit" ? (
              <>
                <Textarea 
                  id="body"
                  ref={textareaRef}
                  placeholder="Hi {{firstName}},&#10;&#10;I noticed..." 
                  value={formData.body}
                  onChange={handleTextareaChange}
                  className="min-h-[200px] resize-none overflow-y-auto"
                />
                <p className="text-xs text-muted-foreground">
                  Use placeholders like <code className="bg-muted px-1 py-0.5 rounded">{"{{firstName}}"}</code> to personalize.
                </p>
              </>
            ) : (
              <div className="p-4 border rounded-md bg-muted/50 text-sm whitespace-pre-wrap min-h-[200px]">
                {formData.body ? renderPreview(formData.body) : <span className="text-muted-foreground">Body preview...</span>}
              </div>
            )}
          </div>

        </div>
        
        <div className="shrink-0 p-4 border-t border-border bg-background flex justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || isGenerating}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Template
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
