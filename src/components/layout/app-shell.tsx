"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  mainNavItems,
  type NavItem,
  type NavGroup,
} from "@/config/nav";
import { CheetahIcon } from "@/components/icons/cheetah-icon";
import { UserNav } from "./user-nav";
import { CompanyProvider, useCompany } from "@/context/CompanyContext";
import { useAuth } from "@/context/AuthContext";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("🚫 AppShell: User not authenticated, redirecting to /signin");
      router.replace("/signin");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <CheetahIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <CheetahIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function SidebarNavigation() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <ScrollArea className="flex-1">
      <SidebarMenu>
        {mainNavItems.map((element, index) => {
          if ('isGroup' in element && element.isGroup) {
            const navGroup = element as NavGroup;
            return (
              <React.Fragment key={navGroup.title + index}>
                {navGroup.title && (
                  <li
                    className="px-3 pt-5 pb-1 text-xs font-semibold text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden"
                    style={{ listStyleType: 'none' }}
                  >
                    {navGroup.title.toUpperCase()}
                  </li>
                )}
                {navGroup.children.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(item.href))}
                      {...(open ? {} : { tooltip: item.title })}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </React.Fragment>
            );
          } else {
            const item = element as NavItem;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(item.href))}
                  {...(open ? {} : { tooltip: item.title })}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
        })}
      </SidebarMenu>
    </ScrollArea>
  );
}

function CompanyGuard({ children }: { children: React.ReactNode }) {
  const { selectedCompanyId, isLoadingCompanyContext } = useCompany();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingCompanyContext && !selectedCompanyId) {
      console.log("🚫 AppShell: No company selected, redirecting to /select-company");
      router.replace("/select-company");
    }
  }, [selectedCompanyId, isLoadingCompanyContext, router]);

  if (isLoadingCompanyContext) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <CheetahIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <p>Loading company data...</p>
        </div>
      </div>
    );
  }

  if (!selectedCompanyId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <CheetahIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <p>Redirecting to company selection...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { selectedCompanyName } = useCompany();

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <Sidebar
          className="border-r dark:border-sidebar-border"
          collapsible="icon"
        >
          <SidebarHeader>
            <div className="flex items-center justify-between w-full">
              <Link
                href="/app/dashboard"
                className="-ml-1 flex items-center gap-2 text-lg font-semibold text-sidebar-foreground"
              >
                <CheetahIcon className="h-6 w-6 text-sidebar-foreground" />
                <span className="group-data-[collapsible=icon]:hidden">Cheetah Payroll</span>
              </Link>
              <SidebarTrigger className="-mr-1" />
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarNavigation />
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 overflow-auto">
          <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <h1 className="text-lg font-semibold text-foreground hidden md:block">
                  {selectedCompanyName || "No Company Selected"}
                </h1>
              </div>
              <div className="flex items-center space-x-4 ml-auto">
                <UserNav />
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <CompanyProvider>
        <CompanyGuard>
          <AppShellContent>{children}</AppShellContent>
        </CompanyGuard>
      </CompanyProvider>
    </AuthGuard>
  );
}
