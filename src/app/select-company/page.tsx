"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheetahIcon } from "@/components/icons/cheetah-icon";
import { LogOut, Briefcase, Settings, Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getSupabaseClientAsync } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Company = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tinNumber?: string;
  primaryBusiness?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function SelectCompanyPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout, canAccessCompany } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = React.useState<string | null>(null);
  const [availableCompanies, setAvailableCompanies] = React.useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Redirect to signin if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      console.log('🚫 SelectCompany: No authenticated user, redirecting to signin');
      router.replace('/signin');
    }
  }, [user, authLoading, router]);

  // Load available companies
  React.useEffect(() => {
    const loadCompanies = async () => {
      if (!user || authLoading) {
        setIsLoadingCompanies(false);
        return;
      }

      try {
        setIsLoadingCompanies(true);
        const supabase = await getSupabaseClientAsync();

        // Get companies the user can access
        let companies: Company[] = [];
        
        if (user.role === 'Primary Admin' || user.role === 'App Admin') {
          // Admins can see all companies
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name');
          
          if (error) throw error;
          companies = data || [];
        } else {
          // Regular users can only see assigned companies
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .in('id', user.assignedCompanyIds)
            .order('name');
          
          if (error) throw error;
          companies = data || [];
        }

        setAvailableCompanies(companies);
      } catch (error) {
        console.error('❌ SelectCompany: Error loading companies:', error);
        setAvailableCompanies([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, [user, authLoading]);

  const handleCompanySelect = async (company: Company) => {
    if (!canAccessCompany(company.id)) {
      console.warn('❌ SelectCompany: User cannot access company:', company.id);
      return;
    }

    try {
      setSelectedCompanyId(company.id);
      setSelectedCompanyName(company.name);

      // Update user metadata with selected company
      const supabase = await getSupabaseClientAsync();
      const { error } = await supabase.auth.updateUser({
        data: {
          selectedCompanyId: company.id,
          selectedCompanyName: company.name,
        }
      });

      if (error) throw error;

      console.log('✅ SelectCompany: Company selected, redirecting to dashboard');
      router.replace('/app/dashboard');
    } catch (error) {
      console.error('❌ SelectCompany: Error selecting company:', error);
      setSelectedCompanyId(null);
      setSelectedCompanyName(null);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.replace('/signin');
    } catch (error) {
      console.error('❌ SelectCompany: Error during logout:', error);
      setIsLoggingOut(false);
    }
  };

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <CheetahIcon className="h-16 w-16 text-primary mx-auto mb-4" />
              <p>Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render if user is not authenticated (redirect is handled by useEffect)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <CheetahIcon className="h-16 w-16 text-primary mx-auto mb-4" />
              <p>Redirecting to login...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            <CheetahIcon className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Select Company</CardTitle>
          <CardDescription>
            Choose a company to access Cheetah Payroll
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Available Companies</label>
            
            {isLoadingCompanies ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading companies...</span>
              </div>
            ) : availableCompanies.length === 0 ? (
              <div className="text-center p-4">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No companies available</p>
                <p className="text-sm text-muted-foreground">
                  Contact your administrator to get access to a company.
                </p>
              </div>
            ) : (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedCompanyId
                      ? availableCompanies.find((company) => company.id === selectedCompanyId)?.name
                      : "Select company..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search companies..." />
                    <CommandList>
                      <CommandEmpty>No companies found.</CommandEmpty>
                      <CommandGroup>
                        {availableCompanies.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => {
                              setSelectedCompanyId(company.id);
                              setSelectedCompanyName(company.name);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCompanyId === company.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{company.name}</span>
                              {company.primaryBusiness && (
                                <span className="text-xs text-muted-foreground">
                                  {company.primaryBusiness}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            onClick={() => selectedCompanyId && handleCompanySelect(availableCompanies.find(c => c.id === selectedCompanyId)!)}
            className="w-full"
            disabled={!selectedCompanyId || isLoadingCompanies}
          >
            {selectedCompanyId ? "Access Company" : "Select a Company"}
          </Button>
          
          <div className="flex w-full gap-2">
            {(user.role === 'Primary Admin' || user.role === 'App Admin') && (
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/manual-setup">
                  <Plus className="w-4 h-4 mr-2" />
                  New Company
                </Link>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
          
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
