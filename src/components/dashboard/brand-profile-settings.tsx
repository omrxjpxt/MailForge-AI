"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBrandProfile } from "@/hooks/use-brand-profile";
import { BrandProfile } from "@/types/ai-generation";

export function BrandProfileSettings() {
  const { brandProfile, isLoading, updateBrandProfile } = useBrandProfile();
  const [formData, setFormData] = useState<Partial<BrandProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (brandProfile) {
      setFormData(brandProfile);
    }
  }, [brandProfile]);

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBrandProfile(formData);
      toast.success("Brand profile saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save brand profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Brand Profile</CardTitle>
        <CardDescription>
          Teach AI about your company, products, and preferred writing style. This context is automatically applied to all future generations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input 
              value={formData.companyName || ""} 
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} 
              placeholder="e.g. MailForge AI"
            />
          </div>
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input 
              value={formData.website || ""} 
              onChange={(e) => setFormData({ ...formData, website: e.target.value })} 
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Company / Product Description</Label>
          <Textarea 
            value={formData.description || ""} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            placeholder="What does your company do? What value do you provide?"
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Target Customer</Label>
            <Input 
              value={formData.targetCustomer || ""} 
              onChange={(e) => setFormData({ ...formData, targetCustomer: e.target.value })} 
              placeholder="e.g. B2B SaaS Founders, VP of Sales"
            />
          </div>
          <div className="space-y-2">
            <Label>Default Tone</Label>
            <Select 
              value={formData.tone || "Professional"} 
              onValueChange={(v) => setFormData({ ...formData, tone: v || "Professional" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Friendly">Friendly</SelectItem>
                <SelectItem value="Consultative">Consultative</SelectItem>
                <SelectItem value="Direct">Direct</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Writing Style Guidelines</Label>
          <Textarea 
            value={formData.writingStyle || ""} 
            onChange={(e) => setFormData({ ...formData, writingStyle: e.target.value })} 
            placeholder="e.g. Keep it short. Don't use buzzwords. Focus on saving time."
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Email Signature (used for context)</Label>
          <Textarea 
            value={formData.signature || ""} 
            onChange={(e) => setFormData({ ...formData, signature: e.target.value })} 
            placeholder="John Doe&#10;Founder, MailForge"
            className="min-h-[80px]"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-6">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Brand Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
