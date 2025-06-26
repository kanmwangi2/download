/**
 * Base Service Class
 * Provides common functionality for all service classes including error handling and Supabase client access
 */
import { getSupabaseClientAsync } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseService {
  private _supabase: SupabaseClient | null = null;
  private _initializationPromise: Promise<void> | null = null;

  constructor() {
    // Start initialization but don't wait for it
    this._initializationPromise = this.initializeSupabase();
  }

  /**
   * Initialize Supabase client asynchronously
   */
  private async initializeSupabase(): Promise<void> {
    try {
      this._supabase = await getSupabaseClientAsync();
      console.log(`${this.constructor.name}: Supabase client initialized successfully`);
    } catch (error) {
      console.error(`${this.constructor.name}: Failed to initialize Supabase client:`, error);
      // Create a basic mock client to prevent "undefined" errors
      this._supabase = {
        from: () => ({
          select: () => Promise.resolve({ data: [], error: { message: 'Database connection unavailable' } }),
          insert: () => Promise.resolve({ data: null, error: { message: 'Database connection unavailable' } }),
          update: () => Promise.resolve({ data: null, error: { message: 'Database connection unavailable' } }),
          delete: () => Promise.resolve({ data: null, error: { message: 'Database connection unavailable' } }),
          upsert: () => Promise.resolve({ data: null, error: { message: 'Database connection unavailable' } }),
        })
      } as any;
    }
  }

  /**
   * Ensure Supabase client is initialized before use
   */
  protected async ensureInitialized(): Promise<void> {
    if (this._initializationPromise) {
      await this._initializationPromise;
      this._initializationPromise = null;
    }
    
    if (!this._supabase) {
      await this.initializeSupabase();
    }
  }

  /**
   * Get the initialized Supabase client
  /**
   * Get the initialized Supabase client
   */
  protected get supabase(): SupabaseClient {
    if (!this._supabase) {
      throw new Error(`${this.constructor.name}: Supabase client not initialized. Call ensureInitialized() first.`);
    }
    return this._supabase;
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
