'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { UserProfile } from '@/lib/types/user';

interface CompanyContextType {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (companyId: string | null) => void;
  selectedCompanyName: string | null;
  isLoadingCompanyContext: boolean;
  canAccessSelectedCompany: boolean;
  userProfile: UserProfile | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const [isLoadingCompanyContext, setIsLoadingCompanyContext] = useState(true);
  const [canAccessSelectedCompany, setCanAccessSelectedCompany] = useState(false);

  const fetchProfileAndSetCompany = useCallback(async () => {
    setIsLoadingCompanyContext(true);
    try {
      const response = await fetch('/api/user-profile');
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const profile = await response.json();
      setUserProfile(profile as UserProfile);

      if (profile && profile.companies && profile.companies.length > 0) {
        const firstCompany = profile.companies[0];
        setSelectedCompanyId(firstCompany.company_id);
        setSelectedCompanyName(firstCompany.company_name.name);
        setCanAccessSelectedCompany(true);
      } else {
        setCanAccessSelectedCompany(false);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setCanAccessSelectedCompany(false);
    } finally {
      setIsLoadingCompanyContext(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileAndSetCompany();
  }, [fetchProfileAndSetCompany]);

  const value: CompanyContextType = {
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompanyName,
    isLoadingCompanyContext,
    canAccessSelectedCompany,
    userProfile,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};