
import type { PayrollRunSummary } from '@/app/app/(main)/payroll/page';

export const initialPayrollRunsSeedData: PayrollRunSummary[] = [
  {
    id: "PR202406", companyId: "co_001", month: "June", year: 2024, employees: 3, grossSalary: 1200000, deductions: 250000, netPay: 950000, status: "Approved",
  },
  {
    id: "PR202407", companyId: "co_001", month: "July", year: 2024, employees: 0, grossSalary: 0, deductions: 0, netPay: 0, status: "Draft",
  },
  {
    id: "PR202405", companyId: "co_001", month: "May", year: 2024, employees: 3, grossSalary: 850000, deductions: 180000, netPay: 670000, status: "Approved",
  },
  {
    id: "PR202406", companyId: "co_002", month: "June", year: 2024, employees: 2, grossSalary: 900000, deductions: 100000, netPay: 800000, status: "Approved",
  },
  {
    id: "PR202407", companyId: "co_002", month: "July", year: 2024, employees: 0, grossSalary: 0, deductions: 0, netPay: 0, status: "Draft",
  },
];
