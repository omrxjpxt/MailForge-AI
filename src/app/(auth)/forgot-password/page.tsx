"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getAuthErrorMessage } from "@/lib/firebase/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react";

interface AuthAlert {
  title: string;
  description: string;
  variant: "destructive" | "success";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [authAlert, setAuthAlert] = useState<AuthAlert | null>(null);
  const [shaking, setShaking] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

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
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
    } catch (error: unknown) {
      const mapped = getAuthErrorMessage(error);
      setAuthAlert({
        title: mapped.title,
        description: mapped.description,
        variant: "destructive",
      });
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={cardRef} className={shaking ? "auth-shake" : ""}>
      <Card>
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            {isSent
              ? "Check your email for a link to reset your password."
              : "Enter your email address and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>

        {!isSent ? (
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              {/* Inline Auth Alert */}
              {authAlert && (
                <Alert
                  variant={authAlert.variant === "destructive" ? "destructive" : "default"}
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
                <Label htmlFor="email">Email address</Label>
                <Input
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
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link…
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                Back to Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <Alert className="auth-alert-in border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Email sent</AlertTitle>
              <AlertDescription>
                We&apos;ve sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Back to Sign In</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
