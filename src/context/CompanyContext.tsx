'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  ReactNode, 
  useEffect, 
  useMemo,
  memo,
  useCallback 
} from 'react';
import { getSupabaseClientAsync } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface CompanyContextType {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (companyId: string | null) => void;
  selectedCompanyName: string | null;
  setSelectedCompanyName: (name: string | null) => void;
  isLoadingCompanyContext: boolean;
  canAccessSelectedCompany: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = memo(({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, canAccessCompany } = useAuth();
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyNameState] = useState<string | null>(null);
  const [isLoadingCompanyContext, setIsLoadingCompanyContext] = useState(true);

  const fetchCompanyFromProfile = useCallback(async () => {
    // Prevent Supabase calls during build/SSR
    if (typeof window === 'undefined') {
      setIsLoadingCompanyContext(false);
      return;
    }

    if (!isAuthenticated || !user) {
      setSelectedCompanyIdState(null);
      setSelectedCompanyNameState(null);
      setIsLoadingCompanyContext(false);
      return;
    }

    try {
      setIsLoadingCompanyContext(true);
      const supabase = await getSupabaseClientAsync();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Get selected company from user_metadata
        const selectedCompanyId = authUser.user_metadata?.selectedCompanyId || null;
        const selectedCompanyName = authUser.user_metadata?.selectedCompanyName || null;
        
        // Validate that the user can access the selected company
        if (selectedCompanyId && canAccessCompany(selectedCompanyId)) {
          setSelectedCompanyIdState(selectedCompanyId);
          setSelectedCompanyNameState(selectedCompanyName);
        } else {
          // If user can't access the selected company, clear the selection
          setSelectedCompanyIdState(null);
          setSelectedCompanyNameState(null);
          // Also clear it from metadata
          if (selectedCompanyId) {
            await supabase.auth.updateUser({
              data: { 
                ...authUser.user_metadata, 
                selectedCompanyId: null,
                selectedCompanyName: null
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching company from profile:', error);
    } finally {
      setIsLoadingCompanyContext(false);
    }
  }, [isAuthenticated, user, canAccessCompany]);

  useEffect(() => {
    fetchCompanyFromProfile();
  }, [fetchCompanyFromProfile]);

  const setSelectedCompanyId = useCallback(async (companyId: string | null) => {
    // Validate access before setting
    if (companyId && !canAccessCompany(companyId)) {
      console.warn('User does not have access to company:', companyId);
      return;
    }

    setSelectedCompanyIdState(companyId);
    
    // Prevent Supabase calls during build/SSR
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const supabase = await getSupabaseClientAsync();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { ...user.user_metadata, selectedCompanyId: companyId }
        });
      }
    } catch (error) {
      console.error('Error updating selected company:', error);
    }
  }, [canAccessCompany]);

  const setSelectedCompanyName = useCallback(async (name: string | null) => {
    setSelectedCompanyNameState(name);
    
    // Prevent Supabase calls during build/SSR
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const supabase = await getSupabaseClientAsync();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { ...user.user_metadata, selectedCompanyName: name }
        });
      }
    } catch (error) {
      console.error('Error updating selected company name:', error);
    }
  }, []);

  const canAccessSelectedCompany = useMemo(() => {
    return selectedCompanyId ? canAccessCompany(selectedCompanyId) : false;
  }, [selectedCompanyId, canAccessCompany]);

  const contextValue = useMemo(() => ({
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompanyName,
    setSelectedCompanyName,
    isLoadingCompanyContext,
    canAccessSelectedCompany,
  }), [selectedCompanyId, setSelectedCompanyId, selectedCompanyName, setSelectedCompanyName, isLoadingCompanyContext, canAccessSelectedCompany]);

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
});

CompanyProvider.displayName = 'CompanyProvider';

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};