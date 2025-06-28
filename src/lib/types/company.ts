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
  address?: string;
  email?: string;
  phone?: string;
  primaryBusiness?: string;
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
