"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Search, MoreHorizontal, Loader2, Copy, Archive, Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/firebase/auth";
import { onSnapshot, query, orderBy, where } from "firebase/firestore";
import { getTemplatesCollection, deleteTemplate, duplicateTemplate, archiveTemplate } from "@/lib/firebase/templates";
import { EmailTemplate } from "@/types/template";
import { TemplateEditor } from "@/components/templates/template-editor";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const templatesRef = getTemplatesCollection(user.uid);
    const q = query(templatesRef, where("isArchived", "==", false), orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTemplates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailTemplate[];
      
      setTemplates(fetchedTemplates);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    templates.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return ["All", ...Array.from(cats)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            template.subject.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsEditorOpen(true);
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    if (!user) return;
    try {
      await duplicateTemplate(user.uid, template);
      toast.success("Template duplicated");
    } catch {
      toast.error("Failed to duplicate template");
    }
  };

  const handleArchive = async (templateId: string) => {
    if (!user) return;
    try {
      await archiveTemplate(user.uid, templateId);
      toast.success("Template archived");
    } catch {
      toast.error("Failed to archive template");
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate(user.uid, templateId);
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">Manage your highest-converting email snippets.</p>
        </div>
        <Button className="h-9 gap-2" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search templates by name or tag..." 
            className="pl-9 bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <Badge 
              key={category} 
              variant={selectedCategory === category ? "default" : "outline"}
              className={`cursor-pointer ${selectedCategory === category ? '' : 'hover:bg-muted'}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-card/50 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">Create your first AI Template</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            {searchQuery ? "Try adjusting your search or filters to find what you're looking for." : "Templates are reusable email drafts. Use our AI to instantly generate high-converting outreach emails."}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreate} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="bg-card flex flex-col hover:border-primary/50 transition-colors group cursor-pointer"
              onClick={() => handleEdit(template)}
            >
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div className="space-y-1 overflow-hidden pr-2">
                  <CardTitle className="text-base flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{template.name}</span>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs min-h-[32px]">
                    {template.description || template.subject}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(template); }}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(template); }}>
                      <Copy className="h-4 w-4 mr-2" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(template.id); }}>
                      <Archive className="h-4 w-4 mr-2" /> Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:bg-destructive/10" 
                      onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {template.tags?.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px] bg-muted/50 font-normal">
                      {tag}
                    </Badge>
                  ))}
                  {(template.tags?.length || 0) > 3 && (
                    <Badge variant="secondary" className="text-[10px] bg-muted/50 font-normal">
                      +{(template.tags?.length || 0) - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t border-border/50 text-xs text-muted-foreground flex justify-between items-center">
                <span>Used {template.usageCount} times</span>
                <span className="truncate ml-2 text-right">
                  {template.lastUsed ? formatDistanceToNow(template.lastUsed, { addSuffix: true }) : "Never"}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <TemplateEditor 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
        template={selectedTemplate} 
      />
    </div>
  );
}
