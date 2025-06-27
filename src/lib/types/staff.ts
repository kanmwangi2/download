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

/**
 * Employee categories
 */
export type EmployeeCategory = 'P' | 'C' | 'E' | 'S';

/**
 * Staff payment configuration
 */
export interface StaffPaymentConfig {
  id: string;
  staffId: string;
  paymentTypeId: string;
  amount: number;
  isActive: boolean;
  effectiveDate: string;
  notes?: string;
}

/**
 * Staff payment details (detailed record for payroll runs)
 */
export interface StaffPaymentRecord {
  id: string;
  staffId: string;
  payrollRunId: string;
  paymentTypeId: string;
  amount: number;
  calculatedAmount: number;
  isOverride: boolean;
  notes?: string;
}

/**
 * Staff payment type (for general use)
 */
export interface StaffPayment {
  id: string;
  staffId: string;
  paymentTypeId: string;
  amount: number;
  effectiveDate: string;
  isActive: boolean;
}
