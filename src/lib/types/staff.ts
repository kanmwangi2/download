export type StaffStatus = "active" | "inactive" | "on_leave";

export interface StaffMember {
  id: string;
  companyId: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  staffNumber?: string;
  email: string;
  phone?: string;
  rssbNumber?: string;
  employeeCategory?: string;
  gender?: 'Male' | 'Female' | 'Other';
  birthDate?: string;
  department?: string;
  position?: string;
  employmentDate?: string;
  terminationDate?: string | null;
  nationality?: string;
  nationalIdNumber?: string;
  passportNumber?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  bankName?: string;
  bankAccountNumber?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  status: StaffStatus;
  customFields?: Record<string, any>;
}
