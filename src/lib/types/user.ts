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

// Database user type (snake_case - matches users table)
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  assigned_company_ids: string[];
  password?: string;
  phone?: string;
  status?: UserStatus;
  created_at?: string;
  updated_at?: string;
}

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
export interface UserUI {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  assignedCompanyIds: string[];
  password?: string;
  status: UserStatus;
}
