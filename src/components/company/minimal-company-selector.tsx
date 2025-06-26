"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheetahIcon } from "@/components/icons/cheetah-icon";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function MinimalCompanySelector() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCreateCompany = () => {
    setIsLoading(true);
    // Mock company creation - just redirect to dashboard for now
    setTimeout(() => {
      router.push("/app/dashboard");
    }, 1000);
  };

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center space-x-2">
          <CheetahIcon className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Cheetah Payroll</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Select Company</CardTitle>
            <CardDescription>
              Choose a company to continue, or create a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground">
              No companies found. Create your first company to get started.
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleCreateCompany}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Creating..." : "Create New Company"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
