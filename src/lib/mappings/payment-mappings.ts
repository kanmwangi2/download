import { PaymentType, StaffPaymentConfig } from "@/lib/types";

export function paymentTypeToBackend(paymentType: PaymentType | Omit<PaymentType, 'id'>): Record<string, unknown> {
  return {
    ...(('id' in paymentType) && { id: paymentType.id }),
    company_id: paymentType.companyId,
    name: paymentType.name,
    type: paymentType.type,
    order_number: paymentType.orderNumber,
    is_fixed_name: paymentType.isFixedName,
    is_deletable: paymentType.isDeletable,
    is_taxable: paymentType.isTaxable,
    is_pensionable: paymentType.isPensionable,
  };
}

export function paymentTypeFromBackend(paymentType: Record<string, unknown>): PaymentType {
  return {
    id: paymentType.id,
    companyId: paymentType.company_id,
    name: paymentType.name,
    type: paymentType.type,
    orderNumber: paymentType.order_number,
    isFixedName: paymentType.is_fixed_name,
    isDeletable: paymentType.is_deletable,
    isTaxable: paymentType.is_taxable,
    isPensionable: paymentType.is_pensionable,
  };
}

export function staffPaymentConfigToBackend(config: StaffPaymentConfig | Omit<StaffPaymentConfig, 'id'>): Record<string, unknown> {
    return {
        ...(('id' in config) && { id: config.id }),
        company_id: config.companyId,
        staff_id: config.staffId,
        basic_pay: config.basicPay,
        payment_type: config.paymentType,
        allowances: config.allowances,
    };
}

export function staffPaymentConfigFromBackend(config: Record<string, unknown>): StaffPaymentConfig {
    return {
        id: config.id,
        companyId: config.company_id,
        staffId: config.staff_id,
        basicPay: config.basic_pay,
        paymentType: config.payment_type,
        allowances: config.allowances,
    };
}
