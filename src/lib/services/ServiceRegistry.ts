/**
 * Service Registry
 * Central registry for all services following the Singleton pattern
 * Provides a single point of access to all application services
 */
import { PaymentTypeService } from './PaymentTypeService';
import { StaffService } from './StaffService';
import { CustomFieldDefinitionService } from './CustomFieldDefinitionService';
import { PayrollService } from './PayrollService';
import { UserService } from './UserService';
import { TaxService } from './TaxService';
import { DeductionService } from './DeductionService';
import { CompanyService } from './CompanyService';
import { PayrollCalculationService } from './PayrollCalculationService';
import { DeductionTypeService } from './DeductionTypeService';

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  
  public paymentTypeService: PaymentTypeService;
  public staffService: StaffService;
  public customFieldDefinitionService: CustomFieldDefinitionService;
  public payrollService: PayrollService;
  public userService: UserService;
  public taxService: TaxService;
  public deductionService: DeductionService;
  public companyService: CompanyService;
  public payrollCalculationService: PayrollCalculationService;
  public deductionTypeService: DeductionTypeService;

  private constructor() {
    this.paymentTypeService = new PaymentTypeService();
    this.staffService = new StaffService();
    this.customFieldDefinitionService = new CustomFieldDefinitionService();
    this.payrollService = new PayrollService();
    this.userService = new UserService();
    this.taxService = new TaxService();
    this.deductionService = new DeductionService();
    this.companyService = new CompanyService();
    this.payrollCalculationService = new PayrollCalculationService();
    this.deductionTypeService = new DeductionTypeService();
  }

  /**
   * Get the singleton instance of the service registry
   */
  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Clear all service instances (useful for testing or reset)
   */
  clearServices(): void {
    // This is now more complex if we want to allow re-initialization.
    // For now, we can just re-assign new instances.
    this.paymentTypeService = new PaymentTypeService();
    this.staffService = new StaffService();
    this.customFieldDefinitionService = new CustomFieldDefinitionService();
    this.payrollService = new PayrollService();
    this.userService = new UserService();
    this.taxService = new TaxService();
    this.deductionService = new DeductionService();
    this.companyService = new CompanyService();
    this.payrollCalculationService = new PayrollCalculationService();
    this.deductionTypeService = new DeductionTypeService();
  }
}

/**
 * Convenience function to get service registry instance
 */
export const getServices = (): ServiceRegistry => ServiceRegistry.getInstance();
