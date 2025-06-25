/**
 * PayrollPermissions
 * Utility class for handling payroll-related permission checks
 */
import type { UserRole, AuthenticatedUser, PayrollStatus, PayrollRunSummary } from '../oop';

export class PayrollPermissions {
  /**
   * Check if user can create payroll runs
   */
  static canCreatePayrollRun(user: AuthenticatedUser | null): { 
    allowed: boolean; 
    reason?: string; 
  } {
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    const allowedRoles: UserRole[] = ['Primary Admin', 'App Admin', 'Company Admin', 'Payroll Preparer'];
    
    if (allowedRoles.includes(user.role)) {
      return { allowed: true };
    }

    return { 
      allowed: false, 
      reason: 'You do not have permission to create payroll runs.' 
    };
  }

  /**
   * Check if user can delete a specific payroll run
   */
  static canDeletePayrollRun(
    user: AuthenticatedUser | null, 
    runStatus: PayrollStatus
  ): { 
    allowed: boolean; 
    title: string; 
  } {
    if (!user) {
      return { allowed: false, title: 'Login required' };
    }

    const { role } = user;

    if (role === 'Primary Admin' || role === 'App Admin') {
      return { allowed: true, title: 'Delete Run (Admin)' };
    }
    
    if (role === 'Company Admin' || role === 'Payroll Preparer') {
      if (runStatus === 'Draft' || runStatus === 'Rejected') {
        return { allowed: true, title: 'Delete Draft/Rejected Run' };
      }
      return { allowed: false, title: 'Cannot delete runs not in Draft or Rejected state' };
    }
    
    if (role === 'Payroll Approver') {
      return { allowed: false, title: 'Payroll Approvers cannot delete runs' };
    }
    
    return { allowed: false, title: 'Permission Denied' };
  }

  /**
   * Check if user can access payroll data for a company
   */
  static canAccessCompanyPayroll(
    user: AuthenticatedUser | null, 
    companyId: string
  ): boolean {
    if (!user || !companyId) {
      return false;
    }

    if (user.role === 'Primary Admin' || user.role === 'App Admin') {
      return true; // Admins can access all companies
    }
    
    return user.assignedCompanyIds.includes(companyId);
  }

  /**
   * Get tooltip content for disabled create payroll button
   */
  static getCreatePayrollTooltip(
    user: AuthenticatedUser | null,
    selectedCompanyId: string | null,
    existingNonApprovedRun: PayrollRunSummary | null
  ): string {
    if (!selectedCompanyId) {
      return 'No company selected.';
    }
    
    const canCreate = this.canCreatePayrollRun(user);
    if (!canCreate.allowed) {
      return canCreate.reason || 'Permission denied';
    }
    
    if (existingNonApprovedRun) {
      return `A run for ${existingNonApprovedRun.month} ${existingNonApprovedRun.year} (Status: ${existingNonApprovedRun.status}) is in progress.`;
    }
    
    return 'Run a new payroll for the selected company.';
  }

  /**
   * Check if create payroll button should be disabled
   */
  static isCreatePayrollDisabled(
    user: AuthenticatedUser | null,
    selectedCompanyId: string | null,
    existingNonApprovedRun: PayrollRunSummary | null
  ): boolean {
    if (!selectedCompanyId) {
      return true;
    }
    
    const canCreate = this.canCreatePayrollRun(user);
    if (!canCreate.allowed) {
      return true;
    }
    
    return !!existingNonApprovedRun;
  }
}
