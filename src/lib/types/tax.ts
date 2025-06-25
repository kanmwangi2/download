export interface TaxSettingsData {
  id?: string;
  companyId: string;
  payeBand1Limit: number;
  payeBand2Limit: number;
  payeBand3Limit: number;
  payeRate1: number;
  payeRate2: number;
  payeRate3: number;
  payeRate4: number;
  pensionEmployerRate: number;
  pensionEmployeeRate: number;
  maternityEmployerRate: number;
  maternityEmployeeRate: number;
  cbhiRate: number;
  ramaEmployerRate: number;
  ramaEmployeeRate: number;
}
