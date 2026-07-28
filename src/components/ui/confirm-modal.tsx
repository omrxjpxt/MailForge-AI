"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ConfirmOptions {
  title: string;
  description: string;
  items?: string[];
  actionButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => Promise<void>;
  successToast?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isDeleting) return;
    setIsOpen(false);
    setTimeout(() => setOptions(null), 300);
  };

  const handleConfirm = async () => {
    if (!options) return;
    setIsDeleting(true);
    try {
      await options.onConfirm();
      setIsOpen(false);
      if (options.successToast) {
        toast.success(options.successToast);
      }
      setTimeout(() => setOptions(null), 300);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during deletion");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden bg-background/80 backdrop-blur-xl border-border shadow-2xl p-0 gap-0 transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="p-6 pb-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  {options?.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground max-w-sm">
                  {options?.description}
                </DialogDescription>
              </div>
            </div>
            
            {options?.items && options.items.length > 0 && (
              <div className="mt-6 bg-muted/30 border border-border/50 rounded-lg p-3 text-sm">
                <ul className="space-y-1.5 text-muted-foreground">
                  {options.items.slice(0, 5).map((item, i) => (
                    <li key={i} className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 shrink-0" />
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                  {options.items.length > 5 && (
                    <li className="pl-3.5 pt-1 text-xs font-medium text-muted-foreground/70">
                      +{options.items.length - 5} more...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          <DialogFooter className="p-6 pt-4 bg-muted/10 border-t border-border/30 gap-2 sm:gap-0 flex-row">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={handleClose}
              disabled={isDeleting}
            >
              {options?.cancelButtonText || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                options?.actionButtonText || "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
