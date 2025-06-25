export type PaymentCategory = 'allowance' | 'earning' | 'reimbursement' | 'overtime' | 'bonus' | 'other' | 'Gross' | 'Net';

export interface PaymentType {
  id: string;
  companyId: string;
  name: string;
  type: PaymentCategory;
  isTaxable: boolean;
  isDefault: boolean;
  orderNumber: number;
  isFixedName: boolean;
  isDeletable: boolean;
  description?: string;
}

export interface StaffPayment {
  id: string;
  staffId: string;
  paymentTypeId: string;
  amount: number;
  effectiveDate: string;
  endDate?: string;
}

export const DEFAULT_BASIC_PAY_ID = 'd8a4c3a3-1d9a-4f8a-8e9a-4b0c7c1d8e9a';
export const DEFAULT_TRANSPORT_ALLOWANCE_ID = 'd8a4c3a3-1d9a-4f8a-8e9a-4b0c7c1d8e9b';
