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

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, canAccessCompany, supabaseUser } = useAuth();
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyNameState] = useState<string | null>(null);
  const [isLoadingCompanyContext, setIsLoadingCompanyContext] = useState(true);

  const loadSelectedCompany = useCallback(async () => {
    if (typeof window === 'undefined' || !isAuthenticated || !supabaseUser) {
      setIsLoadingCompanyContext(false);
      return;
    }

    try {
      setIsLoadingCompanyContext(true);
      
      // Get selected company from user metadata
      const selectedCompanyId = supabaseUser.user_metadata?.selectedCompanyId || null;
      const selectedCompanyName = supabaseUser.user_metadata?.selectedCompanyName || null;
      
      console.log('🔄 CompanyContext: Loading selected company', {
        selectedCompanyId,
        selectedCompanyName,
        canAccess: selectedCompanyId ? canAccessCompany(selectedCompanyId) : false
      });
      
      // Validate that the user can access the selected company
      if (selectedCompanyId && canAccessCompany(selectedCompanyId)) {
        setSelectedCompanyIdState(selectedCompanyId);
        setSelectedCompanyNameState(selectedCompanyName);
      } else {
        setSelectedCompanyIdState(null);
        setSelectedCompanyNameState(null);
        
        // Clear invalid selection from metadata
        if (selectedCompanyId) {
          const supabase = await getSupabaseClientAsync();
          await supabase.auth.updateUser({
            data: { 
              ...supabaseUser.user_metadata, 
              selectedCompanyId: null,
              selectedCompanyName: null
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ CompanyContext: Error loading selected company:', error);
      setSelectedCompanyIdState(null);
      setSelectedCompanyNameState(null);
    } finally {
      setIsLoadingCompanyContext(false);
    }
  }, [isAuthenticated, supabaseUser, canAccessCompany]);

  useEffect(() => {
    loadSelectedCompany();
  }, [loadSelectedCompany]);

  const setSelectedCompanyId = useCallback(async (companyId: string | null) => {
    // Validate access before setting
    if (companyId && !canAccessCompany(companyId)) {
      console.warn('❌ CompanyContext: User does not have access to company:', companyId);
      return;
    }

    setSelectedCompanyIdState(companyId);
    
    if (typeof window === 'undefined' || !supabaseUser) {
      return;
    }

    try {
      const supabase = await getSupabaseClientAsync();
      await supabase.auth.updateUser({
        data: { 
          ...supabaseUser.user_metadata, 
          selectedCompanyId: companyId 
        }
      });
      console.log('✅ CompanyContext: Updated selected company ID:', companyId);
    } catch (error) {
      console.error('❌ CompanyContext: Error updating selected company:', error);
    }
  }, [canAccessCompany, supabaseUser]);

  const setSelectedCompanyName = useCallback(async (name: string | null) => {
    setSelectedCompanyNameState(name);
    
    if (typeof window === 'undefined' || !supabaseUser) {
      return;
    }

    try {
      const supabase = await getSupabaseClientAsync();
      await supabase.auth.updateUser({
        data: { 
          ...supabaseUser.user_metadata, 
          selectedCompanyName: name 
        }
      });
      console.log('✅ CompanyContext: Updated selected company name:', name);
    } catch (error) {
      console.error('❌ CompanyContext: Error updating selected company name:', error);
    }
  }, [supabaseUser]);

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
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};