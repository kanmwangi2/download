
import { CompanySelector } from "@/components/company/company-selector";
import { CompanyProvider } from "@/context/CompanyContext";

export default function SelectCompanyPage() {
  return (
    <CompanyProvider>
      <CompanySelector />
    </CompanyProvider>
  );
}
