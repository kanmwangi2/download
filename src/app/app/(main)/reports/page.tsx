
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileArchive, Download, Loader2, AlertTriangle, FileSpreadsheet as FileSpreadsheetIcon, History, FileText as FileTextIcon, FileType as FileTypePdfIcon, Users, CalendarDays, Eye, X, ChevronLeft, ChevronRight, Mail, Info, CheckCircle2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAllFromStore, getFromStore, STORE_NAMES, getCompanySingletonData } from '@/lib/indexedDbUtils';
import type { PayrollRunSummary as MainPayrollRunSummary } from '@/app/app/(main)/payroll/page';
import { type StaffMember } from '@/lib/staffData';
import { format, startOfMonth, endOfMonth, getDaysInMonth, isValid as isValidDate, parseISO, parse, compareAsc } from 'date-fns';
import type { Deduction as MainFullDeductionRecord } from '@/app/app/(main)/deductions/page';
import type { CompanyProfileData } from '@/app/app/(main)/settings/company/page';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useCompany } from '@/context/CompanyContext';
import Link from 'next/link';
import type { PaymentType } from '@/lib/paymentTypesData';
import { DEFAULT_BASIC_PAY_ID, DEFAULT_TRANSPORT_ALLOWANCE_ID, initialPaymentTypesForCompanySeed } from '@/lib/paymentTypesData';
import type { DeductionType as CompanyDeductionType } from '@/lib/deductionTypesData';
import { initialDeductionTypesForCompanySeed as initialCompanyDeductionTypesSeed, DEFAULT_CHARGE_DEDUCTION_TYPE_ID } from '@/lib/deductionTypesData';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface AppliedDeductionDetailForReport {
  deductionId: string;
  deductionTypeId: string;
  amountApplied: number;
}

interface EmployeePayrollRecordForReport {
  employeeId: string; companyId: string; firstName: string; lastName: string; staffNumber?: string; rssbNumber?: string; designation?: string;
  dynamicGrossEarnings: Record<string, number>;
  appliedDeductionAmounts: Record<string, number>;
  grossSalary: number; employerPension: number; employeePension: number; employerMaternity: number;
  employeeMaternity: number; totalPension: number; totalMaternity: number; paye: number;
  netPayBeforeCbhi: number; cbhiDeduction: number;
  totalDeductionsAppliedThisRun: number;
  finalNetPay: number; employerRssb: number; employeeRssb: number;
  employerRama: number;
  employeeRama: number;
  appliedDeductions?: AppliedDeductionDetailForReport[];
}

interface PayrollRunDetailForReport {
  id: string; companyId: string; month: string; year: number;
  employees: EmployeePayrollRecordForReport[]; status: string;
}

interface PayrollRunSummaryForPayslips extends MainPayrollRunSummary {}

interface PayslipDataForGeneration {
  employeeName: string; employeeId: string; companyId: string;
  period: string; // e.g. "June 2024"
  periodRunId: string; netPay: number;
  payrollDetails: EmployeePayrollRecordForReport;
}

type IshemaReportRow = { 'Last Name': string; 'First Name': string; 'RSSB Number': string; 'ID or Passport Number': string; 'Category': string; 'Is RAMA Member': 'Y' | 'N'; 'Basic Salary': number; 'Transport Benefit in Kind': number; 'House Benefit in Kind': number; 'Other Benefit in Kind': number; 'Transport Cash Allowance': number; 'House Cash Allowance': number; 'Other Cash Allowance': number; 'Lumpsum Transport': number; 'Other Medical Deductions': number; 'Terminal Benefit End Contract': number; 'Retirement Benefits': number; 'Ejo-Heza Contribution': number; 'Other Pension Funds': number; };
type PayeReportRow = { 'TIN': string; 'RSSB Number': string; 'National ID/Passport': string; 'Last Name': string; 'First Name': string; 'Return Type': string; 'Gender': string; 'Job type': string; 'Start Date': string; 'End date': string; 'Birth Date': string; 'Basic Salary': number; 'Benefits in Kind (Transport)': number; 'Benefits in Kind (House)': number; 'Benefits in Kind (Others)': number; 'Cash Allowance (Transport)': number; 'Cash Allowance (House)': number; 'Cash Allowance (Others)': number; 'PAYE Taxable Base': number; 'PAYE': number; 'RSSB base': number; 'RSSB (Employee)': number; 'RSSB (Employer)': number; 'Total RSSB': number; 'RAMA (Employee)': number; 'RAMA (Employer)': number; 'Total RAMA': number; };
type PensionReportRow = { 'RSSB Number': string; 'Last Name': string; 'First Name': string; 'Gross Salary': number; 'Transport Allowance': number; 'Pension (Employee)': number; 'Pension (Employer)': number; 'Employer Occupational Hazards': number; 'Total Contributions': number; };
type MaternityReportRow = { 'RSSB Number': string; 'Last Name': string; 'First Name': string; 'Amount of Remuneration': number; 'Number of Days in a Month': number; 'Status': string; 'Total contributions': number; };
type CbhiReportRow = { 'RSSB Number': string; 'National ID/Passport': string; 'Last Name': string; 'First Name': string; 'Employment Status': string; 'Is Employer RAMA Member?': string; 'Basic Salary': number; 'Benefits in Kind (Transport)': number; 'Benefits in Kind (House)': number; 'Benefits in Kind (Others)': number; 'Cash Allowance (Transport)': number; 'Cash Allowance (House)': number; 'Cash Allowance (Others)': number; 'Terminal Benefits': number; 'Retirement Benefits': number; 'Other Recognised Medical Deductions': number; 'PAYE Taxable Base': number; 'PAYE': number; 'CBHI': number; };
type NetSalariesReportRow = { 'First Name': string; 'Last Name': string; 'Staff Number': string; 'Bank name': string; 'Bank code': string; 'Bank account no.': string; 'Bank branch': string; 'Net Pay': number; };
interface GeneratedReports { ishema: IshemaReportRow[]; paye: PayeReportRow[]; pension: PensionReportRow[]; maternity: MaternityReportRow[]; cbhi: CbhiReportRow[]; netSalaries: NetSalariesReportRow[]; }
type StatutoryReportTypeKey = keyof GeneratedReports;
const statutoryReportTypeLabels: Record<StatutoryReportTypeKey, string> = { ishema: "Ishema Report", paye: "PAYE Report", pension: "Pension Contribution Report", maternity: "Maternity Contribution Report", cbhi: "CBHI Report", netSalaries: "Net Salaries Report", };
const statutoryReportOrder: StatutoryReportTypeKey[] = ['ishema', 'paye', 'pension', 'maternity', 'cbhi', 'netSalaries'];
interface DeductionHistoryRow { 'Payroll Month': string; 'Amount Deducted': number; 'Running Balance': number; }
const DEDUCTION_HISTORY_HEADERS: (keyof DeductionHistoryRow)[] = ["Payroll Month", "Amount Deducted", "Running Balance"];
const PLACEHOLDER_PERIOD_VALUE = "placeholder_period"; const PLACEHOLDER_STAFF_VALUE = "placeholder_staff"; const PLACEHOLDER_DEDUCTION_VALUE = "placeholder_deduction";
const formatAmountForDisplay = (amount?: number): string => { if (amount === undefined || amount === null || isNaN(amount)) return "0"; return Math.round(amount).toLocaleString('en-US'); };
const sanitizeFilename = (name: string | null | undefined): string => { if (!name) return 'UnknownCompany'; return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, ''); };

type FeedbackMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
};

const KNOWN_NUMERIC_HEADERS = [
  'Basic Salary', 'Transport Benefit in Kind', 'House Benefit in Kind',
  'Other Benefit in Kind', 'Transport Cash Allowance', 'House Cash Allowance',
  'Other Cash Allowance', 'Lumpsum Transport', 'Other Medical Deductions',
  'Terminal Benefit End Contract', 'Retirement Benefits', 'Ejo-Heza Contribution',
  'Other Pension Funds',
  'Benefits in Kind (Transport)', 'Benefits in Kind (House)',
  'Benefits in Kind (Others)', 'Cash Allowance (Transport)', 'Cash Allowance (House)',
  'Cash Allowance (Others)', 'PAYE Taxable Base', 'PAYE', 'RSSB base',
  'RSSB (Employee)', 'RSSB (Employer)', 'Total RSSB', 'RAMA (Employee)',
  'RAMA (Employer)', 'Total RAMA', 'Gross Salary', 'Transport Allowance',
  'Pension (Employee)', 'Pension (Employer)', 'Employer Occupational Hazards',
  'Total Contributions', 'Amount of Remuneration',
  'Number of Days in a Month', 'Total contributions',
  'Terminal Benefits', 'Retirement Benefits', 'Other Recognised Medical Deductions',
  'CBHI', 'Net Pay', 'Amount Deducted', 'Running Balance'
];

const getStringIdentifier = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    let stringValue = String(value).trim();
    if (stringValue === "") return 'N/A';

    const num = Number(stringValue);
    if (!isNaN(num) && (stringValue.toLowerCase().includes('e') || Math.abs(num) >= 1e9 || String(num) !== stringValue)) {
        return num.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 0 });
    }
    return stringValue;
};

const HtmlPayslipPreview = ({ payslipData, companyProfile, companyPaymentTypes, companyDeductionTypes }: { payslipData: PayslipDataForGeneration, companyProfile: CompanyProfileData | null, companyPaymentTypes: PaymentType[], companyDeductionTypes: CompanyDeductionType[] }) => {
  if (!payslipData) return <p className="text-center text-muted-foreground p-4">No payslip data.</p>;
  const record = payslipData.payrollDetails;

  const basicPayAmount = record.dynamicGrossEarnings[DEFAULT_BASIC_PAY_ID] || 0;
  const basicPayType = companyPaymentTypes.find(pt => pt.id === DEFAULT_BASIC_PAY_ID);

  const allowancePaymentTypes = companyPaymentTypes
    .filter(pt => pt.id !== DEFAULT_BASIC_PAY_ID && (record.dynamicGrossEarnings[pt.id] || 0) > 0)
    .sort((a, b) => a.order - b.order);

  const subtotalAllowances = allowancePaymentTypes.reduce(
    (sum, pt) => sum + (record.dynamicGrossEarnings[pt.id] || 0),
    0
  );

  const sortedDeductionTypesToDisplay = [...companyDeductionTypes].sort((a,b) => a.order - b.order)
                                      .filter(dt => (record.appliedDeductionAmounts[dt.id] || 0) > 0);

  const totalStatutoryDeductions = (record.paye || 0) + (record.employeePension || 0) + (record.employeeMaternity || 0) + (record.employeeRama || 0) + (record.cbhiDeduction || 0);
  const totalOtherDeductions = sortedDeductionTypesToDisplay.reduce((sum, dt) => sum + (record.appliedDeductionAmounts[dt.id] || 0), 0);

  const sectionTitleClass = "text-md font-semibold text-primary mb-1 mt-3"; const tableClass = "w-full text-sm";
  const tdClass = "py-1 pr-2"; const tdAmountClass = "text-right py-1 pl-2";
  const subtotalRowClass = "font-semibold border-t"; const totalRowClass = "text-md font-bold text-primary border-t-2";

  return (
    <div className="p-4 bg-card text-card-foreground rounded-lg shadow max-w-2xl mx-auto print:shadow-none print:p-0">
      <div className="flex justify-between items-start mb-4 pb-2 border-b"><div><h2 className="text-xl font-bold text-primary">{companyProfile?.name || "[Company Name]"}</h2><p className="text-xs text-muted-foreground">{companyProfile?.address || "[Address]"}</p><p className="text-xs text-muted-foreground">TIN: {companyProfile?.taxId || "[TIN]"}</p></div><div className="text-right"><h1 className="text-2xl font-bold">PAYSLIP</h1><p className="text-sm text-muted-foreground">Period: {payslipData.period}</p></div></div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
        <div><strong>Staff Name:</strong> {payslipData.employeeName}</div>
        <div><strong>Designation:</strong> {record.designation || 'N/A'}</div>
        <div><strong>Staff No:</strong> {getStringIdentifier(record.staffNumber || 'N/A')}</div>
        <div><strong>RSSB No:</strong> {getStringIdentifier(record.rssbNumber || 'N/A')}</div>
      </div>

      <div className="mb-3">
        <h3 className={sectionTitleClass}>Earnings</h3>
        <table className={tableClass}>
          <tbody>
            <tr>
              <td className={tdClass}>{basicPayType?.name || "Basic Pay"}</td>
              <td className={tdAmountClass}>{formatAmountForDisplay(basicPayAmount)}</td>
            </tr>
            {allowancePaymentTypes.length > 0 && (
              <>
                <tr><td colSpan={2} className={`${tdClass} pt-2 font-medium text-muted-foreground`}>Allowances</td></tr>
                {allowancePaymentTypes.map(pt => (
                  <tr key={`earn-${pt.id}`}>
                    <td className={tdClass} style={{ paddingLeft: '1rem' }}>{pt.name}</td>
                    <td className={tdAmountClass}>{formatAmountForDisplay(record.dynamicGrossEarnings[pt.id] || 0)}</td>
                  </tr>
                ))}
                <tr className={subtotalRowClass}>
                  <td className={tdClass} style={{ paddingLeft: '1rem' }}>Subtotal: Allowances</td>
                  <td className={tdAmountClass}>{formatAmountForDisplay(subtotalAllowances)}</td>
                </tr>
              </>
            )}
            <tr className={`${totalRowClass} bg-muted/30`}>
              <td className={tdClass}>Total Gross Salary</td>
              <td className={tdAmountClass}>{formatAmountForDisplay(record.grossSalary)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-3">
        <h3 className={sectionTitleClass}>Deductions</h3>
        <table className={`${tableClass} mb-2`}>
          <thead>
            <tr><th colSpan={2} className="text-left text-sm font-medium text-muted-foreground pb-1">Statutory Deductions</th></tr>
          </thead>
          <tbody>
            {record.paye > 0 && <tr><td className={tdClass}>PAYE</td><td className={tdAmountClass}>{formatAmountForDisplay(record.paye)}</td></tr>}
            {record.employeePension > 0 && <tr><td className={tdClass}>Pension (Employee)</td><td className={tdAmountClass}>{formatAmountForDisplay(record.employeePension)}</td></tr>}
            {record.employeeMaternity > 0 && <tr><td className={tdClass}>Maternity (Employee)</td><td className={tdAmountClass}>{formatAmountForDisplay(record.employeeMaternity)}</td></tr>}
            {record.employeeRama > 0 && <tr><td className={tdClass}>RAMA (Employee)</td><td className={tdAmountClass}>{formatAmountForDisplay(record.employeeRama)}</td></tr>}
            {record.cbhiDeduction > 0 && <tr><td className={tdClass}>CBHI</td><td className={tdAmountClass}>{formatAmountForDisplay(record.cbhiDeduction)}</td></tr>}
            <tr className={subtotalRowClass}>
              <td className={tdClass}>Subtotal: Statutory Deductions</td>
              <td className={tdAmountClass}>{formatAmountForDisplay(totalStatutoryDeductions)}</td>
            </tr>
          </tbody>
        </table>

        {sortedDeductionTypesToDisplay.length > 0 && (
          <table className={`${tableClass} mt-2`}>
            <thead>
              <tr><th colSpan={2} className="text-left text-sm font-medium text-muted-foreground pb-1 pt-2 border-t">Other Deductions</th></tr>
            </thead>
            <tbody>
              {sortedDeductionTypesToDisplay.map(dt => (
                <tr key={`ded-${dt.id}`}>
                  <td className={tdClass}>{dt.name}</td>
                  <td className={tdAmountClass}>{formatAmountForDisplay(record.appliedDeductionAmounts[dt.id] || 0)}</td>
                </tr>
              ))}
              <tr className={subtotalRowClass}>
                <td className={tdClass}>Subtotal: Other Deductions</td>
                <td className={tdAmountClass}>{formatAmountForDisplay(totalOtherDeductions)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 pt-2 border-t-2">
        <table className="w-full text-lg">
          <tbody>
            <tr className="font-bold text-primary bg-muted/30">
              <td className="text-left py-1 px-2">Net Pay (Take Home)</td>
              <td className="text-right py-1 px-2">{formatAmountForDisplay(record.finalNetPay)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-6 pt-3 border-t text-center text-xs text-muted-foreground">
        <p>Generated on: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        <p className="italic">Powered by Cheetah Payroll</p>
      </div>
    </div>
  );
};

const HtmlDeductionHistoryPreview = ({ deductionHistoryData, staffMember, deduction, companyProfile }: { deductionHistoryData: DeductionHistoryRow[], staffMember: StaffMember | null, deduction: MainFullDeductionRecord | null, companyProfile: CompanyProfileData | null }) => { 
  return (
    <div className="p-4 bg-card text-card-foreground rounded-lg shadow print:shadow-none print:p-0"> 
      <div className="flex justify-between items-start mb-4 pb-2 border-b"> 
        <div> 
          <h2 className="text-xl font-bold text-primary">{companyProfile?.name || "[Company Name Not Set]"}</h2> 
          <p className="text-xs text-muted-foreground">{companyProfile?.address || "[Company Address Not Set]"}</p> 
          <p className="text-xs text-muted-foreground">TIN: {getStringIdentifier(companyProfile?.taxId || "[TIN Not Set]")}</p> 
        </div> 
        <div className="text-right"> 
          <h1 className="text-2xl font-bold">DEDUCTION HISTORY</h1> 
        </div> 
      </div> 
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
        <div><strong>Staff Name:</strong> {staffMember?.firstName} {staffMember?.lastName}</div>
        <div><strong>Designation:</strong> {staffMember?.designation || 'N/A'}</div>
        <div><strong>Staff No:</strong> {getStringIdentifier(staffMember?.staffNumber || 'N/A')}</div>
        <div><strong>RSSB No:</strong> {getStringIdentifier(staffMember?.staffRssbNumber || 'N/A')}</div>
      </div>
      <div className="text-sm mb-4"> 
        <div><strong>Deduction Item:</strong> {deduction?.description}</div> 
        <div><strong>Original Amount:</strong> {formatAmountForDisplay(deduction?.originalAmount)}</div> 
        <div><strong>Monthly Installment:</strong> {formatAmountForDisplay(deduction?.monthlyDeduction)}</div> 
      </div> 
      <div className="rounded-md border"> 
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{DEDUCTION_HISTORY_HEADERS[0]}</TableHead>
              <TableHead className="text-right">{DEDUCTION_HISTORY_HEADERS[1]}</TableHead>
              <TableHead className="text-right">{DEDUCTION_HISTORY_HEADERS[2]}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deductionHistoryData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row["Payroll Month"]}</TableCell>
                <TableCell className="text-right">{formatAmountForDisplay(row["Amount Deducted"])}</TableCell>
                <TableCell className="text-right">{formatAmountForDisplay(row["Running Balance"])}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table> 
      </div> 
      <div className="mt-6 pt-3 border-t text-center text-xs text-muted-foreground"> 
        <p>Generated on: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p> 
        <p className="italic">Powered by Cheetah Payroll</p> 
      </div> 
    </div>
  ); 
};

const HtmlStatutoryReportPreview = ({ reportData, reportTitle, companyProfile, selectedPeriodId, approvedRuns, }: { reportData: any[]; reportTitle: string; companyProfile: CompanyProfileData | null; selectedPeriodId: string | null; approvedRuns: MainPayrollRunSummary[]; }) => {
  if (!reportData || reportData.length === 0) {
    return <p className="text-center text-muted-foreground p-4">No data to display for {reportTitle}.</p>;
  }
  const headersToUse = Object.keys(reportData[0] || {});
  const periodDetails = approvedRuns.find(run => run.id === selectedPeriodId);
  const totals: Record<string, number> = {};
  headersToUse.forEach(headerKey => {
    if (KNOWN_NUMERIC_HEADERS.includes(headerKey)) {
      totals[headerKey] = reportData.reduce((sum, row) => sum + (Number(row[headerKey]) || 0), 0);
    }
  });
  return (
    <div className="p-4 bg-card text-card-foreground rounded-lg shadow print:shadow-none print:p-0">
      <div className="flex justify-between items-start mb-4 pb-2 border-b">
        <div>
          <h2 className="text-xl font-bold text-primary">{companyProfile?.name || "[Company Name Not Set]"}</h2>
          <p className="text-xs text-muted-foreground">{companyProfile?.address || "[Company Address Not Set]"}</p>
          <p className="text-xs text-muted-foreground">TIN: {getStringIdentifier(companyProfile?.taxId || "[TIN Not Set]")}</p>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold uppercase">{reportTitle}</h1>
          {periodDetails && (
            <p className="text-sm text-muted-foreground">Period: {periodDetails.month} {periodDetails.year}</p>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headersToUse.map(headerKey => {
                const isNumericColumn = KNOWN_NUMERIC_HEADERS.includes(headerKey);
                return (
                  <TableHead key={headerKey} className={cn(isNumericColumn ? "text-right" : "text-left", "whitespace-nowrap")}>
                    {String(headerKey)}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headersToUse.map(headerKey => {
                  const cellValue = row[headerKey];
                  const isNumericColumn = KNOWN_NUMERIC_HEADERS.includes(headerKey);
                  return (
                    <TableCell key={`${rowIndex}-${headerKey}`} className={cn(isNumericColumn ? "text-right" : "text-left", "whitespace-nowrap")} >
                      {isNumericColumn ? formatAmountForDisplay(Number(cellValue)) : getStringIdentifier(cellValue)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
          {Object.keys(totals).length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="text-left font-bold whitespace-nowrap">{headersToUse[0] && reportData.length > 0 ? "Totals" : ""}</TableCell>
                {headersToUse.slice(1).map(headerKey => {
                  const isNumericColumn = KNOWN_NUMERIC_HEADERS.includes(headerKey);
                  return (
                    <TableCell key={`total-${headerKey}`} className="text-right font-bold whitespace-nowrap">
                      {isNumericColumn ? formatAmountForDisplay(totals[headerKey]) : ''}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
      <div className="mt-6 pt-3 border-t text-center text-xs text-muted-foreground">
        <p>Generated on: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        <p className="italic">Powered by Cheetah Payroll</p>
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const { selectedCompanyId, selectedCompanyName, isLoadingCompanyContext } = useCompany();
  const [approvedRunsForStatutory, setApprovedRunsForStatutory] = useState<MainPayrollRunSummary[]>([]);
  const [selectedPeriodIdForStatutory, setSelectedPeriodIdForStatutory] = useState<string>(PLACEHOLDER_PERIOD_VALUE);
  const [generatedReportsData, setGeneratedReportsData] = useState<GeneratedReports | null>(null);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true); const [isGeneratingReports, setIsGeneratingReports] = useState(false);
  const [currentStatutoryReportIndex, setCurrentStatutoryReportIndex] = useState(0);
  const [isStatutoryReportPreviewDialogOpen, setIsStatutoryReportPreviewDialogOpen] = useState(false);
  const [allStaffMembers, setAllStaffMembers] = useState<StaffMember[]>([]);
  const [staffWithDeductions, setStaffWithDeductions] = useState<StaffMember[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData | null>(null);
  const [companyPaymentTypes, setCompanyPaymentTypes] = useState<PaymentType[]>([]);
  const [companyDeductionTypes, setCompanyDeductionTypes] = useState<CompanyDeductionType[]>([]);
  const [allDeductionsData, setAllDeductionsData] = useState<MainFullDeductionRecord[]>([]);
  const [selectedStaffIdForDeductionReport, setSelectedStaffIdForDeductionReport] = useState<string>(PLACEHOLDER_STAFF_VALUE);
  const [staffDeductionsForSelection, setStaffDeductionsForSelection] = useState<MainFullDeductionRecord[]>([]);
  const [selectedDeductionIdForReport, setSelectedDeductionIdForReport] = useState<string>(PLACEHOLDER_DEDUCTION_VALUE);
  const [deductionHistoryReportData, setDeductionHistoryReportData] = useState<DeductionHistoryRow[] | null>(null);
  const [isGeneratingDeductionHistory, setIsGeneratingDeductionHistory] = useState(false);
  const [isDeductionHistoryPreviewDialogOpen, setIsDeductionHistoryPreviewDialogOpen] = useState(false);
  const [approvedRunsForPayslips, setApprovedRunsForPayslips] = useState<PayrollRunSummaryForPayslips[]>([]);
  const [isGeneratePayslipByPeriodDialogOpen, setIsGeneratePayslipByPeriodDialogOpen] = useState(false);
  const [selectedPayrollRunIdForPayslip, setSelectedPayrollRunIdForPayslip] = useState<string>(PLACEHOLDER_PERIOD_VALUE);
  const [staffInSelectedRunForPayslip, setStaffInSelectedRunForPayslip] = useState<{id: string; name: string}[]>([]);
  const [selectedStaffForPayslipPeriodGeneration, setSelectedStaffForPayslipPeriodGeneration] = useState<Record<string, boolean>>({});
  const [isGeneratePayslipByStaffDialogOpen, setIsGeneratePayslipByStaffDialogOpen] = useState(false);
  const [selectedStaffIdForPayslip, setSelectedStaffIdForPayslip] = useState<string>(PLACEHOLDER_STAFF_VALUE);
  const [periodsForSelectedStaffPayslip, setPeriodsForSelectedStaffPayslip] = useState<PayrollRunSummaryForPayslips[]>([]);
  const [selectedPeriodsForPayslipStaffGeneration, setSelectedPeriodsForPayslipStaffGeneration] = useState<Record<string, boolean>>({});
  const [payslipsForPreviewDialog, setPayslipsForPreviewDialog] = useState<PayslipDataForGeneration[]>([]);
  const [isPayslipPreviewDialogOpen, setIsPayslipPreviewDialogOpen] = useState(false);
  const [currentPayslipPreviewIndex, setCurrentPayslipPreviewIndex] = useState(0);
  const [isGeneratingPayslips, setIsGeneratingPayslips] = useState(false);
  const [isLoadingPeriodsForStaff, setIsLoadingPeriodsForStaff] = useState(false);
  const [isEmailPayslipsDialogOpen, setIsEmailPayslipsDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState(""); const [emailBody, setEmailBody] = useState("");
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);


  useEffect(() => {
    const loadInitialData = async () => {
      if (isLoadingCompanyContext || !selectedCompanyId || typeof window === 'undefined') {
         if (!isLoadingCompanyContext && !selectedCompanyId) {
            setApprovedRunsForStatutory([]); setApprovedRunsForPayslips([]); setAllStaffMembers([]); setAllDeductionsData([]);
            setCompanyProfile(null); setCompanyPaymentTypes([]); setCompanyDeductionTypes([]); setStaffWithDeductions([]);
            setIsLoadingRuns(false);
        } return;
      }
      setIsLoadingRuns(true);
      setFeedback(null);
      try {
        const summaries = await getAllFromStore<MainPayrollRunSummary>(STORE_NAMES.PAYROLL_SUMMARIES, selectedCompanyId);
        const approved = summaries.filter(s => s.status === "Approved").sort((a, b) => b.year - a.year || Date.parse(`01 ${b.month} ${b.year}`) - Date.parse(`01 ${a.month} ${a.year}`));
        setApprovedRunsForStatutory(approved); setApprovedRunsForPayslips(approved as PayrollRunSummaryForPayslips[]);

        const staff = await getAllFromStore<StaffMember>(STORE_NAMES.STAFF, selectedCompanyId); setAllStaffMembers(staff);
        const deductions = await getAllFromStore<MainFullDeductionRecord>(STORE_NAMES.DEDUCTIONS, selectedCompanyId); setAllDeductionsData(deductions);

        const staffWithAnyDeductions = staff.filter(s => deductions.some(d => d.staffId === s.id && d.companyId === selectedCompanyId));
        setStaffWithDeductions(staffWithAnyDeductions);

        let profile = await getCompanySingletonData<CompanyProfileData>(STORE_NAMES.COMPANY_PROFILE, selectedCompanyId); if (profile) { profile.currency = "RWF"; } setCompanyProfile(profile || null);
        let paymentTypes = await getAllFromStore<PaymentType>(STORE_NAMES.PAYMENT_TYPES, selectedCompanyId); if (paymentTypes.length === 0 && selectedCompanyId) { const defaultTypes = initialPaymentTypesForCompanySeed(selectedCompanyId); for (const type of defaultTypes) { await putToStore<PaymentType>(STORE_NAMES.PAYMENT_TYPES, type, selectedCompanyId); } paymentTypes = defaultTypes; } setCompanyPaymentTypes(paymentTypes.sort((a,b)=>a.order - b.order));
        let dedTypes = await getAllFromStore<CompanyDeductionType>(STORE_NAMES.DEDUCTION_TYPES, selectedCompanyId); if (dedTypes.length === 0 && selectedCompanyId) { const defaultDedTypes = initialCompanyDeductionTypesSeed(selectedCompanyId); for (const type of defaultDedTypes) { await putToStore<CompanyDeductionType>(STORE_NAMES.DEDUCTION_TYPES, type, selectedCompanyId); } dedTypes = defaultDedTypes; } setCompanyDeductionTypes(dedTypes.sort((a,b)=>a.order - b.order));
      } catch (error) { console.error("Error loading initial data for reports:", error); setFeedback({type: 'error', message: "Loading Error", details: `Could not load initial data. ${(error as Error).message}`}); }
      setIsLoadingRuns(false);
    };
    loadInitialData();
  }, [selectedCompanyId, isLoadingCompanyContext]);

  useEffect(() => {
      if (selectedStaffIdForDeductionReport === "" || selectedStaffIdForDeductionReport === PLACEHOLDER_STAFF_VALUE) {
        setStaffDeductionsForSelection([]);
        setSelectedDeductionIdForReport(PLACEHOLDER_DEDUCTION_VALUE);
        setDeductionHistoryReportData(null);
      } else if (selectedStaffIdForDeductionReport && selectedCompanyId) {
        setStaffDeductionsForSelection(allDeductionsData.filter(d => d.staffId === selectedStaffIdForDeductionReport && d.companyId === selectedCompanyId));
        setSelectedDeductionIdForReport(PLACEHOLDER_DEDUCTION_VALUE);
        setDeductionHistoryReportData(null);
      }
  }, [selectedStaffIdForDeductionReport, allDeductionsData, selectedCompanyId]);

  useEffect(() => { if (selectedDeductionIdForReport === "" || selectedDeductionIdForReport === PLACEHOLDER_DEDUCTION_VALUE) { setDeductionHistoryReportData(null); } }, [selectedDeductionIdForReport]);
  useEffect(() => { if (selectedPeriodIdForStatutory === "" || selectedPeriodIdForStatutory === PLACEHOLDER_PERIOD_VALUE) { setGeneratedReportsData(null); setCurrentStatutoryReportIndex(0); } }, [selectedPeriodIdForStatutory]);
  useEffect(() => { const fetchStaffForSelectedRunPayslip = async () => { if (selectedPayrollRunIdForPayslip && selectedPayrollRunIdForPayslip !== PLACEHOLDER_PERIOD_VALUE && selectedCompanyId) { setIsGeneratingPayslips(true); setFeedback(null); try { const runDetail = await getFromStore<PayrollRunDetailForReport>(STORE_NAMES.PAYROLL_RUN_DETAILS, selectedPayrollRunIdForPayslip, selectedCompanyId); if (runDetail && runDetail.employees) { const staff = runDetail.employees.map(emp => ({ id: emp.employeeId, name: `${emp.firstName} ${emp.lastName}` })); setStaffInSelectedRunForPayslip(staff); setSelectedStaffForPayslipPeriodGeneration({}); } else { setStaffInSelectedRunForPayslip([]); } } catch (error) { console.error("Error fetching staff for selected run (payslip):", error); setStaffInSelectedRunForPayslip([]); setFeedback({type: 'error', message: "Error", details: "Could not fetch staff."}); } setIsGeneratingPayslips(false); } else { setStaffInSelectedRunForPayslip([]); setSelectedStaffForPayslipPeriodGeneration({});} }; fetchStaffForSelectedRunPayslip(); }, [selectedPayrollRunIdForPayslip, selectedCompanyId]);
  useEffect(() => { const fetchPeriodsForSelectedStaff = async () => { if (selectedStaffIdForPayslip && selectedStaffIdForPayslip !== PLACEHOLDER_STAFF_VALUE && approvedRunsForPayslips.length > 0 && selectedCompanyId) { setIsLoadingPeriodsForStaff(true); setFeedback(null); const relevantPeriods: PayrollRunSummaryForPayslips[] = []; for (const runSummary of approvedRunsForPayslips) { try { const runDetail = await getFromStore<PayrollRunDetailForReport>(STORE_NAMES.PAYROLL_RUN_DETAILS, runSummary.id, selectedCompanyId); if (runDetail && runDetail.employees && runDetail.employees.some(emp => emp.employeeId === selectedStaffIdForPayslip)) { relevantPeriods.push(runSummary); } } catch (error) { console.error(`Error fetching details for run ${runSummary.id}:`, error); } } setPeriodsForSelectedStaffPayslip(relevantPeriods); setSelectedPeriodsForPayslipStaffGeneration({}); setIsLoadingPeriodsForStaff(false); } else { setPeriodsForSelectedStaffPayslip([]); setSelectedPeriodsForPayslipStaffGeneration({}); } }; fetchPeriodsForSelectedStaff(); }, [selectedStaffIdForPayslip, approvedRunsForPayslips, selectedCompanyId]);

  const handleGenerateReports = async () => {
    setFeedback(null);
    if (!selectedPeriodIdForStatutory || selectedPeriodIdForStatutory === PLACEHOLDER_PERIOD_VALUE || !selectedCompanyId) { setFeedback({type: 'error', message: "Selection Missing", details: "Select company and period."}); setGeneratedReportsData(null); setCurrentStatutoryReportIndex(0); return; }
    if (companyPaymentTypes.length === 0) { setFeedback({type: 'error', message: "Config Error", details: `No Payment Types defined.`}); return; }
    setIsGeneratingReports(true); setGeneratedReportsData(null); setCurrentStatutoryReportIndex(0);
    try {
      const runDetail = await getFromStore<PayrollRunDetailForReport>(STORE_NAMES.PAYROLL_RUN_DETAILS, selectedPeriodIdForStatutory, selectedCompanyId);
      if (!runDetail || !runDetail.employees) { setFeedback({type: 'error', message: "Data Error", details: `Could not find data for run ${selectedPeriodIdForStatutory}.`}); setIsGeneratingReports(false); return; }
      const payrollMonthDate = new Date(Date.parse(runDetail.month +" 1, " + runDetail.year)); const firstDayOfMonth = startOfMonth(payrollMonthDate); const lastDayOfMonth = endOfMonth(payrollMonthDate); const daysInMonth = getDaysInMonth(payrollMonthDate);
      const ishemaReport: IshemaReportRow[] = []; const payeReport: PayeReportRow[] = []; const pensionReport: PensionReportRow[] = []; const maternityReport: MaternityReportRow[] = []; const cbhiReport: CbhiReportRow[] = []; const netSalariesReport: NetSalariesReportRow[] = [];
      for (const emp of runDetail.employees) {
        const staffMember = allStaffMembers.find(s => s.id === emp.employeeId && s.companyId === selectedCompanyId); let formattedBirthDate = ''; if (staffMember?.birthDate && isValidDate(parseISO(staffMember.birthDate))) { formattedBirthDate = format(parseISO(staffMember.birthDate), 'dd/MM/yyyy'); }
        
        const basicPayForReport = emp.dynamicGrossEarnings?.[DEFAULT_BASIC_PAY_ID] || 0;
        const transportAllowanceForReport = emp.dynamicGrossEarnings?.[DEFAULT_TRANSPORT_ALLOWANCE_ID] || 0;
        
        let houseAllowanceForReport = 0; const houseAllowancePaymentType = companyPaymentTypes.find(pt => pt.name.toLowerCase() === "house allowance" && pt.id !== DEFAULT_BASIC_PAY_ID && pt.id !== DEFAULT_TRANSPORT_ALLOWANCE_ID); if (houseAllowancePaymentType) { houseAllowanceForReport = emp.dynamicGrossEarnings[houseAllowancePaymentType.id] || 0; }
        let otherCashAllowancesForReport = 0; for(const paymentTypeId in emp.dynamicGrossEarnings) { if (paymentTypeId !== DEFAULT_BASIC_PAY_ID && paymentTypeId !== DEFAULT_TRANSPORT_ALLOWANCE_ID && (!houseAllowancePaymentType || paymentTypeId !== houseAllowancePaymentType.id)) { otherCashAllowancesForReport += (emp.dynamicGrossEarnings[paymentTypeId] || 0); } }
        ishemaReport.push({ 'Last Name': emp.lastName, 'First Name': emp.firstName, 'RSSB Number': getStringIdentifier(emp.rssbNumber), 'ID or Passport Number': getStringIdentifier(staffMember?.idPassportNumber), 'Category': staffMember?.employeeCategory || 'P', 'Is RAMA Member': companyProfile?.isRamaActive ? 'Y' : 'N', 'Basic Salary': Math.round(basicPayForReport), 'Transport Benefit in Kind': 0, 'House Benefit in Kind': 0, 'Other Benefit in Kind': 0, 'Transport Cash Allowance': Math.round(transportAllowanceForReport), 'House Cash Allowance': Math.round(houseAllowanceForReport), 'Other Cash Allowance': Math.round(otherCashAllowancesForReport), 'Lumpsum Transport': 0, 'Other Medical Deductions': 0, 'Terminal Benefit End Contract': 0, 'Retirement Benefits': 0, 'Ejo-Heza Contribution': 0, 'Other Pension Funds': 0 });
        payeReport.push({ 'TIN': getStringIdentifier(staffMember?.taxId), 'RSSB Number': getStringIdentifier(emp.rssbNumber), 'National ID/Passport': getStringIdentifier(staffMember?.idPassportNumber), 'Last Name': emp.lastName, 'First Name': emp.firstName, 'Return Type': 'B', 'Gender': staffMember?.gender || 'Unknown', 'Job type': 'P', 'Start Date': format(firstDayOfMonth, 'dd/MM/yyyy'), 'End date': format(lastDayOfMonth, 'dd/MM/yyyy'), 'Birth Date': formattedBirthDate, 'Basic Salary': Math.round(basicPayForReport), 'Benefits in Kind (Transport)': 0, 'Benefits in Kind (House)': 0, 'Benefits in Kind (Others)': 0, 'Cash Allowance (Transport)': Math.round(transportAllowanceForReport), 'Cash Allowance (House)': Math.round(houseAllowanceForReport), 'Cash Allowance (Others)': Math.round(otherCashAllowancesForReport), 'PAYE Taxable Base': Math.round(emp.grossSalary || 0), 'PAYE': Math.round(emp.paye || 0), 'RSSB base': Math.round(emp.grossSalary || 0), 'RSSB (Employee)': Math.round(emp.employeeRssb || 0), 'RSSB (Employer)': Math.round(emp.employerRssb || 0), 'Total RSSB': Math.round((emp.employeeRssb || 0) + (emp.employerRssb || 0)), 'RAMA (Employee)': Math.round(emp.employeeRama || 0), 'RAMA (Employer)': Math.round(emp.employerRama || 0), 'Total RAMA': Math.round((emp.employeeRama || 0) + (emp.employerRama || 0)), });
        const employerOccupationalHazards = Math.round((emp.grossSalary || 0) * 0.02); pensionReport.push({ 'RSSB Number': getStringIdentifier(emp.rssbNumber), 'Last Name': emp.lastName, 'First Name': emp.firstName, 'Gross Salary': Math.round(emp.grossSalary || 0), 'Transport Allowance': Math.round(transportAllowanceForReport), 'Pension (Employee)': Math.round(emp.employeePension || 0), 'Pension (Employer)': Math.round(emp.employerPension || 0), 'Employer Occupational Hazards': employerOccupationalHazards, 'Total Contributions': Math.round((emp.employeePension || 0) + (emp.employerPension || 0) + employerOccupationalHazards), });
        maternityReport.push({ 'RSSB Number': getStringIdentifier(emp.rssbNumber), 'Last Name': emp.lastName, 'First Name': emp.firstName, 'Amount of Remuneration': Math.round(Math.max(0, (emp.grossSalary || 0) - (transportAllowanceForReport || 0))), 'Number of Days in a Month': daysInMonth, 'Status': 'E', 'Total contributions': Math.round(emp.totalMaternity || 0), });
        cbhiReport.push({ 'RSSB Number': getStringIdentifier(emp.rssbNumber), 'National ID/Passport': getStringIdentifier(staffMember?.idPassportNumber), 'Last Name': emp.lastName, 'First Name': emp.firstName, 'Employment Status': 'P', 'Is Employer RAMA Member?': 'N', 'Basic Salary': Math.round(basicPayForReport), 'Benefits in Kind (Transport)': 0, 'Benefits in Kind (House)': 0, 'Benefits in Kind (Others)': 0, 'Cash Allowance (Transport)': Math.round(transportAllowanceForReport), 'Cash Allowance (House)': Math.round(houseAllowanceForReport), 'Cash Allowance (Others)': Math.round(otherCashAllowancesForReport), 'Terminal Benefits': 0, 'Retirement Benefits': 0, 'Other Recognised Medical Deductions': 0, 'PAYE Taxable Base': Math.round(emp.grossSalary || 0), 'PAYE': Math.round(emp.paye || 0), 'CBHI': Math.round(emp.cbhiDeduction || 0), });
        netSalariesReport.push({ 'First Name': emp.firstName, 'Last Name': emp.lastName, 'Staff Number': getStringIdentifier(emp.staffNumber), 'Bank name': String(staffMember?.bankName || 'N/A'), 'Bank code': String(staffMember?.bankCode || 'N/A'), 'Bank account no.': getStringIdentifier(staffMember?.bankAccountNumber), 'Bank branch': String(staffMember?.bankBranch || 'N/A'), 'Net Pay': Math.round(emp.finalNetPay || 0), });
      }
      setGeneratedReportsData({ ishema: ishemaReport, paye: payeReport, pension: pensionReport, maternity: maternityReport, cbhi: cbhiReport, netSalaries: netSalariesReport, });
      setFeedback({type: 'success', message: "Statutory Reports Generated"}); setIsStatutoryReportPreviewDialogOpen(true);
    } catch (error) { console.error("Error generating reports:", error); setFeedback({type: 'error', message: "Generation Failed", details: (error as Error).message }); }
    setIsGeneratingReports(false);
  };
  const handleGenerateDeductionHistoryReport = async () => { setFeedback(null); if (!selectedDeductionIdForReport || selectedDeductionIdForReport === PLACEHOLDER_DEDUCTION_VALUE || !selectedCompanyId) { setFeedback({type: 'error', message: "Selection Missing", details: "Select company, staff, and deduction."}); setDeductionHistoryReportData(null); return; } setIsGeneratingDeductionHistory(true); setDeductionHistoryReportData(null); try { const selectedDeduction = allDeductionsData.find(d => d.id === selectedDeductionIdForReport && d.companyId === selectedCompanyId); if (!selectedDeduction) { setFeedback({type: 'error', message: "Error", details: "Deduction not found."}); setIsGeneratingDeductionHistory(false); return; } const history: DeductionHistoryRow[] = []; let currentRunningBalance = selectedDeduction.originalAmount || 0; history.push({ 'Payroll Month': isValidDate(parse(selectedDeduction.startDate, 'yyyy-MM-dd', new Date())) ? format(parse(selectedDeduction.startDate, 'yyyy-MM-dd', new Date()), 'MMM yyyy') + " (Start)" : "Invalid Start", 'Amount Deducted': 0, 'Running Balance': Math.round(currentRunningBalance), }); const relevantApprovedRuns = approvedRunsForStatutory.filter(runSummary => { const runDate = new Date(Date.parse(`${runSummary.month} 1, ${runSummary.year}`)); const deductionStartDate = parse(selectedDeduction.startDate, 'yyyy-MM-dd', new Date()); return isValidDate(deductionStartDate) && runDate >= deductionStartDate; }).sort((a, b) => new Date(Date.parse(`${a.month} 1, ${a.year}`)).getTime() - new Date(Date.parse(`${b.month} 1, ${b.year}`)).getTime()); for (const runSummary of relevantApprovedRuns) { if (currentRunningBalance <= 0 && (selectedDeduction.deductionTypeId !== DEFAULT_CHARGE_DEDUCTION_TYPE_ID)) break; const runDetail = await getFromStore<PayrollRunDetailForReport>(STORE_NAMES.PAYROLL_RUN_DETAILS, runSummary.id, selectedCompanyId); if (!runDetail) continue; const employeeRecord = runDetail.employees.find(emp => emp.employeeId === selectedDeduction.staffId && emp.companyId === selectedCompanyId); if (!employeeRecord || !employeeRecord.appliedDeductions) continue; const appliedDetail = employeeRecord.appliedDeductions.find(ad => ad.deductionId === selectedDeduction.id); if (appliedDetail && (appliedDetail.amountApplied || 0) > 0) { currentRunningBalance -= (appliedDetail.amountApplied || 0); currentRunningBalance = Math.max(0, currentRunningBalance); history.push({ 'Payroll Month': `${runDetail.month} ${runDetail.year}`, 'Amount Deducted': Math.round(appliedDetail.amountApplied || 0), 'Running Balance': Math.round(currentRunningBalance), }); } else if (selectedDeduction.deductionTypeId === DEFAULT_CHARGE_DEDUCTION_TYPE_ID && (!appliedDetail || (appliedDetail.amountApplied || 0) === 0)) { history.push({ 'Payroll Month': `${runDetail.month} ${runDetail.year}`, 'Amount Deducted': 0, 'Running Balance': Math.round(currentRunningBalance), }); } } setDeductionHistoryReportData(history); setFeedback({type: 'success', message: "Deduction History Generated"}); if (history.length > 0) { setIsDeductionHistoryPreviewDialogOpen(true); } } catch (error) { console.error("Error generating deduction history:", error); setFeedback({type: 'error', message: "History Gen Failed", details: (error as Error).message}); } setIsGeneratingDeductionHistory(false); };
  const ID_LIKE_HEADERS_FOR_STATUTORY_REPORTS: (keyof PayeReportRow | keyof PensionReportRow | keyof CbhiReportRow | keyof NetSalariesReportRow | keyof IshemaReportRow)[] = [ 'TIN', 'RSSB Number', 'ID or Passport Number', 'National ID/Passport', 'Staff Number', 'Bank account no.', 'Bank code' ];
  const convertToCsv = (data: any[], headers: string[], idLikeHeaders: string[] = []): string => { const headerRow = headers.join(','); const dataRows = data.map(row => headers.map(header => { let value = row[header]; let stringValue = (value === undefined || value === null) ? '' : String(value); if (idLikeHeaders.includes(header as any) && /^\d+$/.test(stringValue) && stringValue.length > 0 && !stringValue.startsWith("'")) { stringValue = `'${stringValue}`; } return `"${stringValue.replace(/"/g, '""')}"`; }).join(',') ); return [headerRow, ...dataRows].join('\n'); };
  const getHeadersFromData = (data: any[], specificHeaders?: string[]): string[] => { if (specificHeaders && specificHeaders.length > 0) return specificHeaders; if (!data || data.length === 0) return []; return Object.keys(data[0]); }

  const handleDownloadAllStatutory = async (fileType: 'csv' | 'xlsx') => {
    setFeedback(null);
    if (!generatedReportsData || !selectedCompanyId) {
      setFeedback({ type: 'error', message: "Error", details: "No Reports. Generate reports first." });
      return;
    }
    const zip = new JSZip();
    const periodInfo = approvedRunsForStatutory.find(r => r.id === selectedPeriodIdForStatutory);
    const periodName = periodInfo ? `${periodInfo.month}_${periodInfo.year}` : "UnknownPeriod";
    const companyNameForFile = sanitizeFilename(selectedCompanyName);
    const reportFileNames: Record<StatutoryReportTypeKey, string> = {
      ishema: `Ishema_Report_${periodName}.${fileType}`,
      paye: `PAYE_Report_${periodName}.${fileType}`,
      pension: `Pension_Report_${periodName}.${fileType}`,
      maternity: `Maternity_Report_${periodName}.${fileType}`,
      cbhi: `CBHI_Report_${periodName}.${fileType}`,
      netSalaries: `Net_Salaries_Report_${periodName}.${fileType}`,
    };
    const reportsToZipConfig: { name: string; data: any[]; headers: string[]; idLikeFields: string[] }[] = (Object.keys(generatedReportsData) as StatutoryReportTypeKey[]).map(key => { const reportData = generatedReportsData[key]; const headers = getHeadersFromData(reportData); const relevantIdLikeFields = ID_LIKE_HEADERS_FOR_STATUTORY_REPORTS.filter(idHeader => headers.includes(idHeader as string)) as string[]; return { name: reportFileNames[key], data: reportData, headers: headers, idLikeFields: relevantIdLikeFields }; });
    for (const report of reportsToZipConfig) {
      if (report.data.length > 0) {
        const processedDataForExport = report.data.map(row => {
          const newRow: Record<string, string | number> = {};
          report.headers.forEach(header => {
            let value = row[header];
            if (report.idLikeFields.includes(header)) {
                 newRow[header] = getStringIdentifier(value);
            } else if (typeof value === 'number') {
              newRow[header] = Math.round(value);
            } else {
              newRow[header] = String(value || '');
            }
          });
          return newRow;
        });
        if (fileType === 'csv') {
          zip.file(report.name, convertToCsv(processedDataForExport, report.headers, report.idLikeFields));
        } else {
          const worksheet = XLSX.utils.json_to_sheet(processedDataForExport, { header: report.headers, skipHeader: false });
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, report.name.split('.')[0].substring(0, 30));
          const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
          zip.file(report.name, xlsxData, { binary: true });
        }
      }
    }
    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${companyNameForFile}_all_statutory_reports_${periodName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      setFeedback({ type: 'success', message: "ZIP Export Started" });
    } catch (error) {
      console.error("Error creating ZIP:", error);
      setFeedback({ type: 'error', message: "ZIP Generation Error", details: (error as Error).message });
    }
    setIsGeneratingReports(false);
  };

  const handleDownloadSingleStatutoryReport = async (fileType: 'csv' | 'xlsx') => {
    setFeedback(null);
    const reportKey = statutoryReportOrder[currentStatutoryReportIndex];
    if (!generatedReportsData || !generatedReportsData[reportKey] || !selectedCompanyId) {
      setFeedback({ type: 'error', message: "Error", details: "Report data not available." });
      return;
    }
    const reportData = generatedReportsData[reportKey];
    if (reportData.length === 0) {
      setFeedback({ type: 'info', message: "No Data", details: `There is no data to export for ${statutoryReportTypeLabels[reportKey]}.` });
      return;
    }

    const periodInfo = approvedRunsForStatutory.find(r => r.id === selectedPeriodIdForStatutory);
    const periodName = periodInfo ? `${periodInfo.month}_${periodInfo.year}` : "UnknownPeriod";
    const companyNameForFile = sanitizeFilename(selectedCompanyName);
    const reportBaseName = statutoryReportTypeLabels[reportKey].replace(/\s+/g, '_');
    const fileName = `${companyNameForFile}_${reportBaseName}_${periodName}.${fileType}`;

    const headers = getHeadersFromData(reportData);
    const relevantIdLikeFields = ID_LIKE_HEADERS_FOR_STATUTORY_REPORTS.filter(idHeader => headers.includes(idHeader as string)) as string[];

    const processedDataForExport = reportData.map(row => {
        const newRow: Record<string, string | number> = {};
        headers.forEach(header => {
            let value = (row as any)[header];
            if (relevantIdLikeFields.includes(header as any)) {
                newRow[header] = getStringIdentifier(value);
            } else if (typeof value === 'number') {
                newRow[header] = Math.round(value);
            } else {
                newRow[header] = String(value || '');
            }
        });
        return newRow;
    });

    if (fileType === 'csv') {
        const csvString = convertToCsv(processedDataForExport, headers, relevantIdLikeFields);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        setFeedback({ type: 'success', message: "CSV Export Started", details: `${fileName} exported.` });
    } else if (fileType === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(processedDataForExport, { header: headers, skipHeader: false });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, reportBaseName.substring(0, 30));
        XLSX.writeFile(workbook, fileName);
        setFeedback({ type: 'success', message: "XLSX Export Started", details: `${fileName} exported.` });
    }
  };

  const downloadDeductionHistory = (fileType: "pdf") => { 
    setFeedback(null); 
    if (!deductionHistoryReportData || deductionHistoryReportData.length === 0 || !selectedCompanyId) { 
      setFeedback({type: 'error', message: "Error", details: "No history data. Generate history first."}); 
      return; 
    } 
    const staffMember = allStaffMembers.find(s => s.id === selectedStaffIdForDeductionReport && s.companyId === selectedCompanyId); 
    const deduction = allDeductionsData.find(d => d.id === selectedDeductionIdForReport && d.companyId === selectedCompanyId); 
    const staffNameSafe = staffMember ? `${staffMember.firstName}_${staffMember.lastName}`.replace(/\s+/g, '_') : "UnknownStaff"; 
    const dedDescSafe = deduction ? deduction.description.replace(/\s+/g, "_").substring(0, 30) : "UnknownDeduction"; 
    const companyNameForFile = sanitizeFilename(selectedCompanyName); 
    const fileName = `${companyNameForFile}_deduction_history_${staffNameSafe}_${dedDescSafe}.pdf`; 
    const headers = DEDUCTION_HISTORY_HEADERS; 
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' }); 
    const margin = 72; 
    const pageWidth = doc.internal.pageSize.getWidth(); 
    let yPos = margin; 
    doc.setFontSize(14).setFont(undefined, 'bold').text(companyProfile?.name || "[Company Name]", margin, yPos); 
    yPos += 16; 
    doc.setFontSize(10).setFont(undefined, 'normal'); 
    if (companyProfile?.address) { doc.text(companyProfile.address, margin, yPos); yPos += 12; } 
    if (companyProfile?.taxId) { doc.text(`TIN: ${getStringIdentifier(companyProfile.taxId)}`, margin, yPos); yPos += 12; } 
    yPos = Math.max(yPos, margin) + 10; 
    doc.setFontSize(16).setFont(undefined, 'bold').text("Deduction History Report", pageWidth / 2, yPos, { align: 'center' }); 
    yPos += 20; 
    doc.setFontSize(10).setFont(undefined, 'normal'); 
    
    if (staffMember) {
      doc.text(`Staff Name: ${staffMember.firstName} ${staffMember.lastName}`, margin, yPos); 
      doc.text(`Designation: ${staffMember.designation || 'N/A'}`, pageWidth - margin, yPos, { align: 'right'}); 
      yPos +=12; 
      doc.text(`Staff Number: ${getStringIdentifier(staffMember.staffNumber || 'N/A')}`, margin, yPos); 
      doc.text(`RSSB Number: ${getStringIdentifier(staffMember.staffRssbNumber || 'N/A')}`, pageWidth - margin, yPos, { align: 'right'}); 
      yPos +=12; 
    } 
    
    if (deduction) { 
      doc.text(`Deduction: ${deduction.description}`, margin, yPos); 
      doc.text(`Original Amount: ${formatAmountForDisplay(deduction.originalAmount)}`, pageWidth - margin, yPos, {align: 'right'}); 
      yPos +=14; 
    } 
    doc.setLineWidth(0.5).line(margin, yPos, pageWidth - margin, yPos); 
    yPos += 15; 
    (doc as any).autoTable({ head: [headers.map(h => String(h))], body: deductionHistoryReportData.map(row => [ row["Payroll Month"] || '', formatAmountForDisplay(row["Amount Deducted"]), formatAmountForDisplay(row["Running Balance"]) ]), startY: yPos, styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' }, headStyles: { fillColor: [102, 126, 234], textColor: [255,255,255], fontStyle: 'bold', fontSize: 10, }, columnStyles: { 0: { cellWidth: 'auto', halign: 'left' }, 1: { halign: 'right', cellWidth: 'auto' }, 2: { halign: 'right', cellWidth: 'auto' } }, didParseCell: (data: any) => { if (data.section === 'head') { if (data.column.index === 0) { data.cell.styles.halign = 'left'; } if (data.column.index === 1 || data.column.index === 2) { data.cell.styles.halign = 'right'; } } }, margin: { left: margin, right: margin, bottom: margin + 20 }, didDrawPage: (data: any) => { const str = "Page " + doc.getNumberOfPages(); const pageHeightInner = doc.internal.pageSize.getHeight(); doc.setFontSize(8); doc.text(str, data.settings.margin.left, pageHeightInner - (margin / 2)); doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - data.settings.margin.right, pageHeightInner - (margin / 2), { align: 'right' }); doc.setFont(undefined, 'italic'); doc.text("Powered by Cheetah Payroll", pageWidth / 2, pageHeightInner - (margin / 2) + 10, { align: 'center' }); } }); 
    doc.save(fileName); 
    setFeedback({type: 'success', message: "PDF Export Started"}); 
  };
  const generatePayslipObjectsInternal = async (itemsToGenerate: { staffId: string; periodRunId: string }[]): Promise<PayslipDataForGeneration[]> => { setFeedback(null); const generatedSlips: PayslipDataForGeneration[] = []; if (!selectedCompanyId) return generatedSlips; setIsGeneratingPayslips(true); if(companyPaymentTypes.length === 0){ setFeedback({type: 'error', message: "Error", details: "No Payment Types defined for this company. Configure them in 'Payments' settings."}); setIsGeneratingPayslips(false); return generatedSlips; }
    for (const item of itemsToGenerate) { try { const runDetail = await getFromStore<PayrollRunDetailForReport>(STORE_NAMES.PAYROLL_RUN_DETAILS, item.periodRunId, selectedCompanyId); if (!runDetail) { setFeedback({type: 'error', message: "Data Error", details: `No details for run ${item.periodRunId}.`}); continue; } const employeeRecord = runDetail.employees.find(emp => emp.employeeId === item.staffId && emp.companyId === selectedCompanyId); if (!employeeRecord) { if (itemsToGenerate.length === 1) { setFeedback({type: 'info', message: "Info", details: `Staff ${item.staffId} not in run ${item.periodRunId}.`}); } continue; } const newPayslip: PayslipDataForGeneration = { employeeName: `${employeeRecord.firstName} ${employeeRecord.lastName}`, employeeId: employeeRecord.employeeId, companyId: selectedCompanyId, period: `${runDetail.month} ${runDetail.year}`, periodRunId: runDetail.id, netPay: employeeRecord.finalNetPay || 0, payrollDetails: employeeRecord, }; generatedSlips.push(newPayslip); } catch (error) { console.error(`Error for staff ${item.staffId}, run ${item.periodRunId}:`, error); setFeedback({type: 'error', message: "Payslip Generation Error", details: (error as Error).message }); } } setIsGeneratingPayslips(false); return generatedSlips; };

  const generatePayslipPdfDocInternal = (payslip: PayslipDataForGeneration, currentCompanyProfile: CompanyProfileData | null, paymentTypesForPayslip: PaymentType[], deductionTypesForPayslip: CompanyDeductionType[]): jsPDF => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const PRIMARY_COLOR_RGB = [102, 126, 234];
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const record = payslip.payrollDetails;
    let currentY = margin;
    const lineHeight = 14;

    doc.setFontSize(14).setFont(undefined, 'bold').setTextColor(PRIMARY_COLOR_RGB[0], PRIMARY_COLOR_RGB[1], PRIMARY_COLOR_RGB[2]);
    doc.text(currentCompanyProfile?.name || "[Company Name]", margin, currentY);
    currentY += lineHeight * 1.2;
    doc.setFontSize(9).setFont(undefined, 'normal').setTextColor(100);
    if (currentCompanyProfile?.address) { doc.text(currentCompanyProfile.address, margin, currentY); currentY += lineHeight * 0.9; }
    if (currentCompanyProfile?.taxId) { doc.text(`TIN: ${getStringIdentifier(currentCompanyProfile.taxId)}`, margin, currentY); currentY += lineHeight * 0.9; }

    const headerRightX = pageWidth - margin;
    doc.setFontSize(14).setFont(undefined, 'bold').setTextColor(0);
    doc.text("PAYSLIP", headerRightX, margin, { align: 'right' });
    doc.setFontSize(9).setFont(undefined, 'normal');
    doc.text(`Period: ${payslip.period}`, headerRightX, margin + (lineHeight * 1.2), { align: 'right' });

    currentY = Math.max(currentY, margin + (lineHeight * 1.2) + (lineHeight * 0.9)) + 5;
    doc.setLineWidth(0.5).line(margin, currentY, pageWidth - margin, currentY);
    currentY += lineHeight * 1.1;

    doc.setFontSize(10);

    doc.setFont(undefined, 'bold'); doc.text("Staff Name:", margin, currentY);
    doc.setFont(undefined, 'normal'); doc.text(payslip.employeeName, margin + doc.getTextWidth("Staff Name:") + 5, currentY);
    const designationLabel = "Designation:"; const designationValue = record.designation || 'N/A';
    doc.setFont(undefined, 'normal'); doc.text(designationValue, headerRightX, currentY, { align: 'right' });
    doc.setFont(undefined, 'bold'); doc.text(designationLabel, headerRightX - doc.getTextWidth(designationValue) - 5, currentY, { align: 'right' });
    currentY += lineHeight;

    doc.setFont(undefined, 'bold'); doc.text("Staff No:", margin, currentY);
    doc.setFont(undefined, 'normal'); doc.text(getStringIdentifier(record.staffNumber || 'N/A'), margin + doc.getTextWidth("Staff No:") + 5, currentY);
    const rssbLabel = "RSSB Number:"; const rssbValue = getStringIdentifier(record.rssbNumber || 'N/A');
    doc.setFont(undefined, 'normal'); doc.text(rssbValue, headerRightX, currentY, { align: 'right' });
    doc.setFont(undefined, 'bold'); doc.text(rssbLabel, headerRightX - doc.getTextWidth(rssbValue) - 5, currentY, { align: 'right' });
    currentY += lineHeight * 1.1;


    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += lineHeight * 1.1;

    const tableColumnStyles: {[key: number]: any} = { 0: { halign: 'left' }, 1: { halign: 'right'} };
    const tableHeadStyles: any = { fillColor: PRIMARY_COLOR_RGB, textColor: [255,255,255] as [number,number,number], fontSize: 10, fontStyle: 'bold' as const, };
    const tableHeadStylesWithRightAlignNumeric: any = { ...tableHeadStyles };
    tableHeadStylesWithRightAlignNumeric.didParseCell = (data: any) => { if (data.section === 'head' && data.column.index === 1) { data.cell.styles.halign = 'right'; } };
    const tableBodyStyles = { fontSize: 9, cellPadding: 2, overflow: 'linebreak' as const };
    const tableSubtotalStyles = { fontStyle: 'bold' as const, fillColor: [230, 230, 230] as [number,number,number], textColor: [0,0,0] as [number,number,number] };
    const tableTotalStyles = { fontStyle: 'bold' as const, fontSize: 11, fillColor: [240,240,240] as [number,number,number], textColor: [0,0,0] as [number,number,number] };

    const basicPayAmountForPayslip = record.dynamicGrossEarnings[DEFAULT_BASIC_PAY_ID] || 0;
    const basicPayTypeForPayslip = paymentTypesForPayslip.find(pt => pt.id === DEFAULT_BASIC_PAY_ID);
    const earningsData: any[][] = [[(basicPayTypeForPayslip?.name || "Basic Pay"), formatAmountForDisplay(basicPayAmountForPayslip)]];

    const allowancePaymentTypesForPayslip = paymentTypesForPayslip
        .filter(pt => pt.id !== DEFAULT_BASIC_PAY_ID && (record.dynamicGrossEarnings[pt.id] || 0) > 0)
        .sort((a,b) => a.order - b.order);

    const subtotalAllowancesForPayslip = allowancePaymentTypesForPayslip.reduce(
        (sum, pt) => sum + (record.dynamicGrossEarnings[pt.id] || 0), 0
    );

    if (allowancePaymentTypesForPayslip.length > 0) {
        earningsData.push([{content: "Allowances", colSpan: 2, styles: { fontStyle: 'bold' as const, textColor: [100,100,100]}}]);
        allowancePaymentTypesForPayslip.forEach(pt => {
            earningsData.push([ {content: pt.name, styles: {cellPadding: {left: 15}}}, formatAmountForDisplay(record.dynamicGrossEarnings[pt.id] || 0) ]);
        });
        earningsData.push([ {content: "Subtotal: Allowances", styles: {...tableSubtotalStyles, cellPadding: {left: 15}}}, {content: formatAmountForDisplay(subtotalAllowancesForPayslip), styles: tableSubtotalStyles} ]);
    }

    earningsData.push( [{content: "Total Gross Salary", styles: {...tableSubtotalStyles, fontStyle: 'bold' as const, fontSize: 10, fillColor: [220, 220, 220]}}, {content: formatAmountForDisplay(record.grossSalary || 0), styles: {...tableSubtotalStyles, fontStyle: 'bold' as const, fontSize: 10, fillColor: [220, 220, 220]}}] );
    (doc as any).autoTable({ startY: currentY, head: [['Earnings', 'Amount']], body: earningsData, theme: 'striped', headStyles: tableHeadStylesWithRightAlignNumeric, bodyStyles: tableBodyStyles, columnStyles: tableColumnStyles, margin: { left: margin, right: margin }, didDrawPage: (data: any) => { currentY = data.cursor.y; } }); currentY = (doc as any).lastAutoTable.finalY + 10;

    const totalStatutoryDeductions = (record.paye || 0) + (record.employeePension || 0) + (record.employeeMaternity || 0) + (record.employeeRama || 0) + (record.cbhiDeduction || 0);
    const statutoryDeductionsData: any[][] = [];
    if (record.paye > 0) statutoryDeductionsData.push(["PAYE", formatAmountForDisplay(record.paye || 0)]);
    if (record.employeePension > 0) statutoryDeductionsData.push(["Pension (Employee)", formatAmountForDisplay(record.employeePension || 0)]);
    if (record.employeeMaternity > 0) statutoryDeductionsData.push(["Maternity (Employee)", formatAmountForDisplay(record.employeeMaternity || 0)]);
    if (record.employeeRama > 0) statutoryDeductionsData.push(["RAMA (Employee)", formatAmountForDisplay(record.employeeRama || 0)]);
    if (record.cbhiDeduction > 0) statutoryDeductionsData.push(["CBHI", formatAmountForDisplay(record.cbhiDeduction || 0)]);
    
    if (statutoryDeductionsData.length > 0) {
        statutoryDeductionsData.push([{content: "Subtotal: Statutory Deductions", styles: {...tableSubtotalStyles}}, {content: formatAmountForDisplay(totalStatutoryDeductions), styles: tableSubtotalStyles}]);
        (doc as any).autoTable({ startY: currentY, head: [['Statutory Deductions', 'Amount']], body: statutoryDeductionsData, theme: 'striped', headStyles: tableHeadStylesWithRightAlignNumeric, bodyStyles: tableBodyStyles, columnStyles: tableColumnStyles, margin: { left: margin, right: margin }, didDrawPage: (data: any) => { currentY = data.cursor.y; } }); 
        currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    const sortedDeductionTypesToDisplayOnPayslip = [...deductionTypesForPayslip].sort((a,b) => a.order - b.order).filter(dt => (record.appliedDeductionAmounts[dt.id] || 0) > 0); 
    const totalOtherDeductionsOnPayslip = sortedDeductionTypesToDisplayOnPayslip.reduce((sum, dt) => sum + (record.appliedDeductionAmounts[dt.id] || 0), 0);
    
    if (sortedDeductionTypesToDisplayOnPayslip.length > 0 ) { 
        const otherDeductionsData = sortedDeductionTypesToDisplayOnPayslip.map(dt => ([dt.name, formatAmountForDisplay(record.appliedDeductionAmounts[dt.id] || 0)])); 
        otherDeductionsData.push([{content: "Subtotal: Other Deductions", styles: tableSubtotalStyles}, {content: formatAmountForDisplay(totalOtherDeductionsOnPayslip), styles: tableSubtotalStyles}]); 
        (doc as any).autoTable({ startY: currentY, head: [['Other Deductions', 'Amount']], body: otherDeductionsData, theme: 'striped', headStyles: tableHeadStylesWithRightAlignNumeric, bodyStyles: tableBodyStyles, columnStyles: tableColumnStyles, margin: { left: margin, right: margin }, didDrawPage: (data: any) => { currentY = data.cursor.y; } }); currentY = (doc as any).lastAutoTable.finalY + 10; }
    (doc as any).autoTable({ startY: currentY, body: [[ {content: "Net Pay (Take Home)", styles: {...tableTotalStyles, halign: 'left' as const, cellPadding: {top: 4, bottom: 4, left: 2}}}, {content: formatAmountForDisplay(record.finalNetPay || 0), styles: {...tableTotalStyles, halign: 'right' as const, cellPadding: {top: 4, bottom: 4, right: 2}}} ]], theme: 'plain', margin: { left: margin, right: margin }, didDrawPage: (data: any) => { currentY = data.cursor.y; }, }); currentY = (doc as any).lastAutoTable.finalY || currentY + 15;
    const footerY = doc.internal.pageSize.getHeight() - margin + 20; doc.line(margin, footerY - 15, pageWidth - margin, footerY - 15); doc.setFontSize(8).setFont(undefined, 'normal').setTextColor(150); doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, footerY); doc.setFont(undefined, 'italic'); doc.text(`Powered by Cheetah Payroll`, pageWidth - margin, footerY, { align: 'right' }); return doc;
  };

  const handleSelectAllStaffForPayslipPeriod = (checked: boolean) => { const sel: Record<string, boolean> = {}; if (checked) staffInSelectedRunForPayslip.forEach(s => sel[s.id] = true); setSelectedStaffForPayslipPeriodGeneration(sel); };
  const handleSelectStaffForPayslipPeriod = (id: string, checked: boolean) => setSelectedStaffForPayslipPeriodGeneration(p => ({ ...p, [id]: checked }));
  const handleSelectAllPeriodsForPayslipStaff = (checked: boolean) => { const sel: Record<string, boolean> = {}; if (checked) periodsForSelectedStaffPayslip.forEach(p => sel[p.id] = true); setSelectedPeriodsForPayslipStaffGeneration(sel); };
  const handleSelectPeriodForPayslipStaff = (id: string, checked: boolean) => setSelectedPeriodsForPayslipStaffGeneration(p => ({ ...p, [id]: checked }));
  const handleInitiatePayslipGeneration = async (items: { staffId: string, periodRunId: string }[]) => { setFeedback(null); if (items.length === 0) { setFeedback({type: 'error', message: "Error", details: "No items selected for payslip generation."}); return; } if (companyPaymentTypes.length === 0 && selectedCompanyId) { setFeedback({type: 'error', message: "Config Error", details: "No Payment Types defined for this company. Configure them in 'Payments' settings."}); return; } const newPayslips = await generatePayslipObjectsInternal(items); if (newPayslips.length > 0) { setPayslipsForPreviewDialog(newPayslips); setCurrentPayslipPreviewIndex(0); setIsPayslipPreviewDialogOpen(true); setFeedback({type: 'success', message: `${newPayslips.length} Payslip(s) Generated`}); } else { setFeedback({type: 'info', message: "No Payslips Generated", details: "This could be due to no staff found in the selected run(s) or other data issues."}); } setIsGeneratePayslipByPeriodDialogOpen(false); setIsGeneratePayslipByStaffDialogOpen(false); };
  const handleGeneratePayslipsByPeriod = () => { if (!selectedPayrollRunIdForPayslip || selectedPayrollRunIdForPayslip === PLACEHOLDER_PERIOD_VALUE) { setFeedback({type: 'error', message: "Error", details: "Select a period."}); return; } const staffToProcess = staffInSelectedRunForPayslip.filter(s => selectedStaffForPayslipPeriodGeneration[s.id]); const items = staffToProcess.map(staff => ({ staffId: staff.id, periodRunId: selectedPayrollRunIdForPayslip })); handleInitiatePayslipGeneration(items); };
  const handleGeneratePayslipsByStaff = () => { if (!selectedStaffIdForPayslip || selectedStaffIdForPayslip === PLACEHOLDER_STAFF_VALUE) { setFeedback({type: 'error', message: "Error", details: "Select a staff member."}); return; } const periodsToProcess = periodsForSelectedStaffPayslip.filter(p => selectedPeriodsForPayslipStaffGeneration[p.id]); const items = periodsToProcess.map(period => ({ staffId: selectedStaffIdForPayslip, periodRunId: period.id })); handleInitiatePayslipGeneration(items); };
  const handleDownloadSinglePayslipFromPreview = () => { setFeedback(null); if (payslipsForPreviewDialog.length === 0 || !payslipsForPreviewDialog[currentPayslipPreviewIndex]) return; const payslip = payslipsForPreviewDialog[currentPayslipPreviewIndex]; const companyNameForFile = sanitizeFilename(selectedCompanyName); const fileName = `${companyNameForFile}_payslip_${payslip.employeeName.replace(/\s+/g, "_")}_${payslip.period.replace(/\s+/g, "_")}.pdf`; const doc = generatePayslipPdfDocInternal(payslip, companyProfile, companyPaymentTypes, companyDeductionTypes); doc.save(fileName); setFeedback({type: 'success', message: "PDF Export Started"}); };
  const handleDownloadAllPreviewedPayslipsAsZip = async () => { setFeedback(null); if (payslipsForPreviewDialog.length === 0 || !selectedCompanyId) { setFeedback({type: 'info', message: "Error", details: "No payslips to export."}); return; } setIsGeneratingPayslips(true); const zip = new JSZip(); const companyNameForFile = sanitizeFilename(selectedCompanyName); for (const payslip of payslipsForPreviewDialog) { const doc = generatePayslipPdfDocInternal(payslip, companyProfile, companyPaymentTypes, companyDeductionTypes); const pdfBlob = doc.output('blob'); const fileName = `${payslip.employeeName.replace(/\s+/g, "_")}_Payslip_${payslip.period.replace(/\s+/g, "_")}.pdf`; zip.file(fileName, pdfBlob); } try { const zipBlob = await zip.generateAsync({ type: "blob" }); const link = document.createElement('a'); const url = URL.createObjectURL(zipBlob); link.setAttribute('href', url); link.setAttribute('download', `${companyNameForFile}_payslips_export.zip`); document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); setFeedback({type: 'success', message: `ZIP Export of ${payslipsForPreviewDialog.length} payslip(s) Started`}); } catch (error) { console.error("Error generating ZIP:", error); setFeedback({type: 'error', message: "ZIP Generation Error", details: (error as Error).message}); } setIsGeneratingPayslips(false); };

  const handleOpenEmailDialog = () => {
    setFeedback(null);
    if (payslipsForPreviewDialog.length > 0) {
      const firstPayslip = payslipsForPreviewDialog[0];
      let defaultSubject = `Payslip for ${firstPayslip.period}`;

      const allSameStaff = payslipsForPreviewDialog.every(p => p.employeeId === firstPayslip.employeeId);

      if (allSameStaff && payslipsForPreviewDialog.length > 1) {
        const periods = payslipsForPreviewDialog.map(p => parse(p.period, 'MMMM yyyy', new Date())).sort(compareAsc);
        const startDate = periods[0];
        const endDate = periods[periods.length - 1];
        if (startDate.getFullYear() === endDate.getFullYear()) {
          defaultSubject = `Pay Slips for ${format(startDate, 'MMM')} to ${format(endDate, 'MMM')} ${startDate.getFullYear()}`;
        } else {
          defaultSubject = `Pay Slips for ${format(startDate, 'MMM yyyy')} to ${format(endDate, 'MMM yyyy')}`;
        }
      }

      setEmailSubject(defaultSubject);
      setEmailBody(`Dear [Employee Name],\n\nPlease find attached your payslip(s).\n\nIf you have any questions, please contact HR.\n\nRegards,\nCheetah Payroll (${selectedCompanyName || 'Your Company'})`);
      setIsEmailPayslipsDialogOpen(true);
    } else {
      setFeedback({type: 'error', message: "Error", details: "No payslips generated to email."});
    }
  };

  const handleSendEmailsSimulated = async () => {
    setFeedback(null);
    if (payslipsForPreviewDialog.length === 0 || !selectedCompanyId) {
      setFeedback({type: 'error', message: "Error", details: "No payslips to email."});
      return;
    }
    console.log("Simulating email sending...");

    const allSameStaff = payslipsForPreviewDialog.every(p => p.employeeId === payslipsForPreviewDialog[0].employeeId);

    if (allSameStaff) {
      const staffId = payslipsForPreviewDialog[0].employeeId;
      const staffMember = allStaffMembers.find(s => s.id === staffId && s.companyId === selectedCompanyId);
      if (staffMember && staffMember.email) {
        const personalizedBody = emailBody.replace(/\[Employee Name\]/g, payslipsForPreviewDialog[0].employeeName);
        const attachmentsInfo = payslipsForPreviewDialog.map(p => `${p.employeeName}_Payslip_${p.period}.pdf`).join(', ');
        console.log(`-----\nTo: ${staffMember.email}\nSubject: ${emailSubject}\n\n${personalizedBody}\n(Attachments: ${attachmentsInfo})\n-----`);
      } else {
        console.warn(`Could not send email to ${payslipsForPreviewDialog[0].employeeName}. Email or staff record missing.`);
      }
    } else {
      for (const payslip of payslipsForPreviewDialog) {
        const staffMember = allStaffMembers.find(s => s.id === payslip.employeeId && s.companyId === selectedCompanyId);
        if (staffMember && staffMember.email) {
          const individualSubject = `Payslip for ${payslip.period}`;
          const personalizedBody = emailBody.replace(/\[Employee Name\]/g, payslip.employeeName).replace(/\[Period\]/g, payslip.period);
          console.log(`-----\nTo: ${staffMember.email}\nSubject: ${individualSubject}\n\n${personalizedBody}\n(Attachment: ${payslip.employeeName}_Payslip_${payslip.period}.pdf)\n-----`);
        } else {
          console.warn(`Could not send email to ${payslip.employeeName}. Email or staff record missing.`);
        }
      }
    }
    setFeedback({type: 'success', message: "Email Simulation Complete", details: `${payslipsForPreviewDialog.length} email(s) simulated. Check console.`});
    setIsEmailPayslipsDialogOpen(false);
  };

  const renderFeedbackMessage = () => {
    if (!feedback) return null;
    let IconComponent;
    let variant: "default" | "destructive" = "default";
    let additionalAlertClasses = "";

    switch (feedback.type) {
      case 'success':
        IconComponent = CheckCircle2;
        variant = "default";
        additionalAlertClasses = "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600 [&>svg]:text-green-600 dark:[&>svg]:text-green-400";
        break;
      case 'error':
        IconComponent = AlertTriangle;
        variant = "destructive";
        break;
      case 'info':
        IconComponent = Info;
        variant = "default";
        break;
      default:
        return null;
    }
    return (
      <Alert variant={variant} className={cn("my-4", additionalAlertClasses)}>
        <IconComponent className="h-4 w-4" />
        <AlertTitle>{feedback.message}</AlertTitle>
        {feedback.details && <AlertDescription>{feedback.details}</AlertDescription>}
      </Alert>
    );
  };


  if (isLoadingCompanyContext) { return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading company info...</div>; }
  if (!selectedCompanyId) { return (<div className="flex flex-col items-center justify-center h-64 text-center"><FileSpreadsheetIcon className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-xl font-semibold">No Company Selected</p><p className="text-muted-foreground">Select a company.</p><Button asChild className="mt-4"><Link href="/select-company">Go to Company Selection</Link></Button></div>); }
  if (isLoadingRuns) { return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading report data...</div>; }
  const currentPayslipForHtmlPreview = payslipsForPreviewDialog[currentPayslipPreviewIndex];
  const selectedStaffMemberForHistory = allStaffMembers.find(s => s.id === selectedStaffIdForDeductionReport && s.companyId === selectedCompanyId) || null;
  const selectedDeductionForHistory = allDeductionsData.find(d => d.id === selectedDeductionIdForReport && d.companyId === selectedCompanyId) || null;
  const currentStatutoryReportDataForPreview = generatedReportsData ? generatedReportsData[statutoryReportOrder[currentStatutoryReportIndex]] : null;
  const currentStatutoryReportTitleForPreview = generatedReportsData ? statutoryReportTypeLabels[statutoryReportOrder[currentStatutoryReportIndex]] : "";

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold tracking-tight font-headline flex items-center"><FileSpreadsheetIcon className="mr-3 h-8 w-8 text-primary" />Report Generation</h1><p className="text-muted-foreground mb-2">Generate statutory reports, payslips, and view deduction histories.</p></div>
      {renderFeedbackMessage()}
      <Tabs defaultValue="statutory">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
            <TabsTrigger value="statutory">Statutory Reports</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="deductionHistory">Deduction History</TabsTrigger>
        </TabsList>

        <TabsContent value="statutory">
            <Card><CardHeader><CardTitle className="flex items-center"><FileTextIcon className="mr-2 h-5 w-5 text-primary"/> Statutory Reports</CardTitle><CardDescription>Choose an approved payroll period to generate relevant tax and payment reports.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"><div className="space-y-2 md:col-span-2"><Label htmlFor="payrollPeriodStatutory">Payroll Period</Label><Select value={selectedPeriodIdForStatutory} onValueChange={(value) => { setSelectedPeriodIdForStatutory(value); setCurrentStatutoryReportIndex(0); if (value === PLACEHOLDER_PERIOD_VALUE) { setGeneratedReportsData(null); setFeedback(null); } }} disabled={isLoadingRuns || isGeneratingReports || !selectedCompanyId}><SelectTrigger id="payrollPeriodStatutory" className="w-full"><SelectValue placeholder="-- Select an approved period --" /></SelectTrigger><SelectContent><SelectItem value={PLACEHOLDER_PERIOD_VALUE}>-- Select an approved period --</SelectItem>{approvedRunsForStatutory.length > 0 ? (approvedRunsForStatutory.map(run => (<SelectItem key={run.id} value={run.id}>{run.month} {run.year} (ID: {run.id})</SelectItem>))) : (<SelectItem value="no-runs" disabled>No approved runs found.</SelectItem>)}</SelectContent></Select></div><Button onClick={handleGenerateReports} disabled={!selectedPeriodIdForStatutory || selectedPeriodIdForStatutory === PLACEHOLDER_PERIOD_VALUE || isGeneratingReports || isLoadingRuns || !selectedCompanyId || companyPaymentTypes.length === 0} className="w-full md:w-auto">{isGeneratingReports ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<FileSpreadsheetIcon className="mr-2 h-4 w-4" />)}Generate Reports</Button></div>{(!generatedReportsData && !isGeneratingReports && selectedPeriodIdForStatutory && selectedPeriodIdForStatutory !== PLACEHOLDER_PERIOD_VALUE) && (<CardContent className="p-6 text-center bg-muted/10 rounded-md border border-dashed mt-4"><AlertTriangle className="mx-auto h-12 w-12 text-primary/70 mb-3" /><p className="text-lg font-medium text-primary/90">Reports Ready to Generate</p>{companyPaymentTypes.length === 0 && selectedCompanyId ? (<p className="text-sm text-destructive">Payment Types not defined. Configure on 'Payments' page.</p>) : (<p className="text-muted-foreground">Click "Generate Reports" to process and open preview.</p>)}</CardContent>)}{generatedReportsData && !isGeneratingReports && (<div className="mt-4 text-center md:text-left"><Button variant="outline" onClick={() => setIsStatutoryReportPreviewDialogOpen(true)} disabled={!generatedReportsData}><Eye className="mr-2 h-4 w-4"/> Re-open Statutory Report Preview</Button></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="payslips">
            <Card><CardHeader><CardTitle className="flex items-center"><FileTextIcon className="mr-2 h-5 w-5 text-primary"/>Payslips</CardTitle><CardDescription>Generate individual payslips for approved payroll periods.</CardDescription></CardHeader><CardContent className="flex flex-col sm:flex-row gap-4"><Dialog open={isGeneratePayslipByPeriodDialogOpen} onOpenChange={(isOpen) => { setIsGeneratePayslipByPeriodDialogOpen(isOpen); if (!isOpen) setFeedback(null); }}><DialogTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={isGeneratingPayslips || !selectedCompanyId || companyPaymentTypes.length === 0}><CalendarDays className="mr-2 h-4 w-4" /> Generate by Period</Button></DialogTrigger><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Generate Payslips by Period</DialogTitle><DialogDescription>Select an approved payroll period, then choose staff.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="payslipPayrollPeriodSelect">Approved Payroll Period</Label><Select value={selectedPayrollRunIdForPayslip} onValueChange={(value) => setSelectedPayrollRunIdForPayslip(value)} disabled={isGeneratingPayslips}><SelectTrigger id="payslipPayrollPeriodSelect"><SelectValue placeholder="-- Select period --" /></SelectTrigger><SelectContent><SelectItem value={PLACEHOLDER_PERIOD_VALUE}>-- Select period --</SelectItem>{approvedRunsForPayslips.map(r => (<SelectItem key={r.id} value={r.id}>{r.month} {r.year} (ID: {r.id})</SelectItem>))}</SelectContent></Select></div>{selectedPayrollRunIdForPayslip && selectedPayrollRunIdForPayslip !== PLACEHOLDER_PERIOD_VALUE && staffInSelectedRunForPayslip.length > 0 && (<div className="space-y-2"><Label>Select Staff ({staffInSelectedRunForPayslip.filter(s => selectedStaffForPayslipPeriodGeneration[s.id]).length}/{staffInSelectedRunForPayslip.length} selected)</Label><div className="flex items-center space-x-2 mb-2"><Checkbox id="selectAllStaffPayslipPeriod" checked={staffInSelectedRunForPayslip.length > 0 && staffInSelectedRunForPayslip.every(s => selectedStaffForPayslipPeriodGeneration[s.id])} onCheckedChange={(c) => handleSelectAllStaffForPayslipPeriod(Boolean(c))} disabled={isGeneratingPayslips}/><Label htmlFor="selectAllStaffPayslipPeriod" className="font-normal text-sm">Select/Deselect All</Label></div><ScrollArea className="h-60 rounded-md border p-2">{staffInSelectedRunForPayslip.map(s => (<div key={s.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-sm"><Checkbox id={`staff-payslip-period-${s.id}`} checked={!!selectedStaffForPayslipPeriodGeneration[s.id]} onCheckedChange={(c) => handleSelectStaffForPayslipPeriod(s.id, Boolean(c))} disabled={isGeneratingPayslips}/><Label htmlFor={`staff-payslip-period-${s.id}`} className="font-normal">{s.name}</Label></div>))}</ScrollArea></div>)}{selectedPayrollRunIdForPayslip && selectedPayrollRunIdForPayslip !== PLACEHOLDER_PERIOD_VALUE && staffInSelectedRunForPayslip.length === 0 && !isGeneratingPayslips && (<p className="text-sm text-muted-foreground text-center py-4">No staff in selected period.</p>)}{isGeneratingPayslips && selectedPayrollRunIdForPayslip && selectedPayrollRunIdForPayslip !== PLACEHOLDER_PERIOD_VALUE && (<Loader2 className="mx-auto h-6 w-6 animate-spin text-primary my-4"/>)}</div><DialogFooter className="border-t pt-4"><Button variant="outline" onClick={()=>{setIsGeneratePayslipByPeriodDialogOpen(false); setFeedback(null);}} disabled={isGeneratingPayslips}>Cancel</Button><Button onClick={handleGeneratePayslipsByPeriod} disabled={!selectedPayrollRunIdForPayslip || selectedPayrollRunIdForPayslip === PLACEHOLDER_PERIOD_VALUE || staffInSelectedRunForPayslip.filter(s=>selectedStaffForPayslipPeriodGeneration[s.id]).length === 0 || isGeneratingPayslips || companyPaymentTypes.length === 0}>{isGeneratingPayslips ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Generate Payslips</Button></DialogFooter></DialogContent></Dialog><Dialog open={isGeneratePayslipByStaffDialogOpen} onOpenChange={(isOpen) => { setIsGeneratePayslipByStaffDialogOpen(isOpen); if (!isOpen) setFeedback(null); }}><DialogTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={isGeneratingPayslips || isLoadingPeriodsForStaff || !selectedCompanyId || companyPaymentTypes.length === 0}>{isLoadingPeriodsForStaff ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Users className="mr-2 h-4 w-4" />}Generate by Staff</Button></DialogTrigger><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Generate Payslips by Staff</DialogTitle><DialogDescription>Select a staff member, then choose approved payroll periods.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="payslipStaffSelect">Staff Member</Label><Select value={selectedStaffIdForPayslip} onValueChange={(value) => setSelectedStaffIdForPayslip(value)} disabled={isGeneratingPayslips || isLoadingPeriodsForStaff}><SelectTrigger id="payslipStaffSelect"><SelectValue placeholder="-- Select staff --" /></SelectTrigger><SelectContent><SelectItem value={PLACEHOLDER_STAFF_VALUE}>-- Select staff --</SelectItem>{allStaffMembers.map(s => (<SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.id})</SelectItem>))}</SelectContent></Select></div>{isLoadingPeriodsForStaff && selectedStaffIdForPayslip && selectedStaffIdForPayslip !== PLACEHOLDER_STAFF_VALUE && (<div className="flex justify-center items-center py-4"><Loader2 className="mr-2 h-6 w-6 animate-spin text-primary"/> <p>Loading periods...</p></div>)}{!isLoadingPeriodsForStaff && selectedStaffIdForPayslip && selectedStaffIdForPayslip !== PLACEHOLDER_STAFF_VALUE && periodsForSelectedStaffPayslip.length > 0 && (<div className="space-y-2"><Label>Select Approved Periods ({periodsForSelectedStaffPayslip.filter(p=>selectedPeriodsForPayslipStaffGeneration[p.id]).length}/{periodsForSelectedStaffPayslip.length} selected)</Label><div className="flex items-center space-x-2 mb-2"><Checkbox id="selectAllPeriodsPayslipStaff" checked={periodsForSelectedStaffPayslip.length > 0 && periodsForSelectedStaffPayslip.every(p=>selectedPeriodsForPayslipStaffGeneration[p.id])} onCheckedChange={(c)=>handleSelectAllPeriodsForPayslipStaff(Boolean(c))} disabled={isGeneratingPayslips}/><Label htmlFor="selectAllPeriodsPayslipStaff" className="font-normal text-sm">Select/Deselect All</Label></div><ScrollArea className="h-60 rounded-md border p-2">{periodsForSelectedStaffPayslip.map(p => (<div key={p.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-sm"><Checkbox id={`period-payslip-staff-${p.id}`} checked={!!selectedPeriodsForPayslipStaffGeneration[p.id]} onCheckedChange={(c)=>handleSelectPeriodForPayslipStaff(p.id, Boolean(c))} disabled={isGeneratingPayslips}/><Label htmlFor={`period-payslip-staff-${p.id}`} className="font-normal">{p.month} {p.year}</Label></div>))}</ScrollArea></div>)}{!isLoadingPeriodsForStaff && selectedStaffIdForPayslip && selectedStaffIdForPayslip !== PLACEHOLDER_STAFF_VALUE && periodsForSelectedStaffPayslip.length === 0 && !isGeneratingPayslips && (<p className="text-sm text-muted-foreground text-center py-4">No approved runs for this staff.</p>)}</div><DialogFooter className="border-t pt-4"><Button variant="outline" onClick={()=>{setIsGeneratePayslipByStaffDialogOpen(false); setFeedback(null);}} disabled={isGeneratingPayslips || isLoadingPeriodsForStaff}>Cancel</Button><Button onClick={handleGeneratePayslipsByStaff} disabled={isLoadingPeriodsForStaff || !selectedStaffIdForPayslip || selectedStaffIdForPayslip === PLACEHOLDER_STAFF_VALUE || periodsForSelectedStaffPayslip.filter(p=>selectedPeriodsForPayslipStaffGeneration[p.id]).length === 0 || isGeneratingPayslips || companyPaymentTypes.length === 0}>{isGeneratingPayslips ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Generate Payslips</Button></DialogFooter></DialogContent></Dialog></CardContent>{payslipsForPreviewDialog.length > 0 && !isGeneratingPayslips && (<CardContent className="mt-0 pt-0 text-center md:text-left"><Button variant="outline" onClick={() => setIsPayslipPreviewDialogOpen(true)} disabled={payslipsForPreviewDialog.length === 0}><Eye className="mr-2 h-4 w-4"/> Re-open Payslip Preview ({payslipsForPreviewDialog.length} generated)</Button></CardContent>)}</Card>
        </TabsContent>

        <TabsContent value="deductionHistory">
             <Card><CardHeader><CardTitle className="flex items-center"><History className="mr-2 h-5 w-5 text-primary"/>Deduction History</CardTitle><CardDescription>Select a staff member and their specific deduction to view its payment history.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                    <Label htmlFor="staffForDeductionReport">Staff Member</Label>
                    <Select value={selectedStaffIdForDeductionReport} onValueChange={(value) => { setSelectedStaffIdForDeductionReport(value); if (value === PLACEHOLDER_STAFF_VALUE) { setStaffDeductionsForSelection([]); setSelectedDeductionIdForReport(PLACEHOLDER_DEDUCTION_VALUE); setDeductionHistoryReportData(null); setFeedback(null); } }} disabled={isLoadingRuns || isGeneratingDeductionHistory || !selectedCompanyId}>
                        <SelectTrigger id="staffForDeductionReport"><SelectValue placeholder="-- Select staff --"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={PLACEHOLDER_STAFF_VALUE}>-- Select staff --</SelectItem>
                            {staffWithDeductions.length > 0 ? (
                                staffWithDeductions.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.id})</SelectItem>)
                            ) : (
                                <SelectItem value="no-staff-with-deductions" disabled>No staff with deductions found.</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="deductionForReport">Deduction Item</Label>
                    <Select value={selectedDeductionIdForReport} onValueChange={(value) => { setSelectedDeductionIdForReport(value); if (value === PLACEHOLDER_DEDUCTION_VALUE) { setDeductionHistoryReportData(null); setFeedback(null); } }} disabled={!selectedStaffIdForDeductionReport || selectedStaffIdForDeductionReport === PLACEHOLDER_STAFF_VALUE || staffDeductionsForSelection.length === 0 || isGeneratingDeductionHistory || !selectedCompanyId}>
                        <SelectTrigger id="deductionForReport">
                            <SelectValue placeholder={staffDeductionsForSelection.length === 0 && selectedStaffIdForDeductionReport && selectedStaffIdForDeductionReport !== PLACEHOLDER_STAFF_VALUE ? "No deductions for staff" : "-- Select deduction --"}/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={PLACEHOLDER_DEDUCTION_VALUE}>-- Select deduction --</SelectItem>
                            {staffDeductionsForSelection.map(d => <SelectItem key={d.id} value={d.id}>{d.description} (Bal: {formatAmountForDisplay(d.balance)})</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleGenerateDeductionHistoryReport} disabled={!selectedDeductionIdForReport || selectedDeductionIdForReport === PLACEHOLDER_DEDUCTION_VALUE || isGeneratingDeductionHistory || !selectedCompanyId} className="w-full md:w-auto">{isGeneratingDeductionHistory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}Generate History</Button>
                </div>{!deductionHistoryReportData && !isGeneratingDeductionHistory && selectedDeductionIdForReport && selectedDeductionIdForReport !== PLACEHOLDER_DEDUCTION_VALUE && (<CardContent className="p-6 text-center bg-muted/10 rounded-md border border-dashed mt-4"><History className="mx-auto h-10 w-10 text-muted-foreground mb-3" /><p className="text-lg font-medium">Deduction History Ready to Generate</p><p className="text-muted-foreground">Click "Generate History" to process and open preview.</p></CardContent>)}{deductionHistoryReportData && !isGeneratingDeductionHistory && (<div className="mt-4 text-center md:text-left"><Button variant="outline" onClick={() => setIsDeductionHistoryPreviewDialogOpen(true)} disabled={!deductionHistoryReportData}><Eye className="mr-2 h-4 w-4"/> Re-open Deduction History Preview</Button></div>)}</CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isStatutoryReportPreviewDialogOpen} onOpenChange={(isOpen) => { setIsStatutoryReportPreviewDialogOpen(isOpen); if (!isOpen) setFeedback(null); }}><DialogContent className="sm:max-w-xl md:max-w-3xl lg:max-w-6xl xl:max-w-7xl flex flex-col h-[90vh]"><DialogHeader><DialogTitle>Statutory Report Preview: {currentStatutoryReportTitleForPreview} ({currentStatutoryReportIndex + 1} of {statutoryReportOrder.length})</DialogTitle><DialogDescription>Review the generated data.</DialogDescription></DialogHeader><div className="flex-grow my-2 border rounded-md overflow-auto min-w-0">{currentStatutoryReportDataForPreview ? (<HtmlStatutoryReportPreview reportData={currentStatutoryReportDataForPreview} reportTitle={currentStatutoryReportTitleForPreview} companyProfile={companyProfile} selectedPeriodId={selectedPeriodIdForStatutory} approvedRuns={approvedRunsForStatutory}/>) : (<p className="text-center text-muted-foreground p-4">No data to display.</p>)}</div>
        <DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2 justify-between">
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStatutoryReportIndex(prev => Math.max(0, prev - 1))} disabled={currentStatutoryReportIndex === 0 || isGeneratingReports}><ChevronLeft className="mr-2 h-4 w-4"/>Previous</Button>
                <Button variant="outline" onClick={() => setCurrentStatutoryReportIndex(prev => Math.min(statutoryReportOrder.length - 1, prev + 1))} disabled={currentStatutoryReportIndex === statutoryReportOrder.length - 1 || isGeneratingReports}>Next<ChevronRight className="ml-2 h-4 w-4"/></Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto" disabled={isGeneratingReports || !generatedReportsData || !currentStatutoryReportDataForPreview || currentStatutoryReportDataForPreview.length === 0}>
                            Export Current
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownloadSingleStatutoryReport('csv')}><FileTextIcon className="mr-2 h-4 w-4" /> Export as CSV</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadSingleStatutoryReport('xlsx')}><FileSpreadsheetIcon className="mr-2 h-4 w-4" /> Export as XLSX</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto" disabled={isGeneratingReports || !generatedReportsData}>
                            Export All (ZIP)
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownloadAllStatutory('csv')}><FileTextIcon className="mr-2 h-4 w-4" /> Export as CSV (ZIP)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadAllStatutory('xlsx')}><FileSpreadsheetIcon className="mr-2 h-4 w-4" /> Export as XLSX (ZIP)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </DialogFooter>
      </DialogContent></Dialog>
      <Dialog open={isDeductionHistoryPreviewDialogOpen} onOpenChange={(isOpen) => { setIsDeductionHistoryPreviewDialogOpen(isOpen); if (!isOpen) setFeedback(null); }}><DialogContent className="sm:max-w-3xl flex flex-col h-[90vh]"><DialogHeader><DialogTitle>Deduction History Preview</DialogTitle><DialogDescription>Viewing history for: {selectedDeductionForHistory?.description} - {selectedStaffMemberForHistory?.firstName} {selectedStaffMemberForHistory?.lastName}.</DialogDescription></DialogHeader><div className="flex-grow my-2 border rounded-md overflow-auto">{deductionHistoryReportData && selectedStaffMemberForHistory && selectedDeductionForHistory ? (<HtmlDeductionHistoryPreview deductionHistoryData={deductionHistoryReportData} staffMember={selectedStaffMemberForHistory} deduction={selectedDeductionForHistory} companyProfile={companyProfile}/>) : (<p className="text-center text-muted-foreground p-4">No history to display.</p>)}</div><DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2 justify-end"><Button onClick={() => downloadDeductionHistory("pdf")} disabled={isGeneratingDeductionHistory || !deductionHistoryReportData} className="w-full sm:w-auto"><FileTypePdfIcon className="mr-2 h-4 w-4" /> Export as PDF</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isPayslipPreviewDialogOpen} onOpenChange={(isOpen) => { setIsPayslipPreviewDialogOpen(isOpen); if (!isOpen) setFeedback(null); }}><DialogContent className="sm:max-w-3xl flex flex-col h-[90vh]"><DialogHeader><DialogTitle>Payslip Preview ({currentPayslipPreviewIndex + 1} of {payslipsForPreviewDialog.length})</DialogTitle><DialogDescription>Viewing payslip for: {currentPayslipForHtmlPreview?.employeeName} - {currentPayslipForHtmlPreview?.period}.</DialogDescription></DialogHeader><div className="flex-grow my-2 border rounded-md overflow-auto">{currentPayslipForHtmlPreview ? (<HtmlPayslipPreview payslipData={currentPayslipForHtmlPreview} companyProfile={companyProfile} companyPaymentTypes={companyPaymentTypes} companyDeductionTypes={companyDeductionTypes}/>) : (<p className="text-center text-muted-foreground p-4">No payslip selected.</p>)}</div><DialogFooter className="border-t pt-4 flex flex-col sm:flex-row gap-2 justify-between items-center"><div className="flex gap-2">{payslipsForPreviewDialog.length > 1 && (<><Button variant="outline" onClick={() => setCurrentPayslipPreviewIndex(prev => Math.max(0, prev - 1))} disabled={currentPayslipPreviewIndex === 0 || isGeneratingPayslips}><ChevronLeft className="mr-2 h-4 w-4"/>Previous</Button><Button variant="outline" onClick={() => setCurrentPayslipPreviewIndex(prev => Math.min(payslipsForPreviewDialog.length - 1, prev + 1))} disabled={currentPayslipPreviewIndex === payslipsForPreviewDialog.length - 1 || isGeneratingPayslips}>Next<ChevronRight className="ml-2 h-4 w-4"/></Button></>)}</div><div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0"><Button onClick={handleDownloadSinglePayslipFromPreview} className="w-full sm:w-auto" disabled={!currentPayslipForHtmlPreview || isGeneratingPayslips}>{isGeneratingPayslips && !currentPayslipForHtmlPreview ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileTypePdfIcon className="mr-2 h-4 w-4"/>} Export as PDF</Button><Button onClick={handleDownloadAllPreviewedPayslipsAsZip} className="w-full sm:w-auto" disabled={payslipsForPreviewDialog.length === 0 || isGeneratingPayslips}>{isGeneratingPayslips && payslipsForPreviewDialog.length > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileArchive className="mr-2 h-4 w-4"/>} Export All (ZIP)</Button><Button onClick={handleOpenEmailDialog} className="w-full sm:w-auto" disabled={payslipsForPreviewDialog.length === 0 || isGeneratingPayslips}><Mail className="mr-2 h-4 w-4"/> Send All by Email</Button></div></DialogFooter></DialogContent></Dialog>
      <Dialog open={isEmailPayslipsDialogOpen} onOpenChange={(isOpen) => { setIsEmailPayslipsDialogOpen(isOpen); if (!isOpen) setFeedback(null); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Email Payslips</DialogTitle><DialogDescription>Customize subject and body. Emails sent individually.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-1"><Label htmlFor="emailSubject">Subject</Label><Input id="emailSubject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}/></div><div className="space-y-1"><Label htmlFor="emailBody">Body</Label><Textarea id="emailBody" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={10} placeholder="Use [Employee Name] and [Period] as placeholders."/><p className="text-xs text-muted-foreground">Placeholders: `+"`[Employee Name]`"+`, `+"`[Period]`"+`.</p></div></div><DialogFooter><Button variant="outline" onClick={() => setIsEmailPayslipsDialogOpen(false)}>Cancel</Button><Button onClick={handleSendEmailsSimulated} disabled={isGeneratingPayslips}>{isGeneratingPayslips ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Send Emails (Simulated)</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
