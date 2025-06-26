export type StaffStatus = "Active" | "Inactive";

export interface StaffMember {
  id: string;
  companyId: string;
  staffNumber?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  staffRssbNumber?: string;
  employeeCategory?: 'P' | 'C' | 'E' | 'S';
  gender?: 'Male' | 'Female' | 'Other';
  birthDate?: string;
  department?: string;
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
  keyContactRelationship?: string;
  keyContactPhone?: string;
  status: StaffStatus;
  customFields?: Record<string, any>;
}
