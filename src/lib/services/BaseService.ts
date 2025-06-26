/**
 * Base Service Class
 * Provides common functionality for all service classes including error handling and Supabase client access
 */
import { getSupabaseClientAsync } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseService {
  private _supabase: SupabaseClient | null = null;

  constructor() {
    // Lazy initialization - client will be created on first access
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
   * Handle and format errors consistently across all services
   */
  protected handleError(error: any, operation: string): never {
    console.error(`${this.constructor.name} - ${operation}:`, error);
    const message = error?.message || `Failed to ${operation}`;
    throw new Error(message);
  }

  /**
   * Validate required fields
   */
  protected validateRequired(data: Record<string, any>, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }
}
