export interface DeductionType {
  id: string;
  companyId: string;
  name: string;
  orderNumber: number;
  isFixedName: boolean;
  isDeletable: boolean;
  description?: string;
  isDefault?: boolean; // Added missing field
}
