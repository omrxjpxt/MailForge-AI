"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Shield, User, Bell, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { auth, db } from "@/lib/firebase/client";
import { doc, onSnapshot } from "firebase/firestore";

function SettingsContent() {
  const [isSaving, setIsSaving] = useState(false);
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const gmailError = searchParams.get("gmail_error");
  const successMsg = searchParams.get("success");
  const defaultTab = searchParams.get("tab") || "account";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (doc) => {
          if (doc.exists()) {
            setGmailConnected(!!doc.data().gmailConnected);
          } else {
            setGmailConnected(false);
          }
        });
        return () => unsubscribeDoc();
      } else {
        setGmailConnected(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (successMsg === "gmail_connected") {
      toast.success("Gmail connected successfully.");
      router.replace("/settings?tab=integrations");
    } else if (gmailError && gmailConnected === true) {
      // Clean up stale error if already connected
      router.replace("/settings?tab=integrations");
    }
  }, [successMsg, gmailError, gmailConnected, router]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully");
    }, 1000);
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/gmail/disconnect", { method: "POST" });
      if (res.ok) {
        toast.success("Gmail disconnected successfully");
        router.replace("/settings?tab=integrations"); // clean any leftover params
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to disconnect Gmail account.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getGmailErrorDisplay = (error: string) => {
    switch (error) {
      case "access_denied":
        return { title: "Gmail connection cancelled", desc: "You cancelled the Google authorization." };
      case "invalid_state":
        return { title: "Session expired", desc: "The authorization session expired or is invalid. Please try again." };
      case "unauthorized_client":
      case "app_not_verified":
        return { title: "Not authorized", desc: "This Google account isn't authorized to access the application. If you're testing the app, ask the administrator to add your account as a Google OAuth test user." };
      case "redirect_uri_mismatch":
        return { title: "Configuration error", desc: "OAuth configuration is incorrect. Please contact the administrator." };
      default:
        return { title: "Gmail connection failed", desc: "We couldn't connect your Gmail account. Please try again." };
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account, integrations, and preferences.</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 bg-muted/50 w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="account" className="rounded-sm gap-2"><User className="h-4 w-4" /> Account</TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-sm gap-2"><Mail className="h-4 w-4" /> Integrations</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-sm gap-2"><Shield className="h-4 w-4" /> Billing</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-sm gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="mt-0 space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Om" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="om@example.com" disabled />
                <p className="text-xs text-muted-foreground">To change your email, please contact support.</p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-6">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Delete Account</h4>
                  <p className="text-xs text-muted-foreground">Permanently delete your data and campaigns.</p>
                </div>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-0 space-y-6">
          {gmailError && !gmailConnected && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{getGmailErrorDisplay(gmailError).title}</AlertTitle>
              <AlertDescription>{getGmailErrorDisplay(gmailError).desc}</AlertDescription>
            </Alert>
          )}

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Email Provider</CardTitle>
              <CardDescription>Connect your email account to send campaigns.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-lg bg-muted/20 gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white rounded flex items-center justify-center border border-border shrink-0">
                    <svg viewBox="0 0 24 24" className="h-6 w-6">
                      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335" />
                      <path d="M16.91 16.774h3.818v4.226h-3.818zM16.91 5.31l1.528-1.145c1.618-1.214 3.927-.059 3.927 1.964v5.602l-5.455 5.043z" fill="#C5221F" />
                      <path d="M3.273 16.774H7.09v4.226H3.273z" fill="#FABB05" />
                      <path d="M5.564 4.165 7.092 5.31v11.464L1.636 11.73V5.457c0-2.023 2.309-3.178 3.928-1.964z" fill="#4285F4" />
                      <path d="M12 9.548 5.455 4.64 7.092 5.31 12 8.986l4.908-3.676 1.637-.676z" fill="#34A853" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Google Workspace / Gmail</h4>
                    {gmailConnected === null ? (
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" /> Checking...
                      </div>
                    ) : gmailConnected ? (
                      <p className="text-xs text-green-500 flex items-center font-medium mt-1">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Not connected</p>
                    )}
                  </div>
                </div>
                
                {gmailConnected !== null && (
                  gmailConnected ? (
                    <Button variant="outline" onClick={handleDisconnect} disabled={isDisconnecting}>
                      {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Disconnect
                    </Button>
                  ) : (
                    <Button asChild>
                      <a href="/api/gmail/auth">
                        {gmailError ? "Try Again" : "Connect"}
                      </a>
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage keys for external services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini">Gemini API Key</Label>
                <div className="flex gap-2">
                  <Input id="gemini" type="password" value="*************************" disabled />
                  <Button variant="outline">Update</Button>
                </div>
                <p className="text-xs text-muted-foreground">Used for AI email generation and personalized drafting.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-0 space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>You are currently on the Pro plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-primary/20 bg-primary/5 rounded-lg">
                <div>
                  <h4 className="font-bold text-lg text-primary">MailForge Pro</h4>
                  <p className="text-sm text-muted-foreground">$49/month • Renews on Aug 15, 2026</p>
                </div>
                <Button variant="outline">Manage Subscription</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0 space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what alerts you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Positive Replies</Label>
                  <p className="text-sm text-muted-foreground">Get notified when a prospect replies positively.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Campaign Completion</Label>
                  <p className="text-sm text-muted-foreground">Get notified when a campaign finishes sending.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">Receive a daily digest of your outreach stats.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

