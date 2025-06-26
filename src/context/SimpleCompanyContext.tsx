'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  ReactNode, 
  useMemo,
  memo,
  useCallback 
} from 'react';

interface SimpleCompanyContextType {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (companyId: string | null) => void;
  selectedCompanyName: string | null;
  setSelectedCompanyName: (name: string | null) => void;
}

const SimpleCompanyContext = createContext<SimpleCompanyContextType | undefined>(undefined);

export const SimpleCompanyProvider = memo(({ children }: { children: ReactNode }) => {
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyNameState] = useState<string | null>(null);

  const setSelectedCompanyId = useCallback((companyId: string | null) => {
    setSelectedCompanyIdState(companyId);
  }, []);

  const setSelectedCompanyName = useCallback((name: string | null) => {
    setSelectedCompanyNameState(name);
  }, []);

  const contextValue = useMemo(() => ({
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompanyName,
    setSelectedCompanyName
  }), [selectedCompanyId, setSelectedCompanyId, selectedCompanyName, setSelectedCompanyName]);
  
  return (
    <SimpleCompanyContext.Provider value={contextValue}>
      {children}
    </SimpleCompanyContext.Provider>
  );
});

SimpleCompanyProvider.displayName = 'SimpleCompanyProvider';

export const useSimpleCompany = (): SimpleCompanyContextType => {
  const context = useContext(SimpleCompanyContext);
  if (context === undefined) {
    throw new Error('useSimpleCompany must be used within a SimpleCompanyProvider');
  }
  return context;
};
