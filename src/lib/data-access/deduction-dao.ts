/**
 * Deduction DAO - Data Access Object for staff deductions
 * Extends BaseDAO with deduction-specific operations
 */

import { BaseDAO, BaseEntity } from './base-dao';

export interface Deduction extends BaseEntity {
  id: string;
  companyId: string;
  staffId: string;
  deductionType: string;
  amount: number;
  isPercentage: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class DeductionDAO extends BaseDAO<Deduction> {
  constructor() {
    super('staff_deductions', true); // Company-scoped table
  }

  protected fromDatabase(record: unknown): Deduction {
    return {
      id: record.id,
      companyId: record.company_id,
      staffId: record.staff_id,
      deductionType: record.deduction_type,
      amount: record.amount,
      isPercentage: record.is_percentage,
      isActive: record.is_active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected toDatabase(entity: Partial<Deduction>): unknown {
    return {
      ...(entity.id && { id: entity.id }),
      ...(entity.companyId && { company_id: entity.companyId }),
      ...(entity.staffId !== undefined && { staff_id: entity.staffId }),
      ...(entity.deductionType !== undefined && { deduction_type: entity.deductionType }),
      ...(entity.amount !== undefined && { amount: entity.amount }),
      ...(entity.isPercentage !== undefined && { is_percentage: entity.isPercentage }),
      ...(entity.isActive !== undefined && { is_active: entity.isActive }),
    };
  }

  /**
   * Find deductions by staff member
   */
  async findByStaff(staffId: string, companyId: string): Promise<Deduction[]> {
    return this.findWithFilters({ staff_id: staffId }, companyId);
  }
}

// Singleton instance
export const deductionDAO = new DeductionDAO();
