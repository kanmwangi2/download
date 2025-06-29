import { BaseService } from './BaseService';

export interface StaffPaymentConfig {
  id: string;
  companyId: string;
  staffId: string;
  basicPay: number;
  paymentType: 'Gross' | 'Net';
  allowances: Record<string, number>;
}

export interface CreateStaffPaymentConfigData {
  companyId: string;
  staffId: string;
  basicPay: number;
  paymentType: 'Gross' | 'Net';
  allowances?: Record<string, number>;
}

export interface UpdateStaffPaymentConfigData {
  basicPay?: number;
  paymentType?: 'Gross' | 'Net';
  allowances?: Record<string, number>;
}

export class StaffPaymentConfigService extends BaseService {
  private readonly tableName = 'staff_payment_configs';

  async getByCompanyId(companyId: string): Promise<StaffPaymentConfig[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
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
        company_id: data.companyId,
        staff_id: data.staffId,
        basic_pay: data.basicPay,
        payment_type: data.paymentType,
        allowances: data.allowances || {},
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
      const dbData: Partial<Record<string, unknown>> = {};
      if (data.basicPay !== undefined) dbData.basic_pay = data.basicPay;
      if (data.paymentType !== undefined) dbData.payment_type = data.paymentType;
      if (data.allowances !== undefined) dbData.allowances = data.allowances;

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

  private mapFromDatabase(dbRow: unknown): StaffPaymentConfig {
    return {
      id: dbRow.id,
      companyId: dbRow.company_id,
      staffId: dbRow.staff_id,
      basicPay: dbRow.basic_pay,
      paymentType: dbRow.payment_type,
      allowances: dbRow.allowances || {},
    };
  }
}