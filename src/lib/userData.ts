// User and company type definitions for Cheetah Payroll

export type UserRole = "Primary Admin" | "App Admin" | "Company Admin" | "Payroll Approver" | "Payroll Preparer";

export interface Company {
  id: string;
  name: string;
  tin_number?: string;
  address?: string;
  email?: string;
  phone?: string;
  primary_business?: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  assigned_company_ids: string[];
  phone?: string;
}

export const defaultNewUserFormData: Omit<User, 'id'> = {
  first_name: "",
  last_name: "",
  email: "",
  role: "Payroll Preparer",
  assigned_company_ids: [],
  phone: "",
};

// Import centralized case conversion utilities
export { userToBackend, userFromBackend } from './case-conversion';

import { getSupabaseClientAsync } from './supabase';

/**
 * Ensures a user profile exists for the current authenticated user.
 * Call this after login or on app load.
 */
export async function ensureUserProfile() {
  try {
    const supabase = await getSupabaseClientAsync();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user in ensureUserProfile:', userError);
      return;
    }
    
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (!existingProfile) {
      // Create profile for new user
      const emailUsername = user.email?.split('@')[0] || '';
      const firstName = user.user_metadata?.first_name || emailUsername;
      const lastName = user.user_metadata?.last_name || '';
      
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          phone: user.user_metadata?.phone || '',
        });
      
      if (insertError) {
        console.error('Error creating user profile:', insertError);
      } else {
        // console.log('✅ User profile created successfully');
      }
    }
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
  }
}
