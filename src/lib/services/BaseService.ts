/**
 * Base Service Class
 * Provides common functionality for all service classes including error handling and Supabase client access
 */
import { getSupabaseClient } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseService {
  protected supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
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
