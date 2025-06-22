// This file centralizes initial user and company data for seeding and type definitions.

export type UserRole = "Primary Admin" | "App Admin" | "Company Admin" | "Payroll Approver" | "Payroll Preparer";

// Company type used by User data, matches the structure in company-management-tab.tsx for seeding
export interface Company {
  id: string;
  name: string;
  tin_number?: string;
  address?: string;
  email?: string;
  phone?: string;
  primary_business?: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  assigned_company_ids: string[];
  password?: string; // Stored plain text for simulation
  phone?: string;
}

// This will be dynamically populated by initialCompaniesDataForSeed from company-management-tab.tsx
// during IndexedDB seeding.
export const all_company_ids_for_user_seed: string[] = ["co_001", "co_002"];


export const initialUsers: User[] = [
  {
    id: "usr_pa001",
    first_name: "Jean Pierre",
    last_name: "Mugabe",
    email: "jp.mugabe.admin@example.rw",
    role: "Primary Admin",
    assigned_company_ids: all_company_ids_for_user_seed,
    password: "password123",
    phone: "0788123456",
  },
  {
    id: "usr_aa001",
    first_name: "Marie Claire",
    last_name: "Uwineza",
    email: "mc.uwineza.admin@example.rw",
    role: "App Admin",
    assigned_company_ids: all_company_ids_for_user_seed,
    password: "password123",
    phone: "0788000111",
  },
  {
    id: "usr_ca001", // Kevin Gatete
    first_name: "Kevin",
    last_name: "Gatete",
    email: "kevin.gatete@example.rw",
    role: "Company Admin",
    assigned_company_ids: ["co_001", "co_002"],
    password: "password123",
    phone: "0788111222",
  },
   {
    id: "usr_pp001", // Diane Keza - Payroll Preparer for Umoja (co_001)
    first_name: "Diane",
    last_name: "Keza",
    email: "diane.keza@example.rw",
    role: "Payroll Preparer",
    assigned_company_ids: ["co_001"],
    password: "password123",
    phone: "0788333444",
  },
  {
    id: "usr_pa002", // Eric Shema - Payroll Approver for Umoja (co_001)
    first_name: "Eric",
    last_name: "Shema",
    email: "eric.shema@example.rw",
    role: "Payroll Approver",
    assigned_company_ids: ["co_001"],
    password: "password123",
    phone: "0788555666",
  },
  { // New Payroll Preparer for Isoko (co_002)
    id: "usr_pp002",
    first_name: "Aisha",
    last_name: "Nizam",
    email: "aisha.nizam@example.rw",
    role: "Payroll Preparer",
    assigned_company_ids: ["co_002"],
    password: "password123",
    phone: "0788777888",
  },
  { // New Payroll Approver for Isoko (co_002)
    id: "usr_pa003",
    first_name: "Samuel",
    last_name: "Kaneza",
    email: "samuel.kaneza@example.rw",
    role: "Payroll Approver",
    assigned_company_ids: ["co_002"],
    password: "password123",
    phone: "0788999000",
  }
];

export const defaultNewUserFormData: Omit<User, 'id' | 'password'> & { password?: string } = {
  first_name: "",
  last_name: "",
  email: "",
  role: "Payroll Preparer",
  assigned_company_ids: [],
  password: "",
  phone: "",
};

// Utility: Convert camelCase user to snake_case for backend
export function userToBackend(user: any): any {
  return {
    ...user,
    first_name: user.firstName,
    last_name: user.lastName,
    assigned_company_ids: user.assignedCompanyIds,
    // ...other mappings as needed
  };
}

// Utility: Convert backend user to camelCase for frontend
export function userFromBackend(user: any): any {
  return {
    ...user,
    firstName: user.first_name,
    lastName: user.last_name,
    assignedCompanyIds: user.assigned_company_ids,
    // ...other mappings as needed
  };
}
