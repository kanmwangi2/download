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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, Download, FileText, Edit2,
  CheckCircle, XCircle, AlertTriangle, Hourglass, Users, Banknote, 
  MinusCircle, PlayCircle, Send, Save, Eye, SlidersHorizontal,
  Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  InfoIcon, FileSpreadsheet as FileSpreadsheetIcon, FileType as FileTypePdfIcon
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSupabaseClient } from '@/lib/supabase';
import { useCompany } from '@/context/CompanyContext';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { FeedbackMessage } from '@/components/ui/feedback-alert';

// OOP Services
import { ServiceRegistry } from '@/lib/services/ServiceRegistry';
import { PayrollCalculationService } from '@/lib/services/PayrollCalculationService';
import { CompanyService } from '@/lib/services/CompanyService';
import { TaxService } from '@/lib/services/TaxService';
import { StaffService } from '@/lib/services/StaffService';
import { StaffPaymentConfigService } from '@/lib/services/StaffPaymentConfigService';
import { DeductionService } from '@/lib/services/DeductionService';
import { PaymentTypeService } from '@/lib/services/PaymentTypeService';
import { DeductionTypeService } from '@/lib/services/DeductionTypeService';


// Centralized Types
import { CompanyProfileData, GlobalApplicationCompany } from '@/lib/types/company';
import { PayrollRunDetail, PayrollRunSummary, PayrollStatus, EmployeePayrollRecord } from '@/lib/types/payroll';
import { StaffMember, StaffPaymentConfig } from '@/lib/types/staff';
import { StaffPaymentDetails } from '@/lib/types/payments';
import { TaxSettingsData } from '@/lib/types/tax';
import { Deduction, DeductionRecord } from '@/lib/types/deductions';
import { DeductionType as DeductionTypeDef } from '@/lib/types/deductionTypes';
import { PaymentType } from '@/lib/types/payments';
import { DeductionType } from '@/lib/types/deductionTypes';

// Utility function that would normally come from @/lib/utils
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Supabase client - using the correct function name
const createClient = getSupabaseClient;


const statusConfig: Record<PayrollStatus, { color: string; icon: React.ElementType; textColor?: string }> = {
  Draft: { color: "bg-gray-500 hover:bg-gray-600", icon: Hourglass, textColor: "text-white" },
  "To Approve": { color: "bg-blue-500 hover:bg-blue-600", icon: AlertTriangle, textColor: "text-white" },
  Rejected: { color: "bg-red-500 hover:bg-red-600", icon: XCircle, textColor: "text-white" },
  Approved: { color: "bg-green-500 hover:bg-green-600", icon: CheckCircle, textColor: "text-white" },
};

const DIALOG_ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

const formatNumberForTable = (amount?: number) => (amount === undefined || amount === null || isNaN(amount) ? "0" : Math.round(amount).toLocaleString('en-US'));
const formatCurrencyForCard = (amount?: number) => `RWF ${formatNumberForTable(amount)}`;
const sanitizeFilename = (name: string | null | undefined): string => { if (!name) return 'UnknownCompany'; return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, ''); };

export default function PayrollRunDetailPage() {
  const router = useRouter(); const params = useParams();
  const { selectedCompanyId, selectedCompanyName, isLoadingCompanyContext } = useCompany();
  const runId = typeof params.id === 'string' ? params.id : '';

  // OOP Services
  const serviceRegistry = ServiceRegistry.getInstance();
  const payrollCalculationService = useMemo(() => serviceRegistry.payrollCalculationService, [serviceRegistry]);
  const companyService = useMemo(() => serviceRegistry.companyService, [serviceRegistry]);
  const taxService = useMemo(() => serviceRegistry.taxService, [serviceRegistry]);
  const staffService = useMemo(() => serviceRegistry.staffService, [serviceRegistry]);
  const staffPaymentConfigService = useMemo(() => serviceRegistry.staffPaymentConfigService, [serviceRegistry]);
  const deductionService = useMemo(() => serviceRegistry.deductionService, [serviceRegistry]);
  const paymentTypeService = useMemo(() => serviceRegistry.paymentTypeService, [serviceRegistry]);
  const deductionTypeService = useMemo(() => serviceRegistry.deductionTypeService, [serviceRegistry]);
  const payrollService = useMemo(() => serviceRegistry.payrollService, [serviceRegistry]);

  const [currentTaxSettings, setCurrentTaxSettings] = useState<TaxSettingsData | null>(null);
  const [payrollRun, setPayrollRun] = useState<PayrollRunDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true); const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(""); const [isPayrollProcessed, setIsPayrollProcessed] = useState(false);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [allPaymentConfigs, setAllPaymentConfigs] = useState<StaffPaymentConfig[]>([]);
  const [allDeductions, setAllDeductions] = useState<Deduction[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData | null>(null);
  const [companyPaymentTypes, setCompanyPaymentTypes] = useState<PaymentType[]>([]);
  const [companyDeductionTypes, setCompanyDeductionTypes] = useState<DeductionTypeDef[]>([]);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [activeDeductionTypeColumns, setActiveDeductionTypeColumns] = useState<DeductionTypeDef[]>([]);
  const [activePaymentTypeColumns, setActivePaymentTypeColumns] = useState<PaymentType[]>([]);
  const [activeStatutoryColumns, setActiveStatutoryColumns] = useState<string[]>([]);
  const [pageFeedback, setPageFeedback] = useState<FeedbackMessage | null>(null);
  const [dialogCurrentPage, setDialogCurrentPage] = useState(1);
  const [dialogRowsPerPage, setDialogRowsPerPage] = useState<number>(DIALOG_ROWS_PER_PAGE_OPTIONS[0] ?? 10);
  const [payrollJustProcessedMessage, setPayrollJustProcessedMessage] = useState<string | null>(null);

  const memoizedPayrollDetailColumns = useMemo(() => {
    const baseColumns: { key: string; label: string; isNumeric: boolean; accessor: (emp: EmployeePayrollRecord) => string | number | undefined; }[] = [
      { key: 'employeeName', label: 'Employee Name', isNumeric: false, accessor: (emp: EmployeePayrollRecord) => emp.employeeName },
      { key: 'grossSalary', label: 'Gross Salary', isNumeric: true, accessor: (emp: EmployeePayrollRecord) => emp.grossSalary },
    ];

    const paymentTypeColumns = activePaymentTypeColumns.map(pt => ({
      key: `dyn_earn_${pt.id}`,
      label: pt.name,
      isNumeric: true,
      accessor: (emp: EmployeePayrollRecord) => emp.dynamicGrossEarnings?.[pt.id] || 0,
    }));

    const statutoryColumns = [
        { key: 'totalGrossEarnings', label: 'Total Gross', isNumeric: true, accessor: (emp: EmployeePayrollRecord) => emp.totalGrossEarnings },
        { key: 'employerRssb', label: 'Empl\'r RSSB', isNumeric: true, accessor: (emp: EmployeePayrollRecord) => emp.employerRssb },
        { key: 'employeeRssb', label: 'Empl\'e RSSB', isNumeric: true, accessor: (emp: EmployeePayrollRecord) => emp.employeeRssb },
        { key: 'paye', label: 'PAYE', isNumeric: true, accessor: (emp: EmployeePayrollRecord) => emp.paye },
        { key: 'cbhiDeduction', label: 'CBHI', isNumeric: true, accessor: (emp: EmployeePayrollRecord) => emp.cbhiDeduction },
    ];

    const deductionTypeColumns = activeDeductionTypeColumns.map(dt => ({
      key: `dyn_ded_${dt.id}`,
      label: dt.name,
      isNumeric: true,
      accessor: (emp: EmployeePayrollRecord) => emp.appliedDeductionAmounts?.[dt.id] || 0,
    }));

    const finalColumns = [
        { key: 'totalDeductionsAppliedThisRun', label: 'Total Deductions', isNumeric: true, accessor: (emp: EmployeePayrollRecord) => emp.totalDeductionsAppliedThisRun },
        { key: 'finalNetPay', label: 'Final Net Pay', isNumeric: true, accessor: (emp: EmployeePayrollRecord) => emp.finalNetPay },
    ];

    return [...baseColumns, ...paymentTypeColumns, ...statutoryColumns, ...deductionTypeColumns, ...finalColumns];
  }, [activePaymentTypeColumns, activeDeductionTypeColumns]);

  const tableTotals = useMemo(() => (payrollRun && payrollRun.employees ? payrollCalculationService.calculatePayrollRunTotals(payrollRun.employees, companyPaymentTypes, companyDeductionTypes) : payrollCalculationService.calculatePayrollRunTotals([], companyPaymentTypes, companyDeductionTypes)), [payrollRun, companyPaymentTypes, companyDeductionTypes, payrollCalculationService]);

  const paginatedDialogEmployees = useMemo(() => {
    if (!payrollRun || !payrollRun.employees) return [];
    const startIndex = (dialogCurrentPage - 1) * dialogRowsPerPage;
    const endIndex = startIndex + dialogRowsPerPage;
    return payrollRun.employees.slice(startIndex, endIndex);
  }, [payrollRun, dialogCurrentPage, dialogRowsPerPage]);

  const dialogTotalItems = payrollRun?.employees?.length || 0;
  const dialogTotalPages = Math.ceil(dialogTotalItems / (dialogRowsPerPage || 1));
  
  const setDynamicColumnsBasedOnRun = (run: PayrollRunDetail, cDeductionTypes: DeductionTypeDef[], cPaymentTypes: PaymentType[]) => {
    if (!run || !run.employees || run.employees.length === 0) {
        setActiveDeductionTypeColumns([]);
        setActivePaymentTypeColumns([]);
        setActiveStatutoryColumns([]);
        return;
    }
    const totalsForRun = payrollCalculationService.calculatePayrollRunTotals(run.employees, cPaymentTypes, cDeductionTypes);
    const activePayTypesInRun = cPaymentTypes
        .filter(pt => (totalsForRun.dynamicTotalGrossEarnings?.[pt.id] ?? 0) > 0)
        .sort((a, b) => a.orderNumber - b.orderNumber);
    setActivePaymentTypeColumns(activePayTypesInRun);
    const activeDedTypesInRun = cDeductionTypes
        .filter(dt => (totalsForRun.dynamicTotalDeductionAmounts?.[dt.id] ?? 0) > 0)
        .sort((a, b) => a.orderNumber - b.orderNumber);
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
            const supabase = createClient();
            
            const [
                taxSettings,
                staffFromDB,
                paymentConfigsFromDB,
                deductionsFromDB,
                profileFromDB,
                paymentTypesFromDB,
                dedTypesFromDB,
                runDetail
            ] = await Promise.all([
                taxService.getTaxSettings(selectedCompanyId),
                staffService.getStaffByCompany(selectedCompanyId),
                staffPaymentConfigService.getByCompanyId(selectedCompanyId),
                deductionService.getDeductionsByCompany(selectedCompanyId),
                companyService.getCompanyProfile(selectedCompanyId),
                paymentTypeService.getPaymentTypesByCompany(selectedCompanyId),
                deductionTypeService.getDeductionTypesByCompany(selectedCompanyId),
                payrollService.getPayrollRunDetail(runId, selectedCompanyId)
            ]);

            setCurrentTaxSettings(taxSettings);
            setAllStaff(staffFromDB || []);
            setAllPaymentConfigs(paymentConfigsFromDB || []);
            setAllDeductions(deductionsFromDB || []);
            
            if (!profileFromDB && selectedCompanyId) {
              const { data: globalCompanies } = await supabase.from('companies').select('*');
              const currentGlobalCompany = globalCompanies?.find((c: GlobalApplicationCompany) => c.id === selectedCompanyId);
              const newProfileForCompany: CompanyProfileData = {
                id: selectedCompanyId,
                name: selectedCompanyName || currentGlobalCompany?.name || `Company ${selectedCompanyId}`,
                address: currentGlobalCompany?.address || "",
                registrationNumber: "",
                tinNumber: currentGlobalCompany?.tinNumber || "",
                email: currentGlobalCompany?.email || "",
                phone: currentGlobalCompany?.phone || "",
                currency: "RWF",
                isPayeActive: true, isPensionActive: true, isMaternityActive: true, isCbhiActive: true, isRamaActive: true,
                primaryBusiness: currentGlobalCompany?.primaryBusiness || "",
              };
              await companyService.updateCompanyProfile(newProfileForCompany);
              setCompanyProfile(newProfileForCompany);
            } else {
                if (profileFromDB && typeof (profileFromDB as any).isRamaActive === 'undefined') {
                    (profileFromDB as any).isRamaActive = true;
                }
                setCompanyProfile(profileFromDB || null);
            }

            setCompanyPaymentTypes((paymentTypesFromDB || []).sort((a: PaymentType, b: PaymentType) => a.orderNumber - b.orderNumber));
            setCompanyDeductionTypes((dedTypesFromDB || []).sort((a: DeductionType, b: DeductionType) => a.orderNumber - b.orderNumber));

            if (runDetail) {
                setPayrollRun(runDetail);
                const processed = runDetail.employees && runDetail.employees.length > 0;
                setIsPayrollProcessed(processed);
                if (processed) {
                    setDynamicColumnsBasedOnRun(runDetail, dedTypesFromDB || [], paymentTypesFromDB || []);
                    setIsDetailViewOpen(true);
                }
            } else {
                const summary = await payrollService.getPayrollRunSummary(runId, selectedCompanyId);
                if (summary) {
                    const totals = payrollCalculationService.calculatePayrollRunTotals([], paymentTypesFromDB || [], dedTypesFromDB || []);
                    const newDetailShell: PayrollRunDetail = {
                        id: summary.id, companyId: selectedCompanyId, month: summary.month, year: summary.year,
                        status: summary.status, employees: [],
                        ...totals
                    };
                    if (summary.rejectionReason) {
                        newDetailShell.rejectionReason = summary.rejectionReason;
                    }
                    setPayrollRun(newDetailShell);
                    setIsPayrollProcessed(false);
                    setPageFeedback({type: 'info', message: `Payroll run for ${summary.month} ${summary.year} is in Draft. Please 'Run Payroll' to process.`});
                } else {
                    router.push("/app/payroll");
                }
            }
        } catch (error) {
            console.error("Error loading payroll detail page data:", error);
            router.push("/app/payroll");
        }
        setIsLoading(false);
    };
    loadInitialData();
  }, [runId, selectedCompanyId, isLoadingCompanyContext, router, selectedCompanyName, companyService, deductionService, deductionTypeService, paymentTypeService, payrollCalculationService, staffPaymentConfigService, staffService, taxService, payrollService]);

  const updatePayrollRunStateAndStorage = async (updatedRun: PayrollRunDetail) => {
    if (!selectedCompanyId) return;
    try {
        const runTotalsForSummary = payrollCalculationService.calculatePayrollRunTotals(updatedRun.employees, companyPaymentTypes, companyDeductionTypes);
        
        const summaryData: PayrollRunSummary = {
            id: updatedRun.id,
            companyId: selectedCompanyId,
            month: updatedRun.month,
            year: updatedRun.year,
            employees: updatedRun.employees.length,
            grossSalary: runTotalsForSummary.totalGrossSalary || 0,
            deductions: (runTotalsForSummary.totalEmployeeRssb || 0) + (runTotalsForSummary.totalPaye || 0) + (runTotalsForSummary.totalCbhiDeduction || 0) + (runTotalsForSummary.totalTotalDeductionsAppliedThisRun || 0),
            netPay: runTotalsForSummary.totalFinalNetPay || 0,
            status: updatedRun.status,
            rejectionReason: updatedRun.rejectionReason || "",
        };

        await payrollService.updatePayrollRun(updatedRun, summaryData);
        setPayrollRun(updatedRun);
    } catch (error) {
        console.error("Error saving payroll run data:", error);
        throw error;
    }
  };

  const handleRunPayroll = async () => {
    setPageFeedback(null);
    setPayrollJustProcessedMessage(null);
    if (!selectedCompanyId) {
        setPageFeedback({type: 'error', message: "Error: No company is currently selected. Please select a company and try again."});
        return;
    }
    if (!companyProfile || !currentTaxSettings) {
        setPageFeedback({type: 'error', message: `Error: Company profile or tax settings for ${selectedCompanyName || 'the selected company'} is missing or incomplete.`, details: "Please go to 'Company Settings' to configure it, especially tax exemptions, before running payroll."});
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

    const processedEmployees: EmployeePayrollRecord[] = activeStaffForCompany.reduce((acc, staff) => {
        const paymentConfigsForStaff = allPaymentConfigs.filter(p => p.staffId === staff.id && p.isActive);

        if (paymentConfigsForStaff.length > 0) {
            const staffPaymentDetails: StaffPaymentDetails = paymentConfigsForStaff.reduce((details, config) => {
                details[config.paymentTypeId] = config.amount;
                return details;
            }, {} as StaffPaymentDetails);

            const activeDeductionsForStaff = allDeductions.filter(d => d.staffId === staff.id && d.balance > 0);
            const employeeRecord = payrollCalculationService.calculateEmployeePayrollRecord(staff, staffPaymentDetails, activeDeductionsForStaff, currentTaxSettings, companyExemptions, companyPaymentTypes, companyDeductionTypes, selectedCompanyId);
            acc.push(employeeRecord);
        } else {
            console.warn(`Skipping staff member ${staff.id} (${staff.firstName} ${staff.lastName}) from payroll run as they have no active payment configuration.`);
        }
        return acc;
    }, [] as EmployeePayrollRecord[]);

    const totals = payrollCalculationService.calculatePayrollRunTotals(processedEmployees, companyPaymentTypes, companyDeductionTypes);
    const updatedRun: PayrollRunDetail = {
        id: payrollRun.id,
        companyId: selectedCompanyId,
        month: payrollRun.month,
        year: payrollRun.year,
        employees: processedEmployees,
        status: "Draft",
        ...totals
    };
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
    const draftToSave: PayrollRunDetail = {
        id: payrollRun.id,
        companyId: selectedCompanyId,
        month: payrollRun.month,
        year: payrollRun.year,
        status: "Draft",
        employees: payrollRun.employees,
        ...payrollCalculationService.calculatePayrollRunTotals(payrollRun.employees, companyPaymentTypes, companyDeductionTypes)
    };
    try { 
        await updatePayrollRunStateAndStorage(draftToSave); 
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
    const baseData: PayrollRunDetail = {
        id: payrollRun.id,
        companyId: selectedCompanyId,
        month: payrollRun.month,
        year: payrollRun.year,
        status: "Draft",
        employees: payrollRun.employees,
        ...payrollCalculationService.calculatePayrollRunTotals(payrollRun.employees, companyPaymentTypes, companyDeductionTypes)
    };
    try { 
        await updatePayrollRunStateAndStorage(baseData); 
        const forApprovalData: PayrollRunDetail = { ...baseData, status: "To Approve" as PayrollStatus }; 
        await updatePayrollRunStateAndStorage(forApprovalData); 
        setPageFeedback({type: 'success', message: "Payroll sent for approval successfully."}); 
    } catch (error) { 
        setPageFeedback({type: 'error', message: "Error: Could not send payroll for approval.", details: (error as Error).message}); 
    }
  };

  const handleApproveRun = async () => {
    setPageFeedback(null);
    setPayrollJustProcessedMessage(null);
    if (!payrollRun || !selectedCompanyId) return;
    const updatedRunData: PayrollRunDetail = {
        id: payrollRun.id,
        companyId: selectedCompanyId,
        month: payrollRun.month,
        year: payrollRun.year,
        status: "Approved",
        employees: payrollRun.employees,
        ...payrollCalculationService.calculatePayrollRunTotals(payrollRun.employees, companyPaymentTypes, companyDeductionTypes)
    };
    try {
      await updatePayrollRunStateAndStorage(updatedRunData);
      setPageFeedback({type: 'success', message: "Payroll approved successfully."});
      
      const approvedRunDetails = await payrollService.getPayrollRunDetail(updatedRunData.id, selectedCompanyId);
          
      if (!approvedRunDetails || !approvedRunDetails.employees) { 
          console.warn("Could not fetch approved run details for deduction update."); 
          setPageFeedback(prev => prev ? {...prev, details: (prev?.details || "") + " Warning: Could not fetch approved run details for deduction update."} : {type: 'info', message: 'Warning', details: 'Could not fetch approved run details for deduction update.'});
          return; 
      }
      
      const deductionsToActuallyUpdateInDB: Deduction[] = []; let deductionsUpdatedCount = 0;
      for (const empRecord of approvedRunDetails.employees) {
        if (empRecord.appliedDeductions && empRecord.appliedDeductions.length > 0) {
            for (const appliedDed of empRecord.appliedDeductions) {
                const dedRecordToUpdate = allDeductions.find(d => d.id === appliedDed.deductionId);
                if (dedRecordToUpdate) {
                    let recordInBatch = deductionsToActuallyUpdateInDB.find(d => d.id === dedRecordToUpdate.id);
                    if (!recordInBatch) { 
                        recordInBatch = { ...dedRecordToUpdate };
                        deductionsToActuallyUpdateInDB.push(recordInBatch);
                    }
                    if (recordInBatch) {
                        recordInBatch.deductedSoFar = (recordInBatch.deductedSoFar || 0) + (appliedDed.amountApplied || 0);
                        recordInBatch.balance = Math.max(0, (recordInBatch.originalAmount || 0) - (recordInBatch.deductedSoFar || 0));
                        deductionsUpdatedCount++;
                    }
                }
            }
        }
      }
      if (deductionsToActuallyUpdateInDB.length > 0) {
        await deductionService.updateDeductionRecords(deductionsToActuallyUpdateInDB);
        setAllDeductions(prevDeds => { const updatedMap = new Map(prevDeds.map(d => [d.id, d])); deductionsToActuallyUpdateInDB.forEach(updated => updatedMap.set(updated.id, updated)); return Array.from(updatedMap.values()); });
        setPageFeedback(prev => prev ? {...prev, details: (prev?.details || "") + ` ${deductionsUpdatedCount} deduction record(s) reconciled.`} : {type: 'info', message: 'Success', details: `${deductionsUpdatedCount} deduction record(s) reconciled.`});
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
          const updatedRun: PayrollRunDetail = {
              id: payrollRun.id,
              companyId: selectedCompanyId,
              month: payrollRun.month,
              year: payrollRun.year,
              status: "Rejected",
              rejectionReason: rejectionReason,
              employees: payrollRun.employees,
              ...payrollCalculationService.calculatePayrollRunTotals(payrollRun.employees, companyPaymentTypes, companyDeductionTypes)
          };
          try { 
              await updatePayrollRunStateAndStorage(updatedRun); 
              setIsRejectDialogOpen(false); 
              setRejectionReason(""); 
              setPageFeedback({type: 'success', message: "Payroll run rejected successfully."}); 
          } catch (error) { 
              setPageFeedback({type: 'error', message: "Error: Could not reject payroll run.", details: (error as Error).message}); 
          }
      } else {
          setPageFeedback({type: 'error', message: "Rejection reason cannot be empty."});
      }
  };

  const handleEditRun = () => {
    if (!payrollRun) return;
    setIsPayrollProcessed(false);
    setPayrollJustProcessedMessage(null);
    setPageFeedback({ type: 'info', message: 'Payroll run has been reset. You can now make changes and re-run the payroll.' });
    const resetRun = {
        ...payrollRun,
        employees: [],
        ...payrollCalculationService.calculatePayrollRunTotals([], companyPaymentTypes, companyDeductionTypes)
    };
    setPayrollRun(resetRun);
    setIsDetailViewOpen(false);
  };

  const exportPayrollDetails = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!payrollRun || !payrollRun.employees || payrollRun.employees.length === 0) {
        setPageFeedback({ type: 'error', message: 'No payroll data available to export.' });
        return;
    }

    const companyName = sanitizeFilename(selectedCompanyName);
    const period = `${payrollRun.year}-${payrollRun.month}`;
    const filename = `Payroll_Details_${companyName}_${period}`;

    const columns = memoizedPayrollDetailColumns;
    const data = payrollRun.employees.map(emp => {
        const row: { [key:string]: any } = {};
        columns.forEach(col => {
            row[col.label] = col.accessor(emp);
        });
        return row;
    });

    const totalsRow: { [key: string]: any } = {};
    columns.forEach((col, index) => {
        if (index === 0) {
            totalsRow[col.label] = 'Grand Totals';
        } else if (col.isNumeric) {
            let totalValue;
            if (col.key.startsWith('dyn_earn_')) { const paymentTypeId = col.key.substring(9); totalValue = tableTotals.dynamicTotalGrossEarnings?.[paymentTypeId] || 0; }
            else if (col.key.startsWith('dyn_ded_')) { const deductionTypeId = col.key.substring(8); totalValue = tableTotals.dynamicTotalDeductionAmounts?.[deductionTypeId] || 0; }
            else if (col.key === 'totalDeductionsAppliedThisRun') { totalValue = tableTotals.totalTotalDeductionsAppliedThisRun; }
            else { const totalKey = `total${col.key.charAt(0).toUpperCase() + col.key.slice(1)}`; totalValue = (tableTotals as any)[totalKey] ?? 0; }
            totalsRow[col.label] = totalValue;
        } else {
            totalsRow[col.label] = '';
        }
    });
    data.push(totalsRow);

    if (format === 'csv') {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (format === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Details');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else if (format === 'pdf') {
        const doc = new jsPDF({ orientation: 'landscape' });
        const head = [columns.map(c => c.label)];
        const body = data.map(row => columns.map(c => {
            const value = row[c.label];
            if (c.isNumeric) {
                return typeof value === 'number' ? formatNumberForTable(value) : String(value || '');
            }
            return String(value || '');
        }));

        (doc as any).autoTable({
            head: head,
            body: body,
            startY: 20,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [22, 163, 74] },
            didDrawPage: function (data: any) {
                doc.setFontSize(16);
                doc.setTextColor(40);
                doc.text('Payroll Details', data.settings.margin.left, 15);
                doc.setFontSize(10);
                if(payrollRun) {
                  doc.text(`${selectedCompanyName} - ${payrollRun.month} ${payrollRun.year}`, data.settings.margin.left, 10);
                }
            },
        });
        doc.save(`${filename}.pdf`);
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
                                const value = col.accessor(emp);
                                return (
                                    <TableCell key={`${emp.employeeId}-${col.key}`} className={cn("whitespace-nowrap min-w-[120px]", col.isNumeric ? "text-right" : "text-left")}>
                                        {col.isNumeric ? formatNumberForTable(value as number) : String(value || '')}
                                    </TableCell>
                                );
                            })}
                            </TableRow>
                        ))}
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
                                <Select
                                    value={`${dialogRowsPerPage}`}
                                    onValueChange={(value) => {
                                        setDialogRowsPerPage(Number(value));
                                        setDialogCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={`${dialogRowsPerPage}`} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {DIALOG_ROWS_PER_PAGE_OPTIONS.map((pageSize) => (
                                            <SelectItem key={`dialog-payroll-${pageSize}`} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => setDialogCurrentPage(1)} disabled={dialogCurrentPage === 1}>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setDialogCurrentPage(prev => prev - 1)} disabled={dialogCurrentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setDialogCurrentPage(prev => prev + 1)} disabled={dialogCurrentPage === dialogTotalPages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => setDialogCurrentPage(dialogTotalPages)} disabled={dialogCurrentPage === dialogTotalPages}>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
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
      <div className="p-4 border-l-4 border-primary bg-primary/10 rounded-md mt-8"><p className="font-semibold text-primary/90">Notes:</p><ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1"><li>Tax settings apply globally unless company-specific exemptions are set. Staff data, payment configs, and deductions are company-specific.</li><li>Payment Types (e.g. Basic Pay, Allowances) defined in 'Payments Configuration' determine earnings. "Net" components are grossed-up sequentially.</li><li>Deductions are applied based on the order of Deduction Types defined in 'Deductions Management', after statutory deductions. Insufficient net pay may result in partial or skipped deductions.</li><li>Saving a draft, approving, or rejecting updates this run in Supabase. Approved runs update staff deduction balances.</li></ul></div>
    </div>
  );
}
