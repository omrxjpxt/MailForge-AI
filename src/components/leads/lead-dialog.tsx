"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Lead, LeadInput, leadSchema, LeadStatusEnum } from "@/types/lead";
import { addLead, updateLead } from "@/lib/firebase/leads";
import { useAuth } from "@/lib/firebase/auth";

interface LeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leadToEdit?: Lead | null;
}

export function LeadDialog({ isOpen, onOpenChange, leadToEdit }: LeadDialogProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      jobTitle: "",
      industry: "",
      status: "New",
      source: "Manual",
    },
  });

  const currentStatus = useWatch({ control, name: "status" });

  useEffect(() => {
    if (isOpen) {
      if (leadToEdit) {
        reset({
          firstName: leadToEdit.firstName,
          lastName: leadToEdit.lastName,
          email: leadToEdit.email,
          phone: leadToEdit.phone || "",
          company: leadToEdit.company,
          jobTitle: leadToEdit.jobTitle,
          website: leadToEdit.website || "",
          linkedin: leadToEdit.linkedin || "",
          industry: leadToEdit.industry,
          companySize: leadToEdit.companySize || "",
          location: leadToEdit.location || "",
          status: leadToEdit.status,
          source: leadToEdit.source,
          notes: leadToEdit.notes || "",
          tags: leadToEdit.tags || [],
        });
      } else {
        reset({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          company: "",
          jobTitle: "",
          website: "",
          linkedin: "",
          industry: "",
          companySize: "",
          location: "",
          status: "New",
          source: "Manual",
          notes: "",
          tags: [],
        });
      }
    }
  }, [isOpen, leadToEdit, reset]);

  const onSubmit = async (data: LeadInput) => {
    if (!user) return toast.error("You must be logged in.");

    setIsSaving(true);
    try {
      if (leadToEdit) {
        await updateLead(user.uid, leadToEdit.id, data);
        toast.success("Lead updated successfully");
      } else {
        await addLead(user.uid, data);
        toast.success("Lead added successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save lead");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{leadToEdit ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          <DialogDescription>
            {leadToEdit ? "Update the prospect's details below." : "Enter the details of the prospect you want to reach out to."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input id="company" {...register("company")} />
              {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input id="jobTitle" {...register("jobTitle")} />
              {errors.jobTitle && <p className="text-xs text-destructive">{errors.jobTitle.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input id="industry" {...register("industry")} />
              {errors.industry && <p className="text-xs text-destructive">{errors.industry.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={currentStatus} onValueChange={(v) => setValue("status", v as LeadInput["status"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {LeadStatusEnum.options.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input id="linkedin" type="url" {...register("linkedin")} placeholder="https://linkedin.com/in/..." />
            {errors.linkedin && <p className="text-xs text-destructive">{errors.linkedin.message}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {leadToEdit ? "Save Changes" : "Create Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
