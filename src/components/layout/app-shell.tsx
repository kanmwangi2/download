
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Added useRouter
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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  mainNavItems,
  type NavItem,
  type NavGroup,
} from "@/config/nav";
import { CheetahIcon } from "@/components/icons/cheetah-icon";
import { UserNav } from "./user-nav";
import { CompanyProvider, useCompany } from "@/context/CompanyContext"; // Import CompanyProvider and useCompany

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
                      tooltip={open ? undefined : item.title}
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
                    tooltip={open ? undefined : item.title}
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

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { selectedCompanyName, selectedCompanyId, isLoadingCompanyContext } = useCompany();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingCompanyContext && !selectedCompanyId && typeof window !== 'undefined' && window.location.pathname !== '/select-company') {
      console.log("AppShell: No company selected, redirecting to /select-company");
      router.replace("/select-company");
    }
  }, [selectedCompanyId, isLoadingCompanyContext, router]);

  const companyNameToDisplay = isLoadingCompanyContext ? "Loading Company..." : (selectedCompanyName || "No Company Selected");
  
  if (isLoadingCompanyContext && !selectedCompanyId) {
      // Optionally show a loading state or minimal layout if context is loading and no companyId yet
      return <div className="flex h-screen w-screen items-center justify-center"><p>Loading application data...</p></div>;
  }
  
  if (!selectedCompanyId && !isLoadingCompanyContext && typeof window !== 'undefined' && window.location.pathname !== '/select-company') {
    // This case should be handled by the useEffect redirect, but as a fallback:
    return <div className="flex h-screen w-screen items-center justify-center"><p>Redirecting to company selection...</p></div>;
  }

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

        <SidebarInset className="flex flex-col flex-1 overflow-auto"> {/* Added overflow-auto */}
          <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"> {/* Removed sticky */}
            <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <h1 className="text-lg font-semibold text-foreground hidden md:block">
                  {companyNameToDisplay}
                </h1>
              </div>
              <div className="flex items-center space-x-4 ml-auto">
                <UserNav />
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8"> {/* Removed overflow-y-auto */}
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CompanyProvider>
      <AppShellContent>{children}</AppShellContent>
    </CompanyProvider>
  );
}
    
