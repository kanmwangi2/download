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

interface CompanyContextType {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (companyId: string | null) => void;
  selectedCompanyName: string | null;
  setSelectedCompanyName: (name: string | null) => void;
  isLoadingCompanyContext: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = memo(({ children }: { children: ReactNode }) => {
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyNameState] = useState<string | null>(null);
  const [isLoadingCompanyContext, setIsLoadingCompanyContext] = useState(true);

  const fetchCompanyFromProfile = useCallback(async () => {
    // Prevent Supabase calls during build/SSR
    if (typeof window === 'undefined') {
      setIsLoadingCompanyContext(false);
      return;
    }

    try {
      setIsLoadingCompanyContext(true);
      const supabase = await getSupabaseClientAsync();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Assume user_metadata contains selectedCompanyId and selectedCompanyName
        setSelectedCompanyIdState(user.user_metadata?.selectedCompanyId || null);
        setSelectedCompanyNameState(user.user_metadata?.selectedCompanyName || null);
      }
    } catch (error) {
      console.error('Error fetching company from profile:', error);
    } finally {
      setIsLoadingCompanyContext(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyFromProfile();
  }, []); // Remove fetchCompanyFromProfile dependency to prevent infinite loop

  const setSelectedCompanyId = useCallback(async (companyId: string | null) => {
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
  }, []);

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

  const contextValue = useMemo(() => ({
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompanyName,
    setSelectedCompanyName,
    isLoadingCompanyContext
  }), [selectedCompanyId, setSelectedCompanyId, selectedCompanyName, setSelectedCompanyName, isLoadingCompanyContext]);
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

