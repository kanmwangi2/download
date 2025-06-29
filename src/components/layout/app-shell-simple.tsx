"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
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
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mainNavItems, type NavItem, type _NavGroup, type NavElement } from "@/config/nav";
import { CheetahIcon } from "@/components/icons/cheetah-icon";
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function AppSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <CheetahIcon className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Cheetah Payroll</h2>
            <p className="text-sm text-muted-foreground">Payroll Management</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="flex-1">
          <div className="p-2">
            <SidebarMenu>
              {mainNavItems.map((element: NavElement, index) => {
                if ('isGroup' in element) {
                  // This is a group
                  return (
                    <div key={element.title} className="mb-6">
                      <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {element.title}
                      </h3>
                      <div className="space-y-1">
                        {element.children.map((item: NavItem) => (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              asChild
                              isActive={pathname === item.href}
                            >
                              <Link href={item.href} className="flex items-center gap-2">
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  // This is a single item
                  return (
                    <SidebarMenuItem key={element.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === element.href}
                      >
                        <Link href={element.href} className="flex items-center gap-2">
                          <element.icon className="h-4 w-4" />
                          <span>{element.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
              })}
            </SidebarMenu>
          </div>
        </ScrollArea>
        <div className="border-t border-sidebar-border p-4">
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger />
              <div className="flex-1" />
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
