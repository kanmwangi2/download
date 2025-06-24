export interface DeductionType {
  id: string;
  companyId: string;
  name: string;
  orderNumber: number; // For display order in forms/tables
  isFixedName: boolean;
  isDeletable: boolean;
}

export const DEFAULT_ADVANCE_DEDUCTION_TYPE_ID = "dt_advance";
export const DEFAULT_CHARGE_DEDUCTION_TYPE_ID = "dt_charge";
export const DEFAULT_LOAN_DEDUCTION_TYPE_ID = "dt_loan";

export const initialDeductionTypesForCompanySeed = (companyId: string): DeductionType[] => [
  {
    id: DEFAULT_ADVANCE_DEDUCTION_TYPE_ID,
    companyId,
    name: "Advance",
    orderNumber: 1,
    isFixedName: true,
    isDeletable: false,
  },
  {
    id: DEFAULT_CHARGE_DEDUCTION_TYPE_ID,
    companyId,
    name: "Charge",
    orderNumber: 2,
    isFixedName: true,
    isDeletable: false,
  },
  {
    id: DEFAULT_LOAN_DEDUCTION_TYPE_ID,
    companyId,
    name: "Loan",
    orderNumber: 3,
    isFixedName: true,
    isDeletable: false,
  },
];

export const exampleUserDefinedDeductionTypesForUmoja: Omit<DeductionType, 'companyId'>[] = [
    {
        id: "dt_staff_welfare_co001",
        name: "Staff Welfare Contribution",
        orderNumber: 4,
        isFixedName: false,
        isDeletable: true,
    },
];

export const exampleUserDefinedDeductionTypesForIsoko: Omit<DeductionType, 'companyId'>[] = [
    {
        id: "dt_isoko_loan_co002",
        name: "Isoko Staff Loan",
        orderNumber: 4,
        isFixedName: false,
        isDeletable: true,
    },
    {
        id: "dt_isoko_uniform_co002",
        name: "Uniform Charge",
        orderNumber: 5,
        isFixedName: false,
        isDeletable: true,
    }
];

// --- Mapping utilities for frontend/backend case conversion ---
// Import centralized case conversion utilities
export { deductionTypeFromBackend, deductionTypeToBackend } from './case-conversion';
