'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  ReactNode
} from 'react';

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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>('default-company');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>('Default Company');
  const [isLoadingCompanyContext] = useState(false);
  const [canAccessSelectedCompany] = useState(true);

  const value: CompanyContextType = {
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompanyName,
    setSelectedCompanyName,
    isLoadingCompanyContext,
    canAccessSelectedCompany,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
