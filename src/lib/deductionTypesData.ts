
export interface DeductionType {
  id: string; 
  companyId: string;
  name: string;
  order: number;
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
    order: 1,
    isFixedName: true,
    isDeletable: false,
  },
  {
    id: DEFAULT_CHARGE_DEDUCTION_TYPE_ID,
    companyId,
    name: "Charge", 
    order: 2,
    isFixedName: true,
    isDeletable: false,
  },
  {
    id: DEFAULT_LOAN_DEDUCTION_TYPE_ID,
    companyId,
    name: "Loan",
    order: 3,
    isFixedName: true,
    isDeletable: false,
  },
];

export const exampleUserDefinedDeductionTypesForUmoja: Omit<DeductionType, 'companyId'>[] = [
    {
        id: "dt_staff_welfare_co001",
        name: "Staff Welfare Contribution",
        order: 4, 
        isFixedName: false,
        isDeletable: true,
    },
];

export const exampleUserDefinedDeductionTypesForIsoko: Omit<DeductionType, 'companyId'>[] = [
    {
        id: "dt_isoko_loan_co002", // More specific ID
        name: "Isoko Staff Loan",
        order: 4, 
        isFixedName: false,
        isDeletable: true,
    },
    {
        id: "dt_isoko_uniform_co002",
        name: "Uniform Charge",
        order: 5,
        isFixedName: false,
        isDeletable: true,
    }
];
