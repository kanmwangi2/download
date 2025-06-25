export type PayrollStatus = "Draft" | "To Approve" | "Rejected" | "Approved";

export interface AppliedDeductionDetail {
  deductionId: string;
  deductionTypeId: string;
  amountApplied: number;
}

export interface EmployeePayrollRecord {
  employeeId: string;
  employeeName: string;
  firstName: string;
  lastName: string;
  staffNumber?: string;
  rssbNumber?: string;
  designation?: string;
  dynamicGrossEarnings: Record<string, number>;
  appliedDeductionAmounts: Record<string, number>;
  totalGrossEarnings: number;
  grossSalary: number;
  employerRssb: number;
  employeeRssb: number;
  employerPension: number;
  employeePension: number;
  employerMaternity: number;
  employeeMaternity: number;
  totalPension: number;
  totalMaternity: number;
  paye: number;
  employerRama: number;
  employeeRama: number;
  totalRama: number;
  netPayBeforeCbhi: number;
  cbhiDeduction: number;
  netPayAfterCbhi: number;
  totalDeductionsAppliedThisRun: number;
  finalNetPay: number;
  appliedDeductions: AppliedDeductionDetail[];
  companyId: string;
}

export interface PayrollRunDetail {
  id: string; 
  companyId: string;
  month: string; 
  year: number; 
  status: PayrollStatus; 
  rejectionReason?: string;
  employees: EmployeePayrollRecord[];
  totalEmployees?: number;
  dynamicTotalDeductionAmounts?: Record<string, number>;
  dynamicTotalGrossEarnings?: Record<string, number>;
  totalGrossSalary?: number;
  totalEmployerRssb?: number; 
  totalEmployeeRssb?: number; 
  totalEmployerPension?: number; 
  totalEmployeePension?: number;
  totalEmployerMaternity?: number; 
  totalEmployeeMaternity?: number; 
  totalTotalPension?: number; 
  totalTotalMaternity?: number;
  totalEmployerRama?: number;
  totalEmployeeRama?: number;
  totalTotalRama?: number;
  totalPaye?: number; 
  totalNetPayBeforeCbhi?: number; 
  totalCbhiDeduction?: number; 
  totalNetPayAfterCbhi?: number;
  totalTotalDeductionsAppliedThisRun?: number;
  totalFinalNetPay?: number;
}

export interface PayrollRunSummary {
  id: string;
  companyId: string;
  month: string;
  year: number;
  employees: number;
  grossSalary: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  rejectionReason?: string;
}
