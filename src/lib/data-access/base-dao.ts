/**
 * Base Data Access Object (DAO) class for Supabase operations
 * Implements common CRUD operations that all entities can inherit
 */

import { getSupabaseClientAsync } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface BaseEntity {
  id: string;
  companyId?: string;
  company_id?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface CRUDOperations<T extends BaseEntity> {
  findAll(companyId?: string): Promise<T[]>;
  findById(id: string, companyId?: string): Promise<T | null>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  bulkCreate(entities: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<T[]>;
  bulkUpdate(entities: Partial<T>[]): Promise<T[]>;
  bulkDelete(ids: string[]): Promise<void>;
}

export abstract class BaseDAO<T extends BaseEntity> implements CRUDOperations<T> {
  private _supabase: SupabaseClient | null = null;
  protected tableName: string;
  protected companyScoped: boolean;

  constructor(tableName: string, companyScoped: boolean = true) {
    this.tableName = tableName;
    this.companyScoped = companyScoped;
  }

  /**
   * Get Supabase client with lazy initialization
   */
  protected async getSupabase(): Promise<SupabaseClient> {
    if (!this._supabase) {
      this._supabase = await getSupabaseClientAsync();
    }
    return this._supabase as SupabaseClient;
  }

  /**
   * Transform database record to frontend entity
   */
  protected abstract fromDatabase(record: any): T;

  /**
   * Transform frontend entity to database record
   */
  protected abstract toDatabase(entity: Partial<T>): any;

  /**
   * Build base query with company scoping if needed
   */
  protected async buildBaseQuery(companyId?: string) {
    const supabase = await this.getSupabase();
    let query = supabase.from(this.tableName).select('*');
    
    if (this.companyScoped && companyId) {
      query = query.eq('company_id', companyId);
    }
    
    return query;
  }

  async findAll(companyId?: string): Promise<T[]> {
    const query = await this.buildBaseQuery(companyId);
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
    }
    
    return (data || []).map((record: any) => this.fromDatabase(record));
  }

  async findById(id: string, companyId?: string): Promise<T | null> {
    const supabase = await this.getSupabase();
    let query = supabase.from(this.tableName).select('*').eq('id', id);
    
    if (this.companyScoped && companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch ${this.tableName} by ID: ${error.message}`);
    }
    
    return data ? this.fromDatabase(data) : null;
  }

  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const supabase = await this.getSupabase();
    const dbEntity = this.toDatabase(entity as Partial<T>);
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(dbEntity)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }
    
    return this.fromDatabase(data);
  }

  async update(id: string, entity: Partial<T>): Promise<T> {
    const supabase = await this.getSupabase();
    const dbEntity = this.toDatabase(entity);
    const { data, error } = await supabase
      .from(this.tableName)
      .update(dbEntity)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }
    
    return this.fromDatabase(data);
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }
  }

  async bulkCreate(entities: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<T[]> {
    const supabase = await this.getSupabase();
    const dbEntities = entities.map(entity => this.toDatabase(entity as Partial<T>));
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(dbEntities)
      .select();
    
    if (error) {
      throw new Error(`Failed to bulk create ${this.tableName}: ${error.message}`);
    }
    
    return (data || []).map(record => this.fromDatabase(record));
  }

  async bulkUpdate(entities: Partial<T>[]): Promise<T[]> {
    const supabase = await this.getSupabase();
    const dbEntities = entities.map(entity => this.toDatabase(entity));
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(dbEntities)
      .select();
    
    if (error) {
      throw new Error(`Failed to bulk update ${this.tableName}: ${error.message}`);
    }
    
    return (data || []).map(record => this.fromDatabase(record));
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .in('id', ids);
    
    if (error) {
      throw new Error(`Failed to bulk delete ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Find entities with custom filters
   */
  async findWithFilters(filters: Record<string, any>, companyId?: string): Promise<T[]> {
    const supabase = await this.getSupabase();
    let query = supabase.from(this.tableName).select('*');
    
    if (this.companyScoped && companyId) {
      query = query.eq('company_id', companyId);
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch ${this.tableName} with filters: ${error.message}`);
    }
    
    return (data || []).map((record: any) => this.fromDatabase(record));
  }

  /**
   * Count entities
   */
  async count(companyId?: string): Promise<number> {
    const supabase = await this.getSupabase();
    let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true });
    
    if (this.companyScoped && companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { count, error } = await query;
    
    if (error) {
      throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
    }
    
    return count || 0;
  }
}
