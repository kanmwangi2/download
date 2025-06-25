/**
 * Deduction DAO - Data Access Object for staff deductions
 * Extends BaseDAO with deduction-specific operations
 */

import { BaseDAO, BaseEntity } from './base-dao';

export interface Deduction extends BaseEntity {
  id: string;
  companyId: string;
  staffId: string;
  deductionTypeId: string;
  originalAmount: number;
  deductedSoFar: number;
  balance: number;
  startDate: string;
  endDate?: string;
  isRecurring: boolean;
  recurringFrequency?: 'Monthly' | 'Quarterly' | 'Annually';
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields for convenience
  staffName?: string;
  deductionTypeName?: string;
}

export class DeductionDAO extends BaseDAO<Deduction> {
  constructor() {
    super('staff_deductions', true); // Company-scoped table
  }

  protected fromDatabase(record: any): Deduction {
    return {
      id: record.id,
      companyId: record.company_id,
      staffId: record.staff_id,
      deductionTypeId: record.deduction_type_id,
      originalAmount: record.original_amount || 0,
      deductedSoFar: record.deducted_so_far || 0,
      balance: record.balance || 0,
      startDate: record.start_date,
      endDate: record.end_date,
      isRecurring: record.is_recurring || false,
      recurringFrequency: record.recurring_frequency,
      isActive: record.is_active || true,
      description: record.description,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      // Populated fields (if included in query)
      staffName: record.staff_name,
      deductionTypeName: record.deduction_type_name,
    };
  }

  protected toDatabase(entity: Partial<Deduction>): any {
    return {
      ...(entity.id && { id: entity.id }),
      ...(entity.companyId && { company_id: entity.companyId }),
      ...(entity.staffId !== undefined && { staff_id: entity.staffId }),
      ...(entity.deductionTypeId !== undefined && { deduction_type_id: entity.deductionTypeId }),
      ...(entity.originalAmount !== undefined && { original_amount: entity.originalAmount }),
      ...(entity.deductedSoFar !== undefined && { deducted_so_far: entity.deductedSoFar }),
      ...(entity.balance !== undefined && { balance: entity.balance }),
      ...(entity.startDate !== undefined && { start_date: entity.startDate }),
      ...(entity.endDate !== undefined && { end_date: entity.endDate }),
      ...(entity.isRecurring !== undefined && { is_recurring: entity.isRecurring }),
      ...(entity.recurringFrequency !== undefined && { recurring_frequency: entity.recurringFrequency }),
      ...(entity.isActive !== undefined && { is_active: entity.isActive }),
      ...(entity.description !== undefined && { description: entity.description }),
    };
  }

  /**
   * Find deductions by staff member
   */
  async findByStaff(staffId: string, companyId: string): Promise<Deduction[]> {
    return this.findWithFilters({ staff_id: staffId }, companyId);
  }

  /**
   * Find deductions by deduction type
   */
  async findByDeductionType(deductionTypeId: string, companyId: string): Promise<Deduction[]> {
    return this.findWithFilters({ deduction_type_id: deductionTypeId }, companyId);
  }

  /**
   * Find active deductions
   */
  async findActive(companyId: string): Promise<Deduction[]> {
    return this.findWithFilters({ is_active: true }, companyId);
  }

  /**
   * Find deductions with balance remaining
   */
  async findWithBalance(companyId: string): Promise<Deduction[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('company_id', companyId)
      .gt('balance', 0);

    if (error) {
      throw new Error(`Failed to fetch deductions with balance: ${error.message}`);
    }

    return (data || []).map(record => this.fromDatabase(record));
  }

  /**
   * Get deductions with staff and deduction type details
   */
  async findWithDetails(companyId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        staff_members!inner (
          first_name,
          last_name
        ),
        deduction_types!inner (
          name
        )
      `)
      .eq('company_id', companyId);

    if (error) {
      throw new Error(`Failed to fetch deductions with details: ${error.message}`);
    }

    return (data || []).map(record => ({
      ...this.fromDatabase(record),
      staffFullName: record.staff_members ? 
        `${record.staff_members.first_name} ${record.staff_members.last_name}` : 
        undefined,
      deductionTypeName: record.deduction_types?.name,
    }));
  }

  /**
   * Update deduction balance after payment
   */
  async updateBalance(id: string, amountDeducted: number): Promise<Deduction> {
    const deduction = await this.findById(id);
    if (!deduction) {
      throw new Error('Deduction not found');
    }

    const newDeductedSoFar = deduction.deductedSoFar + amountDeducted;
    const newBalance = Math.max(0, deduction.originalAmount - newDeductedSoFar);

    return this.update(id, {
      deductedSoFar: newDeductedSoFar,
      balance: newBalance,
      isActive: newBalance > 0
    });
  }

  /**
   * Reverse deduction (for payroll reversals)
   */
  async reverseDeduction(id: string, amountToReverse: number): Promise<Deduction> {
    const deduction = await this.findById(id);
    if (!deduction) {
      throw new Error('Deduction not found');
    }

    const newDeductedSoFar = Math.max(0, deduction.deductedSoFar - amountToReverse);
    const newBalance = deduction.originalAmount - newDeductedSoFar;

    return this.update(id, {
      deductedSoFar: newDeductedSoFar,
      balance: newBalance,
      isActive: newBalance > 0
    });
  }

  /**
   * Get total deduction amount for a staff member
   */
  async getTotalDeductionsByStaff(staffId: string, companyId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('balance')
      .eq('company_id', companyId)
      .eq('staff_id', staffId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to get total deductions: ${error.message}`);
    }

    return (data || []).reduce((total, record) => total + (record.balance || 0), 0);
  }

  /**
   * Get recurring deductions due for processing
   */
  async getRecurringDeductionsDue(companyId: string, currentDate: string): Promise<Deduction[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('company_id', companyId)
      .eq('is_recurring', true)
      .eq('is_active', true)
      .lte('start_date', currentDate)
      .or(`end_date.is.null,end_date.gte.${currentDate}`);

    if (error) {
      throw new Error(`Failed to fetch recurring deductions: ${error.message}`);
    }

    return (data || []).map(record => this.fromDatabase(record));
  }
}

// Singleton instance
export const deductionDAO = new DeductionDAO();
