import { Deduction, DeductionType } from '../types/deductions';
import { objectToCamelCase, objectToSnakeCase } from '../case-conversion';
import { BaseService } from './BaseService';

export class DeductionService extends BaseService {
  private readonly staffDeductionsTable = 'staff_deductions';
  private readonly deductionTypesTable = 'deduction_types';

  private mapDeductionFromSupabase(d: any): Deduction {
    return {
      id: d.id,
      companyId: d.company_id,
      staffId: d.staff_id,
      deductionType: d.deduction_type,
      amount: d.amount,
      isPercentage: d.is_percentage,
      isActive: d.is_active,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    };
  }

  async createDeduction(deduction: Omit<Deduction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deduction> {
    try {
      const backendDeduction = objectToSnakeCase(deduction);
      const { data, error } = await this.supabase
        .from(this.staffDeductionsTable)
        .insert(backendDeduction)
        .select()
        .single();

      if (error) throw error;
      return this.mapDeductionFromSupabase(data);
    } catch (error) {
      this.handleError(error, 'create deduction');
      throw error;
    }
  }

  async getDeductionById(id: string): Promise<Deduction | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.staffDeductionsTable)
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data ? this.mapDeductionFromSupabase(data) : null;
    } catch (error) {
      this.handleError(error, 'fetch deduction by id');
      throw error;
    }
  }

  async getDeductionsByCompany(companyId: string): Promise<Deduction[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.staffDeductionsTable)
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      return data.map(d => this.mapDeductionFromSupabase(d));
    } catch (error) {
      this.handleError(error, 'fetch deductions');
      throw error;
    }
  }

  async getActiveDeductionsForStaff(staffId: string): Promise<Deduction[]> {
    try {
        const { data, error } = await this.supabase
            .from(this.staffDeductionsTable)
            .select('*')
            .eq('staff_id', staffId)
            .eq('is_active', true);

        if (error) throw error;
        return data.map(d => this.mapDeductionFromSupabase(d));
    } catch (error) {
        this.handleError(error, 'fetch active deductions for staff');
        throw error;
    }
  }

  async updateDeduction(deduction: Deduction): Promise<Deduction> {
    try {
      const backendUpdates = objectToSnakeCase(deduction);
      const { data, error } = await this.supabase
        .from(this.staffDeductionsTable)
        .update(backendUpdates)
        .eq('id', deduction.id)
        .select()
        .single();
      if (error) throw error;
      return this.mapDeductionFromSupabase(data);
    } catch (error) {
      this.handleError(error, 'update deduction');
      throw error;
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
      const snakeCaseDeductions = deductions.map(d => objectToSnakeCase(d));
      
      const { data, error } = await this.supabase
        .from('staff_deductions')
        .upsert(snakeCaseDeductions, { onConflict: 'id' })
        .select();

      if (error) throw error;
      return data.map(d => this.mapDeductionFromSupabase(d));
    } catch (error) {
      this.handleError(error, 'bulk-upsert deductions');
      throw error;
    }
  }
}
