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

// Corresponds to the `users` table in the database (snake_case)
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: UserRole;
  assigned_company_ids: string[];
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

// Represents the user object used in the UI (camelCase)
export interface UserUI {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  assignedCompanyIds: string[];
  status: UserStatus;
  password?: string; // Only for creating new users
}
