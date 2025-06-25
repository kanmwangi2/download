/**
 * PayrollUtils
 * Utility functions for payroll operations
 */
import type { PayrollStatus } from '../oop';

export class PayrollUtils {
  /**
   * Format number for display in tables
   */
  static formatNumberForTable(amount?: number): string {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "0";
    }
    return Math.round(amount).toLocaleString('en-US');
  }

  /**
   * Convert month name to number string (e.g., "January" -> "01")
   */
  static monthNameToNumberString(monthName: string): string {
    const date = new Date(Date.parse(monthName + " 1, 2000"));
    const monthNumber = date.getMonth() + 1;
    return monthNumber < 10 ? `0${monthNumber}` : `${monthNumber}`;
  }

  /**
   * Convert month number to month name (e.g., 1 -> "January")
   */
  static monthNumberToName(monthNumber: number): string {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthNumber - 1] || "Invalid";
  }

  /**
   * Get status configuration for UI display
   */
  static getStatusConfig(status: PayrollStatus): { 
    color: string; 
    icon: string; 
    textColor?: string 
  } {
    const statusConfig: Record<PayrollStatus, { 
      color: string; 
      icon: string; 
      textColor?: string 
    }> = {
      Draft: { color: "bg-gray-500 hover:bg-gray-600", icon: "Hourglass", textColor: "text-white" },
      "To Approve": { color: "bg-blue-500 hover:bg-blue-600", icon: "AlertTriangle", textColor: "text-white" },
      Rejected: { color: "bg-red-500 hover:bg-red-600", icon: "XCircle", textColor: "text-white" },
      Approved: { color: "bg-green-500 hover:bg-green-600", icon: "CheckCircle", textColor: "text-white" },
    };

    return statusConfig[status] ?? statusConfig.Draft;
  }

  /**
   * Check if a payroll run can be deleted
   */
  static canDeleteRun(runStatus: PayrollStatus): { allowed: boolean; title: string } {
    switch (runStatus) {
      case "Draft":
        return { allowed: true, title: "Delete Draft Run" };
      case "To Approve":
        return { allowed: true, title: "Delete Pending Run" };
      case "Rejected":
        return { allowed: true, title: "Delete Rejected Run" };
      case "Approved":
        return { allowed: false, title: "Cannot Delete Approved Run" };
      default:
        return { allowed: false, title: "Cannot Delete Run" };
    }
  }

  /**
   * Validate payroll run creation data
   */
  static validatePayrollRunData(data: {
    month: string;
    year: number;
    companyId: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.month || data.month.trim() === '') {
      errors.push('Month is required');
    }

    if (!data.year || data.year < 2000 || data.year > 2100) {
      errors.push('Year must be between 2000 and 2100');
    }

    if (!data.companyId || data.companyId.trim() === '') {
      errors.push('Company ID is required');
    }

    // Check if month is valid
    const validMonths = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    if (data.month && !validMonths.includes(data.month)) {
      errors.push('Invalid month selected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate search terms for filtering payroll runs
   */
  static generateSearchTerms(run: {
    month: string;
    year: number;
    status: PayrollStatus;
    employees?: number;
  }, searchTerm: string): boolean {
    if (!searchTerm || searchTerm.trim() === '') {
      return true;
    }

    const search = searchTerm.toLowerCase();
    const searchableText = [
      run.month.toLowerCase(),
      run.year.toString(),
      run.status.toLowerCase(),
      run.employees?.toString() || ''
    ].join(' ');

    return searchableText.includes(search);
  }

  /**
   * Get available months for dropdown
   */
  static getAvailableMonths(): Array<{ value: string; label: string }> {
    return [
      { value: "January", label: "January" },
      { value: "February", label: "February" },
      { value: "March", label: "March" },
      { value: "April", label: "April" },
      { value: "May", label: "May" },
      { value: "June", label: "June" },
      { value: "July", label: "July" },
      { value: "August", label: "August" },
      { value: "September", label: "September" },
      { value: "October", label: "October" },
      { value: "November", label: "November" },
      { value: "December", label: "December" }
    ];
  }

  /**
   * Get available years for dropdown (current year ± 5)
   */
  static getAvailableYears(): Array<{ value: number; label: string }> {
    const currentYear = new Date().getFullYear();
    const years: Array<{ value: number; label: string }> = [];
    
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      years.push({ value: year, label: year.toString() });
    }
    
    return years;
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number): string {
    return `RWF ${this.formatNumberForTable(amount)}`;
  }

  /**
   * Calculate net pay from gross salary and deductions
   */
  static calculateNetPay(grossSalary: number, deductions: number): number {
    return Math.max(0, grossSalary - deductions);
  }
}
