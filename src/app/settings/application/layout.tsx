
"use client";

import type { Metadata } from 'next';
import '@/app/globals.css';
import { ThemeProvider } from "@/components/theme-provider";
import Link from 'next/link';
import { CheetahIcon } from '@/components/icons/cheetah-icon';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserService } from '@/lib/services/UserService';

interface ApplicationSettingsLayoutProps {
  children: React.ReactNode;
}

export default function ApplicationSettingsLayout({ children }: ApplicationSettingsLayoutProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      console.log('ApplicationSettings: No user found, redirecting to signin');
      router.replace('/signin');
      return;
    }

    // Check if user has admin privileges
    const hasAdminAccess = UserService.hasUniversalAccess(user);
    
    if (!hasAdminAccess) {
      console.log('ApplicationSettings: User not admin, redirecting to select-company');
      router.replace('/select-company');
      return;
    }

    console.log('ApplicationSettings: User authenticated with admin access:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      hasAdminAccess
    });
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!user || !UserService.hasUniversalAccess(user)) {
    return null; // Router will redirect
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/select-company" className="flex items-center gap-2 text-lg font-semibold">
              <CheetahIcon className="h-6 w-6 text-primary" />
              <span>Cheetah Payroll - Settings</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.role}
              </span>
              <Button variant="outline" asChild>
                <Link href="/select-company">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Company Selection
                </Link>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-grow max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
