/**
 * Staff DAO - Data Access Object for staff members
 * Extends BaseDAO with staff-specific operations
 */

import { BaseDAO, BaseEntity } from './base-dao';

export interface Staff extends BaseEntity {
  id: string;
  companyId: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  staffRssbNumber?: string;
  employeeCategory?: 'P' | 'C' | 'E' | 'S';
  gender?: 'Male' | 'Female' | 'Other';
  birthDate?: string;
  department?: string;
  designation?: string;
  employmentDate?: string;
  nationality?: string;
  idPassportNumber?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  bankName?: string;
  bankCode?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  keyContactName?: string;
  keyContactRelationship?: string;
  keyContactPhone?: string;
  status: 'Active' | 'Inactive';
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export class StaffDAO extends BaseDAO<Staff> {
  constructor() {
    super('staff_members', true); // Company-scoped table
  }

  protected fromDatabase(record: any): Staff {
    return {
      id: record.id,
      companyId: record.company_id,
      staffNumber: record.staff_number || '',
      firstName: record.first_name || '',
      lastName: record.last_name || '',
      email: record.email,
      phone: record.phone,
      staffRssbNumber: record.staff_rssb_number,
      employeeCategory: record.employee_category,
      gender: record.gender,
      birthDate: record.birth_date,
      department: record.department,
      designation: record.designation,
      employmentDate: record.employment_date,
      nationality: record.nationality,
      idPassportNumber: record.id_passport_number,
      province: record.province,
      district: record.district,
      sector: record.sector,
      cell: record.cell,
      village: record.village,
      bankName: record.bank_name,
      bankCode: record.bank_code,
      bankAccountNumber: record.bank_account_number,
      bankBranch: record.bank_branch,
      keyContactName: record.key_contact_name,
      keyContactRelationship: record.key_contact_relationship,
      keyContactPhone: record.key_contact_phone,
      status: record.status || 'Active',
      customFields: record.custom_fields || {},
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected toDatabase(entity: Partial<Staff>): any {
    return {
      ...(entity.id && { id: entity.id }),
      ...(entity.companyId && { company_id: entity.companyId }),
      ...(entity.staffNumber !== undefined && { staff_number: entity.staffNumber }),
      ...(entity.firstName !== undefined && { first_name: entity.firstName }),
      ...(entity.lastName !== undefined && { last_name: entity.lastName }),
      ...(entity.email !== undefined && { email: entity.email }),
      ...(entity.phone !== undefined && { phone: entity.phone }),
      ...(entity.staffRssbNumber !== undefined && { staff_rssb_number: entity.staffRssbNumber }),
      ...(entity.employeeCategory !== undefined && { employee_category: entity.employeeCategory }),
      ...(entity.gender !== undefined && { gender: entity.gender }),
      ...(entity.birthDate !== undefined && { birth_date: entity.birthDate }),
      ...(entity.department !== undefined && { department: entity.department }),
      ...(entity.designation !== undefined && { designation: entity.designation }),
      ...(entity.employmentDate !== undefined && { employment_date: entity.employmentDate }),
      ...(entity.nationality !== undefined && { nationality: entity.nationality }),
      ...(entity.idPassportNumber !== undefined && { id_passport_number: entity.idPassportNumber }),
      ...(entity.province !== undefined && { province: entity.province }),
      ...(entity.district !== undefined && { district: entity.district }),
      ...(entity.sector !== undefined && { sector: entity.sector }),
      ...(entity.cell !== undefined && { cell: entity.cell }),
      ...(entity.village !== undefined && { village: entity.village }),
      ...(entity.bankName !== undefined && { bank_name: entity.bankName }),
      ...(entity.bankCode !== undefined && { bank_code: entity.bankCode }),
      ...(entity.bankAccountNumber !== undefined && { bank_account_number: entity.bankAccountNumber }),
      ...(entity.bankBranch !== undefined && { bank_branch: entity.bankBranch }),
      ...(entity.keyContactName !== undefined && { key_contact_name: entity.keyContactName }),
      ...(entity.keyContactRelationship !== undefined && { key_contact_relationship: entity.keyContactRelationship }),
      ...(entity.keyContactPhone !== undefined && { key_contact_phone: entity.keyContactPhone }),
      ...(entity.status !== undefined && { status: entity.status }),
      ...(entity.customFields !== undefined && { custom_fields: entity.customFields }),
    };
  }

  /**
   * Find staff by status
   */
  async findByStatus(status: 'Active' | 'Inactive', companyId: string): Promise<Staff[]> {
    return this.findWithFilters({ status }, companyId);
  }

  /**
   * Find staff by department
   */
  async findByDepartment(department: string, companyId: string): Promise<Staff[]> {
    return this.findWithFilters({ department }, companyId);
  }

  /**
   * Find staff by employee category
   */
  async findByEmployeeCategory(category: 'P' | 'C' | 'E' | 'S', companyId: string): Promise<Staff[]> {
    return this.findWithFilters({ employee_category: category }, companyId);
  }

  /**
   * Search staff by name or staff number
   */
  async searchByNameOrStaffNumber(searchTerm: string, companyId: string): Promise<Staff[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('company_id', companyId)
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,staff_number.ilike.%${searchTerm}%`);

    if (error) {
      throw new Error(`Failed to search staff: ${error.message}`);
    }

    return (data || []).map(record => this.fromDatabase(record));
  }

  /**
   * Get active staff count for a company
   */
  async getActiveStaffCount(companyId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'Active');

    if (error) {
      throw new Error(`Failed to count active staff: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get staff with their payment configurations
   */
  async getStaffWithPaymentConfigs(companyId: string): Promise<Array<Staff & { paymentConfig?: any }>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        staff_payment_configs (*)
      `)
      .eq('company_id', companyId);

    if (error) {
      throw new Error(`Failed to fetch staff with payment configs: ${error.message}`);
    }

    return (data || []).map(record => ({
      ...this.fromDatabase(record),
      paymentConfig: record.staff_payment_configs?.[0] || null
    }));
  }
}

// Singleton instance
export const staffDAO = new StaffDAO();
