
// This file centralizes initial user and company data for seeding and type definitions.

export type UserRole = "Primary Admin" | "App Admin" | "Company Admin" | "Payroll Approver" | "Payroll Preparer";

// Company type used by User data, matches the structure in company-management-tab.tsx for seeding
export interface Company {
  id: string;
  name: string;
  tinNumber?: string;
  address?: string;
  email?: string;
  phone?: string;
  primaryBusiness?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  assignedCompanyIds: string[];
  password?: string; // Stored plain text for simulation
  phone?: string;
}

// This will be dynamically populated by initialCompaniesDataForSeed from company-management-tab.tsx
// during IndexedDB seeding.
export const allCompanyIdsForUserSeed: string[] = ["co_001", "co_002"];


export const initialUsers: User[] = [
  {
    id: "usr_pa001",
    firstName: "Jean Pierre",
    lastName: "Mugabe",
    email: "jp.mugabe.admin@example.rw",
    role: "Primary Admin",
    assignedCompanyIds: allCompanyIdsForUserSeed,
    password: "password123",
    phone: "0788123456",
  },
  {
    id: "usr_aa001",
    firstName: "Marie Claire",
    lastName: "Uwineza",
    email: "mc.uwineza.admin@example.rw",
    role: "App Admin",
    assignedCompanyIds: allCompanyIdsForUserSeed,
    password: "password123",
    phone: "0788000111",
  },
  {
    id: "usr_ca001", // Kevin Gatete
    firstName: "Kevin",
    lastName: "Gatete",
    email: "kevin.gatete@example.rw",
    role: "Company Admin",
    assignedCompanyIds: ["co_001", "co_002"],
    password: "password123",
    phone: "0788111222",
  },
   {
    id: "usr_pp001", // Diane Keza - Payroll Preparer for Umoja (co_001)
    firstName: "Diane",
    lastName: "Keza",
    email: "diane.keza@example.rw",
    role: "Payroll Preparer",
    assignedCompanyIds: ["co_001"],
    password: "password123",
    phone: "0788333444",
  },
  {
    id: "usr_pa002", // Eric Shema - Payroll Approver for Umoja (co_001)
    firstName: "Eric",
    lastName: "Shema",
    email: "eric.shema@example.rw",
    role: "Payroll Approver",
    assignedCompanyIds: ["co_001"],
    password: "password123",
    phone: "0788555666",
  },
  { // New Payroll Preparer for Isoko (co_002)
    id: "usr_pp002",
    firstName: "Aisha",
    lastName: "Nizam",
    email: "aisha.nizam@example.rw",
    role: "Payroll Preparer",
    assignedCompanyIds: ["co_002"],
    password: "password123",
    phone: "0788777888",
  },
  { // New Payroll Approver for Isoko (co_002)
    id: "usr_pa003",
    firstName: "Samuel",
    lastName: "Kaneza",
    email: "samuel.kaneza@example.rw",
    role: "Payroll Approver",
    assignedCompanyIds: ["co_002"],
    password: "password123",
    phone: "0788999000",
  }
];

export const defaultNewUserFormData: Omit<User, 'id' | 'password'> & { password?: string } = {
  firstName: "",
  lastName: "",
  email: "",
  role: "Payroll Preparer",
  assignedCompanyIds: [],
  password: "",
  phone: "",
};
