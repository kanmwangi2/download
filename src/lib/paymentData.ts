
import { DEFAULT_BASIC_PAY_ID, DEFAULT_TRANSPORT_ALLOWANCE_ID } from './paymentTypesData';

export type StaffPaymentDetails = Record<string, number>; 

export const defaultPaymentDetails: StaffPaymentDetails = {};

// Payment Type IDs for Umoja Tech Solutions (co_001)
const umojaTechPaymentTypeIds = {
    basic: DEFAULT_BASIC_PAY_ID,
    transport: DEFAULT_TRANSPORT_ALLOWANCE_ID,
    house: "pt_house_co001",
    overtime: "pt_overtime_co001",
    other: "pt_other_co001",
};

// Payment Type IDs for Isoko Trading Co. (co_002)
const isokoTradingPaymentTypeIds = {
    basic: DEFAULT_BASIC_PAY_ID,
    transport: DEFAULT_TRANSPORT_ALLOWANCE_ID,
    salesCommission: "pt_sales_commission_co002",
    communication: "pt_communication_co002",
};

export const initialPaymentDataStore: Record<string, StaffPaymentDetails> = {
  // --- Umoja Tech Solutions (co_001) ---
  "co_001_S001": { // Aline Uwase
    [umojaTechPaymentTypeIds.basic]: 450000,
    [umojaTechPaymentTypeIds.transport]: 50000,
    [umojaTechPaymentTypeIds.house]: 100000,
    [umojaTechPaymentTypeIds.overtime]: 30000,
    [umojaTechPaymentTypeIds.other]: 15000,
  },
  "co_001_S002": { // Emmanuel Nkubito
    [umojaTechPaymentTypeIds.basic]: 300000,
    [umojaTechPaymentTypeIds.transport]: 40000,
    [umojaTechPaymentTypeIds.house]: 70000,
    [umojaTechPaymentTypeIds.other]: 10000,
  },
  "co_001_S003": { // Grace Mutoni
    [umojaTechPaymentTypeIds.basic]: 350000,
    [umojaTechPaymentTypeIds.transport]: 35000,
    [umojaTechPaymentTypeIds.house]: 60000,
    [umojaTechPaymentTypeIds.overtime]: 10000,
  },
  // --- Isoko Trading Co. (co_002) ---
  "co_002_S005": { // John Kato
    [isokoTradingPaymentTypeIds.basic]: 500000,
    [isokoTradingPaymentTypeIds.transport]: 70000,
    [isokoTradingPaymentTypeIds.salesCommission]: 150000,
    [isokoTradingPaymentTypeIds.communication]: 25000,
  },
  "co_002_S006": { // Fatuma Abdi
    [isokoTradingPaymentTypeIds.basic]: 350000,
    [isokoTradingPaymentTypeIds.transport]: 40000,
    [isokoTradingPaymentTypeIds.communication]: 20000,
    // No sales commission for Fatuma in this example
  }
};
