/**
 * Staff Service
 * Handles all staff-related operations with proper OOP structure
 */
import { BaseService } from './BaseService';
import { StaffMember } from '../types';
import { staffFromBackend, staffToBackend } from '../mappings/staff-mappings';

export class StaffService extends BaseService {
  private readonly tableName = 'staff_members';

  /**
   * Get all staff members for a company
   */
  async getStaffByCompany(companyId: string, options?: { activeOnly?: boolean }): Promise<StaffMember[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId);

      if (options?.activeOnly) {
        query = query.eq('status', 'active');
      }
      
      const { data, error } = await query.order('last_name', { ascending: true });

      if (error) {
        this.handleError(error, 'fetch staff members');
      }

      return (data || []).map(staffFromBackend);
    } catch (error) {
      this.handleError(error, 'fetch staff members');
      return [];
    }
  }

  /**
   * Get a single staff member by ID
   */
  async getById(id: string, companyId: string): Promise<StaffMember | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        this.handleError(error, 'fetch staff member');
        return null;
      }

      return staffFromBackend(data);
    } catch (error) {
      this.handleError(error, 'fetch staff member');
      return null;
    }
  }

  /**
   * Create a new staff member
   */
  async create(data: Omit<StaffMember, 'id'>): Promise<StaffMember> {
    try {
      this.validateRequired(data, ['firstName', 'lastName', 'email', 'employmentDate', 'companyId']);
      const backendData = staffToBackend(data);

      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert({
          ...backendData,
          status: data.status ?? 'active'
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'create staff member');
        throw error;
      }

      return staffFromBackend(result);
    } catch (error) {
      this.handleError(error, 'create staff member');
      throw error;
    }
  }

  /**
   * Update an existing staff member
   */
  async update(id: string, data: Partial<Omit<StaffMember, 'id' | 'companyId'>>): Promise<StaffMember> {
    try {
      const backendData = staffToBackend(data as StaffMember); // Cast needed for mapping

      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update(backendData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'update staff member');
        throw error;
      }

      return staffFromBackend(result);
    } catch (error) {
      this.handleError(error, 'update staff member');
      throw error;
    }
  }

  /**
   * Delete a staff member
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error, 'delete staff member');
      }
    } catch (error) {
      this.handleError(error, 'delete staff member');
    }
  }

  /**
   * Bulk delete staff members
   */
  async bulkDelete(ids: string[]): Promise<{ count: number }> {
    try {
      const { count, error } = await this.supabase
        .from(this.tableName)
        .delete()
        .in('id', ids);

      if (error) {
        this.handleError(error, 'bulk delete staff members');
      }
      return { count: count ?? 0 };
    } catch (error) {
      this.handleError(error, 'bulk delete staff members');
      return { count: 0 };
    }
  }
}
