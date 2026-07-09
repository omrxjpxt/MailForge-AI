"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileType, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export function CsvImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "text/csv" && !selected.name.endsWith('.csv')) {
        toast.error("Please select a valid CSV file");
        return;
      }
      setFile(selected);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(10);

    // Parse CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setProgress(40);
        try {
          const leads = results.data;
          
          if (leads.length === 0) {
            throw new Error("CSV file is empty");
          }
          
          // Simulated upload process
          const chunkSize = Math.max(1, Math.floor(leads.length / 5));
          for (let i = 0; i < 5; i++) {
            await new Promise(r => setTimeout(r, 400));
            setProgress(40 + (i * 10));
          }
          
          setProgress(100);
          setTimeout(() => {
            toast.success(`Successfully imported ${leads.length} leads`);
            setIsOpen(false);
            setFile(null);
            setProgress(0);
            setIsUploading(false);
          }, 500);

        } catch (error: any) {
          toast.error(error.message || "Failed to process CSV");
          setIsUploading(false);
          setProgress(0);
        }
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
        setIsUploading(false);
        setProgress(0);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing your leads. The file should include columns for Name, Email, Company, and Industry.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {!file ? (
            <div 
              className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileType className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Click to upload</h3>
              <p className="text-xs text-muted-foreground">or drag and drop a CSV file here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-muted/20">
                <FileType className="h-8 w-8 text-primary" />
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-sm font-semibold truncate">{file.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                {!isUploading && (
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Importing leads...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? "Importing..." : "Start Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
