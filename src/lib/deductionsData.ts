import type { Deduction } from '@/app/app/(main)/deductions/page';
import { DEFAULT_ADVANCE_DEDUCTION_TYPE_ID, DEFAULT_LOAN_DEDUCTION_TYPE_ID } from '@/lib/deductionTypesData';

export const initialDeductionsData: Deduction[] = [
  {
    id: 'DED_S001_L01_co001',
    companyId: 'co_001',
    staffId: 'S001',
    staffName: 'Aline Uwase', // This will be dynamically populated on load if staff data changes
    deductionTypeId: DEFAULT_LOAN_DEDUCTION_TYPE_ID,
    deductionTypeName: 'Loan', // This will be dynamically populated on load
    description: 'Laptop Purchase Loan',
    originalAmount: 180000,
    monthlyDeduction: 30000,
    deductedSoFar: 60000,
    balance: 120000,
    startDate: '2024-04-01',
  },
  {
    id: 'DED_S002_A01_co001',
    companyId: 'co_001',
    staffId: 'S002',
    staffName: 'Emmanuel Nkubito',
    deductionTypeId: DEFAULT_ADVANCE_DEDUCTION_TYPE_ID,
    deductionTypeName: 'Advance',
    description: 'Urgent Salary Advance',
    originalAmount: 75000,
    monthlyDeduction: 75000,
    deductedSoFar: 0,
    balance: 75000,
    startDate: '2024-06-10',
  },
  {
    id: 'DED_S005_L01_co002',
    companyId: 'co_002',
    staffId: 'S005',
    staffName: 'John Kato',
    deductionTypeId: "dt_isoko_loan_co002", // Specific to Isoko
    deductionTypeName: 'Isoko Staff Loan',
    description: 'Emergency Loan - Isoko',
    originalAmount: 100000,
    monthlyDeduction: 25000,
    deductedSoFar: 0,
    balance: 100000,
    startDate: '2024-07-01',
  },
  {
    id: 'DED_S006_C01_co002',
    companyId: 'co_002',
    staffId: 'S006',
    staffName: 'Fatuma Abdi',
    deductionTypeId: "dt_isoko_uniform_co002", // Specific to Isoko
    deductionTypeName: 'Uniform Charge',
    description: 'Safety Gear Uniform',
    originalAmount: 15000,
    monthlyDeduction: 15000,
    deductedSoFar: 0,
    balance: 15000,
    startDate: '2024-07-05',
  },
];

// Import centralized case conversion utilities
export { deductionFromBackend, deductionToBackend } from './case-conversion';
