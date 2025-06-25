
import { Company } from "@/lib/types";

// Utility: Convert camelCase company to snake_case for backend
export function companyToBackend(company: Company | Omit<Company, 'id'>): Record<string, unknown> {
  return {
    ...(('id' in company) && { id: company.id }),
    name: company.name,
    tin_number: company.tinNumber,
    address: company.address,
    email: company.email,
    phone: company.phone,
    primary_business: company.primaryBusiness,
  };
}
// Utility: Convert backend company to camelCase for frontend
export function companyFromBackend(company: Record<string, unknown>): Company {
  return {
    id: company.id as string,
    name: company.name as string,
    tinNumber: company.tin_number as string,
    address: company.address as string,
    email: company.email as string,
    phone: company.phone as string,
    primaryBusiness: company.primary_business as string,
  };
}
