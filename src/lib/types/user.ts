export const USER_ROLE_VALUES = [
  'Primary Admin',
  'App Admin',
  'Company Admin',
  'Payroll Approver',
  'Payroll Preparer',
] as const;

export type UserRole = typeof USER_ROLE_VALUES[number];

export const USER_STATUS_VALUES = ['Active', 'Inactive'] as const;
export type UserStatus = typeof USER_STATUS_VALUES[number];

// User profile (matches user_profiles table)
export interface UserProfile {
  id: string; // UUID referencing auth.users(id)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// User company assignment (matches user_company_assignments table)
export interface UserCompanyAssignment {
  id: string;
  userId: string;
  companyId: string;
  role: UserRole;
}

// UI user type (camelCase - for component use)
export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  password?: string;
  status: UserStatus;
}
