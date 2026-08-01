import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RewriteAction } from "@/types/ai-generation";
import { 
  Sparkles, 
  Shrink, 
  Expand, 
  Briefcase, 
  Smile, 
  User, 
  Target, 
  SpellCheck,
  Zap,
  Laugh,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIRewriteToolbarProps {
  onRewrite: (action: RewriteAction) => Promise<void>;
  disabled?: boolean;
}

export function AIRewriteToolbar({ onRewrite, disabled }: AIRewriteToolbarProps) {
  const [activeAction, setActiveAction] = useState<RewriteAction | null>(null);

  const handleAction = async (action: RewriteAction) => {
    setActiveAction(action);
    try {
      await onRewrite(action);
    } finally {
      setActiveAction(null);
    }
  };

  const buttons: { id: RewriteAction; label: string; icon: React.ReactNode }[] = [
    { id: "rewrite", label: "Rewrite", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "shorter", label: "Shorter", icon: <Shrink className="h-3.5 w-3.5" /> },
    { id: "longer", label: "Longer", icon: <Expand className="h-3.5 w-3.5" /> },
    { id: "professional", label: "Professional", icon: <Briefcase className="h-3.5 w-3.5" /> },
    { id: "friendly", label: "Friendly", icon: <Smile className="h-3.5 w-3.5" /> },
    { id: "personalized", label: "Personalize", icon: <User className="h-3.5 w-3.5" /> },
    { id: "improve-cta", label: "Better CTA", icon: <Target className="h-3.5 w-3.5" /> },
    { id: "fix-grammar", label: "Fix Grammar", icon: <SpellCheck className="h-3.5 w-3.5" /> },
    { id: "direct", label: "Direct", icon: <Zap className="h-3.5 w-3.5" /> },
    { id: "humor", label: "Add Humor", icon: <Laugh className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border">
      {buttons.map((btn) => (
        <Button
          key={btn.id}
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-xs bg-background hover:bg-muted transition-colors",
            activeAction === btn.id && "bg-primary/10 text-primary border-primary/20 pointer-events-none"
          )}
          disabled={disabled || (activeAction !== null && activeAction !== btn.id)}
          onClick={() => handleAction(btn.id)}
        >
          {activeAction === btn.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <span className="mr-1.5">{btn.icon}</span>
          )}
          {btn.label}
        </Button>
      ))}
    </div>
  );
}
