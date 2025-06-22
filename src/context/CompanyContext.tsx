'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface CompanyContextType {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (companyId: string | null) => void;
  selectedCompanyName: string | null;
  setSelectedCompanyName: (name: string | null) => void;
  isLoadingCompanyContext: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyNameState] = useState<string | null>(null);
  const [isLoadingCompanyContext, setIsLoadingCompanyContext] = useState(true);

  useEffect(() => {
    const fetchCompanyFromProfile = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Assume user_metadata contains selectedCompanyId and selectedCompanyName
        setSelectedCompanyIdState(user.user_metadata?.selectedCompanyId || null);
        setSelectedCompanyNameState(user.user_metadata?.selectedCompanyName || null);
      }
      setIsLoadingCompanyContext(false);
    };
    fetchCompanyFromProfile();
  }, []);

  const setSelectedCompanyId = useCallback(async (companyId: string | null) => {
    setSelectedCompanyIdState(companyId);
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.auth.updateUser({
        data: { ...user.user_metadata, selectedCompanyId: companyId }
      });
    }
  }, []);

  const setSelectedCompanyName = useCallback(async (name: string | null) => {
    setSelectedCompanyNameState(name);
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.auth.updateUser({
        data: { ...user.user_metadata, selectedCompanyName: name }
      });
    }
  }, []);

  return (
    <CompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId, selectedCompanyName, setSelectedCompanyName, isLoadingCompanyContext }}>
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

