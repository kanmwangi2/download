import { BaseService } from './BaseService';
import { DeductionType } from '../types/deductionTypes';
import { initialDeductionTypesForCompanySeed } from '../deductionTypesData';
import { objectToCamelCase, objectToSnakeCase } from '../case-conversion';

export type { DeductionType };

export class DeductionTypeService extends BaseService {
  private readonly tableName = 'deduction_types';

  async getDeductionTypesByCompany(companyId: string): Promise<DeductionType[]> {
    try {
      let { data: dedTypesFromDB, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId);

      if (error) {
        this.handleError(error, 'fetch deduction types');
      }

      if ((!dedTypesFromDB || dedTypesFromDB.length === 0) && companyId) {
        const defaultDedTypes = initialDeductionTypesForCompanySeed(companyId);
        const snakeCaseDeds = defaultDedTypes.map(d => objectToSnakeCase(d));

        const { data: newTypes, error: insertError } = await this.supabase
            .from(this.tableName)
            .upsert(snakeCaseDeds)
            .select();
        
        if (insertError) {
            this.handleError(insertError, 'seed deduction types');
            return [];
        }
        dedTypesFromDB = newTypes;
      }
      
      const camelCaseDeds = (dedTypesFromDB || []).map(d => objectToCamelCase<DeductionType>(d));
      return camelCaseDeds.sort((a: DeductionType, b: DeductionType) => a.orderNumber - b.orderNumber);
    } catch (error) {
      this.handleError(error, 'fetch deduction types');
      return [];
    }
  }
}
