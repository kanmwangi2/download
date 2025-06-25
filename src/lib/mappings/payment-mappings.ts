import { PaymentType, StaffPayment } from "@/lib/types";

export function paymentTypeToBackend(paymentType: PaymentType | Omit<PaymentType, 'id'>): Record<string, unknown> {
  return {
    ...(('id' in paymentType) && { id: paymentType.id }),
    company_id: paymentType.companyId,
    name: paymentType.name,
    type: paymentType.type,
    is_taxable: paymentType.isTaxable,
    is_default: paymentType.isDefault,
    description: paymentType.description,
  };
}

export function paymentTypeFromBackend(paymentType: Record<string, any>): PaymentType {
  return {
    id: paymentType.id,
    companyId: paymentType.company_id,
    name: paymentType.name,
    type: paymentType.type,
    isTaxable: paymentType.is_taxable,
    isDefault: paymentType.is_default,
    description: paymentType.description,
  };
}

export function staffPaymentToBackend(staffPayment: StaffPayment | Omit<StaffPayment, 'id'>): Record<string, unknown> {
    return {
        ...(('id' in staffPayment) && { id: staffPayment.id }),
        staff_id: staffPayment.staffId,
        payment_type_id: staffPayment.paymentTypeId,
        amount: staffPayment.amount,
        effective_date: staffPayment.effectiveDate,
        end_date: staffPayment.endDate,
    };
}

export function staffPaymentFromBackend(staffPayment: Record<string, any>): StaffPayment {
    return {
        id: staffPayment.id,
        staffId: staffPayment.staff_id,
        paymentTypeId: staffPayment.payment_type_id,
        amount: staffPayment.amount,
        effectiveDate: staffPayment.effective_date,
        endDate: staffPayment.end_date,
    };
}
