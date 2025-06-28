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
  deductedSoFar?: number; // Amount deducted so far
  originalAmount?: number; // Original deduction amount
  staffName?: string; // Staff member name (for joined queries)
  deductionTypeName?: string; // Deduction type name (for joined queries)
}

/**
 * Deduction statuses
 */
export type DeductionStatus = 'active' | 'paused' | 'completed';

/**
 * Represents a deduction type
 */
export interface DeductionType {
  id: string;
  companyId: string;
  name: string;
  orderNumber: number;
  isFixedName: boolean;
  isDeletable: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a deduction record
 */
export interface DeductionRecord {
  id: string;
  deductionId: string;
  payrollRunId: string;
  amount: number;
  appliedDate: string;
  notes?: string;
}
