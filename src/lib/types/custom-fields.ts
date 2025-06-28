export interface CustomFieldDefinition {
  id: string;
  companyId: string;
  name: string;
  type: 'text' | 'number' | 'date';
  orderIndex: number;
  isDeletable: boolean;
}
