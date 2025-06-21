
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as ShadTableFooter
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Download, FileText, FileSpreadsheet, FileType, Edit2, CheckCircle, XCircle, AlertTriangle, Hourglass, Users, Banknote, MinusCircle, PlayCircle, Send, Save, Eye, SlidersHorizontal, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, InfoIcon, FileSpreadsheet as FileSpreadsheetIcon, FileType as FileTypePdfIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StaffMember } from '@/lib/staffData';
import { StaffPaymentDetails } from '@/lib/paymentData';
import type { TaxSettingsData } from '@/components/settings/taxes-tab';
import type { CompanyProfileData } from '@/app/app/(main)/settings/company/page';
import type { PayrollRunSummary, PayrollStatus } from '@/app/app/(main)/payroll/page';
import {
    getCompanySingletonData, getFromStore, putToStore,
    getAllFromStore, getAllPaymentConfigsForCompany, STORE_NAMES,
    putCompanySingletonData, getFromGlobalStore, getGlobalSingletonData,
    logAuditEvent, getAllFromGlobalStore 
} from '@/lib/indexedDbUtils';
import { PAYE_BANDS as DEFAULT_PAYE_BANDS, PENSION_EMPLOYER_RATE as DEFAULT_PENSION_EMPLOYER_RATE, PENSION_EMPLOYEE_RATE as DEFAULT_PENSION_EMPLOYEE_RATE, MATERNITY_EMPLOYER_RATE as DEFAULT_MATERNITY_EMPLOYER_RATE, MATERNITY_EMPLOYEE_RATE as DEFAULT_MATERNITY_EMPLOYEE_RATE, CBHI_RATE as DEFAULT_CBHI_RATE, RAMA_EMPLOYER_RATE as DEFAULT_RAMA_EMPLOYER_RATE, RAMA_EMPLOYEE_RATE as DEFAULT_RAMA_EMPLOYEE_RATE } from "@/lib/taxConfig";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { useCompany } from '@/context/CompanyContext';
import type { Deduction as FullDeductionRecord } from '@/app/app/(main)/deductions/page';
import type { PaymentType } from '@/lib/paymentTypesData';
import { DEFAULT_BASIC_PAY_ID, DEFAULT_TRANSPORT_ALLOWANCE_ID, initialPaymentTypesForCompanySeed } from '@/lib/paymentTypesData';
import type { DeductionType as CompanyDeductionType } from '@/lib/deductionTypesData';
import { initialDeductionTypesForCompanySeed as initialCompanyDeductionTypesSeed } from '@/lib/deductionTypesData';
import { cn } from "@/lib/utils";

interface GlobalApplicationCompany {
  id: string;
  name: string;
  tinNumber?: string;
  address?: string;
  email?: string;
  phone?: string;
  primaryBusiness?: string;
}


interface AppliedDeductionDetail {
  deductionId: string;
  deductionTypeId: string;
  amountApplied: number;
}

export interface EmployeePayrollRecord {
  employeeId: string; firstName: string; lastName: string; staffNumber?: string; rssbNumber?: string; designation?: string;

  dynamicGrossEarnings: Record<string, number>;
  appliedDeductionAmounts: Record<string, number>;

  grossSalary: number;
  employerRssb: number; employeeRssb: number; employerPension: number; employeePension: number;
  employerMaternity: number; employeeMaternity: number; totalPension: number; totalMaternity: number; paye: number;
  employerRama: number;
  employeeRama: number;
  totalRama: number;
  netPayBeforeCbhi: number; cbhiDeduction: number; netPayAfterCbhi: number;
  totalDeductionsAppliedThisRun: number;
  finalNetPay: number;
  appliedDeductions: AppliedDeductionDetail[];
  companyId: string;
}

export interface PayrollRunDetail {
  id: string; companyId: string;
  month: string; year: number; status: PayrollStatus; rejectionReason?: string;
  employees: EmployeePayrollRecord[];
  totalEmployees: number;

  dynamicTotalDeductionAmounts: Record<string, number>;
  dynamicTotalGrossEarnings: Record<string, number>;

  totalGrossSalary: number;
  totalEmployerRssb: number; totalEmployeeRssb: number; totalEmployerPension: number; totalEmployeePension: number;
  totalEmployerMaternity: number; totalEmployeeMaternity: number; totalTotalPension: number; totalTotalMaternity: number;
  totalEmployerRama: number;
  totalEmployeeRama: number;
  totalTotalRama: number;
  totalPaye: number; totalNetPayBeforeCbhi: number; totalCbhiDeduction: number; totalNetPayAfterCbhi: number;
  totalTotalDeductionsAppliedThisRun: number;
  totalFinalNetPay: number;
}

type FeedbackMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
};


const statusConfig: Record<PayrollStatus, { color: string; icon: React.ElementType; textColor?: string }> = {
  Draft: { color: "bg-gray-500 hover:bg-gray-600", icon: Hourglass, textColor: "text-white" },
  "To Approve": { color: "bg-blue-500 hover:bg-blue-600", icon: AlertTriangle, textColor: "text-white" },
  Rejected: { color: "bg-red-500 hover:bg-red-600", icon: XCircle, textColor: "text-white" },
  Approved: { color: "bg-green-500 hover:bg-green-600", icon: CheckCircle, textColor: "text-white" },
};

const DIALOG_ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

const getDefaultTaxSettings = (): TaxSettingsData => ({
    payeBand1Limit: DEFAULT_PAYE_BANDS.BAND1_LIMIT, payeBand2Limit: DEFAULT_PAYE_BANDS.BAND2_LIMIT,
    payeBand3Limit: DEFAULT_PAYE_BANDS.BAND3_LIMIT, payeRate1: DEFAULT_PAYE_BANDS.RATE1 * 100,
    payeRate2: DEFAULT_PAYE_BANDS.RATE2 * 100, payeRate3: DEFAULT_PAYE_BANDS.RATE3 * 100,
    payeRate4: DEFAULT_PAYE_BANDS.RATE4 * 100, pensionEmployerRate: DEFAULT_PENSION_EMPLOYER_RATE * 100,
    pensionEmployeeRate: DEFAULT_PENSION_EMPLOYEE_RATE * 100, maternityEmployerRate: DEFAULT_MATERNITY_EMPLOYER_RATE * 100,
    maternityEmployeeRate: DEFAULT_MATERNITY_EMPLOYEE_RATE * 100, cbhiRate: DEFAULT_CBHI_RATE * 100,
    ramaEmployerRate: DEFAULT_RAMA_EMPLOYER_RATE * 100,
    ramaEmployeeRate: DEFAULT_RAMA_EMPLOYEE_RATE * 100,
});

const calculatePAYEInternal = (grossSalary: number, taxSettings: TaxSettingsData, isPayeActive: boolean): number => {
    if (!isPayeActive) return 0;
    let calculatedPaye = 0;
    const rate1 = taxSettings.payeRate1 / 100; const rate2 = taxSettings.payeRate2 / 100;
    const rate3 = taxSettings.payeRate3 / 100; const rate4 = taxSettings.payeRate4 / 100;
    if (grossSalary <= taxSettings.payeBand1Limit) calculatedPaye = grossSalary * rate1;
    else {
        calculatedPaye = taxSettings.payeBand1Limit * rate1;
        if (grossSalary > taxSettings.payeBand1Limit) calculatedPaye += (Math.min(grossSalary, taxSettings.payeBand2Limit) - taxSettings.payeBand1Limit) * rate2;
        if (grossSalary > taxSettings.payeBand2Limit) calculatedPaye += (Math.min(grossSalary, taxSettings.payeBand3Limit) - taxSettings.payeBand2Limit) * rate3;
        if (grossSalary > taxSettings.payeBand3Limit) calculatedPaye += (grossSalary - taxSettings.payeBand3Limit) * rate4;
    }
    return Math.max(0, calculatedPaye || 0);
};

const calculateNetForGross = (
    currentGross: number, currentGrossTransportAllowance: number, currentBasicPay: number, taxSettings: TaxSettingsData,
    companyExemptions: Pick<CompanyProfileData, 'isPayeActive' | 'isPensionActive' | 'isMaternityActive' | 'isCbhiActive' | 'isRamaActive'>
): number => {
    const effectivePensionEmployeeRate = companyExemptions.isPensionActive ? taxSettings.pensionEmployeeRate / 100 : 0;
    const effectiveMaternityEmployeeRate = companyExemptions.isMaternityActive ? taxSettings.maternityEmployeeRate / 100 : 0;
    const effectiveRamaEmployeeRate = companyExemptions.isRamaActive ? taxSettings.ramaEmployeeRate / 100 : 0;
    const effectiveCbhiRate = companyExemptions.isCbhiActive ? taxSettings.cbhiRate / 100 : 0;

    const employeePension = (currentGross || 0) * effectivePensionEmployeeRate;
    const grossExclTransportForMat = Math.max(0, (currentGross || 0) - (currentGrossTransportAllowance || 0));
    const employeeMaternity = grossExclTransportForMat * effectiveMaternityEmployeeRate;
    const employeeRama = (currentBasicPay || 0) * effectiveRamaEmployeeRate;
    const employeeRssb = (employeePension || 0) + (employeeMaternity || 0) + (employeeRama || 0);

    const paye = calculatePAYEInternal(currentGross || 0, taxSettings, companyExemptions.isPayeActive);
    const netPayBeforeCbhi = (currentGross || 0) - ((employeeRssb || 0) + (paye || 0));
    const cbhiDeduction = Math.max(0, netPayBeforeCbhi || 0) * effectiveCbhiRate;
    return (netPayBeforeCbhi || 0) - (cbhiDeduction || 0);
};

function findAdditionalGrossForNetIncrement(
    targetNetIncrement: number, accumulatedGrossSalary: number, accumulatedGrossTransport: number, accumulatedBasicPay: number,
    isCurrentComponentTransport: boolean, isCurrentComponentBasicPay: boolean, taxSettings: TaxSettingsData,
    companyExemptions: Pick<CompanyProfileData, 'isPayeActive' | 'isPensionActive' | 'isMaternityActive' | 'isCbhiActive' | 'isRamaActive'>
): number {
    if (targetNetIncrement <= 0) return 0;

    let low = 0;
    let high = targetNetIncrement * 3; 
    let additionalGrossGuess = targetNetIncrement * 1.5; 
    const MAX_ITERATIONS = 50;
    const TOLERANCE = 0.50; 

    const baselineNet = calculateNetForGross(accumulatedGrossSalary, accumulatedGrossTransport, accumulatedBasicPay, taxSettings, companyExemptions);

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const currentTotalGross = accumulatedGrossSalary + additionalGrossGuess;
        const currentTotalGrossTransport = isCurrentComponentTransport ? accumulatedGrossTransport + additionalGrossGuess : accumulatedGrossTransport;
        const currentTotalBasicPay = isCurrentComponentBasicPay ? accumulatedBasicPay + additionalGrossGuess : accumulatedBasicPay;

        const newNet = calculateNetForGross(currentTotalGross, currentTotalGrossTransport, currentTotalBasicPay, taxSettings, companyExemptions);
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

const calculateMockEmployeeRecord = (
    staffMember: StaffMember, paymentConfig: StaffPaymentDetails, activeDeductionsForStaff: FullDeductionRecord[],
    taxSettings: TaxSettingsData, companyExemptions: Pick<CompanyProfileData, 'isPayeActive' | 'isPensionActive' | 'isMaternityActive' | 'isCbhiActive' | 'isRamaActive'>,
    companyPaymentTypes: PaymentType[], companyDeductionTypes: CompanyDeductionType[], companyId: string
): EmployeePayrollRecord => {
    const dynamicCalculatedGrossEarnings: Record<string, number> = {};
    let accumulatedGrossSalaryForAllComponents = 0; let accumulatedGrossTransportComponentSum = 0; let accumulatedBasicPayComponentSum = 0;
    const sortedPaymentTypes = [...companyPaymentTypes].sort((a, b) => a.order - b.order);
    for (const paymentType of sortedPaymentTypes) {
        const componentAmountFromConfig = paymentConfig[paymentType.id] || 0;
        let calculatedGrossAmountForThisComponent = 0;
        const isCurrentComponentTransport = paymentType.id === DEFAULT_TRANSPORT_ALLOWANCE_ID;
        const isCurrentComponentBasicPay = paymentType.id === DEFAULT_BASIC_PAY_ID;
        if (paymentType.type === "Gross") { calculatedGrossAmountForThisComponent = componentAmountFromConfig; }
        else { calculatedGrossAmountForThisComponent = findAdditionalGrossForNetIncrement(componentAmountFromConfig, accumulatedGrossSalaryForAllComponents, accumulatedGrossTransportComponentSum, accumulatedBasicPayComponentSum, isCurrentComponentTransport, isCurrentComponentBasicPay, taxSettings, companyExemptions); }
        dynamicCalculatedGrossEarnings[paymentType.id] = calculatedGrossAmountForThisComponent;
        accumulatedGrossSalaryForAllComponents += calculatedGrossAmountForThisComponent;
        if (isCurrentComponentTransport) { accumulatedGrossTransportComponentSum += calculatedGrossAmountForThisComponent; }
        if (isCurrentComponentBasicPay) { accumulatedBasicPayComponentSum += calculatedGrossAmountForThisComponent; }
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
    const payeVal = calculatePAYEInternal(finalTotalGrossSalary || 0, taxSettings, companyExemptions.isPayeActive);
    const netBCbhi = (finalTotalGrossSalary || 0) - ((eeRssb || 0) + (payeVal || 0));
    const cbhiDed = Math.max(0, netBCbhi || 0) * effectiveCbhiR; 
    const netACbhi = Math.max(0, (netBCbhi || 0) - (cbhiDed || 0));

    const appliedDeductionAmounts: Record<string, number> = {}; const allAppliedDeductionDetailsThisRun: AppliedDeductionDetail[] = [];
    let remainingNetPayForDeductions = netACbhi; let totalDeductionsAppliedThisRun = 0;
    const sortedDeductionTypes = [...companyDeductionTypes].sort((a,b) => a.order - b.order);
    for (const dedType of sortedDeductionTypes) {
        const typeSpecificStaffDeductions = activeDeductionsForStaff.filter(d => d.deductionTypeId === dedType.id && (d.balance || 0) > 0 && d.companyId === companyId)
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
        if (cumulativeDeductedForThisType > 0) { appliedDeductionAmounts[dedType.id] = cumulativeDeductedForThisType; }
    }
    const finalNet = (netACbhi || 0) - totalDeductionsAppliedThisRun;
    return {
        employeeId: staffMember.id, companyId, firstName: staffMember.firstName, lastName: staffMember.lastName, staffNumber: staffMember.staffNumber, rssbNumber: staffMember.staffRssbNumber, designation: staffMember.designation || "N/A",
        dynamicGrossEarnings: dynamicCalculatedGrossEarnings, 
        appliedDeductionAmounts, 
        grossSalary: finalTotalGrossSalary || 0, employerRssb: empRssb || 0, employeeRssb: eeRssb || 0,
        employerPension: empPen || 0, employeePension: eePen || 0, employerMaternity: empMat || 0, employeeMaternity: eeMat || 0,
        employerRama: empRama || 0, employeeRama: eeRama || 0,
        totalRama: totRama || 0,
        totalPension: totPen || 0, totalMaternity: totMat || 0, paye: payeVal || 0, netPayBeforeCbhi: netBCbhi || 0,
        cbhiDeduction: cbhiDed || 0, netPayAfterCbhi: netACbhi || 0, totalDeductionsAppliedThisRun, finalNetPay: finalNet || 0,
        appliedDeductions: allAppliedDeductionDetailsThisRun
    };
};

const calculateRunTotals = (employees: EmployeePayrollRecord[], companyPaymentTypes: PaymentType[], companyDeductionTypes: CompanyDeductionType[]): Partial<PayrollRunDetail> => {
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
        totalEmployerRssb: employees.reduce((s, e) => s + (e.employerRssb || 0), 0), totalEmployeeRssb: employees.reduce((s, e) => s + (e.employeeRssb || 0), 0),
        totalEmployerPension: employees.reduce((s, e) => s + (e.employerPension || 0), 0), totalEmployeePension: employees.reduce((s, e) => s + (e.employeePension || 0), 0),
        totalEmployerMaternity: employees.reduce((s, e) => s + (e.employerMaternity || 0), 0), totalEmployeeMaternity: employees.reduce((s, e) => s + (e.employeeMaternity || 0), 0),
        totalEmployerRama: employees.reduce((s, e) => s + (e.employerRama || 0), 0), totalEmployeeRama: employees.reduce((s, e) => s + (e.employeeRama || 0), 0),
        totalTotalRama: employees.reduce((s, e) => s + (e.totalRama || 0), 0),
        totalTotalPension: employees.reduce((s, e) => s + (e.totalPension || 0), 0), totalTotalMaternity: employees.reduce((s, e) => s + (e.totalMaternity || 0), 0),
        totalPaye: employees.reduce((s, e) => s + (e.paye || 0), 0),
        totalNetPayBeforeCbhi: employees.reduce((s, e) => s + (e.netPayBeforeCbhi || 0), 0), totalCbhiDeduction: employees.reduce((s, e) => s + (e.cbhiDeduction || 0), 0),
        totalNetPayAfterCbhi: employees.reduce((s, e) => s + (e.netPayAfterCbhi || 0), 0),
        totalTotalDeductionsAppliedThisRun: employees.reduce((s, e) => s + (e.totalDeductionsAppliedThisRun || 0), 0),
        totalFinalNetPay: employees.reduce((s, e) => s + (e.finalNetPay || 0), 0),
    };
};

const formatNumberForTable = (amount?: number) => (amount === undefined || amount === null || isNaN(amount) ? "0" : Math.round(amount).toLocaleString('en-US'));
const formatCurrencyForCard = (amount?: number) => `RWF ${formatNumberForTable(amount)}`;
const sanitizeFilename = (name: string | null | undefined): string => { if (!name) return 'UnknownCompany'; return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, ''); };

const idLikePayrollDetailFieldsForExport = ['employeeId', 'staffNumber', 'rssbNumber'];

export default function PayrollRunDetailPage() {
  const router = useRouter(); const params = useParams();
  const { selectedCompanyId, selectedCompanyName, isLoadingCompanyContext } = useCompany();
  const runId = typeof params.id === 'string' ? params.id : '';
  const [currentTaxSettings, setCurrentTaxSettings] = useState<TaxSettingsData>(() => getDefaultTaxSettings());
  const [payrollRun, setPayrollRun] = useState<PayrollRunDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true); const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(""); const [isPayrollProcessed, setIsPayrollProcessed] = useState(false);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [allPaymentConfigs, setAllPaymentConfigs] = useState<Record<string, StaffPaymentDetails>>({});
  const [allDeductions, setAllDeductions] = useState<FullDeductionRecord[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData | null>(null);
  const [companyPaymentTypes, setCompanyPaymentTypes] = useState<PaymentType[]>([]);
  const [companyDeductionTypes, setCompanyDeductionTypes] = useState<CompanyDeductionType[]>([]);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [activeDeductionTypeColumns, setActiveDeductionTypeColumns] = useState<CompanyDeductionType[]>([]);
  const [activePaymentTypeColumns, setActivePaymentTypeColumns] = useState<PaymentType[]>([]);
  const [activeStatutoryColumns, setActiveStatutoryColumns] = useState<string[]>([]);
  const [pageFeedback, setPageFeedback] = useState<FeedbackMessage | null>(null);
  const [dialogCurrentPage, setDialogCurrentPage] = useState(1);
  const [dialogRowsPerPage, setDialogRowsPerPage] = useState(DIALOG_ROWS_PER_PAGE_OPTIONS[0]);
  const [payrollJustProcessedMessage, setPayrollJustProcessedMessage] = useState<string | null>(null);

  const tableTotals = useMemo(() => (payrollRun && payrollRun.employees ? calculateRunTotals(payrollRun.employees, companyPaymentTypes, companyDeductionTypes) : calculateRunTotals([], companyPaymentTypes, companyDeductionTypes)), [payrollRun, companyPaymentTypes, companyDeductionTypes]);

  const paginatedDialogEmployees = useMemo(() => {
    if (!payrollRun || !payrollRun.employees) return [];
    const startIndex = (dialogCurrentPage - 1) * dialogRowsPerPage;
    const endIndex = startIndex + dialogRowsPerPage;
    return payrollRun.employees.slice(startIndex, endIndex);
  }, [payrollRun, dialogCurrentPage, dialogRowsPerPage]);

  const dialogTotalItems = payrollRun?.employees?.length || 0;
  const dialogTotalPages = Math.ceil(dialogTotalItems / dialogRowsPerPage) || 1;
  
  const setDynamicColumnsBasedOnRun = (run: PayrollRunDetail, cDeductionTypes: CompanyDeductionType[], cPaymentTypes: PaymentType[]) => {
    if (!run || !run.employees || run.employees.length === 0) {
        setActiveDeductionTypeColumns([]);
        setActivePaymentTypeColumns([]);
        setActiveStatutoryColumns([]);
        return;
    }
    const totalsForRun = calculateRunTotals(run.employees, cPaymentTypes, cDeductionTypes);

    const activePayTypesInRun = cPaymentTypes
        .filter(pt => (totalsForRun.dynamicTotalGrossEarnings?.[pt.id] ?? 0) > 0)
        .sort((a, b) => a.order - b.order);
    setActivePaymentTypeColumns(activePayTypesInRun);

    const activeDedTypesInRun = cDeductionTypes
        .filter(dt => (totalsForRun.dynamicTotalDeductionAmounts?.[dt.id] ?? 0) > 0)
        .sort((a, b) => a.order - b.order);
    setActiveDeductionTypeColumns(activeDedTypesInRun);
    
    const allPossibleStatutoryKeys: (keyof EmployeePayrollRecord)[] = [
      'grossSalary', 'employerRssb', 'employeeRssb', 'employerPension', 'employeePension',
      'employerMaternity', 'employeeMaternity', 'totalPension', 'totalMaternity',
      'employerRama', 'employeeRama', 'totalRama',
      'paye', 'netPayBeforeCbhi', 'cbhiDeduction', 'netPayAfterCbhi',
      'totalDeductionsAppliedThisRun', 'finalNetPay'
    ];
    
    const activeStats = allPossibleStatutoryKeys.filter(key => {
        const totalKey = `total${key.charAt(0).toUpperCase() + key.slice(1)}`;
        return (totalsForRun as any)[totalKey] > 0;
    });
    setActiveStatutoryColumns(activeStats);
  };

  useEffect(() => {
    const loadInitialData = async () => {
        if (isLoadingCompanyContext || !selectedCompanyId || !runId) {
            if(!isLoadingCompanyContext && !selectedCompanyId && typeof window !== 'undefined' && window.location.pathname !== '/select-company') router.push("/app/payroll");
            return;
        }
        setIsLoading(true);
        setPageFeedback(null);
        setPayrollJustProcessedMessage(null);
        try {
            const taxSettings = await getGlobalSingletonData<TaxSettingsData>(STORE_NAMES.TAX_SETTINGS) || getDefaultTaxSettings(); setCurrentTaxSettings(taxSettings);
            const staffFromDB = await getAllFromStore<StaffMember>(STORE_NAMES.STAFF, selectedCompanyId) || []; setAllStaff(staffFromDB);
            const paymentConfigsFromDB = await getAllPaymentConfigsForCompany<StaffPaymentDetails>(selectedCompanyId); setAllPaymentConfigs(paymentConfigsFromDB);
            const deductionsFromDB = await getAllFromStore<FullDeductionRecord>(STORE_NAMES.DEDUCTIONS, selectedCompanyId) || []; setAllDeductions(deductionsFromDB);
            
            let profileFromDB = await getCompanySingletonData<CompanyProfileData>(STORE_NAMES.COMPANY_PROFILE, selectedCompanyId);
            if (!profileFromDB && selectedCompanyId) {
              const globalCompanies = await getAllFromGlobalStore<GlobalApplicationCompany>(STORE_NAMES.COMPANIES);
              const currentGlobalCompany = globalCompanies.find(c => c.id === selectedCompanyId);
              const newProfileForCompany: CompanyProfileData = {
                name: selectedCompanyName || currentGlobalCompany?.name || `Company ${selectedCompanyId}`,
                address: currentGlobalCompany?.address || "",
                registrationNumber: "",
                taxId: currentGlobalCompany?.tinNumber || "",
                contactEmail: currentGlobalCompany?.email || "",
                contactPhone: currentGlobalCompany?.phone || "",
                currency: "RWF",
                isPayeActive: true, isPensionActive: true, isMaternityActive: true, isCbhiActive: true, isRamaActive: true,
                primaryBusiness: currentGlobalCompany?.primaryBusiness || "",
              };
              await putCompanySingletonData<CompanyProfileData>(STORE_NAMES.COMPANY_PROFILE, newProfileForCompany, selectedCompanyId);
              profileFromDB = newProfileForCompany;
            }
            if (profileFromDB && typeof profileFromDB.isRamaActive === 'undefined') {
                profileFromDB.isRamaActive = true;
            }
            setCompanyProfile(profileFromDB || null);

            let paymentTypesFromDB = await getAllFromStore<PaymentType>(STORE_NAMES.PAYMENT_TYPES, selectedCompanyId);
            if (paymentTypesFromDB.length === 0 && selectedCompanyId) { const defaultTypes = initialPaymentTypesForCompanySeed(selectedCompanyId); for (const type of defaultTypes) { await putToStore<PaymentType>(STORE_NAMES.PAYMENT_TYPES, type, selectedCompanyId); } paymentTypesFromDB = defaultTypes; }
            setCompanyPaymentTypes(paymentTypesFromDB.sort((a,b) => a.order - b.order));

            let dedTypesFromDB = await getAllFromStore<CompanyDeductionType>(STORE_NAMES.DEDUCTION_TYPES, selectedCompanyId);
            if (dedTypesFromDB.length === 0 && selectedCompanyId) { const defaultDedTypes = initialCompanyDeductionTypesSeed(selectedCompanyId); for (const type of defaultDedTypes) { await putToStore<CompanyDeductionType>(STORE_NAMES.DEDUCTION_TYPES, type, selectedCompanyId); } dedTypesFromDB = defaultDedTypes; }
            setCompanyDeductionTypes(dedTypesFromDB.sort((a,b) => a.order - b.order));

            let runDetail = await getFromStore<PayrollRunDetail>(STORE_NAMES.PAYROLL_RUN_DETAILS, runId, selectedCompanyId);
            if (runDetail) {
                setPayrollRun(runDetail);
                const processed = runDetail.employees && runDetail.employees.length > 0;
                setIsPayrollProcessed(processed);
                if (processed) {
                    setDynamicColumnsBasedOnRun(runDetail, dedTypesFromDB, paymentTypesFromDB);
                    setIsDetailViewOpen(true);
                }
            } else {
                const summary = await getFromStore<PayrollRunSummary>(STORE_NAMES.PAYROLL_SUMMARIES, runId, selectedCompanyId);
                if (summary) {
                    const newDetailShell: PayrollRunDetail = {
                        id: summary.id, companyId: selectedCompanyId, month: summary.month, year: summary.year,
                        status: summary.status, employees: [], ...(calculateRunTotals([], paymentTypesFromDB, dedTypesFromDB) as any),
                        rejectionReason: summary.rejectionReason
                    };
                    setPayrollRun(newDetailShell); setIsPayrollProcessed(false);
                    setPageFeedback({type: 'info', message: `Payroll run for ${summary.month} ${summary.year} is in Draft. Please 'Run Payroll' to process.`});
                } else { router.push("/app/payroll"); }
            }
        } catch (error) { console.error("Error loading payroll detail page data:", error); router.push("/app/payroll"); }
        setIsLoading(false);
    };
    loadInitialData();
  }, [runId, selectedCompanyId, isLoadingCompanyContext, router, selectedCompanyName]);

  const updatePayrollRunStateAndStorage = async (updatedRun: PayrollRunDetail) => {
    if (!selectedCompanyId) return;
    try {
        await putToStore<PayrollRunDetail>(STORE_NAMES.PAYROLL_RUN_DETAILS, updatedRun, selectedCompanyId);
        const runTotalsForSummary = calculateRunTotals(updatedRun.employees, companyPaymentTypes, companyDeductionTypes);
        const updatedSummary: PayrollRunSummary = {
            id: updatedRun.id, companyId: selectedCompanyId, month: updatedRun.month, year: updatedRun.year, employees: updatedRun.employees.length,
            grossSalary: runTotalsForSummary.totalGrossSalary || 0,
            deductions: (runTotalsForSummary.totalEmployeeRssb || 0) + (runTotalsForSummary.totalPaye || 0) + (runTotalsForSummary.totalCbhiDeduction || 0) + (runTotalsForSummary.totalTotalDeductionsAppliedThisRun || 0),
            netPay: runTotalsForSummary.totalFinalNetPay || 0, status: updatedRun.status, rejectionReason: updatedRun.rejectionReason,
        };
        await putToStore<PayrollRunSummary>(STORE_NAMES.PAYROLL_SUMMARIES, updatedSummary, selectedCompanyId);
        setPayrollRun(updatedRun);
    } catch (error) { console.error("Error saving payroll run data:", error); throw error; }
  };

 const handleRunPayroll = async () => {
    setPageFeedback(null);
    setPayrollJustProcessedMessage(null);
    if (!selectedCompanyId) {
        setPageFeedback({type: 'error', message: "Error: No company is currently selected. Please select a company and try again."});
        return;
    }
    if (!companyProfile) {
        setPageFeedback({type: 'error', message: `Error: Company profile for ${selectedCompanyName || 'the selected company'} is missing or incomplete.`, details: "Please go to 'Company Settings' to configure it, especially tax exemptions, before running payroll."});
        return;
    }
    const activeStaffForCompany = allStaff.filter(s => s.status === "Active" && s.companyId === selectedCompanyId);
    if (activeStaffForCompany.length === 0) {
        setPageFeedback({type: 'error', message: "Error: No active staff members found for this company.", details: "Please add or activate staff before running payroll."});
        return;
    }
    if (!payrollRun) {
        setPageFeedback({type: 'error', message: "Error: Cannot run payroll as the current run details are not loaded."});
        return;
    }
    if (companyPaymentTypes.length === 0) {
        setPageFeedback({type: 'error', message: "Error: Cannot run payroll.", details: "No payment types are defined for this company. Please configure them in 'Payments' settings."});
        return;
    }
    if (companyDeductionTypes.length === 0) {
        setPageFeedback({type: 'error', message: "Error: Cannot run payroll.", details: "No deduction types are defined for this company. Please configure them in 'Deductions' settings."});
        return;
    }
    
    const companyExemptions: Pick<CompanyProfileData, 'isPayeActive' | 'isPensionActive' | 'isMaternityActive' | 'isCbhiActive' | 'isRamaActive'> = {
        isPayeActive: companyProfile.isPayeActive,
        isPensionActive: companyProfile.isPensionActive,
        isMaternityActive: companyProfile.isMaternityActive,
        isCbhiActive: companyProfile.isCbhiActive,
        isRamaActive: companyProfile.isRamaActive,
    };

    const processedEmployees: EmployeePayrollRecord[] = activeStaffForCompany.map(staff => {
        const paymentConfig = allPaymentConfigs[staff.id] || {};
        const activeDeductionsForStaff = allDeductions.filter(d => d.staffId === staff.id && (d.balance || 0) > 0 && d.companyId === selectedCompanyId);
        return calculateMockEmployeeRecord(staff, paymentConfig, activeDeductionsForStaff, currentTaxSettings, companyExemptions, companyPaymentTypes, companyDeductionTypes, selectedCompanyId);
    });

    const totals = calculateRunTotals(processedEmployees, companyPaymentTypes, companyDeductionTypes);
    const updatedRun: PayrollRunDetail = { ...payrollRun, companyId: selectedCompanyId, employees: processedEmployees, status: "Draft", rejectionReason: undefined, ...(totals as Partial<PayrollRunDetail>) };
    setPayrollRun(updatedRun);
    setIsPayrollProcessed(true);
    setPayrollJustProcessedMessage(`Payroll for ${payrollRun.month} ${payrollRun.year} has been successfully processed.`);

    if (processedEmployees.length > 0) {
        setDynamicColumnsBasedOnRun(updatedRun, companyDeductionTypes, companyPaymentTypes);
        setDialogCurrentPage(1);
        setIsDetailViewOpen(true);
    }
};

  const handleSaveDraft = async () => {
    setPageFeedback(null);
    setPayrollJustProcessedMessage(null);
    if (!payrollRun || !isPayrollProcessed || payrollRun.employees.length === 0 || !selectedCompanyId) { 
        setPageFeedback({type: 'error', message: "Error: Payroll must be processed before saving as draft."}); 
        return; 
    }
    const draftToSave: PayrollRunDetail = { ...payrollRun, status: "Draft", rejectionReason: undefined, companyId: selectedCompanyId };
    try { 
        await updatePayrollRunStateAndStorage(draftToSave); 
        await logAuditEvent("Payroll Draft Saved", `Payroll run ID ${payrollRun.id} for ${payrollRun.month} ${payrollRun.year} saved as Draft.`, selectedCompanyId, selectedCompanyName);
        setPageFeedback({type: 'success', message: "Payroll draft saved successfully."}); 
    } catch (error) { 
        setPageFeedback({type: 'error', message: "Error: Could not save payroll draft.", details: (error as Error).message}); 
    }
  };
 const handleSendForApproval = async () => {
    setPageFeedback(null);
    setPayrollJustProcessedMessage(null);
    if (!payrollRun || !isPayrollProcessed || payrollRun.employees.length === 0 || !selectedCompanyId) { 
        setPageFeedback({type: 'error', message: "Error: Payroll must be processed before sending for approval."}); 
        return; 
    }
    const draftData: PayrollRunDetail = { ...payrollRun, status: "Draft", rejectionReason: undefined, companyId: selectedCompanyId };
    try { 
        await updatePayrollRunStateAndStorage(draftData); 
        const forApprovalData: PayrollRunDetail = { ...draftData, status: "To Approve" as PayrollStatus }; 
        await updatePayrollRunStateAndStorage(forApprovalData); 
        await logAuditEvent("Payroll Sent for Approval", `Payroll run ID ${payrollRun.id} for ${payrollRun.month} ${payrollRun.year} sent for approval.`, selectedCompanyId, selectedCompanyName);
        setPageFeedback({type: 'success', message: "Payroll sent for approval successfully."}); 
    } catch (error) { 
        setPageFeedback({type: 'error', message: "Error: Could not send payroll for approval.", details: (error as Error).message}); 
    }
  };
  const handleApproveRun = async () => {
    setPageFeedback(null);
    setPayrollJustProcessedMessage(null);
    if (!payrollRun || !selectedCompanyId) return;
    const updatedRunData = { ...payrollRun, status: "Approved" as PayrollStatus, rejectionReason: undefined, companyId: selectedCompanyId };
    try {
      await updatePayrollRunStateAndStorage(updatedRunData);
      await logAuditEvent("Payroll Approved", `Payroll run ID ${payrollRun.id} for ${payrollRun.month} ${payrollRun.year} approved.`, selectedCompanyId, selectedCompanyName);
      setPageFeedback({type: 'success', message: "Payroll approved successfully."});
      const approvedRunDetails = await getFromStore<PayrollRunDetail>(STORE_NAMES.PAYROLL_RUN_DETAILS, updatedRunData.id, selectedCompanyId);
      if (!approvedRunDetails || !approvedRunDetails.employees) { 
          console.warn("Could not fetch approved run details for deduction update."); 
          setPageFeedback(prev => ({...prev, details: (prev?.details || "") + " Warning: Could not fetch approved run details for deduction update."}));
          return; 
      }
      const allCurrentDeductionRecords = await getAllFromStore<FullDeductionRecord>(STORE_NAMES.DEDUCTIONS, selectedCompanyId);
      const deductionsToActuallyUpdateInDB: FullDeductionRecord[] = []; let deductionsUpdatedCount = 0;
      for (const empRecord of approvedRunDetails.employees) {
        if (empRecord.appliedDeductions && empRecord.appliedDeductions.length > 0) {
            for (const appliedDed of empRecord.appliedDeductions) {
                const dedRecordToUpdate = allCurrentDeductionRecords.find(d => d.id === appliedDed.deductionId && d.companyId === selectedCompanyId);
                if (dedRecordToUpdate) {
                    let recordInBatch = deductionsToActuallyUpdateInDB.find(d => d.id === dedRecordToUpdate.id);
                    if (!recordInBatch) { recordInBatch = { ...dedRecordToUpdate }; deductionsToActuallyUpdateInDB.push(recordInBatch); }
                    recordInBatch.deductedSoFar = (recordInBatch.deductedSoFar || 0) + (appliedDed.amountApplied || 0);
                    recordInBatch.balance = Math.max(0, (recordInBatch.originalAmount || 0) - recordInBatch.deductedSoFar);
                    deductionsUpdatedCount++;
                }
            }
        }
      }
      if (deductionsToActuallyUpdateInDB.length > 0) {
        for (const dedToSave of deductionsToActuallyUpdateInDB) { await putToStore<FullDeductionRecord>(STORE_NAMES.DEDUCTIONS, dedToSave, selectedCompanyId); }
        setAllDeductions(prevDeds => { const updatedMap = new Map(prevDeds.map(d => [d.id, d])); deductionsToActuallyUpdateInDB.forEach(updated => updatedMap.set(updated.id, updated)); return Array.from(updatedMap.values()); });
        setPageFeedback(prev => ({...prev, details: (prev?.details || "") + ` ${deductionsUpdatedCount} deduction record(s) reconciled.`}));
      }
    } catch (error) { 
        setPageFeedback({type: 'error', message: "Error: Could not approve payroll.", details: (error as Error).message}); 
    }
  };
  const handleOpenRejectDialog = () => { setPageFeedback(null); setPayrollJustProcessedMessage(null); setRejectionReason(payrollRun?.rejectionReason || ""); setIsRejectDialogOpen(true); };
  const handleConfirmRejectRun = async () => { 
      setPageFeedback(null);
      setPayrollJustProcessedMessage(null);
      if (payrollRun && rejectionReason.trim() !== "" && selectedCompanyId) { 
          const updatedRun = { ...payrollRun, status: "Rejected" as PayrollStatus, rejectionReason: rejectionReason.trim(), companyId: selectedCompanyId }; 
          try { 
              await updatePayrollRunStateAndStorage(updatedRun); 
              await logAuditEvent("Payroll Rejected", `Payroll run ID ${payrollRun.id} for ${payrollRun.month} ${payrollRun.year} rejected. Reason: ${rejectionReason.trim()}`, selectedCompanyId, selectedCompanyName);
              setIsPayrollProcessed(true); 
              setPageFeedback({type: 'success', message: "Payroll rejected successfully."}); 
              setIsRejectDialogOpen(false); 
          } catch (error) {
              setPageFeedback({type: 'error', message:"Error: Could not reject payroll.", details: (error as Error).message});
          } 
      } else { 
          setPageFeedback({type: 'error', message: "Error: Rejection reason is required."}); 
      } 
  };
  const handleEditRun = () => {
    setPageFeedback(null);
    setPayrollJustProcessedMessage(null);
    if (payrollRun && selectedCompanyId) {
        if (payrollRun.status === "Draft" || payrollRun.status === "Rejected") {
            setIsPayrollProcessed(false); setIsDetailViewOpen(false); setActiveDeductionTypeColumns([]); setActivePaymentTypeColumns([]);
            setPageFeedback({type: 'info', message: "Payroll run is now editable. Please re-run payroll after making changes."});
            const runToEdit: PayrollRunDetail = { ...payrollRun, companyId: selectedCompanyId, employees: [], ...(calculateRunTotals([], companyPaymentTypes, companyDeductionTypes) as Partial<PayrollRunDetail>) };
            setPayrollRun(runToEdit);
        } else { 
            setPageFeedback({type: 'error', message: "Error: Cannot edit run with status: " + payrollRun.status}); 
        }
    }
  };

  const memoizedPayrollDetailColumns = useMemo(() => {
    const baseColumns = [
      { key: 'firstName', label: 'First Name', isNumeric: false }, { key: 'lastName', label: 'Last Name', isNumeric: false },
      { key: 'staffNumber', label: 'Staff No.', isNumeric: false, isIdLike: true }, { key: 'rssbNumber', label: 'RSSB No.', isNumeric: false, isIdLike: true }
    ];

    const dynamicEarningsColumns = activePaymentTypeColumns.map(pt => ({
      key: `dyn_earn_${pt.id}`, label: `${pt.name}`,
      accessor: (emp: EmployeePayrollRecord) => emp.dynamicGrossEarnings?.[pt.id] || 0,
      isNumeric: true
    }));
    
    const statutoryColumnsBeforeDeductions = [
        { key: 'grossSalary', label: 'Total Gross', isNumeric: true }, 
        { key: 'employerRssb', label: 'Empr. RSSB', isNumeric: true },
        { key: 'employeeRssb', label: 'Empe. RSSB', isNumeric: true }, 
        { key: 'employerPension', label: 'Empr. Pension', isNumeric: true },
        { key: 'employeePension', label: 'Empe. Pension', isNumeric: true }, 
        { key: 'employerMaternity', label: 'Empr. Maternity', isNumeric: true },
        { key: 'employeeMaternity', label: 'Empe. Maternity', isNumeric: true }, 
        { key: 'employerRama', label: 'Empr. RAMA', isNumeric: true },
        { key: 'employeeRama', label: 'Empe. RAMA', isNumeric: true },
        { key: 'totalRama', label: 'Total RAMA', isNumeric: true },
        { key: 'totalPension', label: 'Total Pension', isNumeric: true }, 
        { key: 'totalMaternity', label: 'Total Maternity', isNumeric: true }, 
        { key: 'paye', label: 'PAYE', isNumeric: true },
        { key: 'netPayBeforeCbhi', label: 'Net (Bef. CBHI)', isNumeric: true }, 
        { key: 'cbhiDeduction', label: 'CBHI Ded.', isNumeric: true },
        { key: 'netPayAfterCbhi', label: 'Net (Aft. CBHI)', isNumeric: true },
    ];
    
    const statutoryColumnsAfterDeductions = [
        { key: 'totalDeductionsAppliedThisRun', label: 'Total Applied Ded.', isNumeric: true },
        { key: 'finalNetPay', label: 'Final Net Pay', isNumeric: true },
    ];

    const visibleStatutoryBefore = statutoryColumnsBeforeDeductions.filter(col => activeStatutoryColumns.includes(col.key));
    const visibleStatutoryAfter = statutoryColumnsAfterDeductions.filter(col => activeStatutoryColumns.includes(col.key));

    const dynamicDeductionCols = activeDeductionTypeColumns.map(dt => ({
      key: `dyn_ded_${dt.id}`, label: dt.name,
      accessor: (emp: EmployeePayrollRecord) => emp.appliedDeductionAmounts?.[dt.id] || 0,
      isNumeric: true
    }));

    return [...baseColumns, ...dynamicEarningsColumns, ...visibleStatutoryBefore, ...dynamicDeductionCols, ...visibleStatutoryAfter];
  }, [activePaymentTypeColumns, activeDeductionTypeColumns, activeStatutoryColumns]);


  const exportPayrollDetails = (fileType: "csv" | "xlsx" | "pdf") => {
    setPageFeedback(null);
    setPayrollJustProcessedMessage(null);
    if (!payrollRun || !isPayrollProcessed || payrollRun.employees.length === 0 || !selectedCompanyId) { 
        setPageFeedback({type: 'error', message: "Error: Payroll must be processed before exporting."}); 
        return; 
    }
    const data = payrollRun.employees;
    const companyNameForFile = companyProfile?.name ? sanitizeFilename(companyProfile.name) : (selectedCompanyName ? sanitizeFilename(selectedCompanyName) : 'UnknownCompany');
    const fileName = `${companyNameForFile}_payroll_run_${payrollRun.id}_details_export.${fileType}`;
    const exportColumns = memoizedPayrollDetailColumns;
    const headers = exportColumns.map(col => col.label);

    const dataForExport = data.map(emp => {
        const row: Record<string, string | number> = {};
        exportColumns.forEach(col => {
            const value = typeof col.accessor === 'function' ? col.accessor(emp) : emp[col.key as keyof Omit<EmployeePayrollRecord, 'appliedDeductions' | 'companyId' | 'dynamicGrossEarnings' | 'appliedDeductionAmounts'>];
            if (col.isIdLike) {
                row[col.label] = String(value || '');
            } else if (col.isNumeric) {
                row[col.label] = Math.round((value as number) || 0);
            } else {
                row[col.label] = String(value || '');
            }
        });
        return row;
    });

    if (fileType === "csv") {
        const csvData = dataForExport.map(row => {
            const newRow: Record<string, string> = {};
            headers.forEach(header => {
                const colDef = exportColumns.find(c => c.label === header);
                let cellValue = String(row[header] || (colDef?.isNumeric ? '0' : ''));
                if (colDef?.isIdLike && /^\d+$/.test(cellValue) && cellValue.length > 0) {
                    cellValue = `'${cellValue}`;
                }
                newRow[header] = cellValue;
            });
            return newRow;
        });
        const csvString = Papa.unparse(csvData, { header: true, columns: headers });
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a'); const url = URL.createObjectURL(blob);
        link.setAttribute('href', url); link.setAttribute('download', fileName);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setPageFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "xlsx") {
        const xlsxData = dataForExport.map(row => {
            const newRow: Record<string, string|number>={};
            headers.forEach(h => {
                const colDef = exportColumns.find(c => c.label === h);
                if (colDef?.isIdLike) newRow[h] = String(row[h] || '');
                else newRow[h] = (typeof row[h] === 'number' ? row[h] : String(row[h] || ''));
            });
            return newRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(xlsxData, {header: headers, skipHeader: false});
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Details");
        XLSX.writeFile(workbook, fileName);
        setPageFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const margin = 36; const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(14).setFont(undefined, 'bold');
        doc.text(companyProfile?.name || "Company", margin, margin);
        doc.setFontSize(10).setFont(undefined, 'normal');
        if(companyProfile?.address) doc.text(companyProfile.address, margin, margin + 12);
        if(companyProfile?.taxId) doc.text(`TIN: ${companyProfile.taxId}`, margin, margin + 24);
        doc.setFontSize(12).setFont(undefined, 'bold');
        doc.text(`Payroll Run: ${payrollRun.id} (${payrollRun.month} ${payrollRun.year})`, margin, margin + 40);
      
        const columnStylesForPdf: {[key: number]: any} = {};
        exportColumns.forEach((col, index) => {
            columnStylesForPdf[index] = { halign: col.isNumeric ? 'right' : 'left' };
        });

        const bodyData = dataForExport.map(empRow =>
            exportColumns.map(col =>
                col.isNumeric ? formatNumberForTable(empRow[col.label] as number) : String(empRow[col.label] || '')
            )
        );

        const baseColumnsForTotals = exportColumns.filter(c => !c.isNumeric);
        const totalsLabelColSpan = baseColumnsForTotals.length || 1;
        const footerRowData: any[] = [{ content: 'Totals', colSpan: totalsLabelColSpan, styles: { fontStyle: 'bold', halign: 'right' } }];

        exportColumns.slice(totalsLabelColSpan).forEach(col => {
            let totalValue;
            if (col.key.startsWith('dyn_earn_')) { const paymentTypeId = col.key.substring(9); totalValue = (tableTotals as any).dynamicTotalGrossEarnings?.[paymentTypeId] || 0; }
            else if (col.key.startsWith('dyn_ded_')) { const deductionTypeId = col.key.substring(8); totalValue = (tableTotals as any).dynamicTotalDeductionAmounts?.[deductionTypeId] || 0; }
            else if (col.key === 'totalDeductionsAppliedThisRun') { totalValue = tableTotals.totalTotalDeductionsAppliedThisRun; }
            else { const totalKey = `total${col.key.charAt(0).toUpperCase() + col.key.slice(1)}`; totalValue = (tableTotals as any)[totalKey] ?? 0; }
            footerRowData.push({ content: formatNumberForTable(totalValue), styles: { halign: 'right', fontStyle: 'bold' } });
        });

        (doc as any).autoTable({
            head: [headers], body: bodyData, foot: [footerRowData], startY: margin + 55,
            styles: { fontSize: 5, cellPadding: 1, overflow: 'linebreak' },
            headStyles: { fillColor: [102, 126, 234], fontSize: 6, textColor: [255,255,255] },
            footStyles: { fillColor: [230, 230, 230], fontSize: 6, textColor: [0,0,0], fontStyle: 'bold'},
            columnStyles: columnStylesForPdf, margin: { left: margin, right: margin, bottom: margin + 20 },
            didDrawPage: (data: any) => {
                const str = "Page " + doc.getNumberOfPages();
                const pageHeightInner = doc.internal.pageSize.getHeight();
                doc.setFontSize(8);
                doc.text(str, data.settings.margin.left, pageHeightInner - (margin / 2));
                doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - data.settings.margin.right, pageHeightInner - (margin / 2), { align: 'right' });
                doc.setFont(undefined, 'italic').setTextColor(150);
                doc.text("Powered by Cheetah Payroll", pageWidth / 2, pageHeightInner - (margin / 2) + 10, { align: 'center' });
                doc.setFont(undefined, 'normal').setTextColor(0);
            }
        });
        doc.save(fileName);
        setPageFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    }
  };

  const renderPageFeedback = () => {
    if (!pageFeedback) return null;
    let IconComponent;
    let variant: "default" | "destructive" = "default";
    let additionalAlertClasses = "";

    switch (pageFeedback.type) {
      case 'success':
        IconComponent = CheckCircle;
        variant = "default";
        additionalAlertClasses = "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600 [&>svg]:text-green-600 dark:[&>svg]:text-green-400";
        break;
      case 'error':
        IconComponent = AlertTriangle;
        variant = "destructive";
        break;
      case 'info':
        IconComponent = InfoIcon;
        variant = "default";
        break;
      default:
        return null;
    }
    return (
      <Alert variant={variant} className={cn("mb-4", additionalAlertClasses)}>
        <IconComponent className="h-4 w-4" />
        <AlertTitle>{pageFeedback.message}</AlertTitle>
        {pageFeedback.details && <AlertDescription>{pageFeedback.details}</AlertDescription>}
      </Alert>
    );
  };

  if (isLoadingCompanyContext) { return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading company info...</div>; }
  if (!selectedCompanyId) { return (<div className="flex flex-col items-center justify-center h-64 text-center"><SlidersHorizontal className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-xl font-semibold">No Company Selected</p><p className="text-muted-foreground">Please select a company.</p><Button asChild className="mt-4"><Link href="/app/payroll">Back to Payroll List</Link></Button></div>); }
  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading payroll details...</div>;
  if (!payrollRun) return <div className="text-center py-10">Payroll run not found. <Link href="/app/payroll" className="text-primary hover:underline">Go back</Link>.</div>;
  const StatusIcon = statusConfig[payrollRun.status].icon;
  const baseColumnsForDialogTable = memoizedPayrollDetailColumns.filter(c => !c.isNumeric);
  const totalsLabelColSpanForDialogTable = baseColumnsForDialogTable.length || 1;


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2 mb-1"><SlidersHorizontal className="h-7 w-7 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Payroll Run: {payrollRun.id}</h1></div>{payrollRun && (<Badge className={`${statusConfig[payrollRun.status].color} ${statusConfig[payrollRun.status].textColor} text-sm px-3 py-1.5`}><StatusIcon className="mr-2 h-4 w-4" />Status: {payrollRun.status}</Badge>)}</div>
      <div className="flex justify-end"><Button variant="outline" onClick={() => { setPageFeedback(null); setPayrollJustProcessedMessage(null); router.push("/app/payroll");}}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Payroll List</Button></div>
      {renderPageFeedback()}
      <Card>
        <CardHeader><CardTitle className="text-2xl">Summary: {payrollRun.id}</CardTitle><CardDescription>Period: {payrollRun.month} {payrollRun.year}.</CardDescription>{payrollRun.status === "Rejected" && payrollRun.rejectionReason && (<p className="text-sm text-destructive mt-2"><span className="font-semibold">Reason:</span> {payrollRun.rejectionReason}</p>)}</CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg min-w-0"><Users className="h-6 w-6 text-primary mb-1" /><p className="text-xs text-muted-foreground">Total Employees</p><p className="text-base sm:text-lg md:text-xl font-semibold">{formatNumberForTable(tableTotals.totalEmployees)}</p></div>
                <div className="p-4 bg-muted/50 rounded-lg min-w-0"><Banknote className="h-6 w-6 text-primary mb-1" /><p className="text-xs text-muted-foreground">Total Gross Salary</p><p className="text-base sm:text-lg md:text-xl font-semibold">{formatCurrencyForCard(tableTotals.totalGrossSalary)}</p></div>
                <div className="p-4 bg-muted/50 rounded-lg min-w-0"><MinusCircle className="h-6 w-6 text-destructive mb-1" /><p className="text-xs text-muted-foreground">Total Deductions</p><p className="text-base sm:text-lg md:text-xl font-semibold">{formatCurrencyForCard((tableTotals.totalEmployeeRssb || 0) + (tableTotals.totalPaye || 0) + (tableTotals.totalCbhiDeduction || 0) + (tableTotals.totalTotalDeductionsAppliedThisRun || 0))}</p></div>
                <div className="p-4 bg-muted/50 rounded-lg min-w-0"><CheckCircle className="h-6 w-6 text-primary mb-1" /><p className="text-xs text-muted-foreground">Total Final Net Pay</p><p className="text-base sm:text-lg md:text-xl font-semibold">{formatCurrencyForCard(tableTotals.totalFinalNetPay)}</p></div>
            </div>
            {isPayrollProcessed && payrollRun.employees.length > 0 ? (<div className="flex justify-start mt-4"><Button variant="outline" onClick={() => { setDialogCurrentPage(1); setIsDetailViewOpen(true); }}><Eye className="mr-2 h-4 w-4" /> View Full Employee Details</Button></div>) : ((payrollRun.status === "Draft" || payrollRun.status === "Rejected") && (<CardFooter className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-2 border-t-0 pt-4"><Button onClick={handleRunPayroll} className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto" disabled={companyPaymentTypes.length === 0 || companyDeductionTypes.length === 0}><PlayCircle className="mr-2 h-4 w-4" /> Run Payroll</Button></CardFooter>))}
        </CardContent>
      </Card>
      <Dialog open={isDetailViewOpen} onOpenChange={(isOpen) => { setIsDetailViewOpen(isOpen); if (!isOpen) {setPageFeedback(null); setPayrollJustProcessedMessage(null);}}}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-7xl xl:max-w-screen-2xl flex flex-col h-[90vh]">
            <DialogHeader>
                <DialogTitle>Employee Payroll Details for {payrollRun.id}</DialogTitle>
                <DialogDescription>Breakdown of earnings and deductions for {payrollRun.month} {payrollRun.year}.</DialogDescription>
                {payrollJustProcessedMessage && (
                    <Alert variant="default" className="mt-2 bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600 [&>svg]:text-green-600 dark:[&>svg]:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>{payrollJustProcessedMessage}</AlertTitle>
                    </Alert>
                )}
            </DialogHeader>
             <div className="flex-grow flex flex-col min-h-0">
                <div className="overflow-auto flex-grow min-h-0" tabIndex={0}>
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-background">
                            <TableRow>
                                {memoizedPayrollDetailColumns.map(col =>
                                    <TableHead
                                        key={`header-sticky-${col.key}`}
                                        className={cn(
                                            "bg-background whitespace-nowrap min-w-[120px]",
                                            col.isNumeric ? "text-right" : "text-left"
                                        )}
                                    >
                                        {col.label}
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {paginatedDialogEmployees.map((emp) => (
                            <TableRow key={emp.employeeId}>
                            {memoizedPayrollDetailColumns.map(col => {
                                const value = typeof col.accessor === 'function' ? col.accessor(emp) : emp[col.key as keyof Omit<EmployeePayrollRecord, 'appliedDeductions' | 'companyId' | 'dynamicGrossEarnings' | 'appliedDeductionAmounts'>];
                                const cellClassName = cn(
                                col.isNumeric ? "text-right" : "text-left", "whitespace-nowrap min-w-[120px]",
                                (col.key === 'grossSalary' || col.key === 'finalNetPay') && col.isNumeric ? "font-semibold" : ""
                                );
                                return (
                                <TableCell key={`${emp.employeeId}-${col.key}`} className={cellClassName}>
                                    {col.isNumeric ? formatNumberForTable(value as number) : String(value || '')}
                                </TableCell>
                                );
                            })}
                            </TableRow>
                        ))}
                        {paginatedDialogEmployees.length === 0 && (
                            <TableRow><TableCell colSpan={memoizedPayrollDetailColumns.length} className="text-center h-24">No employees on this page.</TableCell></TableRow>
                        )}
                        </TableBody>
                        {payrollRun.employees.length > 0 && (
                        <ShadTableFooter>
                          <TableRow className="bg-background">
                            <TableCell colSpan={totalsLabelColSpanForDialogTable} className="text-right font-bold whitespace-nowrap min-w-[120px]">Grand Totals</TableCell>
                            {memoizedPayrollDetailColumns.slice(totalsLabelColSpanForDialogTable).map(col => {
                              let totalValue;
                              if (col.key.startsWith('dyn_earn_')) { const paymentTypeId = col.key.substring(9); totalValue = (tableTotals as any).dynamicTotalGrossEarnings?.[paymentTypeId] || 0; }
                              else if (col.key.startsWith('dyn_ded_')) { const deductionTypeId = col.key.substring(8); totalValue = (tableTotals as any).dynamicTotalDeductionAmounts?.[deductionTypeId] || 0; }
                              else if (col.key === 'totalDeductionsAppliedThisRun') { totalValue = tableTotals.totalTotalDeductionsAppliedThisRun; }
                              else { const totalKey = `total${col.key.charAt(0).toUpperCase() + col.key.slice(1)}`; totalValue = (tableTotals as any)[totalKey] ?? 0; }
                              return <TableCell key={`total-${col.key}`} className="text-right font-bold whitespace-nowrap min-w-[120px]">{formatNumberForTable(totalValue)}</TableCell>
                            })}
                          </TableRow>
                        </ShadTableFooter>
                        )}
                    </Table>
                </div>
            
                {dialogTotalPages > 1 && (
                <div className="shrink-0 py-4 border-t">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                        Page {dialogCurrentPage} of {dialogTotalPages} ({dialogTotalItems} total employees)
                        </div>
                        <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Rows per page</p>
                            <Select value={`${dialogRowsPerPage}`} onValueChange={(value) => {setDialogRowsPerPage(Number(value)); setDialogCurrentPage(1);}}>
                            <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${dialogRowsPerPage}`} /></SelectTrigger>
                            <SelectContent side="top">
                                {DIALOG_ROWS_PER_PAGE_OPTIONS.map((pageSize) => (<SelectItem key={`dialog-payroll-${pageSize}`} value={`${pageSize}`}>{pageSize}</SelectItem>))}
                            </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => setDialogCurrentPage(1)} disabled={dialogCurrentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setDialogCurrentPage(prev => prev - 1)} disabled={dialogCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setDialogCurrentPage(prev => prev + 1)} disabled={dialogCurrentPage === dialogTotalPages}><ChevronRight className="h-4 w-4" /></Button>
                            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => setDialogCurrentPage(dialogTotalPages)} disabled={dialogCurrentPage === dialogTotalPages}><ChevronsRight className="h-4 w-4" /></Button>
                        </div>
                        </div>
                    </div>
                </div>
                )}
            </div>

            <DialogFooter className="border-t pt-4 sm:justify-between mt-auto shrink-0">{/* Dialog Actions Footer */}
                <div className="flex flex-wrap gap-2">
                { (payrollRun.status === "Draft" || payrollRun.status === "Rejected") && isPayrollProcessed && payrollRun.employees.length > 0 && (
                    <>
                    <Button variant="outline" onClick={handleEditRun} className="w-full sm:w-auto"><Edit2 className="mr-2 h-4 w-4" /> Edit / Re-run</Button>
                    <Button onClick={handleSaveDraft} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"><Save className="mr-2 h-4 w-4" /> Save as Draft</Button>
                    <Button onClick={handleSendForApproval} variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary w-full sm:w-auto"><Send className="mr-2 h-4 w-4" /> Send for Approval</Button>
                    </>
                )}
                {payrollRun.status === "To Approve" && (
                    <>
                    <Button onClick={handleApproveRun} className="bg-primary hover:bg-primary/90 w-full sm:w-auto"><CheckCircle className="mr-2 h-4 w-4" /> Approve Run</Button>
                    <Button variant="destructive" onClick={handleOpenRejectDialog} className="w-full sm:w-auto"><XCircle className="mr-2 h-4 w-4" /> Reject Run</Button>
                    </>
                )}
                </div>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto" disabled={!isPayrollProcessed || payrollRun.employees.length === 0}>
                            <Download className="mr-2 h-4 w-4" /> Export Current
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportPayrollDetails("csv")}><FileText className="mr-2 h-4 w-4" /> Export as CSV</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportPayrollDetails("xlsx")}><FileSpreadsheetIcon className="mr-2 h-4 w-4" /> Export as XLSX</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportPayrollDetails("pdf")}><FileTypePdfIcon className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isRejectDialogOpen} onOpenChange={(isOpen) => { setIsRejectDialogOpen(isOpen); if (!isOpen) setPageFeedback(null);}}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Reject Payroll Run</DialogTitle><DialogDescription>Provide reason for rejecting {payrollRun?.id}.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label htmlFor="rejectionReason">Rejection Reason *</Label><Input id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g., Incorrect overtime"/></div></div><DialogFooter><Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleConfirmRejectRun}>Confirm Rejection</Button></DialogFooter></DialogContent></Dialog>
      <div className="p-4 border-l-4 border-primary bg-primary/10 rounded-md mt-8"><p className="font-semibold text-primary/90">Notes:</p><ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1"><li>Tax settings apply globally unless company-specific exemptions are set. Staff data, payment configs, and deductions are company-specific.</li><li>Payment Types (e.g. Basic Pay, Allowances) defined in 'Payments Configuration' determine earnings. "Net" components are grossed-up sequentially.</li><li>Deductions are applied based on the order of Deduction Types defined in 'Deductions Management', after statutory deductions. Insufficient net pay may result in partial or skipped deductions.</li><li>Saving a draft, approving, or rejecting updates this run in IndexedDB. Approved runs update staff deduction balances.</li></ul></div>
    </div>
  );
}
