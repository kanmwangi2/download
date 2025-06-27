'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  ReactNode, 
  useEffect, 
  useMemo,
  useCallback 
} from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClientAsync } from '@/lib/supabase';

export type UserRole = 'Primary Admin' | 'App Admin' | 'Company Admin' | 'Payroll Preparer' | 'Payroll Approver' | 'Employee';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  assignedCompanyIds: string[];
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  supabaseUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  canAccessCompany: (companyId: string) => boolean;
  hasUniversalAccess: () => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshUser = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      console.log('� AuthContext: Refreshing user');
      setIsLoading(true);
      
      const supabase = await getSupabaseClientAsync();
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error || !authUser) {
        console.log('🚫 AuthContext: No authenticated user');
        setUser(null);
        setSupabaseUser(null);
        return;
      }

      console.log('✅ AuthContext: Got authenticated user:', authUser.id);
      setSupabaseUser(authUser);

      // Get user profile from database
      let profile = null;
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.warn('❌ AuthContext: Error fetching user profile:', profileError);
        setUser(null);
        return;
      }

      if (existingProfile) {
        profile = existingProfile;
      } else {
        // Create user profile for new user
        console.log('🔄 AuthContext: Creating user profile for new user');
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: authUser.id,
            email: authUser.email,
            first_name: authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || '',
            last_name: authUser.user_metadata?.last_name || '',
            phone: authUser.user_metadata?.phone || '',
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ AuthContext: Error creating user profile:', createError);
          setUser(null);
          return;
        }

        profile = newProfile;
        console.log('✅ AuthContext: Created user profile');
      }

      if (!profile) {
        console.warn('❌ AuthContext: No user profile available');
        setUser(null);
        return;
      }

      // Get role from user metadata
      let role = authUser.user_metadata?.role as UserRole;
      if (!role) {
        // Check if this is the first user in the system
        try {
          const { data: existingProfiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('id')
            .limit(1);
          
          if (profilesError) {
            console.warn('Could not check existing profiles:', profilesError);
            role = 'Company Admin'; // Safe default
          } else if (!existingProfiles || existingProfiles.length === 0) {
            // First user - make them Primary Admin
            role = 'Primary Admin';
            console.log('🔄 AuthContext: First user detected, assigning Primary Admin role');
          } else {
            // Not first user - assign default role
            role = 'Company Admin';
            console.log('🔄 AuthContext: Assigning default Company Admin role');
          }
          
          // Update user metadata with the role
          await supabase.auth.updateUser({
            data: { 
              ...authUser.user_metadata,
              role 
            }
          });
        } catch (error) {
          console.error('❌ AuthContext: Error assigning role:', error);
          role = 'Company Admin'; // Safe fallback
        }
      }

      // Get assigned companies
      let assignedCompanyIds: string[] = [];
      if (role === 'Primary Admin' || role === 'App Admin') {
        // Admins have access to all companies
        const { data: companies } = await supabase
          .from('companies')
          .select('id');
        assignedCompanyIds = companies ? companies.map((c: any) => c.id) : ['*'];
      } else {
        // Get from assignments table
        const { data: assignments } = await supabase
          .from('user_company_assignments')
          .select('company_id')
          .eq('user_id', authUser.id);
        assignedCompanyIds = assignments ? assignments.map((a: any) => a.company_id) : [];
      }

      const authenticatedUser: AuthenticatedUser = {
        id: authUser.id,
        email: authUser.email || profile.email,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
        role,
        assignedCompanyIds,
      };

      console.log('✅ AuthContext: Created user object:', {
        userId: authenticatedUser.id,
        role: authenticatedUser.role,
        companyCount: authenticatedUser.assignedCompanyIds.length
      });

      setUser(authenticatedUser);
    } catch (error) {
      console.error('❌ AuthContext: Error refreshing user:', error);
      setUser(null);
      setSupabaseUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const supabase = await getSupabaseClientAsync();
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
    } catch (error) {
      console.error('❌ AuthContext: Error during logout:', error);
    }
  }, []);

  const canAccessCompany = useCallback((companyId: string): boolean => {
    if (!user || !companyId) return false;
    if (user.role === 'Primary Admin' || user.role === 'App Admin') return true;
    return user.assignedCompanyIds.includes(companyId) || user.assignedCompanyIds.includes('*');
  }, [user]);

  const hasUniversalAccess = useCallback((): boolean => {
    if (!user) return false;
    return user.role === 'Primary Admin' || user.role === 'App Admin';
  }, [user]);

  // Initialize auth state
  useEffect(() => {
    if (isInitialized) return;

    const initializeAuth = async (): Promise<(() => void) | undefined> => {
      try {
        console.log('🔄 AuthContext: Initializing auth');
        await refreshUser();
        
        const supabase = await getSupabaseClientAsync();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: any, session: any) => {
            console.log('🔄 AuthContext: Auth state change:', event);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              await refreshUser();
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setSupabaseUser(null);
              setIsLoading(false);
            }
          }
        );

        setIsInitialized(true);
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('❌ AuthContext: Error initializing auth:', error);
        setIsLoading(false);
        return undefined;
      }
    };

    let cleanup: (() => void) | undefined;
    initializeAuth().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [isInitialized, refreshUser]);

  const contextValue = useMemo(() => ({
    user,
    supabaseUser,
    isLoading,
    isAuthenticated: !!user,
    refreshUser,
    canAccessCompany,
    hasUniversalAccess,
    logout,
  }), [user, supabaseUser, isLoading, refreshUser, canAccessCompany, hasUniversalAccess, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
