'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { logAuditEvent } from '@/lib/indexedDbUtils'; // Import the audit logger

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
    if (typeof window !== 'undefined') {
      const storedCompanyId = localStorage.getItem("selectedCompanyId");
      const storedCompanyName = localStorage.getItem("selectedCompanyName");
      if (storedCompanyId) {
        setSelectedCompanyIdState(storedCompanyId);
      }
      if (storedCompanyName) {
        setSelectedCompanyNameState(storedCompanyName);
      }
      setIsLoadingCompanyContext(false); 
    }
  }, []);

  const setSelectedCompanyId = useCallback((companyId: string | null) => {
    const previousCompanyId = selectedCompanyId;
    setSelectedCompanyIdState(companyId);
    if (typeof window !== 'undefined') {
      if (companyId) {
        localStorage.setItem("selectedCompanyId", companyId);
      } else {
        localStorage.removeItem("selectedCompanyId");
      }
    }
    // Log only if a new company is actually selected (not on initial load with same ID or clearing)
    if (companyId && companyId !== previousCompanyId) {
        const companyJustSelected = localStorage.getItem("selectedCompanyName"); // Get name that was just set
        logAuditEvent(
            "Company Selected", 
            `User switched to company: ${companyJustSelected || companyId}.`,
            companyId,
            companyJustSelected
        ).catch(err => console.error("Audit log error on company selection:", err));
    }
  }, [selectedCompanyId]); // Added selectedCompanyId to dependencies

  const setSelectedCompanyName = useCallback((name: string | null) => {
    setSelectedCompanyNameState(name);
    if (typeof window !== 'undefined') {
      if (name) {
        localStorage.setItem("selectedCompanyName", name);
      } else {
        localStorage.removeItem("selectedCompanyName");
      }
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
    
