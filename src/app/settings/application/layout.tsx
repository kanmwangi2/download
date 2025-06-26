
"use client";

import type { Metadata } from 'next';
import '@/app/globals.css';
import { ThemeProvider } from "@/components/theme-provider";
import Link from 'next/link';
import { CheetahIcon } from '@/components/icons/cheetah-icon';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClientAsync } from '@/lib/supabase';

interface ApplicationSettingsLayoutProps {
  children: React.ReactNode;
}

export default function ApplicationSettingsLayout({ children }: ApplicationSettingsLayoutProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuthentication = async () => {
      try {
        // Longer delay to ensure session is properly established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const supabase = await getSupabaseClientAsync();
        
        // Get the current session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('ApplicationSettings: Session check:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userRole: session?.user?.user_metadata?.role,
          sessionError: sessionError?.message 
        });
        
        if (sessionError) {
          console.error('ApplicationSettings: Session error:', sessionError);
          if (isMounted) {
            router.replace('/signin');
          }
          return;
        }

        if (!session?.user) {
          console.log('ApplicationSettings: No session found, redirecting to signin');
          if (isMounted) {
            router.replace('/signin');
          }
          return;
        }

        const user = session.user;
        const role = user.user_metadata?.role || '';
        
        console.log('ApplicationSettings: User authenticated:', {
          userId: user.id,
          email: user.email,
          role: role,
          isAdmin: role === 'Primary Admin' || role === 'App Admin'
        });
        
        if (isMounted) {
          setUserRole(role);
        }
        
        // Check if user has admin privileges
        const isAdmin = role === 'Primary Admin' || role === 'App Admin';
        
        if (!isAdmin) {
          console.log('ApplicationSettings: User not admin, redirecting to select-company');
          if (isMounted) {
            router.replace('/select-company');
          }
          return;
        }

        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('ApplicationSettings: Authentication error:', error);
        if (isMounted) {
          router.replace('/signin');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuthentication();

    // Set up auth state change listener
    const setupAuthListener = async () => {
      try {
        const supabase = await getSupabaseClientAsync();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
          console.log('ApplicationSettings: Auth state changed:', event, !!session);
          
          if (event === 'SIGNED_OUT' || !session) {
            if (isMounted) {
              setIsAuthenticated(false);
              router.replace('/signin');
            }
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Re-check authentication when signed in or token refreshed
            setTimeout(() => {
              if (isMounted) {
                checkAuthentication();
              }
            }, 100);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('ApplicationSettings: Failed to set up auth listener:', error);
        return () => {};
      }
    };

    let unsubscribe: (() => void) | undefined;
    setupAuthListener().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [router]);

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

  if (!isAuthenticated) {
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
                {userRole}
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
