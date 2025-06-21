
export type StaffStatus = "Active" | "Inactive";
export type EmployeeCategory = 'P' | 'C' | 'E' | 'S';

export interface StaffMember {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  staffNumber?: string;
  email: string;
  phone: string;
  staffRssbNumber?: string;
  employeeCategory?: EmployeeCategory;
  gender?: 'Male' | 'Female' | 'Other';
  birthDate?: string;
  department: string;
  designation?: string;
  employmentDate?: string;
  nationality?: string;
  idPassportNumber?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  bankName?: string;
  bankCode?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  keyContactName?: string;
  keyContactRelationship?: "spouse" | "parent" | "sibling" | "child" | "friend" | "other" | string;
  keyContactPhone?: string;
  status: StaffStatus;
  customFields?: Record<string, string>; // Key is CustomFieldDefinition ID, value is the staff's data
}

const UMOJA_COMPANY_ID = "co_001";
const ISOKO_COMPANY_ID = "co_002";

export const initialStaffData: StaffMember[] = [
  // Staff for Umoja Tech Solutions (co_001)
  {
    id: "S001",
    companyId: UMOJA_COMPANY_ID,
    firstName: "Aline",
    lastName: "Uwase",
    staffNumber: "ST001",
    email: "aline.uwase@example.rw",
    phone: "0788123456",
    staffRssbNumber: "RSSB1001",
    employeeCategory: "P",
    gender: "Female",
    birthDate: "1990-03-15",
    department: "Engineering",
    designation: "Software Engineer",
    employmentDate: "2022-01-10",
    nationality: "Rwanda",
    idPassportNumber: "1199080012345011",
    province: "kigali_city",
    district: "Gasabo",
    sector: "Remera",
    cell: "Kivugiza",
    village: "Amahoro",
    bankName: "Bank of Kigali",
    bankCode: "BKIGRWRW",
    bankAccountNumber: "0004001234567",
    bankBranch: "Kigali Main",
    keyContactName: "Jean Bosco Mugisha",
    keyContactRelationship: "spouse",
    keyContactPhone: "0788654321",
    status: "Active",
    customFields: { "cf_tshirt_size_co001": "Medium", "cf_laptop_asset_co001": "LT0056" },
  },
  {
    id: "S002",
    companyId: UMOJA_COMPANY_ID,
    firstName: "Emmanuel",
    lastName: "Nkubito",
    staffNumber: "ST002",
    email: "emmanuel.nkubito@example.rw",
    phone: "0788987654",
    staffRssbNumber: "RSSB1002",
    employeeCategory: "P",
    gender: "Male",
    birthDate: "1985-07-20",
    department: "Marketing",
    designation: "Marketing Manager",
    employmentDate: "2021-05-01",
    nationality: "Rwanda",
    idPassportNumber: "1198570054321022",
    province: "kigali_city",
    district: "Kicukiro",
    sector: "Gikondo",
    cell: "Gikondo I",
    village: "Ubumwe",
    bankName: "Equity Bank Rwanda",
    bankCode: "EQBLRWRW",
    bankAccountNumber: "1002003004005",
    bankBranch: "Kigali Hub",
    keyContactName: "Chantal Uwamahoro",
    keyContactRelationship: "spouse",
    keyContactPhone: "0788112233",
    status: "Active",
    customFields: { "cf_tshirt_size_co001": "Large" },
  },
  {
    id: "S003",
    companyId: UMOJA_COMPANY_ID,
    firstName: "Grace",
    lastName: "Mutoni",
    staffNumber: "ST003",
    email: "grace.mutoni@example.rw",
    phone: "0722345678",
    staffRssbNumber: "RSSB1003",
    employeeCategory: "P",
    gender: "Female",
    birthDate: "1992-11-01",
    department: "Sales",
    designation: "Sales Executive",
    employmentDate: "2023-03-15",
    nationality: "Rwanda",
    idPassportNumber: "1199280067890033",
    province: "kigali_city",
    district: "Nyarugenge",
    sector: "Nyamirambo",
    cell: "Kivugiza",
    village: "Ubwiza",
    bankName: "I&M Bank Rwanda",
    bankCode: "IMRWRWRW",
    bankAccountNumber: "2005006007008",
    bankBranch: "Kigali City Tower",
    keyContactName: "David Cyusa",
    keyContactRelationship: "sibling",
    keyContactPhone: "0733445566",
    status: "Active",
  },
  // Staff for Isoko Trading Co. (co_002)
  {
    id: "S005",
    companyId: ISOKO_COMPANY_ID,
    firstName: "John",
    lastName: "Kato",
    staffNumber: "ISK005",
    email: "john.kato@isoko.rw",
    phone: "0781000005",
    staffRssbNumber: "RSSB2001",
    employeeCategory: "P",
    gender: "Male",
    birthDate: "1987-09-12",
    department: "Sales",
    designation: "Sales Lead",
    employmentDate: "2020-08-15",
    nationality: "Ugandan",
    idPassportNumber: "UG123456789",
    province: "kigali_city",
    district: "Nyarugenge",
    sector: "Kiyovu",
    cell: "Kiyovu Cell",
    village: "Business Hub",
    bankName: "GT Bank",
    bankCode: "GTBIRWRW",
    bankAccountNumber: "2001000005",
    bankBranch: "Kiyovu Branch",
    keyContactName: "Sarah Nakato",
    keyContactRelationship: "spouse",
    keyContactPhone: "0781000006",
    status: "Active",
    customFields: { "cf_transport_route_co002": "Route A - Nyabugogo" }
  },
  {
    id: "S006",
    companyId: ISOKO_COMPANY_ID,
    firstName: "Fatuma",
    lastName: "Abdi",
    staffNumber: "ISK006",
    email: "fatuma.abdi@isoko.rw",
    phone: "0781000007",
    staffRssbNumber: "RSSB2002",
    employeeCategory: "C",
    gender: "Female",
    birthDate: "1993-01-25",
    department: "Logistics",
    designation: "Logistics Officer",
    employmentDate: "2022-03-01",
    nationality: "Kenyan",
    idPassportNumber: "KE987654321",
    province: "kigali_city",
    district: "Gasabo",
    sector: "Kimihurura",
    cell: "Rugando",
    village: "International Qtrs",
    bankName: "KCB Bank",
    bankCode: "KCBLRWRW",
    bankAccountNumber: "3002000006",
    bankBranch: "Kacyiru Branch",
    keyContactName: "Ali Abdi",
    keyContactRelationship: "sibling",
    keyContactPhone: "0781000008",
    status: "Active",
  },
];
