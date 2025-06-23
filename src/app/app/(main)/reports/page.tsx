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
import { getSupabaseClient } from '@/lib/supabase';
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
    .sort((a, b) => a.orderNumber - b.orderNumber);

  const subtotalAllowances = allowancePaymentTypes.reduce(
    (sum, pt) => sum + (record.dynamicGrossEarnings[pt.id] || 0),
    0
  );

  const sortedDeductionTypesToDisplay = [...companyDeductionTypes].sort((a,b) => a.orderNumber - b.orderNumber)
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
        <div><strong>Staff Name:</strong> {staffMember?.first_name} {staffMember?.last_name}</div>
        <div><strong>Designation:</strong> {staffMember?.designation || 'N/A'}</div>        <div><strong>Staff No:</strong> {getStringIdentifier(staffMember?.staff_number || 'N/A')}</div>
        <div><strong>RSSB No:</strong> {getStringIdentifier(staffMember?.staff_rssb_number || 'N/A')}</div>
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
  const [isLoadingPayslipStaff, setIsLoadingPayslipStaff] = useState(false);
  const [isLoadingPayslipPeriods, setIsLoadingPayslipPeriods] = useState(false);
  const [isEmailPayslipsDialogOpen, setIsEmailPayslipsDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState(""); const [emailBody, setEmailBody] = useState("");
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);


  useEffect(() => {
    const loadInitialData = async () => {
      if (isLoadingCompanyContext || !selectedCompanyId) {
        if (!isLoadingCompanyContext && !selectedCompanyId) {
          setApprovedRunsForStatutory([]);
          setApprovedRunsForPayslips([]);
          setAllStaffMembers([]);
          setAllDeductionsData([]);
          setCompanyPaymentTypes([]);
          setCompanyDeductionTypes([]);
          setCompanyProfile(null);
        }
        return;
      }
      setIsLoadingRuns(true);
      setFeedback(null);
      try {
        // Fetch payroll summaries
        const { data: summaries = [] } = await getSupabaseClient()
          .from('payroll_summaries')
          .select('*')
          .eq('companyId', selectedCompanyId);
        const approved = (summaries || []).filter((s: any) => s.status === 'Approved').sort((a: any, b: any) => b.year - a.year || Date.parse(`01 ${b.month} ${b.year}`) - Date.parse(`01 ${a.month} ${a.year}`));
        setApprovedRunsForStatutory(approved);
        setApprovedRunsForPayslips(approved as PayrollRunSummaryForPayslips[]);
        // Fetch staff
        const { data: staff = [] } = await getSupabaseClient()
          .from('staff')
          .select('*')
          .eq('companyId', selectedCompanyId);
        setAllStaffMembers(staff || []);
        // Fetch deductions
        const { data: deductions = [] } = await getSupabaseClient()
          .from('deductions')
          .select('*')
          .eq('companyId', selectedCompanyId);
        setAllDeductionsData(deductions || []);
        // Fetch payment types
        const { data: paymentTypes = [] } = await getSupabaseClient()
          .from('payment_types')
          .select('*')
          .eq('companyId', selectedCompanyId);
        setCompanyPaymentTypes((paymentTypes || []).sort((a: any, b: any) => a.order - b.order));
        // Fetch deduction types
        const { data: dedTypes = [] } = await getSupabaseClient()
          .from('deduction_types')
          .select('*')
          .eq('companyId', selectedCompanyId);
        setCompanyDeductionTypes((dedTypes || []).sort((a: any, b: any) => a.order - b.order));
        // Fetch company profile
        const { data: profileArr = [] } = await getSupabaseClient()
          .from('company_profile')
          .select('*')
          .eq('companyId', selectedCompanyId);
        const profile = profileArr && profileArr.length > 0 ? profileArr[0] : null;
        if (profile) profile.currency = 'RWF';
        setCompanyProfile(profile || null);
      } catch (error) {
        setFeedback({ type: 'error', message: 'Loading Error', details: `Could not load initial data. ${(error as Error).message}` });
      }
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
  useEffect(() => {
    const fetchStaffForSelectedRunPayslip = async () => {
      if (
        selectedPayrollRunIdForPayslip &&
        selectedPayrollRunIdForPayslip !== PLACEHOLDER_PERIOD_VALUE &&
        selectedCompanyId
      ) {
        setIsLoadingPayslipStaff(true);
        try {
          // Fetch payroll run detail from Supabase
          const { data: runDetail }: { data: any } = await getSupabaseClient()
            .from('payroll_run_details')
            .select('*')
            .eq('id', selectedPayrollRunIdForPayslip)
            .eq('companyId', selectedCompanyId)
            .single();
          if (!runDetail || !runDetail.employees) {
            setStaffInSelectedRunForPayslip([]);
          } else {
            setStaffInSelectedRunForPayslip(
              runDetail.employees.map((emp: any) => ({
                id: emp.employeeId,
                name: `${emp.firstName} ${emp.lastName}`,
              }))
            );
          }
        } catch (error) {
          setStaffInSelectedRunForPayslip([]);
        }
        setIsLoadingPayslipStaff(false);
      } else {
        setStaffInSelectedRunForPayslip([]);
        setSelectedStaffForPayslipPeriodGeneration({});
      }
    };
    fetchStaffForSelectedRunPayslip();
  }, [selectedPayrollRunIdForPayslip, selectedCompanyId]);

  const handleGenerateReports = async () => {
    // ...existing code...
  };

  return (
    <div className="p-4">
      {/* ...existing code... */}
    </div>
  );
}
