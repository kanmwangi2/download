export type StaffStatus = "Active" | "Inactive";
export type EmployeeCategory = 'P' | 'C' | 'E' | 'S';

export interface StaffMember {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  staff_number?: string;
  email: string;
  phone: string;
  staff_rssb_number?: string;
  employee_category?: EmployeeCategory;
  gender?: 'Male' | 'Female' | 'Other';
  birth_date?: string;
  department: string;
  designation?: string;
  employment_date?: string;
  nationality?: string;
  id_passport_number?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  bank_name?: string;
  bank_code?: string;
  bank_account_number?: string;
  bank_branch?: string;
  key_contact_name?: string;
  key_contact_relationship?: "spouse" | "parent" | "sibling" | "child" | "friend" | "other" | string;
  key_contact_phone?: string;
  status: StaffStatus;
  custom_fields?: Record<string, string>; // Key is CustomFieldDefinition ID, value is the staff's data
}

const UMOJA_COMPANY_ID = "co_001";
const ISOKO_COMPANY_ID = "co_002";

export const initialStaffData: StaffMember[] = [
  // Staff for Umoja Tech Solutions (co_001)
  {
    id: "S001",
    company_id: UMOJA_COMPANY_ID,
    first_name: "Aline",
    last_name: "Uwase",
    staff_number: "ST001",
    email: "aline.uwase@example.rw",
    phone: "0788123456",
    staff_rssb_number: "RSSB1001",
    employee_category: "P",
    gender: "Female",
    birth_date: "1990-03-15",
    department: "Engineering",
    designation: "Software Engineer",
    employment_date: "2022-01-10",
    nationality: "Rwanda",
    id_passport_number: "1199080012345011",
    province: "kigali_city",
    district: "Gasabo",
    sector: "Remera",
    cell: "Kivugiza",
    village: "Amahoro",
    bank_name: "Bank of Kigali",
    bank_code: "BKIGRWRW",
    bank_account_number: "0004001234567",
    bank_branch: "Kigali Main",
    key_contact_name: "Jean Bosco Mugisha",
    key_contact_relationship: "spouse",
    key_contact_phone: "0788654321",
    status: "Active",
    custom_fields: { "cf_tshirt_size_co001": "Medium", "cf_laptop_asset_co001": "LT0056" },
  },
  {
    id: "S002",
    company_id: UMOJA_COMPANY_ID,
    first_name: "Emmanuel",
    last_name: "Nkubito",
    staff_number: "ST002",
    email: "emmanuel.nkubito@example.rw",
    phone: "0788987654",
    staff_rssb_number: "RSSB1002",
    employee_category: "P",
    gender: "Male",
    birth_date: "1985-07-20",
    department: "Marketing",
    designation: "Marketing Manager",
    employment_date: "2021-05-01",
    nationality: "Rwanda",
    id_passport_number: "1198570054321022",
    province: "kigali_city",
    district: "Kicukiro",
    sector: "Gikondo",
    cell: "Gikondo I",
    village: "Ubumwe",
    bank_name: "Equity Bank Rwanda",
    bank_code: "EQBLRWRW",
    bank_account_number: "1002003004005",
    bank_branch: "Kigali Hub",
    key_contact_name: "Chantal Uwamahoro",
    key_contact_relationship: "spouse",
    key_contact_phone: "0788112233",
    status: "Active",
    custom_fields: { "cf_tshirt_size_co001": "Large" },
  },
  {
    id: "S003",
    company_id: UMOJA_COMPANY_ID,
    first_name: "Grace",
    last_name: "Mutoni",
    staff_number: "ST003",
    email: "grace.mutoni@example.rw",
    phone: "0722345678",
    staff_rssb_number: "RSSB1003",
    employee_category: "P",
    gender: "Female",
    birth_date: "1992-11-01",
    department: "Sales",
    designation: "Sales Executive",
    employment_date: "2023-03-15",
    nationality: "Rwanda",
    id_passport_number: "1199280067890033",
    province: "kigali_city",
    district: "Nyarugenge",
    sector: "Nyamirambo",
    cell: "Kivugiza",
    village: "Ubwiza",
    bank_name: "I&M Bank Rwanda",
    bank_code: "IMRWRWRW",
    bank_account_number: "2005006007008",
    bank_branch: "Kigali City Tower",
    key_contact_name: "David Cyusa",
    key_contact_relationship: "sibling",
    key_contact_phone: "0733445566",
    status: "Active",
  },
  // Staff for Isoko Trading Co. (co_002)
  {
    id: "S005",
    company_id: ISOKO_COMPANY_ID,
    first_name: "John",
    last_name: "Kato",
    staff_number: "ISK005",
    email: "john.kato@isoko.rw",
    phone: "0781000005",
    staff_rssb_number: "RSSB2001",
    employee_category: "P",
    gender: "Male",
    birth_date: "1987-09-12",
    department: "Sales",
    designation: "Sales Lead",
    employment_date: "2020-08-15",
    nationality: "Ugandan",
    id_passport_number: "UG123456789",
    province: "kigali_city",
    district: "Nyarugenge",
    sector: "Kiyovu",
    cell: "Kiyovu Cell",
    village: "Business Hub",
    bank_name: "GT Bank",
    bank_code: "GTBIRWRW",
    bank_account_number: "2001000005",
    bank_branch: "Kiyovu Branch",
    key_contact_name: "Sarah Nakato",
    key_contact_relationship: "spouse",
    key_contact_phone: "0781000006",
    status: "Active",
    custom_fields: { "cf_transport_route_co002": "Route A - Nyabugogo" }
  },
  {
    id: "S006",
    company_id: ISOKO_COMPANY_ID,
    first_name: "Fatuma",
    last_name: "Abdi",
    staff_number: "ISK006",
    email: "fatuma.abdi@isoko.rw",
    phone: "0781000007",
    staff_rssb_number: "RSSB2002",
    employee_category: "C",
    gender: "Female",
    birth_date: "1993-01-25",
    department: "Logistics",
    designation: "Logistics Officer",
    employment_date: "2022-03-01",
    nationality: "Kenyan",
    id_passport_number: "KE987654321",
    province: "kigali_city",
    district: "Gasabo",
    sector: "Kimihurura",
    cell: "Rugando",
    village: "International Qtrs",
    bank_name: "KCB Bank",
    bank_code: "KCBLRWRW",
    bank_account_number: "3002000006",
    bank_branch: "Kacyiru Branch",
    key_contact_name: "Ali Abdi",
    key_contact_relationship: "sibling",
    key_contact_phone: "0781000008",
    status: "Active",
  },
];

// Import centralized case conversion utilities
export { staffToBackend, staffFromBackend } from './case-conversion';

// Fix: Map backend staff fields to camelCase for frontend display
// Helper function to convert StaffMember backend fields to camelCase for UI

