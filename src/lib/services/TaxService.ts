import { BaseService } from './BaseService';
import { TaxSettingsData } from '../types/tax';
import { objectToCamelCase, objectToSnakeCase } from '../case-conversion';

const DEFAULT_PAYE_BANDS = {
  BAND1_LIMIT: 30000,
  BAND2_LIMIT: 100000,
  BAND3_LIMIT: 500000,
  RATE1: 0,
  RATE2: 0.2,
  RATE3: 0.3,
  RATE4: 0.4
};

const DEFAULT_PENSION_EMPLOYER_RATE = 0.03;
const DEFAULT_PENSION_EMPLOYEE_RATE = 0.03;
const DEFAULT_MATERNITY_EMPLOYER_RATE = 0.003;
const DEFAULT_MATERNITY_EMPLOYEE_RATE = 0.003;
const DEFAULT_CBHI_RATE = 0.075;
const DEFAULT_RAMA_EMPLOYER_RATE = 0.01;
const DEFAULT_RAMA_EMPLOYEE_RATE = 0.01;

export class TaxService extends BaseService {
  private readonly tableName = 'tax_settings';

  async getTaxSettings(companyId: string): Promise<TaxSettingsData> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error || !data) {
        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
            this.handleError(error, 'fetch tax settings');
        }
        return this.getDefaultTaxSettings(companyId);
      }

      return objectToCamelCase<TaxSettingsData>(data);
    } catch (error) {
      this.handleError(error, 'fetch tax settings');
      return this.getDefaultTaxSettings(companyId);
    }
  }

  async updateTaxSettings(settings: Partial<TaxSettingsData>): Promise<TaxSettingsData> {
    try {
      const snakeCaseSettings = objectToSnakeCase(settings);
      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(snakeCaseSettings)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'update tax settings');
        throw error;
      }

      return objectToCamelCase<TaxSettingsData>(data);
    } catch (error) {
      this.handleError(error, 'update tax settings');
      throw error;
    }
  }

  public getDefaultTaxSettings(companyId: string): TaxSettingsData {
    return {
        companyId: companyId,
        payeBand1Limit: DEFAULT_PAYE_BANDS.BAND1_LIMIT,
        payeBand2Limit: DEFAULT_PAYE_BANDS.BAND2_LIMIT,
        payeBand3Limit: DEFAULT_PAYE_BANDS.BAND3_LIMIT,
        payeRate1: DEFAULT_PAYE_BANDS.RATE1 * 100,
        payeRate2: DEFAULT_PAYE_BANDS.RATE2 * 100,
        payeRate3: DEFAULT_PAYE_BANDS.RATE3 * 100,
        payeRate4: DEFAULT_PAYE_BANDS.RATE4 * 100,
        pensionEmployerRate: DEFAULT_PENSION_EMPLOYER_RATE * 100,
        pensionEmployeeRate: DEFAULT_PENSION_EMPLOYEE_RATE * 100,
        maternityEmployerRate: DEFAULT_MATERNITY_EMPLOYER_RATE * 100,
        maternityEmployeeRate: DEFAULT_MATERNITY_EMPLOYEE_RATE * 100,
        cbhiRate: DEFAULT_CBHI_RATE * 100,
        ramaEmployerRate: DEFAULT_RAMA_EMPLOYER_RATE * 100,
        ramaEmployeeRate: DEFAULT_RAMA_EMPLOYEE_RATE * 100,
    };
  }
}
