
import type { Metadata } from 'next';
import '@/app/globals.css';
// Toaster removed
import { ThemeProvider } from "@/components/theme-provider";
import Link from 'next/link';
import { CheetahIcon } from '@/components/icons/cheetah-icon';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Application Settings - Cheetah Payroll',
  description: 'Manage global application settings for Cheetah Payroll.',
};

export default function ApplicationSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            <Button variant="outline" asChild>
              <Link href="/select-company">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Company Selection
              </Link>
            </Button>
          </div>
        </header>
        <main className="flex-grow max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          {children}
        </main>
      </div>
      {/* Toaster removed */}
    </ThemeProvider>
  );
}
