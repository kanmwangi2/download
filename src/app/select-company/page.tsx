
import { CompanySelector } from "@/components/company/company-selector";
import { SimpleCompanyProvider } from "@/context/SimpleCompanyContext";

export default function SelectCompanyPage() {
  return (
    <SimpleCompanyProvider>
      <CompanySelector />
    </SimpleCompanyProvider>
  );
}
