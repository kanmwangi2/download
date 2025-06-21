
export interface PaymentType {
  id: string; 
  companyId: string;
  name: string; 
  type: "Gross" | "Net"; 
  order: number; 
  isFixedName: boolean; 
  isDeletable: boolean; 
}

export const DEFAULT_BASIC_PAY_ID = "pt_basic";
export const DEFAULT_TRANSPORT_ALLOWANCE_ID = "pt_transport";

export const initialPaymentTypesForCompanySeed = (companyId: string): PaymentType[] => [
  {
    id: DEFAULT_BASIC_PAY_ID,
    companyId,
    name: "Basic Pay",
    type: "Gross", 
    order: 1,
    isFixedName: true,
    isDeletable: false,
  },
  {
    id: DEFAULT_TRANSPORT_ALLOWANCE_ID,
    companyId,
    name: "Transport Allowance",
    type: "Gross", 
    order: 2,
    isFixedName: true,
    isDeletable: false,
  },
];

export const exampleUserDefinedPaymentTypesForUmoja: Omit<PaymentType, 'companyId'>[] = [
    {
        id: "pt_house_co001", 
        name: "House Allowance",
        type: "Gross",
        order: 3,
        isFixedName: false,
        isDeletable: true,
    },
    {
        id: "pt_overtime_co001",
        name: "Overtime Allowance",
        type: "Gross",
        order: 4,
        isFixedName: false,
        isDeletable: true,
    },
    {
        id: "pt_other_co001",
        name: "Other Allowances",
        type: "Net", // Example of a Net payment type
        order: 5,
        isFixedName: false,
        isDeletable: true,
    },
];

// Example for Isoko Trading Co. (co_002)
export const exampleUserDefinedPaymentTypesForIsoko: Omit<PaymentType, 'companyId'>[] = [
    {
        id: "pt_sales_commission_co002",
        name: "Sales Commission",
        type: "Gross",
        order: 3, // After Basic and Transport
        isFixedName: false,
        isDeletable: true,
    },
    {
        id: "pt_communication_co002",
        name: "Communication Allowance",
        type: "Net", // Example
        order: 4,
        isFixedName: false,
        isDeletable: true,
    }
];
