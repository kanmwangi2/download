/**
 * Payment Types Service
 * Handles all payment type and staff payment configuration operations.
 */
import { BaseService } from './BaseService';
import { PaymentType, StaffPaymentConfig } from '../types';
import { paymentTypeFromBackend, paymentTypeToBackend } from '../mappings/payment-mappings';

export class PaymentTypeService extends BaseService {
  private readonly paymentTypeTableName = 'payment_types';
  

  // --- Payment Type Methods ---

  async getPaymentTypesByCompany(companyId: string): Promise<PaymentType[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.paymentTypeTableName)
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) {
        this.handleError(error, 'fetch payment types');
      }

      return (data || []).map(paymentTypeFromBackend);
    } catch (error) {
      this.handleError(error, 'fetch payment types');
      return [];
    }
  }

  // Alias for backwards compatibility
  async getByCompanyId(companyId: string): Promise<PaymentType[]> {
    return this.getPaymentTypesByCompany(companyId);
  }

  async getById(id: string): Promise<PaymentType | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.paymentTypeTableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        this.handleError(error, 'fetch payment type');
        return null;
      }

      return paymentTypeFromBackend(data);
    } catch (error) {
      this.handleError(error, 'fetch payment type');
      return null;
    }
  }

  async create(data: Omit<PaymentType, 'id'>): Promise<PaymentType> {
    try {
      this.validateRequired(data, ['name', 'companyId', 'type']);
      const backendData = paymentTypeToBackend(data);
      
      const { data: result, error } = await this.supabase
        .from(this.paymentTypeTableName)
        .insert(backendData)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'create payment type');
        throw error;
      }

      return paymentTypeFromBackend(result);
    } catch (error) {
      this.handleError(error, 'create payment type');
      throw error;
    }
  }

  async update(id: string, data: Partial<Omit<PaymentType, 'id' | 'companyId'>>): Promise<PaymentType> {
    try {
      const backendData = paymentTypeToBackend(data as PaymentType);
      const { data: result, error } = await this.supabase
        .from(this.paymentTypeTableName)
        .update(backendData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'update payment type');
        throw error;
      }

      return paymentTypeFromBackend(result);
    } catch (error) {
      this.handleError(error, 'update payment type');
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.paymentTypeTableName)
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error, 'delete payment type');
      }
    } catch (error) {
      this.handleError(error, 'delete payment type');
    }
  }
}
