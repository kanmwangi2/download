import { TaxSettingsData } from "@/lib/types";

export function taxSettingsToBackend(taxSettings: TaxSettingsData | Omit<TaxSettingsData, 'id'>): Record<string, unknown> {
  return {
    ...(('id' in taxSettings) && { id: taxSettings.id }),
    company_id: taxSettings.companyId,
    paye_band1_limit: taxSettings.payeBand1Limit,
    paye_band2_limit: taxSettings.payeBand2Limit,
    paye_band3_limit: taxSettings.payeBand3Limit,
    paye_rate1: taxSettings.payeRate1,
    paye_rate2: taxSettings.payeRate2,
    paye_rate3: taxSettings.payeRate3,
    paye_rate4: taxSettings.payeRate4,
    pension_employer_rate: taxSettings.pensionEmployerRate,
    pension_employee_rate: taxSettings.pensionEmployeeRate,
    maternity_employer_rate: taxSettings.maternityEmployerRate,
    maternity_employee_rate: taxSettings.maternityEmployeeRate,
    cbhi_rate: taxSettings.cbhiRate,
    rama_employer_rate: taxSettings.ramaEmployerRate,
    rama_employee_rate: taxSettings.ramaEmployeeRate,
  };
}

export function taxSettingsFromBackend(taxSettings: Record<string, unknown>): TaxSettingsData {
  return {
    id: taxSettings.id,
    companyId: taxSettings.company_id,
    payeBand1Limit: taxSettings.paye_band1_limit,
    payeBand2Limit: taxSettings.paye_band2_limit,
    payeBand3Limit: taxSettings.paye_band3_limit,
    payeRate1: taxSettings.paye_rate1,
    payeRate2: taxSettings.paye_rate2,
    payeRate3: taxSettings.paye_rate3,
    payeRate4: taxSettings.paye_rate4,
    pensionEmployerRate: taxSettings.pension_employer_rate,
    pensionEmployeeRate: taxSettings.pension_employee_rate,
    maternityEmployerRate: taxSettings.maternity_employer_rate,
    maternityEmployeeRate: taxSettings.maternity_employee_rate,
    cbhiRate: taxSettings.cbhi_rate,
    ramaEmployerRate: taxSettings.rama_employer_rate,
    ramaEmployeeRate: taxSettings.rama_employee_rate,
  };
}
