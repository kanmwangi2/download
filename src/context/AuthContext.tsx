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
import { AuthenticatedUser, UserService } from '@/lib/services/UserService';
import { getSupabaseClientAsync } from '@/lib/supabase';

interface AuthContextType {
  user: AuthenticatedUser | null;
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
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = await getSupabaseClientAsync();
      const userService = new UserService(); // UserService extends BaseService which handles supabase internally
      const currentUser = await userService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const supabase = await getSupabaseClientAsync();
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  const canAccessCompany = useCallback((companyId: string): boolean => {
    if (!user || !companyId) return false;
    return UserService.canAccessCompany(user, companyId);
  }, [user]);

  const hasUniversalAccess = useCallback((): boolean => {
    if (!user) return false;
    return UserService.hasUniversalAccess(user);
  }, [user]);

  useEffect(() => {
    refreshUser();

    // Listen for auth state changes
    const setupAuthListener = async () => {
      try {
        const supabase = await getSupabaseClientAsync();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: any, session: any) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              await refreshUser();
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setIsLoading(false);
            }
          }
        );

        return subscription;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        return null;
      }
    };

    let cleanup: any = null;
    setupAuthListener().then((subscription) => {
      cleanup = subscription;
    });

    return () => {
      if (cleanup?.unsubscribe) {
        cleanup.unsubscribe();
      }
    };
  }, [refreshUser]);

  const contextValue = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    refreshUser,
    canAccessCompany,
    hasUniversalAccess,
    logout,
  }), [user, isLoading, refreshUser, canAccessCompany, hasUniversalAccess, logout]);

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
