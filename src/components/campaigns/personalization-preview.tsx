import { useState, useMemo } from "react";
import { Lead } from "@/types/lead";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersonalizationPreviewProps {
  subject: string;
  body: string;
  leads: Lead[];
}

export function PersonalizationPreview({ subject, body, leads }: PersonalizationPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentLead = leads[currentIndex];

  const applyPlaceholders = (text: string, lead: Lead | undefined) => {
    if (!text) return "";
    if (!lead) return text;

    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const k = key.trim();
      const val = lead[k as keyof Lead];
      if (val) return String(val);
      return match;
    });
  };

  const previewSubject = applyPlaceholders(subject, currentLead);
  const previewBody = applyPlaceholders(body, currentLead);

  if (!leads || leads.length === 0) {
    return (
      <div className="p-6 text-center border rounded-lg bg-muted/20">
        <User className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <h4 className="text-sm font-medium mb-1">No leads selected</h4>
        <p className="text-xs text-muted-foreground">Select leads in the campaign to see a live preview.</p>
      </div>
    );
  }

  const handlePrev = () => setCurrentIndex(i => (i === 0 ? leads.length - 1 : i - 1));
  const handleNext = () => setCurrentIndex(i => (i === leads.length - 1 ? 0 : i + 1));

  return (
    <div className="border rounded-lg overflow-hidden bg-card text-left">
      <div className="flex items-center justify-between p-2.5 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
            {currentLead?.firstName?.[0] || "?"}
          </div>
          <span className="text-xs font-medium">
            {currentLead?.firstName} {currentLead?.lastName}
          </span>
          {currentLead?.company && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {currentLead.company}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground mr-2">
            {currentIndex + 1} of {leads.length}
          </span>
          <Button variant="ghost" size="icon-xs" className="h-6 w-6" onClick={handlePrev}>
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-xs" className="h-6 w-6" onClick={handleNext}>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider block mb-1">Subject</span>
          <p className="text-sm font-medium">{previewSubject || "No subject"}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider block mb-1">Body</span>
          <div className="text-sm whitespace-pre-wrap text-foreground/90 font-mono leading-relaxed bg-muted/10 p-3 rounded-md border border-border/50">
            {previewBody || "No body content"}
          </div>
        </div>
      </div>
    </div>
  );
}
