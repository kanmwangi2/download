/**
 * Represents a type of deduction (e.g., Loan, Advance).
 */
export interface DeductionType {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

/**
 * Represents a deduction for the frontend (camelCase).
 * Includes optional display fields like staffName and deductionTypeName.
 */
export interface StaffDeduction {
  id: string;
  staffId: string;
  deductionTypeId: string;
  description?: string;
  totalAmount: number;
  monthlyDeductionAmount: number;
  startDate: string; // YYYY-MM-DD format
  endDate?: string;
  status: DeductionStatus;
}

/**
 * Represents a payroll deduction record for a specific payroll run item.
 */
export interface PayrollRunDeduction {
  id: string;
  payrollRunItemId: string;
  staffDeductionId: string;
  amount: number;
}

/**
 * Deduction statuses
 */
export type DeductionStatus = 'active' | 'paused' | 'completed';
