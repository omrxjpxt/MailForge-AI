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
import { Upload, FileType, Loader2, X, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/firebase/auth";
import { LeadInput, leadSchema } from "@/types/lead";
import { batchImportLeads } from "@/lib/firebase/leads";
import { Lead } from "@/types/lead";

interface CsvImportDialogProps {
  existingLeads: Lead[];
}

export function CsvImportDialog({ existingLeads }: CsvImportDialogProps) {
  const { user } = useAuth();
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

  const resetState = () => {
    setFile(null);
    setProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    setProgress(10);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setProgress(30);
        try {
          const rows = results.data as Record<string, string>[];
          if (rows.length === 0) {
            throw new Error("CSV file is empty");
          }

          const existingEmails = new Set(existingLeads.map(l => l.email.toLowerCase()));
          const validLeadsToImport: LeadInput[] = [];
          let skippedCount = 0;
          let failedCount = 0;

          rows.forEach(row => {
            // Map common CSV columns to our schema
            const rawLead = {
              firstName: row.firstName || row["First Name"] || "",
              lastName: row.lastName || row["Last Name"] || "",
              email: (row.email || row["Email"] || "").trim().toLowerCase(),
              company: row.company || row["Company"] || "Unknown",
              jobTitle: row.jobTitle || row["Job Title"] || row.title || "Unknown",
              industry: row.industry || row["Industry"] || "Other",
              phone: row.phone || row["Phone"] || "",
              website: row.website || row["Website"] || "",
              linkedin: row.linkedin || row["LinkedIn"] || "",
              location: row.location || row["Location"] || "",
              companySize: row.companySize || row["Company Size"] || "",
              source: "CSV",
              status: "New",
            };

            const parsed = leadSchema.safeParse(rawLead);
            if (parsed.success) {
              if (existingEmails.has(parsed.data.email)) {
                skippedCount++;
              } else {
                validLeadsToImport.push(parsed.data);
                // add to set so we don't import duplicates within the same CSV
                existingEmails.add(parsed.data.email);
              }
            } else {
              failedCount++;
            }
          });

          setProgress(60);

          if (validLeadsToImport.length > 0) {
            // Firestore batches have a limit of 500. For production, chunk this if needed.
            // Assuming max 500 for this CRM scale per import.
            const chunks = [];
            for (let i = 0; i < validLeadsToImport.length; i += 400) {
              chunks.push(validLeadsToImport.slice(i, i + 400));
            }

            for (let i = 0; i < chunks.length; i++) {
              await batchImportLeads(user.uid, chunks[i]);
              setProgress(60 + ((i + 1) / chunks.length) * 40);
            }
          } else {
            setProgress(100);
          }

          setTimeout(() => {
            toast.success(`Import complete!`, {
              description: `Imported: ${validLeadsToImport.length} | Skipped (Dupes): ${skippedCount} | Failed (Invalid): ${failedCount}`
            });
            setIsOpen(false);
            resetState();
          }, 500);

        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to process CSV");
          resetState();
        }
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
        resetState();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
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
            Upload a CSV file containing your leads. Required columns: First Name, Last Name, Email, Company, Job Title, Industry.
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
                    <span>{Math.round(progress)}%</span>
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
