import { PaymentType } from "@/lib/types";
import { StaffPaymentConfig } from "@/lib/types/staff";

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

export function paymentTypeFromBackend(paymentType: Record<string, any>): PaymentType {
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
        staff_id: config.staffId,
        payment_type_id: config.paymentTypeId,
        amount: config.amount,
        is_active: config.isActive,
        effective_date: config.effectiveDate,
    };
}

export function staffPaymentConfigFromBackend(config: Record<string, any>): StaffPaymentConfig {
    return {
        id: config.id,
        staffId: config.staff_id,
        paymentTypeId: config.payment_type_id,
        amount: config.amount,
        isActive: config.is_active,
        effectiveDate: config.effective_date,
    };
}

// Legacy compatibility functions for existing services
export function staffPaymentFromBackend(payment: Record<string, any>): any {
    return {
        id: payment.id,
        staffId: payment.staff_id,
        paymentTypeId: payment.payment_type_id,
        amount: payment.amount,
        effectiveDate: payment.effective_date,
        endDate: payment.end_date,
    };
}

export function staffPaymentToBackend(payment: any): Record<string, unknown> {
    return {
        id: payment.id,
        staff_id: payment.staffId,
        payment_type_id: payment.paymentTypeId,
        amount: payment.amount,
        effective_date: payment.effectiveDate,
        end_date: payment.endDate,
    };
}
