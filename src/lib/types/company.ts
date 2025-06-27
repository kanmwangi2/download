export interface Company {
  id: string;
  name: string;
  tinNumber?: string;
  address?: string;
  email?: string;
  phone?: string;
  primaryBusiness?: string;
}

export interface CompanyProfileData {
  id: string;
  name: string;
  tinNumber?: string;
  registrationNumber?: string; // Added missing field
  address?: string;
  email?: string;
  phone?: string;
  primaryBusiness?: string;
  currency?: string; // Added missing field
  isPayeActive: boolean;
  isPensionActive: boolean;
  isMaternityActive: boolean;
  isCbhiActive: boolean;
  isRamaActive: boolean;
}

/**
 * Global application company (for system-wide settings)
 */
export interface GlobalApplicationCompany {
  id: string;
  name: string;
  isDefault: boolean;
  settings?: Record<string, any>;
}
