import { Deduction, DeductionType, DeductionRecord } from '../types/deductions';
import { objectToCamelCase, objectToSnakeCase } from '../case-conversion';
import { BaseService } from './BaseService';

export class DeductionService extends BaseService {
  private readonly staffDeductionsTable = 'staff_deductions';
  private readonly deductionTypesTable = 'deduction_types';

  private mapDeductionFromSupabase(d: any): Deduction {
    const camelCaseDeduction = objectToCamelCase(d);
    return {
      ...camelCaseDeduction,
      staffName: `${d.staff.first_name} ${d.staff.last_name}`,
      deductionTypeName: d.deduction_type.name,
      balance: (camelCaseDeduction.originalAmount || 0) - (camelCaseDeduction.deductedSoFar || 0),
    } as Deduction;
  }

  async createDeduction(deduction: Omit<Deduction, 'id'>): Promise<Deduction> {
    try {
      const { staffName, deductionTypeName, balance, ...rest } = deduction as any;
      const backendDeduction = objectToSnakeCase(rest);
      const { data, error } = await this.supabase
        .from(this.staffDeductionsTable)
        .insert(backendDeduction)
        .select('*, staff:staff!inner(first_name, last_name), deduction_type:deduction_types!inner(name)')
        .single();

      if (error) throw error;
      return this.mapDeductionFromSupabase(data);
    } catch (error) {
      this.handleError(error, 'create deduction');
    }
  }

  async getDeductionById(id: string): Promise<Deduction | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.staffDeductionsTable)
        .select('*, staff:staff!inner(first_name, last_name), deduction_type:deduction_types!inner(name)')
        .eq('id', id)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data ? this.mapDeductionFromSupabase(data) : null;
    } catch (error) {
      this.handleError(error, 'fetch deduction by id');
    }
  }

  async getDeductionsByCompany(companyId: string): Promise<Deduction[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.staffDeductionsTable)
        .select('*, staff:staff!inner(first_name, last_name), deduction_type:deduction_types!inner(name)')
        .eq('company_id', companyId);

      if (error) throw error;
      return data.map(d => this.mapDeductionFromSupabase(d));
    } catch (error) {
      this.handleError(error, 'fetch deductions');
    }
  }

  async getActiveDeductionsForStaff(staffId: string): Promise<Deduction[]> {
    try {
        const { data, error } = await this.supabase
            .from(this.staffDeductionsTable)
            .select('*, staff:staff!inner(first_name, last_name), deduction_type:deduction_types!inner(name)')
            .eq('staff_id', staffId)
            .gt('balance', 0);

        if (error) throw error;
        return data.map(d => this.mapDeductionFromSupabase(d));
    } catch (error) {
        this.handleError(error, 'fetch active deductions for staff');
    }
  }

  async updateDeduction(deduction: Deduction): Promise<Deduction> {
    try {
      const { staffName, deductionTypeName, balance, ...rest } = deduction;
      const backendUpdates = objectToSnakeCase(rest);
      const { data, error } = await this.supabase
        .from(this.staffDeductionsTable)
        .update(backendUpdates)
        .eq('id', deduction.id)
        .select('*, staff:staff!inner(first_name, last_name), deduction_type:deduction_types!inner(name)')
        .single();
      if (error) throw error;
      return this.mapDeductionFromSupabase(data);
    } catch (error) {
      this.handleError(error, 'update deduction');
    }
  }

  async updateDeductionRecords(deductions: Partial<DeductionRecord>[]): Promise<DeductionRecord[]> {
    try {
      const snakeCaseDeductions = deductions.map(d => objectToSnakeCase(d));
      const { data, error } = await this.supabase
        .from('staff_deduction_records') 
        .upsert(snakeCaseDeductions)
        .select();

      if (error) throw error;
      return data.map(d => objectToCamelCase(d));
    } catch (error) {
      this.handleError(error, 'bulk updating deduction records');
    }
  }

  async deleteDeductions(ids: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('staff_deductions')
        .delete()
        .in('id', ids);
      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'delete deductions');
    }
  }

  async getDeductionTypes(companyId: string): Promise<DeductionType[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.deductionTypesTable)
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return data.map(d => objectToCamelCase(d));
    } catch (error) {
      this.handleError(error, 'fetch deduction types');
    }
  }

  async createDeductionType(deductionTypeData: Omit<DeductionType, 'id' | 'isDeletable' | 'isFixedName'>): Promise<DeductionType> {
    try {
      const snakeCaseData = objectToSnakeCase(deductionTypeData);
      const { data, error } = await this.supabase
        .from('deduction_types')
        .insert(snakeCaseData)
        .select()
        .single();

      if (error) throw error;
      return objectToCamelCase(data) as DeductionType;
    } catch (error) {
      this.handleError(error, 'create deduction type');
    }
  }

  async updateDeductionType(deductionTypeData: Partial<DeductionType> & { id: string }): Promise<DeductionType> {
    try {
      const snakeCaseData = objectToSnakeCase(deductionTypeData);
      const { id, ...updateData } = snakeCaseData;
      const { data, error } = await this.supabase
        .from('deduction_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return objectToCamelCase(data) as DeductionType;
    } catch (error) {
      this.handleError(error, 'update deduction type');
    }
  }

  async deleteDeductionTypes(ids: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('deduction_types')
        .delete()
        .in('id', ids);

      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'delete deduction types');
    }
  }

  async bulkUpsertDeductions(deductions: Deduction[]): Promise<Deduction[]> {
    try {
      const snakeCaseDeductions = deductions.map(d => {
        const { staffName, deductionTypeName, balance, ...rest } = d;
        return objectToSnakeCase(rest);
      });
      
      const { data, error } = await this.supabase
        .from('staff_deductions')
        .upsert(snakeCaseDeductions, { onConflict: 'id' })
        .select('*, staff:staff!inner(first_name, last_name), deduction_type:deduction_types!inner(name)');

      if (error) throw error;
      return data.map(d => this.mapDeductionFromSupabase(d));
    } catch (error) {
      this.handleError(error, 'bulk-upsert deductions');
    }
  }
}
