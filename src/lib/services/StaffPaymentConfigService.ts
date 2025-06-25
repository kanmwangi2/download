import { BaseService } from './BaseService';

export interface StaffPaymentConfig {
  id: string;
  staffId: string;
  paymentTypeId: string;
  amount: number;
  currency: string;
  isActive: boolean;
  effectiveDate: string;
  endDate?: string;
}

export interface CreateStaffPaymentConfigData {
  staffId: string;
  paymentTypeId: string;
  amount: number;
  currency?: string;
  isActive?: boolean;
  effectiveDate: string;
  endDate?: string;
}

export interface UpdateStaffPaymentConfigData {
  amount?: number;
  currency?: string;
  isActive?: boolean;
  effectiveDate?: string;
  endDate?: string;
}

export class StaffPaymentConfigService extends BaseService {
  private readonly tableName = 'staff_payment_configs';

  async getByCompanyId(companyId: string): Promise<StaffPaymentConfig[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          id,
          staff_id,
          payment_type_id,
          amount,
          currency,
          is_active,
          effective_date,
          end_date
        `)
        .eq('company_id', companyId);

      if (error) {
        this.handleError(error, 'fetch staff payment configs');
      }

      return (data || []).map(this.mapFromDatabase);
    } catch (error) {
      this.handleError(error, 'fetch staff payment configs');
      return [];
    }
  }

  async create(data: CreateStaffPaymentConfigData): Promise<StaffPaymentConfig> {
    try {
      const dbData = {
        staff_id: data.staffId,
        payment_type_id: data.paymentTypeId,
        amount: data.amount,
        currency: data.currency || 'RWF',
        is_active: data.isActive ?? true,
        effective_date: data.effectiveDate,
        end_date: data.endDate
      };

      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(dbData)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'create staff payment config');
      }

      return this.mapFromDatabase(result);
    } catch (error) {
      this.handleError(error, 'create staff payment config');
      throw error;
    }
  }

  async update(id: string, data: UpdateStaffPaymentConfigData): Promise<StaffPaymentConfig> {
    try {
      const dbData: any = {};
      if (data.amount !== undefined) dbData.amount = data.amount;
      if (data.currency !== undefined) dbData.currency = data.currency;
      if (data.isActive !== undefined) dbData.is_active = data.isActive;
      if (data.effectiveDate !== undefined) dbData.effective_date = data.effectiveDate;
      if (data.endDate !== undefined) dbData.end_date = data.endDate;

      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'update staff payment config');
      }

      return this.mapFromDatabase(result);
    } catch (error) {
      this.handleError(error, 'update staff payment config');
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error, 'delete staff payment config');
      }
    } catch (error) {
      this.handleError(error, 'delete staff payment config');
      throw error;
    }
  }

  async deleteByStaffId(staffId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('staff_id', staffId);

      if (error) {
        this.handleError(error, 'delete staff payment configs by staff ID');
      }
    } catch (error) {
      this.handleError(error, 'delete staff payment configs by staff ID');
      throw error;
    }
  }

  private mapFromDatabase(dbRow: any): StaffPaymentConfig {
    return {
      id: dbRow.id,
      staffId: dbRow.staff_id,
      paymentTypeId: dbRow.payment_type_id,
      amount: dbRow.amount,
      currency: dbRow.currency,
      isActive: dbRow.is_active,
      effectiveDate: dbRow.effective_date,
      endDate: dbRow.end_date
    };
  }
}