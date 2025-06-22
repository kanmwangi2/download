"use client";

import Link from "next/link";
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, Repeat, UserCircle } from "lucide-react"; 
import { ThemeToggle } from "./theme-toggle";
import { getSupabaseClient } from '@/lib/supabase';
import type { UserRole } from '@/lib/userData';
import { useCompany } from "@/context/CompanyContext"; // Added useCompany


const defaultAvatarSrc = "https://placehold.co/100x100.png"; 

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole; 
  assignedCompanyIds: string[];
}

export function UserNav() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string>(defaultAvatarSrc);
  const { selectedCompanyId, isLoadingCompanyContext } = useCompany();

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          firstName: user.user_metadata?.first_name || 'User',
          lastName: user.user_metadata?.last_name || '',
          role: user.user_metadata?.role || 'Primary Admin',
          assignedCompanyIds: user.user_metadata?.assignedCompanyIds || []
        });
        // Optionally fetch avatar from a Supabase storage bucket or user profile table
        setAvatarSrc(defaultAvatarSrc); // Replace with Supabase avatar if available
      } else {
        setCurrentUser(null);
        setAvatarSrc(defaultAvatarSrc);
      }
    };
    loadUserData();
  }, []);


  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      setCurrentUser(null); 
      setAvatarSrc(defaultAvatarSrc);
      window.location.href = "/"; 
    }
  };
  
  const userDisplay = currentUser || { firstName: "Guest", lastName: "", email: "", role: "Guest" as UserRole, assignedCompanyIds: [] };
  const userInitials = `${userDisplay.firstName?.[0] || ''}${userDisplay.lastName?.[0] || ''}`.toUpperCase() || 'U';

  const canAccessCompanySettings = useMemo(() => {
    if (isLoadingCompanyContext || !currentUser || !selectedCompanyId) {
      return false; 
    }
    const { role, assignedCompanyIds } = currentUser;
    if (role === "Primary Admin" || role === "App Admin") {
      return true;
    }
    if (role === "Company Admin" && assignedCompanyIds.includes(selectedCompanyId)) {
      return true;
    }
    return false;
  }, [currentUser, selectedCompanyId, isLoadingCompanyContext]);


  return (
    <div className="flex items-center space-x-4">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={avatarSrc} 
                alt={userDisplay.firstName} 
                data-ai-hint="user avatar" 
                key={avatarSrc} 
              />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          {currentUser ? (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{`${currentUser.firstName} ${currentUser.lastName}`}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground/80">
                    Role: {currentUser.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/app/settings/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>User Profile</span>
                  </Link>
                </DropdownMenuItem>
                {canAccessCompanySettings && (
                  <DropdownMenuItem asChild>
                    <Link href="/app/settings/company"> 
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Company Settings</span> 
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/select-company">
                    <Repeat className="mr-2 h-4 w-4" />
                    <span>Switch Company</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </>
          ) : (
             <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Not Logged In</p>
                   <DropdownMenuItem asChild>
                      <Link href="/">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Login</span>
                      </Link>
                    </DropdownMenuItem>
                </div>
              </DropdownMenuLabel>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// All localStorage and indexedDbUtils references have been removed. This component now relies solely on Supabase for user data and session.

