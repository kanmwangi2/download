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
 * Deduction statuses
 */
export type DeductionStatus = 'active' | 'paused' | 'completed';
