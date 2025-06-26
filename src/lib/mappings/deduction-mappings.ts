import { DeductionType, StaffDeduction } from "@/lib/types";

export function deductionTypeToBackend(deductionType: DeductionType | Omit<DeductionType, 'id'>): Record<string, unknown> {
  return {
    ...(('id' in deductionType) && { id: deductionType.id }),
    company_id: deductionType.companyId,
    name: deductionType.name,
    order_number: deductionType.orderNumber,
    is_fixed_name: deductionType.isFixedName,
    is_deletable: deductionType.isDeletable,
    description: deductionType.description,
  };
}

export function deductionTypeFromBackend(deductionType: Record<string, any>): DeductionType {
  return {
    id: deductionType.id,
    companyId: deductionType.company_id,
    name: deductionType.name,
    orderNumber: deductionType.order_number,
    isFixedName: deductionType.is_fixed_name,
    isDeletable: deductionType.is_deletable,
    description: deductionType.description,
  };
}

export function staffDeductionToBackend(deduction: StaffDeduction | Omit<StaffDeduction, 'id'>): Record<string, unknown> {
    return {
        ...(('id' in deduction) && { id: deduction.id }),
        company_id: deduction.companyId,
        staff_id: deduction.staffId,
        deduction_type: deduction.deductionType,
        amount: deduction.amount,
        is_percentage: deduction.isPercentage,
        is_active: deduction.isActive,
    };
}

export function staffDeductionFromBackend(deduction: Record<string, any>): StaffDeduction {
    return {
        id: deduction.id,
        companyId: deduction.company_id,
        staffId: deduction.staff_id,
        deductionType: deduction.deduction_type,
        amount: deduction.amount,
        isPercentage: deduction.is_percentage,
        isActive: deduction.is_active,
    };
}
