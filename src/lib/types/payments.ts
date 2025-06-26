export type PaymentCategory = 'Gross' | 'Net';

export interface PaymentType {
  id: string;
  companyId: string;
  name: string;
  type: PaymentCategory;
  orderNumber: number;
  isFixedName: boolean;
  isDeletable: boolean;
  isTaxable: boolean;
  isPensionable: boolean;
}

export interface StaffPaymentConfig {
  id: string;
  companyId: string;
  staffId: string;
  basicPay: number;
  paymentType: PaymentCategory;
  allowances: Record<string, number>;
}

/**
 * Staff payment details configuration (used in payroll calculations)
 */
export type StaffPaymentDetails = Record<string, number>;

export const DEFAULT_BASIC_PAY_ID = 'd8a4c3a3-1d9a-4f8a-8e9a-4b0c7c1d8e9a';
export const DEFAULT_TRANSPORT_ALLOWANCE_ID = 'd8a4c3a3-1d9a-4f8a-8e9a-4b0c7c1d8e9b';
