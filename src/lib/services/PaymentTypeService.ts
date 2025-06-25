/**
 * Payment Types Service
 * Handles all payment type and staff payment configuration operations.
 */
import { BaseService } from './BaseService';
import { PaymentType, StaffPayment } from '../types';
import { paymentTypeFromBackend, paymentTypeToBackend, staffPaymentFromBackend, staffPaymentToBackend } from '../mappings/payment-mappings';

export class PaymentTypeService extends BaseService {
  private readonly paymentTypeTableName = 'payment_types';
  private readonly staffPaymentTableName = 'staff_payments';

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

  // --- Staff Payment Methods ---

  async getStaffPayments(staffId: string): Promise<StaffPayment[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.staffPaymentTableName)
        .select('*')
        .eq('staff_id', staffId);

      if (error) {
        this.handleError(error, 'fetch staff payments');
      }

      return (data || []).map(staffPaymentFromBackend);
    } catch (error) {
      this.handleError(error, 'fetch staff payments');
      return [];
    }
  }

  async addStaffPayment(data: Omit<StaffPayment, 'id'>): Promise<StaffPayment> {
    try {
      this.validateRequired(data, ['staffId', 'paymentTypeId', 'amount', 'effectiveDate']);
      const backendData = staffPaymentToBackend(data);

      const { data: result, error } = await this.supabase
        .from(this.staffPaymentTableName)
        .insert(backendData)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'add staff payment');
        throw error;
      }

      return staffPaymentFromBackend(result);
    } catch (error) {
      this.handleError(error, 'add staff payment');
      throw error;
    }
  }

  async updateStaffPayment(id: string, data: Partial<Omit<StaffPayment, 'id' | 'staffId'>>): Promise<StaffPayment> {
    try {
      const backendData = staffPaymentToBackend(data as StaffPayment);

      const { data: result, error } = await this.supabase
        .from(this.staffPaymentTableName)
        .update(backendData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'update staff payment');
        throw error;
      }

      return staffPaymentFromBackend(result);
    } catch (error) {
      this.handleError(error, 'update staff payment');
      throw error;
    }
  }

  async removeStaffPayment(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.staffPaymentTableName)
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error, 'remove staff payment');
      }
    } catch (error) {
      this.handleError(error, 'remove staff payment');
    }
  }
}
