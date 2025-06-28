import { BaseService } from './BaseService';
import { DeductionType } from '../types/deductionTypes';

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

      if (!dedTypesFromDB || dedTypesFromDB.length === 0) {
        // Create default deduction types for the company
        const defaultDeductionTypes = [
          {
            company_id: companyId,
            name: 'Loan',
            description: 'Employee loan deduction',
          },
          {
            company_id: companyId,
            name: 'Advance',
            description: 'Salary advance deduction',
          }
        ];

        const { data: insertedTypes, error: insertError } = await this.supabase
          .from(this.tableName)
          .insert(defaultDeductionTypes)
          .select();

        if (insertError) {
          this.handleError(insertError, 'create default deduction types');
        }

        dedTypesFromDB = insertedTypes || [];
      }

      return (dedTypesFromDB || []).map(this.mapFromDatabase);
    } catch (error) {
      this.handleError(error, 'fetch deduction types');
      return [];
    }
  }

  async createDeductionType(deductionTypeData: Omit<DeductionType, 'id'>): Promise<DeductionType | null> {
    try {
      const dbData = this.mapToDatabase(deductionTypeData);

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(dbData)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'create deduction type');
        return null;
      }

      return this.mapFromDatabase(data);
    } catch (error) {
      this.handleError(error, 'create deduction type');
      return null;
    }
  }

  async updateDeductionType(deductionType: DeductionType): Promise<DeductionType | null> {
    try {
      const dbData = this.mapToDatabase(deductionType);

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(dbData)
        .eq('id', deductionType.id)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'update deduction type');
        return null;
      }

      return this.mapFromDatabase(data);
    } catch (error) {
      this.handleError(error, 'update deduction type');
      return null;
    }
  }

  async deleteDeductionType(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error, 'delete deduction type');
        return false;
      }

      return true;
    } catch (error) {
      this.handleError(error, 'delete deduction type');
      return false;
    }
  }

  private mapFromDatabase(dbRow: any): DeductionType {
    return {
      id: dbRow.id,
      companyId: dbRow.company_id,
      name: dbRow.name,
      description: dbRow.description,
      orderNumber: dbRow.order_number || 0,
      isFixedName: dbRow.is_fixed_name || false,
      isDeletable: dbRow.is_deletable || true,
    };
  }

  private mapToDatabase(deductionType: Partial<DeductionType>): any {
    return {
      company_id: deductionType.companyId,
      name: deductionType.name,
      description: deductionType.description,
      order_number: deductionType.orderNumber,
      is_fixed_name: deductionType.isFixedName,
      is_deletable: deductionType.isDeletable,
    };
  }
}
