
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
import { LogOut, Briefcase, Settings, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getSupabaseClientAsync } from '@/lib/supabase';
import { objectToCamelCase } from '@/lib/case-conversion';

type UserRole = 'Primary Admin' | 'App Admin' | 'Company Admin' | 'Manager' | 'User';

type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole | string;
  assignedCompanyIds: string[];
};

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
  const [open, setOpen] = React.useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [availableCompanies, setAvailableCompanies] = React.useState<Company[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  React.useEffect(() => {
    const loadInitialData = async () => {
      console.log('🔄 SelectCompany: Starting loadInitialData')
      setIsLoadingData(true);
      
      try {
        const supabase = await getSupabaseClientAsync();
        console.log('🔄 SelectCompany: Got Supabase client')
        
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔄 SelectCompany: Got user data', { userId: user?.id })
        
        if (user) {
          setCurrentUser({
            id: user.id,
            email: user.email || '',
            firstName: user.user_metadata?.first_name || 'User',
            lastName: user.user_metadata?.last_name || '',
            role: user.user_metadata?.role || 'Primary Admin',
            assignedCompanyIds: user.user_metadata?.assignedCompanyIds || []
          });
          
          console.log('🔄 SelectCompany: Fetching companies')
          // Fetch companies from Supabase
          const { data: companies, error } = await supabase.from('companies').select('*');
          console.log('🔄 SelectCompany: Companies fetched', { companiesCount: companies?.length, error })
          
          if (error) {
            console.error('❌ SelectCompany: Error fetching companies:', error)
            setAvailableCompanies([]);
          } else {
            setAvailableCompanies((companies || []).map(objectToCamelCase));
          }
        } else {
          console.log('🔄 SelectCompany: No user found, redirecting to home')
          router.push("/");
          setIsLoadingData(false);
          return;
        }
      } catch (error) {
        console.error('❌ SelectCompany: Error in loadInitialData:', error)
      } finally {
        setIsLoadingData(false);
        console.log('✅ SelectCompany: loadInitialData completed')
      }
    };
    
    loadInitialData();
  }, [router]);

  const handleGoToCompany = () => {
    if (selectedCompanyId) {
      // Store selected company in localStorage for the app to pick up
      localStorage.setItem('selectedCompanyId', selectedCompanyId);
      localStorage.setItem('selectedCompanyName', selectedCompanyName || '');
      router.push("/app/dashboard");
    }
  };

  const handleLogout = async () => {
    const supabase = await getSupabaseClientAsync();
    await supabase.auth.signOut();
    localStorage.removeItem('selectedCompanyId');
    localStorage.removeItem('selectedCompanyName');
    router.push("/");
  };

  const canAccessApplicationSettings = currentUser && (currentUser.role === 'Primary Admin' || currentUser.role === 'App Admin');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheetahIcon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Select Your Company</CardTitle>
          <CardDescription>
            Welcome, {currentUser?.firstName || "User"}! Choose the company profile you want to work with.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingData || !currentUser ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading user and company data...</p>
            </div>
          ) : (
            <>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between text-base h-auto py-3 px-4"
                  >
                    {selectedCompanyName
                      ? availableCompanies.find((company) => company.name === selectedCompanyName)?.name
                      : "Select company..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(var(--radix-popover-trigger-width)_+_0px)] p-0">
                  <Command>
                    <CommandInput placeholder="Search company..." />
                    <CommandList>
                      <CommandEmpty>No company found.</CommandEmpty>
                      <CommandGroup>
                        {availableCompanies.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={(currentValue) => {
                               const companyMatch = availableCompanies.find(c => c.name.toLowerCase() === currentValue.toLowerCase());
                               if(companyMatch) {
                                setSelectedCompanyId(companyMatch.id);
                                setSelectedCompanyName(companyMatch.name);
                               } else {
                                setSelectedCompanyId(null);
                                setSelectedCompanyName(null);
                               }
                              setOpen(false);
                            }}
                            className="text-base py-2 px-3"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCompanyName === company.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />
                            {company.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button
                onClick={handleGoToCompany}
                disabled={!selectedCompanyId}
                className="w-full text-lg py-3"
              >
                Go to Company
              </Button>

              {canAccessApplicationSettings && (
                 <div className="flex justify-center">
                    <Button
                        variant="outline"
                        className="h-auto py-3 px-4 border-dashed border-primary/70 hover:bg-accent/60"
                        asChild
                    >
                        <Link href="/settings/application">
                        <Settings className="mr-3 h-5 w-5 text-primary" />
                        <span className="text-base">Application Settings</span>
                        </Link>
                    </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="mt-6">
          <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
