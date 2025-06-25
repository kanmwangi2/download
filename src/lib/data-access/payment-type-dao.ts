/**
 * Payment Types DAO - Data Access Object for payment types
 * Extends BaseDAO with payment type-specific operations
 */

import { BaseDAO, BaseEntity } from './base-dao';

export interface PaymentType extends BaseEntity {
  id: string;
  companyId: string;
  name: string;
  type: 'Gross' | 'Net';
  orderNumber: number;
  isFixedName: boolean;
  isDeletable: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export class PaymentTypeDAO extends BaseDAO<PaymentType> {
  constructor() {
    super('payment_types', true); // Company-scoped table
  }

  protected fromDatabase(record: any): PaymentType {
    return {
      id: record.id,
      companyId: record.company_id,
      name: record.name || '',
      type: record.type || 'Gross',
      orderNumber: record.order_number || 0,
      isFixedName: record.is_fixed_name || false,
      isDeletable: record.is_deletable || true,
      description: record.description,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected toDatabase(entity: Partial<PaymentType>): any {
    return {
      ...(entity.id && { id: entity.id }),
      ...(entity.companyId && { company_id: entity.companyId }),
      ...(entity.name !== undefined && { name: entity.name }),
      ...(entity.type !== undefined && { type: entity.type }),
      ...(entity.orderNumber !== undefined && { order_number: entity.orderNumber }),
      ...(entity.isFixedName !== undefined && { is_fixed_name: entity.isFixedName }),
      ...(entity.isDeletable !== undefined && { is_deletable: entity.isDeletable }),
      ...(entity.description !== undefined && { description: entity.description }),
    };
  }

  /**
   * Find payment types by type (Gross/Net)
   */
  async findByType(type: 'Gross' | 'Net', companyId: string): Promise<PaymentType[]> {
    return this.findWithFilters({ type }, companyId);
  }

  /**
   * Get payment types ordered by order number
   */
  async findAllOrdered(companyId: string): Promise<PaymentType[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('company_id', companyId)
      .order('order_number', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch ordered payment types: ${error.message}`);
    }

    return (data || []).map(record => this.fromDatabase(record));
  }

  /**
   * Find deletable payment types
   */
  async findDeletable(companyId: string): Promise<PaymentType[]> {
    return this.findWithFilters({ is_deletable: true }, companyId);
  }

  /**
   * Update order numbers for payment types
   */
  async updateOrderNumbers(orderUpdates: Array<{ id: string; orderNumber: number }>): Promise<void> {
    const updates = orderUpdates.map(update => ({
      id: update.id,
      order_number: update.orderNumber
    }));

    const { error } = await this.supabase
      .from(this.tableName)
      .upsert(updates);

    if (error) {
      throw new Error(`Failed to update payment type order numbers: ${error.message}`);
    }
  }

  /**
   * Get next order number for a company
   */
  async getNextOrderNumber(companyId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('order_number')
      .eq('company_id', companyId)
      .order('order_number', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to get next order number: ${error.message}`);
    }

    return data && data.length > 0 ? ((data[0]?.order_number || 0) + 1) : 1;
  }

  /**
   * Initialize default payment types for a company
   */
  async initializeDefaultTypes(companyId: string): Promise<PaymentType[]> {
    const defaultTypes = [
      {
        companyId,
        name: 'Basic Pay',
        type: 'Gross' as const,
        orderNumber: 1,
        isFixedName: true,
        isDeletable: false,
        description: 'Base salary amount'
      },
      {
        companyId,
        name: 'Transport Allowance',
        type: 'Gross' as const,
        orderNumber: 2,
        isFixedName: true,
        isDeletable: false,
        description: 'Transportation allowance'
      }
    ];

    return this.bulkCreate(defaultTypes);
  }
}

// Singleton instance
export const paymentTypeDAO = new PaymentTypeDAO();
