/**
 * CustomFieldDefinitionService
 * Service for managing custom field definitions following OOP principles
 */
import { BaseService } from './BaseService';
import type { CustomFieldDefinition } from '@/lib/types/custom-fields';

export class CustomFieldDefinitionService extends BaseService {
  private readonly tableName = 'custom_field_definitions';

  /**
   * Get all custom field definitions for a company
   */
  async getByCompanyId(companyId: string): Promise<CustomFieldDefinition[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .order('order_index');

      if (error) throw error;

      // Convert to frontend format
      return (data || []).map(cfd => ({
        id: cfd.id,
        companyId: cfd.company_id,
        name: cfd.name,
        type: cfd.type,
        orderNumber: cfd.order_index,
        isDeletable: cfd.is_deletable ?? true
      }));
    } catch (error) {
      this.handleError(error, 'fetch custom field definitions');
      return [];
    }
  }

  /**
   * Get custom field definition by ID
   */
  async getById(id: string): Promise<CustomFieldDefinition | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) return null;

      // Convert to frontend format
      return {
        id: data.id,
        companyId: data.company_id,
        name: data.name,
        type: data.type,
        orderNumber: data.order_index,
        isDeletable: data.is_deletable ?? true
      };
    } catch (error) {
      this.handleError(error, 'fetch custom field definition');
      return null;
    }
  }

  /**
   * Create a new custom field definition
   */
  async create(customFieldDefinition: Omit<CustomFieldDefinition, 'id'>): Promise<CustomFieldDefinition | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert({
          company_id: customFieldDefinition.companyId,
          name: customFieldDefinition.name,
          type: customFieldDefinition.type,
          order_index: customFieldDefinition.orderNumber,
          is_deletable: customFieldDefinition.isDeletable
        })
        .select()
        .single();

      if (error) throw error;

      // Convert to frontend format
      return {
        id: data.id,
        companyId: data.company_id,
        name: data.name,
        type: data.type,
        orderNumber: data.order_index,
        isDeletable: data.is_deletable ?? true
      };
    } catch (error) {
      this.handleError(error, 'create custom field definition');
      return null;
    }
  }

  /**
   * Update a custom field definition
   */
  async update(id: string, updates: Partial<Omit<CustomFieldDefinition, 'id'>>): Promise<CustomFieldDefinition | null> {
    try {
      const updateData: any = {};
      
      if (updates.companyId !== undefined) updateData.company_id = updates.companyId;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.orderNumber !== undefined) updateData.order_index = updates.orderNumber;
      if (updates.isDeletable !== undefined) updateData.is_deletable = updates.isDeletable;

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Convert to frontend format
      return {
        id: data.id,
        companyId: data.company_id,
        name: data.name,
        type: data.type,
        orderNumber: data.order_index,
        isDeletable: data.is_deletable ?? true
      };
    } catch (error) {
      this.handleError(error, 'update custom field definition');
      return null;
    }
  }

  /**
   * Delete a custom field definition
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      this.handleError(error, 'delete custom field definition');
      return false;
    }
  }

  /**
   * Delete all custom field definitions for a company
   */
  async deleteByCompanyId(companyId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('company_id', companyId);

      if (error) throw error;
      return true;
    } catch (error) {
      this.handleError(error, 'delete custom field definitions for company');
      return false;
    }
  }
}
