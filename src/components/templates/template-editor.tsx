"use client";

import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wand2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { EmailTemplate, TemplateInput } from "@/types/template";
import { createTemplate, updateTemplate } from "@/lib/firebase/templates";
import { useAuth } from "@/lib/firebase/auth";

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
}

export function TemplateEditor({ isOpen, onClose, template }: TemplateEditorProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  
  const [formData, setFormData] = useState<Partial<TemplateInput>>({
    name: "",
    description: "",
    category: "Other",
    subject: "",
    body: "",
    tags: [],
    isAI: false,
  });

  const [currentTag, setCurrentTag] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prevTemplateId, setPrevTemplateId] = useState<string | undefined>(undefined);
  
  // Sync prop to state without useEffect (derived state pattern)
  if (template?.id !== prevTemplateId) {
    setPrevTemplateId(template?.id);
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        subject: template.subject,
        body: template.body,
        tags: template.tags || [],
        isAI: template.isAI,
        createdWithPrompt: template.createdWithPrompt,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        category: "Other",
        subject: "",
        body: "",
        tags: [],
        isAI: false,
      });
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [formData.body]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, body: e.target.value });
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
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
        subject: data.template.subject,
        body: data.template.body,
        category: data.template.category,
        tags: data.template.tags,
        isAI: true,
        createdWithPrompt: aiPrompt
      }));
      
      toast.success("Template generated!");
      setShowAIPrompt(false);
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{template ? "Edit Template" : "Create Template"}</SheetTitle>
          <SheetDescription>
            Create highly converting email templates for your campaigns.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 pb-20">
          {!showAIPrompt ? (
            <Button 
              variant="outline" 
              className="w-full gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
              onClick={() => setShowAIPrompt(true)}
            >
              <Wand2 className="h-4 w-4" />
              Generate with Gemini AI
            </Button>
          ) : (
            <div className="flex flex-col gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <Label htmlFor="ai-prompt" className="text-primary font-medium">Describe your ideal email</Label>
              <Textarea 
                id="ai-prompt"
                placeholder="e.g. Write a cold email to VPs of Sales pitching our AI scheduling tool..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="bg-background"
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

          <div className="grid gap-3">
            <Label htmlFor="name">Template Name *</Label>
            <Input 
              id="name" 
              placeholder="e.g. SaaS Cold Outreach (Meeting)" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input 
              id="description" 
              placeholder="Briefly describe when to use this template..." 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid gap-3">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input 
              placeholder="Type a tag and press Enter..." 
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={handleAddTag}
            />
          </div>

          <div className="border-t border-border pt-6 mt-2 grid gap-3">
            <Label htmlFor="subject">Subject Line *</Label>
            <Input 
              id="subject" 
              placeholder="e.g. Quick question about {{companyName}}" 
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="body">Email Body *</Label>
            <Textarea 
              id="body"
              ref={textareaRef}
              placeholder="Hi {{firstName}},&#10;&#10;I noticed..." 
              value={formData.body}
              onChange={handleTextareaChange}
              className="min-h-[200px] resize-none overflow-hidden"
            />
            <p className="text-xs text-muted-foreground">
              Use placeholders like <code className="bg-muted px-1 py-0.5 rounded">{"{{firstName}}"}</code> to personalize. Basic HTML like <code>&lt;br&gt;</code> is supported.
            </p>
          </div>

        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Template
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
