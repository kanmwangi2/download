/**
 * PayrollValidation
 * Business validation rules for payroll operations
 */
import type { PayrollStatus, PayrollRunSummary } from '../oop';

export class PayrollValidation {
  /**
   * Validate if a new payroll run can be created for the given period
   */
  static canCreatePayrollRun(
    existingRuns: PayrollRunSummary[],
    month: string,
    year: number,
    companyId: string
  ): { canCreate: boolean; reason?: string } {
    // Check if a run already exists for this period
    const existingRun = existingRuns.find(
      run => run.month === month && 
             run.year === year && 
             run.companyId === companyId
    );

    if (existingRun) {
      return {
        canCreate: false,
        reason: `A payroll run already exists for ${month} ${year} with status: ${existingRun.status}`
      };
    }

    // Check if there are any non-approved runs that should be completed first
    const nonApprovedRuns = existingRuns.filter(
      run => run.companyId === companyId && 
             run.status !== 'Approved'
    );

    if (nonApprovedRuns.length > 0) {
      const oldestNonApproved = nonApprovedRuns.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        // Simple month comparison - could be enhanced with proper month ordering
        return a.month.localeCompare(b.month);
      })[0];

      if (oldestNonApproved) {
        return {
          canCreate: false,
          reason: `Please complete the ${oldestNonApproved.month} ${oldestNonApproved.year} payroll run (Status: ${oldestNonApproved.status}) before creating a new one.`
        };
      }
    }

    return { canCreate: true };
  }

  /**
   * Validate if a payroll run can be deleted
   */
  static canDeletePayrollRun(run: PayrollRunSummary): { canDelete: boolean; reason?: string } {
    if (run.status === 'Approved') {
      return {
        canDelete: false,
        reason: 'Approved payroll runs cannot be deleted. Contact your administrator if this needs to be reversed.'
      };
    }

    return { canDelete: true };
  }

  /**
   * Validate if multiple payroll runs can be bulk deleted
   */
  static canBulkDeletePayrollRuns(runs: PayrollRunSummary[]): { 
    canDelete: boolean; 
    reason?: string;
    deletableCount: number;
    undeletableCount: number;
  } {
    const deletableRuns = runs.filter(run => run.status !== 'Approved');
    const undeletableRuns = runs.filter(run => run.status === 'Approved');

    if (undeletableRuns.length > 0) {
      return {
        canDelete: deletableRuns.length > 0,
        reason: `${undeletableRuns.length} approved run(s) cannot be deleted. Only ${deletableRuns.length} run(s) will be deleted.`,
        deletableCount: deletableRuns.length,
        undeletableCount: undeletableRuns.length
      };
    }

    return {
      canDelete: true,
      deletableCount: deletableRuns.length,
      undeletableCount: 0
    };
  }

  /**
   * Validate payroll run status transition
   */
  static canChangeStatus(
    currentStatus: PayrollStatus,
    newStatus: PayrollStatus,
    userRole: string
  ): { canChange: boolean; reason?: string } {
    // Define allowed status transitions
    const allowedTransitions: Record<PayrollStatus, PayrollStatus[]> = {
      'Draft': ['To Approve'],
      'To Approve': ['Approved', 'Rejected'],
      'Rejected': ['Draft', 'To Approve'],
      'Approved': [] // Approved runs cannot be changed
    };

    const allowedNextStatuses = allowedTransitions[currentStatus] || [];
    
    if (!allowedNextStatuses.includes(newStatus)) {
      return {
        canChange: false,
        reason: `Cannot change status from ${currentStatus} to ${newStatus}`
      };
    }

    // Check user role permissions
    if (newStatus === 'Approved' && !['Primary Admin', 'Admin', 'HR'].includes(userRole)) {
      return {
        canChange: false,
        reason: 'Only Admin or HR users can approve payroll runs'
      };
    }

    return { canChange: true };
  }

  /**
   * Validate payroll run data integrity
   */
  static validatePayrollRunData(run: Partial<PayrollRunSummary>): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];

    // Required fields
    if (!run.month) errors.push('Month is required');
    if (!run.year) errors.push('Year is required');
    if (!run.companyId) errors.push('Company ID is required');

    // Data type validations
    if (run.year && (run.year < 2000 || run.year > 2100)) {
      errors.push('Year must be between 2000 and 2100');
    }

    if (run.employees !== undefined && run.employees < 0) {
      errors.push('Employee count cannot be negative');
    }

    if (run.grossSalary !== undefined && run.grossSalary < 0) {
      errors.push('Gross salary cannot be negative');
    }

    if (run.deductions !== undefined && run.deductions < 0) {
      errors.push('Deductions cannot be negative');
    }

    if (run.netPay !== undefined && run.netPay < 0) {
      errors.push('Net pay cannot be negative');
    }

    // Business rule validations
    if (run.grossSalary !== undefined && run.deductions !== undefined) {
      const expectedNetPay = run.grossSalary - run.deductions;
      if (run.netPay !== undefined && Math.abs(run.netPay - expectedNetPay) > 0.01) {
        errors.push('Net pay should equal gross salary minus deductions');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get validation message for period conflicts
   */
  static getPeriodConflictMessage(
    month: string,
    year: number,
    existingRuns: PayrollRunSummary[]
  ): string | null {
    const conflictingRun = existingRuns.find(
      run => run.month === month && run.year === year
    );

    if (conflictingRun) {
      return `A payroll run for ${month} ${year} already exists with status: ${conflictingRun.status}`;
    }

    return null;
  }
}
