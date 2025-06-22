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
export function deductionTypeFromBackend(row: any): DeductionType {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    orderNumber: row.order_number, // snake_case to camelCase
    isFixedName: row.is_fixed_name,
    isDeletable: row.is_deletable,
  };
}

export function deductionTypeToBackend(def: DeductionType): any {
  return {
    id: def.id,
    company_id: def.companyId,
    name: def.name,
    order_number: def.orderNumber, // camelCase to snake_case
    is_fixed_name: def.isFixedName,
    is_deletable: def.isDeletable,
  };
}
