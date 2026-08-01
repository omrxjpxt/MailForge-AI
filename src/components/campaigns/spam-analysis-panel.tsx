import { SpamAnalysis } from "@/types/ai-generation";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpamAnalysisPanelProps {
  analysis: SpamAnalysis | null;
  isLoading: boolean;
}

export function SpamAnalysisPanel({ analysis, isLoading }: SpamAnalysisPanelProps) {
  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardContent className="p-4 flex items-center justify-center min-h-[100px]">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span className="text-sm">Analyzing deliverability...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const isGood = analysis.score >= 80;
  const isWarning = analysis.score >= 60 && analysis.score < 80;
  const isDanger = analysis.score < 60;

  return (
    <Card className="bg-card overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            Deliverability Score
            {isGood && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {isWarning && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
            {isDanger && <AlertCircle className="h-4 w-4 text-destructive" />}
          </h4>
          <span className={cn(
            "text-sm font-bold",
            isGood ? "text-green-500" : isWarning ? "text-yellow-500" : "text-destructive"
          )}>
            {analysis.score}/100
          </span>
        </div>
        <Progress 
          value={analysis.score} 
          className="h-2" 
          /* @ts-ignore - overriding indicator color temporarily */
          style={{"--progress-color": isGood ? "var(--color-green-500)" : isWarning ? "var(--color-yellow-500)" : "var(--color-destructive)"} as any}
        />
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs mb-1">Reading Grade</span>
            <span className="font-medium">{analysis.readingGrade}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs mb-1">CTA Clarity</span>
            <span className="font-medium">{analysis.ctaClarity}</span>
          </div>
        </div>

        {analysis.triggerWords.length > 0 && (
          <div>
            <span className="text-muted-foreground block text-xs mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-yellow-500" /> Spam Trigger Words
            </span>
            <div className="flex flex-wrap gap-1.5">
              {analysis.triggerWords.map((word, i) => (
                <span key={i} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-xs rounded border border-yellow-500/20">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-muted-foreground block text-xs font-medium">Insights</span>
          
          {analysis.hasTooManyLinks && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Too many links. Consider reducing them to avoid spam filters.</span>
            </div>
          )}
          
          {analysis.hasCapitalizationIssues && (
            <div className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-500">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Excessive capitalization detected. Use normal sentence case.</span>
            </div>
          )}

          {analysis.suggestions.map((suggestion, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
              <span className="text-muted-foreground">{suggestion}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
