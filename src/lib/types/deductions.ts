/**
 * Represents a deduction for the frontend (camelCase).
 */
export interface StaffDeduction {
  id: string;
  companyId: string;
  staffId: string;
  deductionType: string;
  amount: number;
  isPercentage: boolean;
  isActive: boolean;
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
 * Represents a general deduction (used in payroll calculations)
 */
export interface Deduction {
  id: string;
  companyId: string;
  staffId: string;
  deductionTypeId: string;
  balance: number;
  monthlyDeduction: number;
  startDate: string;
  isActive: boolean;
}

/**
 * Deduction statuses
 */
export type DeductionStatus = 'active' | 'paused' | 'completed';
