
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
import type { UserRole } from '@/lib/userData';
import { useCompany } from "@/context/CompanyContext";
import { getAllFromGlobalStore, STORE_NAMES } from '@/lib/indexedDbUtils';
import type { Company as AppCompany } from '@/lib/userData';

const CURRENT_USER_LOCALSTORAGE_KEY = "cheetahPayrollCurrentUser";

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  assignedCompanyIds: string[];
}

export function CompanySelector() {
  const router = useRouter();
  const {
    selectedCompanyId: contextCompanyId,
    setSelectedCompanyId: setContextCompanyId,
    selectedCompanyName: contextCompanyName,
    setSelectedCompanyName: setContextCompanyName
  } = useCompany();

  const [open, setOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [availableCompanies, setAvailableCompanies] = React.useState<AppCompany[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true); // State for loading

  React.useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingData(true); // Start loading
      if (typeof window !== 'undefined') {
        const storedUserJson = localStorage.getItem(CURRENT_USER_LOCALSTORAGE_KEY);
        if (storedUserJson) {
          try {
            setCurrentUser(JSON.parse(storedUserJson) as CurrentUser);
          } catch (error) {
            console.error("Error parsing current user from localStorage:", error);
            localStorage.removeItem(CURRENT_USER_LOCALSTORAGE_KEY);
            router.push("/");
            setIsLoadingData(false); // Stop loading on error/redirect
            return;
          }
        } else {
          router.push("/");
          setIsLoadingData(false); // Stop loading on redirect
          return;
        }

        try {
            const companiesFromDB = await getAllFromGlobalStore<AppCompany>(STORE_NAMES.COMPANIES);
            setAvailableCompanies(companiesFromDB || []);
        } catch (error) {
            console.error("Error fetching companies:", error);
            setAvailableCompanies([]);
        }
      }
      setIsLoadingData(false); // Done loading
    };
    loadInitialData();
  }, [router]);

  const handleGoToCompany = () => {
    if (contextCompanyId) {
      router.push("/app/dashboard");
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_LOCALSTORAGE_KEY);
      setContextCompanyId(null);
      setContextCompanyName(null);
      router.push("/");
    }
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
                    {contextCompanyName
                      ? availableCompanies.find((company) => company.name === contextCompanyName)?.name
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
                                setContextCompanyId(companyMatch.id);
                                setContextCompanyName(companyMatch.name);
                               } else {
                                setContextCompanyId(null);
                                setContextCompanyName(null);
                               }
                              setOpen(false);
                            }}
                            className="text-base py-2 px-3"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                contextCompanyName === company.name ? "opacity-100" : "opacity-0"
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
                disabled={!contextCompanyId}
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
