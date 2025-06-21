
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagementTab from "@/components/settings/user-management-tab";
import TaxesTab from "@/components/settings/taxes-tab";
import CompanyManagementTab from "@/components/settings/company-management-tab";
import { Users, FileText, Building, Settings2 } from "lucide-react";

export default function ApplicationSettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Settings2 className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Application Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage company records, users, and global tax configurations.
        </p>
      </div>

      <Tabs defaultValue="companyManagement" className="space-y-4">
        <div className="flex justify-center">
          <TabsList className="grid grid-cols-1 sm:grid-cols-3 h-auto md:h-10">
            <TabsTrigger value="companyManagement" className="py-2 md:py-1.5">
              <Building className="mr-2 h-4 w-4" />
              Company Management
            </TabsTrigger>
            <TabsTrigger value="userManagement" className="py-2 md:py-1.5">
              <Users className="mr-2 h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="taxes" className="py-2 md:py-1.5">
              <FileText className="mr-2 h-4 w-4" />
              Global Taxes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="companyManagement">
          <CompanyManagementTab />
        </TabsContent>
        <TabsContent value="userManagement">
          <UserManagementTab />
        </TabsContent>
        <TabsContent value="taxes">
          <TaxesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
