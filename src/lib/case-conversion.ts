/**
 * Case Conversion Utilities
 * 
 * Centralized utilities for converting between camelCase (frontend) and snake_case (backend)
 * conventions. This ensures consistent data transformation across the application.
 */

/**
 * Converts a camelCase string to snake_case
 * @param str - The camelCase string to convert
 * @returns The snake_case version of the string
 */
export function camelToSnakeCase(str: string): string {
  return str.replace(/([a-z0-9]|(?<=[a-z]))([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Converts a snake_case string to camelCase
 * @param str - The snake_case string to convert
 * @returns The camelCase version of the string
 */
export function snakeToCamelCase(str: string): string {
  return str.replace(/_([a-zA-Z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively converts all keys in an object from camelCase to snake_case
 * @param obj - The object to convert
 * @returns A new object with snake_case keys
 */
export function objectToSnakeCase<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => objectToSnakeCase(item)) as T;
  }

  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnakeCase(key);
    converted[snakeKey] = typeof value === 'object' && value !== null
      ? objectToSnakeCase(value)
      : value;
  }

  return converted;
}

/**
 * Recursively converts all keys in an object from snake_case to camelCase
 * @param obj - The object to convert
 * @returns A new object with camelCase keys
 */
export function objectToCamelCase<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => objectToCamelCase(item)) as T;
  }

  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamelCase(key);
    converted[camelKey] = typeof value === 'object' && value !== null
      ? objectToCamelCase(value)
      : value;
  }

  return converted;
}

/**
 * Specific mapping configuration for objects that need custom field transformations
 * beyond simple case conversion (e.g., field name changes, nested transformations)
 */
export interface FieldMapping {
  [frontendKey: string]: string; // Maps frontend key to backend key
}

/**
 * Converts an object from frontend format to backend format using a custom field mapping
 * @param obj - The frontend object to convert
 * @param mapping - Custom field mapping configuration
 * @returns The backend-formatted object
 */
export function objectToBackendWithMapping<T = unknown>(obj: unknown, mapping: FieldMapping): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as T;
  }

  const converted: Record<string, unknown> = { ...obj as Record<string, unknown> };
  
  // Apply custom mappings first
  for (const [frontendKey, backendKey] of Object.entries(mapping)) {
    if (frontendKey in obj) {
      converted[backendKey] = obj[frontendKey];
      delete converted[frontendKey];
    }
  }

  // Apply snake_case conversion to remaining fields
  return objectToSnakeCase(converted);
}

/**
 * Converts an object from backend format to frontend format using a custom field mapping
 * @param obj - The backend object to convert
 * @param mapping - Custom field mapping configuration (frontend key -> backend key)
 * @returns The frontend-formatted object
 */
export function objectFromBackendWithMapping<T = unknown>(obj: unknown, mapping: FieldMapping): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as T;
  }

  // First convert all to camelCase
  const converted: Record<string, unknown> = objectToCamelCase(obj);
  
  // Apply reverse mappings (backend key -> frontend key)
  const reverseMapping: { [backendKey: string]: string } = {};
  for (const [frontendKey, backendKey] of Object.entries(mapping)) {
    reverseMapping[backendKey] = frontendKey;
  }

  for (const [backendKey, frontendKey] of Object.entries(reverseMapping)) {
    const camelBackendKey = snakeToCamelCase(backendKey);
    if (camelBackendKey in converted) {
      converted[frontendKey] = converted[camelBackendKey];
      delete converted[camelBackendKey];
    }
  }

  return converted;
}

// Common field mappings used across the application
export const COMMON_MAPPINGS = {
  USER: {
    firstName: 'first_name',
    lastName: 'last_name',
    assignedCompanyIds: 'assigned_company_ids'
  },
  COMPANY: {
    tinNumber: 'tin_number',
    primaryBusiness: 'primary_business'
  },
  STAFF: {
    companyId: 'company_id',
    firstName: 'first_name',
    lastName: 'last_name',
    staffNumber: 'staff_number',
    staffRssbNumber: 'staff_rssb_number',
    employeeCategory: 'employee_category',
    birthDate: 'birth_date',
    employmentDate: 'employment_date',
    idPassportNumber: 'id_passport_number',
    keyContactName: 'key_contact_name',
    keyContactRelationship: 'key_contact_relationship',
    keyContactPhone: 'key_contact_phone',
    bankName: 'bank_name',
    bankCode: 'bank_code',
    bankAccountNumber: 'bank_account_number',
    bankBranch: 'bank_branch',
    customFields: 'custom_fields'
  },
  DEDUCTION: {
    companyId: 'company_id',
    staffId: 'staff_id',
    staffName: 'staff_name',
    deductionTypeId: 'deduction_type_id',
    deductionTypeName: 'deduction_type_name',
    originalAmount: 'original_amount',
    monthlyDeduction: 'monthly_deduction',
    deductedSoFar: 'deducted_so_far',
    startDate: 'start_date'
  },  PAYMENT_TYPE: {
    companyId: 'company_id',
    orderNumber: 'order_number',
    isFixedName: 'is_fixed_name',
    isDeletable: 'is_deletable',
    maxAmount: 'max_amount',
    isAutoCalculated: 'is_auto_calculated',
    paymentAmount: 'payment_amount'
  },
  DEDUCTION_TYPE: {
    companyId: 'company_id',
    orderNumber: 'order_number',
    isFixedName: 'is_fixed_name',
    isDeletable: 'is_deletable',
    maxAmount: 'max_amount'
  },
  CUSTOM_FIELD: {
    companyId: 'company_id',
    orderNumber: 'order_number',
    isDeletable: 'is_deletable'
  }
} as const;

/**
 * Type-safe conversion functions for common entities
 */

// User conversions
export function userToBackend(user: unknown): unknown {
  return objectToBackendWithMapping(user, COMMON_MAPPINGS.USER);
}

export function userFromBackend(user: unknown): unknown {
  return objectFromBackendWithMapping(user, COMMON_MAPPINGS.USER);
}

// Company conversions
export function companyToBackend(company: unknown): unknown {
  return objectToBackendWithMapping(company, COMMON_MAPPINGS.COMPANY);
}

export function companyFromBackend(company: unknown): unknown {
  return objectFromBackendWithMapping(company, COMMON_MAPPINGS.COMPANY);
}

// Staff conversions
export function staffToBackend(staff: unknown): unknown {
  return objectToBackendWithMapping(staff, COMMON_MAPPINGS.STAFF);
}

export function staffFromBackend(staff: unknown): unknown {
  return objectFromBackendWithMapping(staff, COMMON_MAPPINGS.STAFF);
}

// Deduction conversions
export function deductionToBackend(deduction: unknown): unknown {
  return objectToBackendWithMapping(deduction, COMMON_MAPPINGS.DEDUCTION);
}

export function deductionFromBackend(deduction: unknown): unknown {
  return objectFromBackendWithMapping(deduction, COMMON_MAPPINGS.DEDUCTION);
}

// Payment type conversions
export function paymentTypeToBackend(paymentType: unknown): unknown {
  return objectToBackendWithMapping(paymentType, COMMON_MAPPINGS.PAYMENT_TYPE);
}

export function paymentTypeFromBackend(paymentType: unknown): unknown {
  return objectFromBackendWithMapping(paymentType, COMMON_MAPPINGS.PAYMENT_TYPE);
}

// Deduction type conversions
export function deductionTypeToBackend(deductionType: unknown): unknown {
  return objectToBackendWithMapping(deductionType, COMMON_MAPPINGS.DEDUCTION_TYPE);
}

export function deductionTypeFromBackend(deductionType: unknown): unknown {
  return objectFromBackendWithMapping(deductionType, COMMON_MAPPINGS.DEDUCTION_TYPE);
}

// Custom field conversions
export function customFieldDefinitionToBackend(customField: unknown): unknown {
  return objectToBackendWithMapping(customField, COMMON_MAPPINGS.CUSTOM_FIELD);
}

export function customFieldDefinitionFromBackend(customField: unknown): unknown {
  return objectFromBackendWithMapping(customField, COMMON_MAPPINGS.CUSTOM_FIELD);
}
