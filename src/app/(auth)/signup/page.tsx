"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { getAuthErrorMessage } from "@/lib/firebase/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AuthAlert {
  title: string;
  description: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authAlert, setAuthAlert] = useState<AuthAlert | null>(null);
  const [shaking, setShaking] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setAuthAlert(null);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update profile with display name
      await updateProfile(user, { displayName: name });

      // 3. Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        fullName: name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 4. Create default settings document
      await setDoc(doc(db, "users", user.uid, "settings", "default"), {
        dailyLimit: 50,
        delayBetweenEmails: 30,
        defaultTone: "professional",
      });

      // 5. Get token and create session cookie
      const idToken = await user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        toast.success("Account created successfully");
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to create session");
      }
    } catch (error: unknown) {
      const mapped = getAuthErrorMessage(error);

      setAuthAlert({ title: mapped.title, description: mapped.description });
      triggerShake();

      if (mapped.clearPassword) {
        setPassword("");
        setTimeout(() => passwordRef.current?.focus(), 0);
      } else if (mapped.field === "email") {
        setTimeout(() => emailRef.current?.focus(), 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={cardRef} className={shaking ? "auth-shake" : ""}>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Get started with MailForge AI outreach.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {/* Inline Auth Alert */}
            {authAlert && (
              <Alert
                variant="destructive"
                role="alert"
                aria-live="polite"
                className="auth-alert-in relative"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{authAlert.title}</AlertTitle>
                <AlertDescription>{authAlert.description}</AlertDescription>
                <button
                  type="button"
                  onClick={() => setAuthAlert(null)}
                  aria-label="Dismiss error"
                  className="absolute top-3 right-3 text-destructive/60 hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                ref={emailRef}
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setAuthAlert(null); }}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setAuthAlert(null); }}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
