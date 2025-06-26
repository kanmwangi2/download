import { StaffService } from './StaffService';
import { TaxService } from './TaxService';
import { DeductionService } from './DeductionService';
import { PaymentTypeService } from './PaymentTypeService';
import { StaffPaymentConfigService } from './StaffPaymentConfigService';
import { CompanyService } from './CompanyService';

// Import centralized types
import { EmployeePayrollRecord, PayrollRunDetail, AppliedDeductionDetail } from '../types/payroll';
import { StaffMember } from '../types/staff';
import { TaxSettingsData } from '../types/tax';
import { PaymentType, StaffPaymentDetails, DEFAULT_BASIC_PAY_ID, DEFAULT_TRANSPORT_ALLOWANCE_ID } from '../types/payments';
import { DeductionType } from '../types/deductionTypes';
import { Deduction } from '../types/deductions';
import { CompanyProfileData } from '../types/company';

export class PayrollCalculationService {
    private _staffService?: StaffService;
    private _taxService?: TaxService;
    private _deductionService?: DeductionService;
    private _paymentTypeService?: PaymentTypeService;
    private _staffPaymentConfigService?: StaffPaymentConfigService;
    private _companyService?: CompanyService;

    constructor() {
        // Services will be lazily initialized when first accessed
    }

    // Lazy initialization getters to avoid circular dependencies
    private get staffService(): StaffService {
        if (!this._staffService) {
            this._staffService = new StaffService();
        }
        return this._staffService;
    }

    private get taxService(): TaxService {
        if (!this._taxService) {
            this._taxService = new TaxService();
        }
        return this._taxService;
    }

    private get deductionService(): DeductionService {
        if (!this._deductionService) {
            this._deductionService = new DeductionService();
        }
        return this._deductionService;
    }

    private get paymentTypeService(): PaymentTypeService {
        if (!this._paymentTypeService) {
            this._paymentTypeService = new PaymentTypeService();
        }
        return this._paymentTypeService;
    }

    private get staffPaymentConfigService(): StaffPaymentConfigService {
        if (!this._staffPaymentConfigService) {
            this._staffPaymentConfigService = new StaffPaymentConfigService();
        }
        return this._staffPaymentConfigService;
    }

    private get companyService(): CompanyService {
        if (!this._companyService) {
            this._companyService = new CompanyService();
        }
        return this._companyService;
    }

    public calculatePAYE(grossSalary: number, taxSettings: TaxSettingsData, isPayeActive: boolean): number {
        if (!isPayeActive) return 0;
        let calculatedPaye = 0;
        const rate1 = taxSettings.payeRate1 / 100;
        const rate2 = taxSettings.payeRate2 / 100;
        const rate3 = taxSettings.payeRate3 / 100;
        const rate4 = taxSettings.payeRate4 / 100;

        if (grossSalary <= taxSettings.payeBand1Limit) {
            calculatedPaye = grossSalary * rate1;
        } else {
            calculatedPaye = taxSettings.payeBand1Limit * rate1;
            if (grossSalary > taxSettings.payeBand1Limit) {
                calculatedPaye += (Math.min(grossSalary, taxSettings.payeBand2Limit) - taxSettings.payeBand1Limit) * rate2;
            }
            if (grossSalary > taxSettings.payeBand2Limit) {
                calculatedPaye += (Math.min(grossSalary, taxSettings.payeBand3Limit) - taxSettings.payeBand2Limit) * rate3;
            }
            if (grossSalary > taxSettings.payeBand3Limit) {
                calculatedPaye += (grossSalary - taxSettings.payeBand3Limit) * rate4;
            }
        }
        return Math.max(0, calculatedPaye || 0);
    }

    private _calculateNetForGross(
        currentGross: number,
        currentGrossTransportAllowance: number,
        currentBasicPay: number,
        taxSettings: TaxSettingsData,
        companyExemptions: Pick<CompanyProfileData, 'isPayeActive' | 'isPensionActive' | 'isMaternityActive' | 'isCbhiActive' | 'isRamaActive'>
    ): number {
        const effectivePensionEmployeeRate = companyExemptions.isPensionActive ? taxSettings.pensionEmployeeRate / 100 : 0;
        const effectiveMaternityEmployeeRate = companyExemptions.isMaternityActive ? taxSettings.maternityEmployeeRate / 100 : 0;
        const effectiveRamaEmployeeRate = companyExemptions.isRamaActive ? taxSettings.ramaEmployeeRate / 100 : 0;
        const effectiveCbhiRate = companyExemptions.isCbhiActive ? taxSettings.cbhiRate / 100 : 0;

        const employeePension = (currentGross || 0) * effectivePensionEmployeeRate;
        const grossExclTransportForMat = Math.max(0, (currentGross || 0) - (currentGrossTransportAllowance || 0));
        const employeeMaternity = grossExclTransportForMat * effectiveMaternityEmployeeRate;
        const employeeRama = (currentBasicPay || 0) * effectiveRamaEmployeeRate;
        const employeeRssb = (employeePension || 0) + (employeeMaternity || 0) + (employeeRama || 0);

        const paye = this.calculatePAYE(currentGross || 0, taxSettings, companyExemptions.isPayeActive);
        const netPayBeforeCbhi = (currentGross || 0) - ((employeeRssb || 0) + (paye || 0));
        const cbhiDeduction = Math.max(0, netPayBeforeCbhi || 0) * effectiveCbhiRate;
        return (netPayBeforeCbhi || 0) - (cbhiDeduction || 0);
    };

    private _findAdditionalGrossForNetIncrement(
        targetNetIncrement: number,
        accumulatedGrossSalary: number,
        accumulatedGrossTransport: number,
        accumulatedBasicPay: number,
        isCurrentComponentTransport: boolean,
        isCurrentComponentBasicPay: boolean,
        taxSettings: TaxSettingsData,
        companyExemptions: Pick<CompanyProfileData, 'isPayeActive' | 'isPensionActive' | 'isMaternityActive' | 'isCbhiActive' | 'isRamaActive'>
    ): number {
        if (targetNetIncrement <= 0) return 0;

        let low = 0;
        let high = targetNetIncrement * 3;
        let additionalGrossGuess = targetNetIncrement * 1.5;
        const MAX_ITERATIONS = 50;
        const TOLERANCE = 0.50;

        const baselineNet = this._calculateNetForGross(accumulatedGrossSalary, accumulatedGrossTransport, accumulatedBasicPay, taxSettings, companyExemptions);

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            const currentTotalGross = accumulatedGrossSalary + additionalGrossGuess;
            const currentTotalGrossTransport = isCurrentComponentTransport ? accumulatedGrossTransport + additionalGrossGuess : accumulatedGrossTransport;
            const currentTotalBasicPay = isCurrentComponentBasicPay ? accumulatedBasicPay + additionalGrossGuess : accumulatedBasicPay;

            const newNet = this._calculateNetForGross(currentTotalGross, currentTotalGrossTransport, currentTotalBasicPay, taxSettings, companyExemptions);
            const achievedNetIncrement = newNet - baselineNet;

            const difference = achievedNetIncrement - targetNetIncrement;

            if (Math.abs(difference) <= TOLERANCE) {
                return Math.max(0, additionalGrossGuess);
            }

            if (difference < 0) {
                low = additionalGrossGuess;
            } else {
                high = additionalGrossGuess;
            }
            additionalGrossGuess = (low + high) / 2;
        }
        console.warn(`Gross-up for net increment ${targetNetIncrement} did not converge within ${MAX_ITERATIONS} iterations. Returning best guess: ${additionalGrossGuess}.`);
        return Math.max(0, additionalGrossGuess);
    }

    public calculateEmployeePayrollRecord(
        staffMember: StaffMember,
        paymentConfig: StaffPaymentDetails,
        activeDeductionsForStaff: Deduction[],
        taxSettings: TaxSettingsData,
        companyExemptions: Pick<CompanyProfileData, 'isPayeActive' | 'isPensionActive' | 'isMaternityActive' | 'isCbhiActive' | 'isRamaActive'>,
        companyPaymentTypes: PaymentType[],
        companyDeductionTypes: DeductionType[],
        companyId: string
    ): EmployeePayrollRecord {
        const dynamicCalculatedGrossEarnings: Record<string, number> = {};
        let accumulatedGrossSalaryForAllComponents = 0;
        let accumulatedGrossTransportComponentSum = 0;
        let accumulatedBasicPayComponentSum = 0;

        const sortedPaymentTypes = [...companyPaymentTypes].sort((a, b) => a.orderNumber - b.orderNumber);

        for (const paymentType of sortedPaymentTypes) {
            const componentAmountFromConfig = paymentConfig[paymentType.id] || 0;
            let calculatedGrossAmountForThisComponent = 0;
            const isCurrentComponentTransport = paymentType.id === DEFAULT_TRANSPORT_ALLOWANCE_ID;
            const isCurrentComponentBasicPay = paymentType.id === DEFAULT_BASIC_PAY_ID;

            if (paymentType.type === "Gross") {
                calculatedGrossAmountForThisComponent = componentAmountFromConfig;
            } else {
                calculatedGrossAmountForThisComponent = this._findAdditionalGrossForNetIncrement(
                    componentAmountFromConfig,
                    accumulatedGrossSalaryForAllComponents,
                    accumulatedGrossTransportComponentSum,
                    accumulatedBasicPayComponentSum,
                    isCurrentComponentTransport,
                    isCurrentComponentBasicPay,
                    taxSettings,
                    companyExemptions
                );
            }

            dynamicCalculatedGrossEarnings[paymentType.id] = calculatedGrossAmountForThisComponent;
            accumulatedGrossSalaryForAllComponents += calculatedGrossAmountForThisComponent;
            if (isCurrentComponentTransport) {
                accumulatedGrossTransportComponentSum += calculatedGrossAmountForThisComponent;
            }
            if (isCurrentComponentBasicPay) {
                accumulatedBasicPayComponentSum += calculatedGrossAmountForThisComponent;
            }
        }

        const finalTotalGrossSalary = accumulatedGrossSalaryForAllComponents;
        const calculatedGrossBasicPay = dynamicCalculatedGrossEarnings[DEFAULT_BASIC_PAY_ID] || 0;

        const effectivePenER = companyExemptions.isPensionActive ? taxSettings.pensionEmployerRate / 100 : 0;
        const effectivePenEER = companyExemptions.isPensionActive ? taxSettings.pensionEmployeeRate / 100 : 0;
        const effectiveMatER = companyExemptions.isMaternityActive ? taxSettings.maternityEmployerRate / 100 : 0;
        const effectiveMatEER = companyExemptions.isMaternityActive ? taxSettings.maternityEmployeeRate / 100 : 0;
        const effectiveRamaER = companyExemptions.isRamaActive ? taxSettings.ramaEmployerRate / 100 : 0;
        const effectiveRamaEER = companyExemptions.isRamaActive ? taxSettings.ramaEmployeeRate / 100 : 0;
        const effectiveCbhiR = companyExemptions.isCbhiActive ? taxSettings.cbhiRate / 100 : 0;

        const empRama = (calculatedGrossBasicPay || 0) * effectiveRamaER;
        const eeRama = (calculatedGrossBasicPay || 0) * effectiveRamaEER;
        const totRama = (empRama || 0) + (eeRama || 0);

        const empPen = (finalTotalGrossSalary || 0) * effectivePenER;
        const grossExclTransMat = Math.max(0, (finalTotalGrossSalary || 0) - (accumulatedGrossTransportComponentSum || 0));
        const empMat = grossExclTransMat * effectiveMatER;
        const empRssb = (empPen || 0) + (empMat || 0) + (empRama || 0);

        const eePen = (finalTotalGrossSalary || 0) * effectivePenEER;
        const eeMat = grossExclTransMat * effectiveMatEER;
        const eeRssb = (eePen || 0) + (eeMat || 0) + (eeRama || 0);

        const totPen = (empPen || 0) + (eePen || 0);
        const totMat = (empMat || 0) + (eeMat || 0);
        const payeVal = this.calculatePAYE(finalTotalGrossSalary || 0, taxSettings, companyExemptions.isPayeActive);
        const netBCbhi = (finalTotalGrossSalary || 0) - ((eeRssb || 0) + (payeVal || 0));
        const cbhiDed = Math.max(0, netBCbhi || 0) * effectiveCbhiR;
        const netACbhi = Math.max(0, (netBCbhi || 0) - (cbhiDed || 0));

        const appliedDeductionAmounts: Record<string, number> = {};
        const allAppliedDeductionDetailsThisRun: AppliedDeductionDetail[] = [];
        let remainingNetPayForDeductions = netACbhi;
        let totalDeductionsAppliedThisRun = 0;

        const sortedDeductionTypes = [...companyDeductionTypes].sort((a, b) => a.orderNumber - b.orderNumber);

        for (const dedType of sortedDeductionTypes) {
            const typeSpecificStaffDeductions = activeDeductionsForStaff
                .filter(d => d.deductionTypeId === dedType.id && (d.balance || 0) > 0 && d.companyId === companyId)
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

            let cumulativeDeductedForThisType = 0;

            for (const staffDed of typeSpecificStaffDeductions) {
                if (remainingNetPayForDeductions <= 0) break;

                const potentialDeductionAmount = Math.min(staffDed.monthlyDeduction || 0, staffDed.balance || 0);
                const actualAmountApplied = Math.min(potentialDeductionAmount, remainingNetPayForDeductions);

                if (actualAmountApplied > 0) {
                    allAppliedDeductionDetailsThisRun.push({ deductionId: staffDed.id, deductionTypeId: dedType.id, amountApplied: actualAmountApplied });
                    cumulativeDeductedForThisType += actualAmountApplied;
                    remainingNetPayForDeductions -= actualAmountApplied;
                    totalDeductionsAppliedThisRun += actualAmountApplied;
                }
            }

            if (cumulativeDeductedForThisType > 0) {
                appliedDeductionAmounts[dedType.id] = cumulativeDeductedForThisType;
            }
        }

        const finalNet = (netACbhi || 0) - totalDeductionsAppliedThisRun;

        return {
            employeeId: staffMember.id,
            employeeName: `${staffMember.firstName} ${staffMember.lastName}`.trim(),
            companyId,
            firstName: staffMember.firstName,
            lastName: staffMember.lastName,
            ...(staffMember.staffNumber && { staffNumber: staffMember.staffNumber }),
            ...(staffMember.staffRssbNumber && { rssbNumber: staffMember.staffRssbNumber }),
            designation: staffMember.designation || "N/A",
            dynamicGrossEarnings: dynamicCalculatedGrossEarnings,
            appliedDeductionAmounts,
            totalGrossEarnings: finalTotalGrossSalary || 0,
            grossSalary: finalTotalGrossSalary || 0,
            employerRssb: empRssb || 0,
            employeeRssb: eeRssb || 0,
            employerPension: empPen || 0,
            employeePension: eePen || 0,
            employerMaternity: empMat || 0,
            employeeMaternity: eeMat || 0,
            employerRama: empRama || 0,
            employeeRama: eeRama || 0,
            totalRama: totRama || 0,
            totalPension: totPen || 0,
            totalMaternity: totMat || 0,
            paye: payeVal || 0,
            netPayBeforeCbhi: netBCbhi || 0,
            cbhiDeduction: cbhiDed || 0,
            netPayAfterCbhi: netACbhi || 0,
            totalDeductionsAppliedThisRun,
            finalNetPay: finalNet || 0,
            appliedDeductions: allAppliedDeductionDetailsThisRun
        };
    }

    public calculatePayrollRunTotals(
        employees: EmployeePayrollRecord[],
        companyPaymentTypes: PaymentType[],
        companyDeductionTypes: DeductionType[]
    ): Partial<PayrollRunDetail> {
        const dynamicTotalDeductionAmounts: Record<string, number> = {};
        companyDeductionTypes.forEach(dt => dynamicTotalDeductionAmounts[dt.id] = 0);
        employees.forEach(emp => {
            Object.entries(emp.appliedDeductionAmounts).forEach(([typeId, amount]) => {
                dynamicTotalDeductionAmounts[typeId] = (dynamicTotalDeductionAmounts[typeId] || 0) + (amount || 0);
            });
        });

        const dynamicTotalGrossEarnings: Record<string, number> = {};
        companyPaymentTypes.forEach(pt => {
            dynamicTotalGrossEarnings[pt.id] = employees.reduce((sum, emp) => sum + (emp.dynamicGrossEarnings[pt.id] || 0), 0);
        });

        return {
            totalEmployees: employees.length,
            dynamicTotalDeductionAmounts,
            dynamicTotalGrossEarnings,
            totalGrossSalary: employees.reduce((s, e) => s + (e.grossSalary || 0), 0),
            totalEmployerRssb: employees.reduce((s, e) => s + (e.employerRssb || 0), 0),
            totalEmployeeRssb: employees.reduce((s, e) => s + (e.employeeRssb || 0), 0),
            totalEmployerPension: employees.reduce((s, e) => s + (e.employerPension || 0), 0),
            totalEmployeePension: employees.reduce((s, e) => s + (e.employeePension || 0), 0),
            totalEmployerMaternity: employees.reduce((s, e) => s + (e.employerMaternity || 0), 0),
            totalEmployeeMaternity: employees.reduce((s, e) => s + (e.employeeMaternity || 0), 0),
            totalEmployerRama: employees.reduce((s, e) => s + (e.employerRama || 0), 0),
            totalEmployeeRama: employees.reduce((s, e) => s + (e.employeeRama || 0), 0),
            totalTotalRama: employees.reduce((s, e) => s + (e.totalRama || 0), 0),
            totalTotalPension: employees.reduce((s, e) => s + (e.totalPension || 0), 0),
            totalTotalMaternity: employees.reduce((s, e) => s + (e.totalMaternity || 0), 0),
            totalPaye: employees.reduce((s, e) => s + (e.paye || 0), 0),
            totalNetPayBeforeCbhi: employees.reduce((s, e) => s + (e.netPayBeforeCbhi || 0), 0),
            totalCbhiDeduction: employees.reduce((s, e) => s + (e.cbhiDeduction || 0), 0),
            totalNetPayAfterCbhi: employees.reduce((s, e) => s + (e.netPayAfterCbhi || 0), 0),
            totalTotalDeductionsAppliedThisRun: employees.reduce((s, e) => s + (e.totalDeductionsAppliedThisRun || 0), 0),
            totalFinalNetPay: employees.reduce((s, e) => s + (e.finalNetPay || 0), 0),
        };
    }
}
