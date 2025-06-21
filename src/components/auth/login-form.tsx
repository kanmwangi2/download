
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheetahIcon } from "@/components/icons/cheetah-icon";
import { getFromStoreByIndex, STORE_NAMES } from '@/lib/indexedDbUtils';
import type { User } from '@/components/settings/user-management-tab';
import { Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

const CURRENT_USER_LOCALSTORAGE_KEY = "cheetahPayrollCurrentUser";

type FeedbackMessage = {
  type: 'success' | 'error';
  message: string;
  details?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    if (!email || !password) {
      setFeedback({ type: 'error', message: "Login Failed", details: "Email and password are required." });
      setIsLoading(false);
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        const user = await getFromStoreByIndex<User>(STORE_NAMES.USERS, 'email', email.trim().toLowerCase());

        if (user && user.password === password) {
          const currentUserData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            assignedCompanyIds: user.assignedCompanyIds,
          };
          localStorage.setItem(CURRENT_USER_LOCALSTORAGE_KEY, JSON.stringify(currentUserData));
          setFeedback({ type: 'success', message: "Login Successful", details: `Welcome back, ${user.firstName}!` });
          setTimeout(() => router.push("/select-company"), 1000);
        } else {
          setFeedback({ type: 'error', message: "Login Failed", details: "Invalid email or password." });
        }
      } catch (error) {
        console.error("Login error:", error);
        setFeedback({ type: 'error', message: "Login Error", details: "An unexpected error occurred during login." });
      }
    }
    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderFeedback = () => {
    if (!feedback) return null;
    const IconComponent = feedback.type === 'success' ? CheckCircle2 : AlertTriangle;
    const additionalAlertClasses = feedback.type === 'success'
      ? "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600 [&>svg]:text-green-600 dark:[&>svg]:text-green-400"
      : "";
    return (
      <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'} className={cn("mb-4", additionalAlertClasses)}>
        <IconComponent className="h-4 w-4" />
        <AlertTitle>{feedback.message}</AlertTitle>
        {feedback.details && <AlertDescription>{feedback.details}</AlertDescription>}
      </Alert>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            <CheetahIcon className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access Cheetah Payroll
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            {renderFeedback()}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                required
                className="text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="text-sm text-primary hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="text-base pr-10 py-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                  suppressHydrationWarning={true}
                >
                  {isClient && (showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />)}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full text-lg py-3"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
