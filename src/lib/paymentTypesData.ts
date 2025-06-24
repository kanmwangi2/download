export interface PaymentType {
  id: string; 
  companyId: string;
  name: string; 
  type: "Gross" | "Net"; 
  orderNumber: number; // For display order in forms/tables
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
    orderNumber: 1,
    isFixedName: true,
    isDeletable: false,
  },
  {
    id: DEFAULT_TRANSPORT_ALLOWANCE_ID,
    companyId,
    name: "Transport Allowance",
    type: "Gross", 
    orderNumber: 2,
    isFixedName: true,
    isDeletable: false,
  },
];

export const exampleUserDefinedPaymentTypesForUmoja: Omit<PaymentType, 'companyId'>[] = [
    {
        id: "pt_house_co001", 
        name: "House Allowance",
        type: "Gross",
        orderNumber: 3,
        isFixedName: false,
        isDeletable: true,
    },
    {
        id: "pt_overtime_co001",
        name: "Overtime Allowance",
        type: "Gross",
        orderNumber: 4,
        isFixedName: false,
        isDeletable: true,
    },
    {
        id: "pt_other_co001",
        name: "Other Allowances",
        type: "Net", // Example of a Net payment type
        orderNumber: 5,
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
        orderNumber: 3, // After Basic and Transport
        isFixedName: false,
        isDeletable: true,
    },
    {
        id: "pt_communication_co002",
        name: "Communication Allowance",
        type: "Net", // Example
        orderNumber: 4,
        isFixedName: false,
        isDeletable: true,
    }
];

// --- Mapping utilities for frontend/backend case conversion ---
// Import centralized case conversion utilities
export { paymentTypeFromBackend, paymentTypeToBackend } from './case-conversion';
