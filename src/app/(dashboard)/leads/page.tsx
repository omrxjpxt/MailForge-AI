import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadsTable } from "@/components/leads/leads-table";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { CsvImportDialog } from "@/components/leads/csv-import-dialog";

export default function LeadsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Manage and segment your prospect universe with AI-powered insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <CsvImportDialog />
          <AddLeadDialog />
        </div>
      </div>
      
      <div className="flex flex-col w-full">
        <LeadFilters />
        <LeadsTable />
      </div>
    </div>
  );
}
