import { SubjectQuality } from "@/types/ai-generation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubjectLineSuggestionsProps {
  subjects: SubjectQuality[];
  isLoading: boolean;
  onSelect: (subject: string) => void;
  onRegenerate: () => void;
}

export function SubjectLineSuggestions({ subjects, isLoading, onSelect, onRegenerate }: SubjectLineSuggestionsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-muted/30 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (!subjects.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">AI Subject Suggestions</h4>
        <Button variant="ghost" size="sm" onClick={onRegenerate} className="h-8 gap-1.5 text-xs">
          <RefreshCw className="h-3 w-3" /> Regenerate
        </Button>
      </div>
      <div className="grid gap-2">
        {subjects.map((s, idx) => (
          <div 
            key={idx} 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{s.subject}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < s.quality ? "opacity-100" : "opacity-30"}>★</span>
                  ))}
                </span>
                <span className="text-muted-foreground">•</span>
                <Badge variant="outline" className={cn(
                  "font-normal border-transparent bg-muted/50",
                  s.spamRisk === "High" ? "text-destructive" : s.spamRisk === "Medium" ? "text-yellow-600" : "text-green-600"
                )}>
                  {s.spamRisk} Spam Risk
                </Badge>
                <Badge variant="outline" className="font-normal text-muted-foreground bg-muted/30 border-transparent">
                  {s.tone}
                </Badge>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onSelect(s.subject)} className="shrink-0 h-8">
              Use This
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
