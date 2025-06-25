export interface CustomFieldDefinition {
  id: string;
  companyId: string;
  name: string;
  type: 'Text' | 'Number' | 'Date';
  orderNumber: number;
  isDeletable: boolean;
}
