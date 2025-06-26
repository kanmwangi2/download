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
  isPayeActive: boolean;
  isPensionActive: boolean;
  isMaternityActive: boolean;
  isCbhiActive: boolean;
  isRamaActive: boolean;
}
