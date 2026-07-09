import { Button } from "@/components/ui/button";
import { Plus, FileText, Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const templates = [
  {
    id: "1",
    name: "SaaS Cold Outreach (Meeting)",
    description: "High converting template for B2B SaaS with a clear CTA to book a meeting.",
    usageCount: 145,
    lastUsed: "2 hours ago",
    tags: ["SaaS", "Meeting", "B2B"]
  },
  {
    id: "2",
    name: "Follow up (No Reply)",
    description: "A quick bump to bring the previous email to the top of their inbox.",
    usageCount: 890,
    lastUsed: "5 mins ago",
    tags: ["Follow-up", "Short"]
  },
  {
    id: "3",
    name: "Value Add / Content Share",
    description: "Sharing a relevant case study or article to build trust before pitching.",
    usageCount: 56,
    lastUsed: "1 day ago",
    tags: ["Value-Add", "Soft Pitch"]
  },
  {
    id: "4",
    name: "Breakup Email",
    description: "The final email in a sequence designed to provoke a response.",
    usageCount: 210,
    lastUsed: "4 hours ago",
    tags: ["Breakup", "Sequence-End"]
  }
];

export default function TemplatesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">Manage your highest-converting email snippets.</p>
        </div>
        <Button className="h-9 gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search templates by name or tag..." 
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="cursor-pointer bg-primary/20 text-primary hover:bg-primary/30">All</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">SaaS</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">Follow-up</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="bg-card flex flex-col hover:border-primary/50 transition-colors group cursor-pointer">
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {template.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs">
                  {template.description}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 pb-3">
              <div className="flex flex-wrap gap-1.5 mt-2">
                {template.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px] bg-muted/50 font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-3 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
              <span>Used {template.usageCount} times</span>
              <span>{template.lastUsed}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
