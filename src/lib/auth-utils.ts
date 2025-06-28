
import { getServerSupabaseClient } from './supabase-server';

export async function getCurrentUser() {
  const supabase = getServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = getServerSupabaseClient();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*, companies:company_users(company_id, company_name:companies(name)) ')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return profile;
}
