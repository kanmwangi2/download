/**
 * Services and Utilities Index
 * Exports all OOP services and utility classes for easy importing
 */

// Base classes
export { BaseService } from '../services/BaseService';

// Service classes
export { PaymentTypeService } from '../services/PaymentTypeService';
export { StaffPaymentConfigService } from '../services/StaffPaymentConfigService';
export { StaffService } from '../services/StaffService';
export { CustomFieldDefinitionService } from '../services/CustomFieldDefinitionService';
export { PayrollService } from '../services/PayrollService';
export { UserService } from '../services/UserService';
export { TaxService } from '../services/TaxService';
export { DeductionService } from '../services/DeductionService';
export { CompanyService } from '../services/CompanyService';
export { PayrollCalculationService } from '../services/PayrollCalculationService';
export { DeductionTypeService } from '../services/DeductionTypeService';

// Service registry
export { ServiceRegistry, getServices } from '../services/ServiceRegistry';

// Utility classes
export { 
  CurrencyFormatter, 
  DateFormatter, 
  Validator, 
  FileExporter, 
  CSVParser 
} from '../utils/UtilityClasses';
export { PayrollUtils } from '../utils/PayrollUtils';
export { PayrollValidation } from '../utils/PayrollValidation';
export { PayrollPermissions } from '../utils/PayrollPermissions';

// Type definitions
export type { PaymentType } from '../types/payments';
export type { StaffMember, StaffStatus } from '../types/staff';
export type { 
  PayrollRunSummary, 
  PayrollStatus, 
  PayrollRunDetail,
  EmployeePayrollRecord
} from '../types/payroll';
export type { CustomFieldDefinition } from '../types/custom-fields';
export type { DeductionType } from '../types/deductions';
export type { 
  StaffPaymentConfig, 
  CreateStaffPaymentConfigData, 
  UpdateStaffPaymentConfigData 
} from '../services/StaffPaymentConfigService';
