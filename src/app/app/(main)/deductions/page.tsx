
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Upload, Download, FileText, FileSpreadsheet, FileType, BadgeMinus, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Users, Settings, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StaffMember } from '@/lib/staffData';
import {
    getAllFromStore, putToStore, deleteFromStore, bulkPutToStore,
    STORE_NAMES
} from '@/lib/indexedDbUtils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useCompany } from '@/context/CompanyContext';
import Link from 'next/link';
import Papa from 'papaparse';
import { DeductionType, initialDeductionTypesForCompanySeed, exampleUserDefinedDeductionTypesForUmoja, exampleUserDefinedDeductionTypesForIsoko, DEFAULT_ADVANCE_DEDUCTION_TYPE_ID, DEFAULT_LOAN_DEDUCTION_TYPE_ID, DEFAULT_CHARGE_DEDUCTION_TYPE_ID } from '@/lib/deductionTypesData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { isValid as isValidDate, parseISO, format, parse } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export interface Deduction {
  id: string;
  companyId: string;
  staffId: string;
  staffName: string;
  deductionTypeId: string;
  deductionTypeName?: string;
  description: string;
  originalAmount: number;
  monthlyDeduction: number;
  deductedSoFar: number;
  balance: number;
  startDate: string;
}


const defaultDeductionFormData: Omit<Deduction, 'id' | 'companyId' | 'balance' | 'staffName' | 'deductionTypeName'> = {
  staffId: "", deductionTypeId: "", description: "", originalAmount: 0,
  monthlyDeduction: 0, deductedSoFar: 0, startDate: new Date().toISOString().split('T')[0],
};

const defaultNewDeductionTypeData: Omit<DeductionType, 'id' | 'companyId' | 'order' | 'isFixedName' | 'isDeletable'> = {
  name: "",
};

const formatNumberForTable = (amount?: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0";
  return Math.round(amount).toLocaleString('en-US');
};

const formatDateForDisplay = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
      const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
      if (isValidDate(parsedDate)) {
          return format(parsedDate, 'dd/MM/yyyy');
      }
      return 'N/A';
  } catch (e) {
      return 'N/A';
  }
};


const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];
const DT_ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

const sanitizeFilename = (name: string | null | undefined): string => {
    if (!name) return 'UnknownCompany';
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
};

type FeedbackMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
};

export default function DeductionsPage() {
  const { selectedCompanyId, selectedCompanyName, isLoadingCompanyContext } = useCompany();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [allDeductionsData, setAllDeductionsData] = useState<Deduction[]>([]);
  const [isDeductionDialogOpen, setIsDeductionDialogOpen] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(null);
  const [deductionFormData, setDeductionFormData] = useState(defaultDeductionFormData);
  const [isDeleteDialogForItemOpen, setIsDeleteDialogForItemOpen] = useState(false);
  const [deductionToDelete, setDeductionToDelete] = useState<Deduction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deductionTypesImportFileInputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [isDeductionTypeDialogOpen, setIsDeductionTypeDialogOpen] = useState(false);
  const [editingDeductionType, setEditingDeductionType] = useState<DeductionType | null>(null);
  const [deductionTypeFormData, setDeductionTypeFormData] = useState(defaultNewDeductionTypeData);
  const [isDeleteDeductionTypeDialogOpen, setIsDeleteDeductionTypeDialogOpen] = useState(false);
  const [deductionTypeToDelete, setDeductionTypeToDelete] = useState<DeductionType | null>(null);
  const [deductionTypeSearchTerm, setDeductionTypeSearchTerm] = useState("");
  const [dtCurrentPage, setDtCurrentPage] = useState(1);
  const [dtRowsPerPage, setDtRowsPerPage] = useState(DT_ROWS_PER_PAGE_OPTIONS[1]);
  const [selectedDeductionTypeItems, setSelectedDeductionTypeItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteDeductionTypesDialogOpen, setIsBulkDeleteDeductionTypesDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (isLoadingCompanyContext || !selectedCompanyId || typeof window === 'undefined') {
        if (!isLoadingCompanyContext && !selectedCompanyId) {
            setStaffList([]); setAllDeductionsData([]); setDeductionTypes([]); setIsLoaded(true);
        }
        return;
      }
      setIsLoaded(false);
      setFeedback(null);
      try {
        const staff = await getAllFromStore<StaffMember>(STORE_NAMES.STAFF, selectedCompanyId);
        setStaffList(staff);

        let companyDeductionTypes = await getAllFromStore<DeductionType>(STORE_NAMES.DEDUCTION_TYPES, selectedCompanyId);
        
        const coreTypeIds = [DEFAULT_ADVANCE_DEDUCTION_TYPE_ID, DEFAULT_CHARGE_DEDUCTION_TYPE_ID, DEFAULT_LOAN_DEDUCTION_TYPE_ID];
        const missingCoreTypes = coreTypeIds.filter(coreId => !companyDeductionTypes.some(dt => dt.id === coreId));
        if (missingCoreTypes.length > 0) {
            const typesToAdd = initialDeductionTypesForCompanySeed(selectedCompanyId).filter(coreType => missingCoreTypes.includes(coreType.id));
            for (const typeToAdd of typesToAdd) {
                await putToStore<DeductionType>(STORE_NAMES.DEDUCTION_TYPES, typeToAdd, selectedCompanyId);
                companyDeductionTypes.push(typeToAdd); 
            }
        }
        setDeductionTypes(companyDeductionTypes.sort((a, b) => a.order - b.order));


        const storedDeductions = await getAllFromStore<Deduction>(STORE_NAMES.DEDUCTIONS, selectedCompanyId);
        const syncedDeductions = storedDeductions.map(d => {
           const staffMember = staff.find(s => s.id === d.staffId && s.companyId === selectedCompanyId);
           const dedType = companyDeductionTypes.find(dt => dt.id === d.deductionTypeId); 
           return {
             ...d,
             staffName: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Unknown Staff",
             deductionTypeName: dedType ? dedType.name : "Unknown Type"
           };
        });
        setAllDeductionsData(syncedDeductions);

      } catch (error) {
        console.error("Error loading data from IndexedDB:", error);
        setStaffList([]); setAllDeductionsData([]); setDeductionTypes([]);
        setFeedback({type: 'error', message: 'Error loading data', details: (error as Error).message});
      }
      setIsLoaded(true);
    };
    loadData();
  }, [selectedCompanyId, isLoadingCompanyContext]);


  useEffect(() => {
    if (isDeductionDialogOpen) {
      if (editingDeduction) {
        const { balance, staffName, companyId, deductionTypeName, ...formDataFromEdit } = editingDeduction;
        setDeductionFormData(formDataFromEdit);
      } else {
        const defaultType = deductionTypes.find(dt => dt.id === DEFAULT_LOAN_DEDUCTION_TYPE_ID) || deductionTypes[0];
        setDeductionFormData({...defaultDeductionFormData, deductionTypeId: defaultType ? defaultType.id : "" });
      }
    }
  }, [isDeductionDialogOpen, editingDeduction, deductionTypes]);

  useEffect(() => {
    if (isDeductionTypeDialogOpen) {
      if (editingDeductionType) {
        setDeductionTypeFormData({ name: editingDeductionType.name });
      } else {
        setDeductionTypeFormData(defaultNewDeductionTypeData);
      }
    }
  }, [isDeductionTypeDialogOpen, editingDeductionType]);

  const filteredDeductionsSource = useMemo(() => allDeductionsData.filter(d =>
    d.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.deductionTypeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((d.balance || 0) > 0 ? "active" : "completed").includes(searchTerm.toLowerCase())
  ), [allDeductionsData, searchTerm]);

  const totalItems = filteredDeductionsSource.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedDeductions = filteredDeductionsSource.slice(startIndex, endIndex);

  const handleSelectRow = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => { const newSelected = new Set(prev); if (checked) newSelected.add(itemId); else newSelected.delete(itemId); return newSelected; });
  };
  const handleSelectAllOnPage = (checked: boolean) => {
    const pageItemIds = paginatedDeductions.map(item => item.id);
    if (checked) { setSelectedItems(prev => new Set([...prev, ...pageItemIds])); }
    else { const pageItemIdsSet = new Set(pageItemIds); setSelectedItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id)))); }
  };
  const isAllOnPageSelected = paginatedDeductions.length > 0 && paginatedDeductions.every(item => selectedItems.has(item.id));
  const resetSelectionAndPage = () => { setSelectedItems(new Set()); setCurrentPage(1); };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = (name === "originalAmount" || name === "monthlyDeduction" || name === "deductedSoFar") ? parseFloat(value.replace(/,/g, '')) : value;
    setDeductionFormData(prev => ({ ...prev, [name]: name.includes('Amount') || name.includes('SoFar') ? (isNaN(numValue as number) ? "" : numValue) : value }));
  };
  const handleSelectChange = (name: keyof typeof deductionFormData, value: string) => {
    setDeductionFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDeductionClick = () => { setFeedback(null); setEditingDeduction(null); setIsDeductionDialogOpen(true); };
  const handleEditDeductionClick = (deduction: Deduction) => { setFeedback(null); setEditingDeduction(deduction); setIsDeductionDialogOpen(true); };
  const handleDeleteSingleDeductionClick = (deduction: Deduction) => { setFeedback(null); setDeductionToDelete(deduction); setIsDeleteDialogForItemOpen(true); };

  const deleteDeductionsByIds = async (idsToDelete: string[]) => {
    setFeedback(null);
    if (idsToDelete.length === 0 || !selectedCompanyId) return;
    try {
      for (const id of idsToDelete) { await deleteFromStore(STORE_NAMES.DEDUCTIONS, id, selectedCompanyId); }
      setAllDeductionsData(prev => prev.filter(d => !idsToDelete.includes(d.id)));
      setSelectedItems(prev => { const newSelected = new Set(prev); idsToDelete.forEach(id => newSelected.delete(id)); return newSelected; });
      setFeedback({type: 'success', message: `${idsToDelete.length} Deduction(s) Deleted`, details: `Successfully deleted ${idsToDelete.length} deduction(s).`});
      if (currentPage > 1 && paginatedDeductions.length === idsToDelete.length && filteredDeductionsSource.slice((currentPage - 2) * rowsPerPage, (currentPage - 1) * rowsPerPage).length > 0) { setCurrentPage(currentPage - 1); }
      else if (currentPage > 1 && paginatedDeductions.length === idsToDelete.length && filteredDeductionsSource.slice((currentPage-1)*rowsPerPage).length === 0){ setCurrentPage( Math.max(1, currentPage -1)); }
    } catch (error) { console.error("Error deleting deduction(s) from IndexedDB:", error); setFeedback({type: 'error', message: "Delete Failed", details: `Could not delete ${idsToDelete.length} deduction(s). ${(error as Error).message}`}); }
  };
  const confirmDeleteSingleDeduction = async () => { if (deductionToDelete) { await deleteDeductionsByIds([deductionToDelete.id]); } setIsDeleteDialogForItemOpen(false); setDeductionToDelete(null); };
  const handleOpenBulkDeleteDialog = () => { setFeedback(null); if (selectedItems.size === 0) { setFeedback({type: 'info', message: "No Selection", details: "Please select deductions to delete."}); return; } setIsBulkDeleteDialogOpen(true); };
  const confirmBulkDeleteDeductions = async () => { await deleteDeductionsByIds(Array.from(selectedItems)); setIsBulkDeleteDialogOpen(false); };

  const handleSaveDeduction = async () => {
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({ type: 'error', message: "Error", details: "No company selected." }); return; }
    if (!deductionFormData.staffId || !deductionFormData.deductionTypeId || !deductionFormData.description || (deductionFormData.originalAmount || 0) <= 0 || (deductionFormData.monthlyDeduction || 0) <= 0) {
      setFeedback({ type: 'error', message: "Validation Error", details: "Staff, Deduction Type, Description, Original Amount, and Monthly Deduction are required and must be valid." }); return;
    }
    const staffMember = staffList.find(s => s.id === deductionFormData.staffId && s.companyId === selectedCompanyId);
    if (!staffMember) { setFeedback({ type: 'error', message: "Error", details: "Selected staff member not found." }); return; }
    const deductionTypeInfo = deductionTypes.find(dt => dt.id === deductionFormData.deductionTypeId);
    if (!deductionTypeInfo) { setFeedback({ type: 'error', message: "Error", details: "Selected deduction type not found." }); return; }

    const calculatedBalance = (deductionFormData.originalAmount || 0) - (deductionFormData.deductedSoFar || 0);
    const staffFullName = `${staffMember.firstName} ${staffMember.lastName}`;

    try {
      if (editingDeduction) {
        const updatedDeduction: Deduction = {
            ...editingDeduction, ...deductionFormData, companyId: selectedCompanyId, balance: calculatedBalance,
            staffName: staffFullName, deductionTypeName: deductionTypeInfo.name
        };
        await putToStore<Deduction>(STORE_NAMES.DEDUCTIONS, updatedDeduction, selectedCompanyId);
        setAllDeductionsData(prev => prev.map(d => d.id === editingDeduction.id ? updatedDeduction : d));
        setFeedback({type: 'success', message: "Deduction Updated", details: `Deduction for ${staffFullName} has been updated.`});
      } else {
        const newDeduction: Deduction = {
            id: `DED_${Date.now()}_${selectedCompanyId.substring(3)}`,
            companyId: selectedCompanyId, ...deductionFormData,
            staffName: staffFullName, deductionTypeName: deductionTypeInfo.name, balance: calculatedBalance
        };
        await putToStore<Deduction>(STORE_NAMES.DEDUCTIONS, newDeduction, selectedCompanyId);
        setAllDeductionsData(prev => [newDeduction, ...prev].sort((a,b) => a.id.localeCompare(b.id)));
        setFeedback({type: 'success', message: "Deduction Added", details: `New deduction added for ${staffFullName}.`});
      }
      resetSelectionAndPage();
    } catch (error) { console.error("Error saving deduction to IndexedDB:", error); setFeedback({type: 'error', message: "Save Failed", details: `Could not save deduction. ${(error as Error).message}`}); }
    setIsDeductionDialogOpen(false);
  };

  const idLikeDeductionFieldsForExport = ['id', 'staffId', 'deductionTypeId'];
  const deductionColumnsForExport = [
    { key: 'id', label: 'ID', isIdLike: true }, { key: 'staffId', label: 'StaffID', isIdLike: true }, { key: 'staffName', label: 'StaffName' },
    { key: 'deductionTypeId', label: 'DeductionTypeID', isIdLike: true }, { key: 'deductionTypeName', label: 'DeductionTypeName' },
    { key: 'description', label: 'Description' }, { key: 'originalAmount', label: 'OriginalAmount' },
    { key: 'monthlyDeduction', label: 'MonthlyDeduction' }, { key: 'deductedSoFar', label: 'DeductedSoFar' },
    { key: 'startDate', label: 'StartDate' },
  ];

  const exportDeductionData = (fileType: "csv" | "xlsx" | "pdf") => {
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "No company selected for export."}); return; }
    if (allDeductionsData.length === 0) { setFeedback({type: 'info', message: "No Data", details: "There is no deduction data to export."}); return; }

    const dataToExport = allDeductionsData.map(row => {
      const rowStatus = (row.balance || 0) > 0 ? "Active" : "Completed";
      const exportRow: Record<string, string | number> = {};
      deductionColumnsForExport.forEach(col => {
        let value = row[col.key as keyof Deduction];
        if (col.isIdLike) {
            exportRow[col.label] = String(value || '');
        } else if (['originalAmount', 'monthlyDeduction', 'deductedSoFar'].includes(col.key)) {
            exportRow[col.label] = Math.round((value as number) || 0);
        } else if (col.key === 'startDate' && value && isValidDate(parse(value as string, 'yyyy-MM-dd', new Date()))) {
            exportRow[col.label] = format(parse(value as string, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy');
        }
         else {
            exportRow[col.label] = String(value || '');
        }
      });
      exportRow['Balance'] = Math.round(row.balance || 0);
      exportRow['Status'] = rowStatus;
      return exportRow;
    });
    const exportHeaders = [...deductionColumnsForExport.map(c => c.label), 'Balance', 'Status'];
    const companyNameForFile = sanitizeFilename(selectedCompanyName);
    const fileName = `${companyNameForFile}_deductions_export.${fileType}`;

    if (fileType === "csv") {
        const csvData = dataToExport.map(row => {
            const newRow: Record<string, string> = {};
            exportHeaders.forEach(header => {
                let cellValue = String(row[header] || (header === 'Balance' || header === 'OriginalAmount' || header === 'MonthlyDeduction' || header === 'DeductedSoFar' ? '0' : ''));
                const colDef = deductionColumnsForExport.find(c => c.label === header);
                if (colDef?.isIdLike && /^\d+$/.test(cellValue) && cellValue.length > 0) {
                    cellValue = `'${cellValue}`;
                }
                newRow[header] = cellValue;
            });
            return newRow;
        });
        const csvString = Papa.unparse(csvData, { header: true, columns: exportHeaders });
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a'); const url = URL.createObjectURL(blob);
        link.setAttribute('href', url); link.setAttribute('download', fileName);
        link.style.visibility = 'hidden'; document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "xlsx") {
        const xlsxData = dataToExport.map(row => {
            const newRow: Record<string, string|number>={};
            exportHeaders.forEach(h => { // Changed headers to exportHeaders
                const colDef = deductionColumnsForExport.find(c => c.label === h);
                if (colDef?.isIdLike) newRow[h] = String(row[h] || '');
                else newRow[h] = (typeof row[h] === 'number' ? row[h] : String(row[h] || ''));
            });
            return newRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(xlsxData, {header: exportHeaders, skipHeader: false}); // Changed headers to exportHeaders
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Deductions");
        XLSX.writeFile(workbook, fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") {
        const pdfData = dataToExport.map(row => exportHeaders.map(header => String(row[header] || '')));
        const doc = new jsPDF({ orientation: 'landscape' });
        (doc as any).autoTable({ head: [exportHeaders], body: pdfData, styles: { fontSize: 7 }, headStyles: { fillColor: [102, 126, 234] }, margin: { top: 10 }, });
        doc.save(fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    }
  };
  const handleDownloadDeductionTemplate = () => {
    setFeedback(null);
    const headers = ['ID', 'StaffID', 'DeductionTypeID', 'Description', 'OriginalAmount', 'MonthlyDeduction', 'DeductedSoFar', 'StartDate'];
    const csvString = headers.join(',') + '\n';
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'deductions_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback({type: 'info', message: "Template Downloaded", details: "Deductions import template. Dates should be in DD/MM/YYYY format. Tip: If a field contains commas (e.g., numbers like \"1,250,000\" or description like \"Loan, school fees\"), ensure the entire field is enclosed in double quotes. Use valid DeductionTypeIDs from 'Manage Deduction Types'."});
  };
  const handleImportClick = () => { setFeedback(null); if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "Please select a company before importing."}); return; } fileInputRef.current?.click(); };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "No company selected for import target."}); return; }
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const { data: rawData, errors: papaParseErrors } = results;
          const fileText = await file.text();
          if (rawData.length === 0 && papaParseErrors.length === 0 && file.size > 0 && !fileText.trim()) { setFeedback({type: 'info', message: "Import Note", details: "The CSV file appears to be empty or contains only headers."}); return; }
          if (papaParseErrors.length > 0 && rawData.length === 0) { setFeedback({type: 'error', message: "Import Failed", details: `Critical CSV parsing error: ${papaParseErrors[0].message}. No data processed.`}); return; }

          const validationSkippedLog: string[] = [];
          let newCount = 0; let updatedCount = 0;
          const itemsToBulkPut: Deduction[] = [];
          const currentDeductions = await getAllFromStore<Deduction>(STORE_NAMES.DEDUCTIONS, selectedCompanyId);
          const normalizedHeaderToKeyMap: Record<string, keyof Omit<Deduction, 'staffName' | 'deductionTypeName' | 'balance' | 'companyId'>> = {};
          deductionColumnsForExport.forEach(col => {
            if (col.key !== 'companyId' && col.key !== 'staffName' && col.key !== 'deductionTypeName' && col.key !== 'balance') {
              normalizedHeaderToKeyMap[col.label.toLowerCase().replace(/\s+/g, '')] = col.key as keyof Omit<Deduction, 'staffName' | 'deductionTypeName' | 'balance' | 'companyId'>;
            }
          });

          for (const [index, rawRowUntyped] of rawData.entries()) {
            const rawRow = rawRowUntyped as Record<string, string>;
            const originalLineNumber = index + 2;
            const deductionObject: Partial<Omit<Deduction, 'staffName' | 'deductionTypeName' | 'balance'>> = { companyId: selectedCompanyId };
            let rowParseError = false;

            for (const csvHeader in rawRow) {
              const normalizedCsvHeader = csvHeader.trim().toLowerCase().replace(/\s+/g, '');
              const deductionKey = normalizedHeaderToKeyMap[normalizedCsvHeader];
              if (deductionKey) {
                let value = String(rawRow[csvHeader] || '').trim();
                if (['originalAmount', 'monthlyDeduction', 'deductedSoFar'].includes(deductionKey)) {
                  (deductionObject as any)[deductionKey] = parseFloat(value.replace(/,/g, '')) || 0;
                } else if (deductionKey === 'startDate' && value) {
                    const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
                    if (isValidDate(parsedDate)) {
                         deductionObject.startDate = format(parsedDate, 'yyyy-MM-dd');
                    } else {
                        validationSkippedLog.push(`Row ${originalLineNumber}: Invalid StartDate format ('${value}'). Expected DD/MM/YYYY. Field cleared.`);
                        deductionObject.startDate = undefined; 
                        rowParseError = true;
                    }
                } else { (deductionObject as any)[deductionKey] = value; }
              }
            }
            
            const requiredFields: (keyof Omit<Deduction, 'staffName' | 'deductionTypeName' | 'balance'>)[] = ['id', 'staffId', 'deductionTypeId', 'description', 'originalAmount', 'monthlyDeduction', 'startDate'];
            const missingFields = requiredFields.filter(field => !(deductionObject as any)[field] || String((deductionObject as any)[field]).trim() === "");
            if (missingFields.length > 0) { validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Missing required field(s): ${missingFields.map(f => deductionColumnsForExport.find(c => c.key === f)?.label || f).join(', ')}.`); rowParseError = true; }
            const staffMember = staffList.find(s => s.id === deductionObject.staffId && s.companyId === selectedCompanyId);
            if (!staffMember && deductionObject.staffId) { validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Staff ID ${deductionObject.staffId} not found.`); rowParseError = true; }
            const deductionTypeInfo = deductionTypes.find(dt => dt.id === deductionObject.deductionTypeId && dt.companyId === selectedCompanyId);
            if (!deductionTypeInfo && deductionObject.deductionTypeId) { validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: DeductionTypeID ${deductionObject.deductionTypeId} not found.`); rowParseError = true; }

            if (!rowParseError && staffMember && deductionTypeInfo) {
              const importedDeduction = deductionObject as Omit<Deduction, 'staffName' | 'deductionTypeName' | 'balance'>;
              const fullImportedDeduction: Deduction = {
                  ...importedDeduction, companyId: selectedCompanyId,
                  staffName: `${staffMember.firstName} ${staffMember.lastName}`,
                  deductionTypeName: deductionTypeInfo.name,
                  balance: (importedDeduction.originalAmount || 0) - (importedDeduction.deductedSoFar || 0)
              };
              const existingIndex = currentDeductions.findIndex(d => d.id === fullImportedDeduction.id && d.companyId === selectedCompanyId);
              if (existingIndex > -1) { const existingDeduction = currentDeductions[existingIndex]; const hasChanges = Object.keys(fullImportedDeduction).some(key => (fullImportedDeduction as any)[key] !== undefined && (fullImportedDeduction as any)[key] !== (existingDeduction as any)[key]); if (hasChanges) { itemsToBulkPut.push(fullImportedDeduction); updatedCount++; }
              } else { itemsToBulkPut.push(fullImportedDeduction); newCount++; }
            }
          }

          if (itemsToBulkPut.length > 0) { await bulkPutToStore<Deduction>(STORE_NAMES.DEDUCTIONS, itemsToBulkPut, selectedCompanyId); }
          const updatedDeductionsList = await getAllFromStore<Deduction>(STORE_NAMES.DEDUCTIONS, selectedCompanyId);
          setAllDeductionsData(updatedDeductionsList.map(d => ({...d, staffName: staffList.find(s=>s.id===d.staffId)?.firstName + " " + staffList.find(s=>s.id===d.staffId)?.lastName || "Unknown", deductionTypeName: deductionTypes.find(dt=>dt.id===d.deductionTypeId)?.name || "Unknown"})).sort((a,b) => a.id.localeCompare(b.id)));

          let feedbackMessage = ""; let feedbackTitle = "Import Processed"; let feedbackType: FeedbackMessage['type'] = 'info';
          const totalPapaParseErrors = papaParseErrors.length; const totalValidationSkipped = validationSkippedLog.length;
          if (newCount > 0 || updatedCount > 0) { feedbackTitle = "Import Successful"; feedbackMessage = `${newCount} deductions added, ${updatedCount} updated.`; feedbackType = 'success';
          } else if (rawData.length === 0 && (totalPapaParseErrors > 0 || totalValidationSkipped > 0)) { feedbackTitle = "Import Failed"; feedbackMessage = `All ${rawData.length} data row(s) processed, but no valid deductions imported.`; feedbackType = 'error';
          } else if (rawData.length === 0 && (totalPapaParseErrors > 0 )) { feedbackTitle = "Import Failed"; feedbackMessage = `No data rows found or all rows had critical parsing errors.`; feedbackType = 'error';
          } else if (newCount === 0 && updatedCount === 0 && totalPapaParseErrors === 0 && totalValidationSkipped === 0 && rawData.length > 0) { feedbackTitle = "Import Note"; feedbackMessage = `CSV processed. ${rawData.length} data row(s) checked. No changes applied.`;
          } else { feedbackTitle = "Import Note"; feedbackMessage = "No changes applied. CSV might be empty or data identical."; }

          let details = "";
          if (totalPapaParseErrors > 0 || totalValidationSkipped > 0) { details += ` ${totalPapaParseErrors + totalValidationSkipped} row(s) had issues.`; if (totalPapaParseErrors > 0) details += ` ${totalPapaParseErrors} CSV parsing error(s).`; if (totalValidationSkipped > 0) details += ` ${totalValidationSkipped} validation error(s).`; if (validationSkippedLog.length > 0 || papaParseErrors.length > 0) { details += ` First error: ${papaParseErrors.length > 0 ? papaParseErrors[0].message : validationSkippedLog[0]}`; } }
          setFeedback({type: feedbackType, message: `${feedbackTitle}: ${feedbackMessage}`, details});
          resetSelectionAndPage();
          if (event.target) event.target.value = '';
        }
      });
    }
  };

  const displayableDeductionTypes = useMemo(() => {
    if (!deductionTypeSearchTerm) {
      return deductionTypes.sort((a, b) => a.order - b.order);
    }
    return deductionTypes.filter(dt =>
        dt.name.toLowerCase().includes(deductionTypeSearchTerm.toLowerCase()) ||
        dt.id.toLowerCase().includes(deductionTypeSearchTerm.toLowerCase())
    ).sort((a,b) => a.order - b.order);
  }, [deductionTypes, deductionTypeSearchTerm]);

  const dtTotalItems = displayableDeductionTypes.length;
  const dtTotalPages = Math.ceil(dtTotalItems / dtRowsPerPage) || 1;
  const dtStartIndex = (dtCurrentPage - 1) * dtRowsPerPage;
  const dtEndIndex = dtStartIndex + dtRowsPerPage;
  const paginatedDeductionTypes = displayableDeductionTypes.slice(dtStartIndex, dtEndIndex);
  const handleSelectDeductionTypeRow = (itemId: string, checked: boolean) => { setSelectedDeductionTypeItems(prev => { const newSelected = new Set(prev); if (checked) newSelected.add(itemId); else newSelected.delete(itemId); return newSelected; }); };
  const handleSelectAllDeductionTypesOnPage = (checked: boolean) => { const pageItemIds = paginatedDeductionTypes.map(item => item.id); if (checked) { setSelectedDeductionTypeItems(prev => new Set([...prev, ...pageItemIds])); } else { const pageItemIdsSet = new Set(pageItemIds); setSelectedDeductionTypeItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id)))); } };
  const isAllDeductionTypesOnPageSelected = paginatedDeductionTypes.length > 0 && paginatedDeductionTypes.every(item => selectedDeductionTypeItems.has(item.id));


  const handleDeductionTypeFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeductionTypeFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleAddDeductionTypeClick = () => { setFeedback(null); setEditingDeductionType(null); setIsDeductionTypeDialogOpen(true); };
  const handleEditDeductionTypeClick = (type: DeductionType) => { setFeedback(null); setEditingDeductionType(type); setIsDeductionTypeDialogOpen(true); };
  const handleDeleteDeductionTypeClick = (type: DeductionType) => {
    setFeedback(null);
    if (type.isDeletable) {
        const isUsed = allDeductionsData.some(ded => ded.deductionTypeId === type.id);
        if (isUsed) {
            setFeedback({type: 'error', message: "Deletion Blocked", details: `Deduction type "${type.name}" is currently assigned to one or more staff deductions. Please reassign or remove these deductions before deleting the type.`});
            return;
        }
        setDeductionTypeToDelete(type); setIsDeleteDeductionTypeDialogOpen(true);
    } else {
        setFeedback({type: 'info', message: "Action Denied", details: `"${type.name}" is a core deduction type and cannot be deleted.`});
    }
  };

  const confirmDeleteDeductionType = async () => { if (deductionTypeToDelete) { await deleteDeductionTypesByIds([deductionTypeToDelete.id]); } setIsDeleteDeductionTypeDialogOpen(false); setDeductionTypeToDelete(null); };
  const handleOpenBulkDeleteDeductionTypesDialog = () => { setFeedback(null); if (selectedDeductionTypeItems.size === 0) { setFeedback({type: 'info', message: "No Selection", details: "Please select deduction types to delete."}); return; } setIsBulkDeleteDeductionTypesDialogOpen(true); };
  const confirmBulkDeleteDeductionTypes = async () => { await deleteDeductionTypesByIds(Array.from(selectedDeductionTypeItems)); setIsBulkDeleteDeductionTypesDialogOpen(false); };

  const deleteDeductionTypesByIds = async (idsToDelete: string[]) => {
    setFeedback(null);
    if (!selectedCompanyId || idsToDelete.length === 0) return;

    const deletableTypeNames: string[] = [];
    const skippedNonDeletable: string[] = [];
    const skippedInUse: string[] = [];
    const actualIdsToDeleteFromDB: string[] = [];

    for (const id of idsToDelete) {
        const type = deductionTypes.find(dt => dt.id === id);
        if (!type) continue;

        if (!type.isDeletable) {
            skippedNonDeletable.push(`"${type.name}" (Core Type)`);
            continue;
        }
        const isUsed = allDeductionsData.some(ded => ded.deductionTypeId === type.id);
        if (isUsed) {
            skippedInUse.push(`"${type.name}" (In Use)`);
            continue;
        }
        deletableTypeNames.push(`"${type.name}"`);
        actualIdsToDeleteFromDB.push(id);
    }

    let feedbackMessages: string[] = [];
    if (skippedNonDeletable.length > 0) feedbackMessages.push(`${skippedNonDeletable.length} core type(s) skipped.`);
    if (skippedInUse.length > 0) feedbackMessages.push(`${skippedInUse.length} type(s) in use skipped.`);

    if (actualIdsToDeleteFromDB.length > 0) {
        try {
            for (const id of actualIdsToDeleteFromDB) {
                await deleteFromStore(STORE_NAMES.DEDUCTION_TYPES, id, selectedCompanyId);
            }
            setDeductionTypes(prev => prev.filter(dt => !actualIdsToDeleteFromDB.includes(dt.id)).sort((a,b)=>a.order - b.order));
            setSelectedDeductionTypeItems(prev => {
                const newSelected = new Set(prev);
                actualIdsToDeleteFromDB.forEach(id => newSelected.delete(id));
                return newSelected;
            });

            if (dtCurrentPage > 1 && paginatedDeductionTypes.length === actualIdsToDeleteFromDB.filter(id => paginatedDeductionTypes.some(dt => dt.id === id)).length && displayableDeductionTypes.slice((dtCurrentPage - 2) * dtRowsPerPage, (dtCurrentPage - 1) * dtRowsPerPage).length > 0) { setDtCurrentPage(dtCurrentPage - 1); }
            else if (dtCurrentPage > 1 && paginatedDeductionTypes.length === actualIdsToDeleteFromDB.filter(id => paginatedDeductionTypes.some(dt => dt.id === id)).length && displayableDeductionTypes.slice((dtCurrentPage-1)*dtRowsPerPage).length === 0){ setDtCurrentPage( Math.max(1, dtCurrentPage -1)); }

            feedbackMessages.unshift(`Successfully deleted ${actualIdsToDeleteFromDB.length} deduction type(s).`);
            setFeedback({type: 'success', message: "Deletion Processed", details: feedbackMessages.join(' ')});
        } catch (error) {
            console.error("Error deleting deduction type(s):", error);
            setFeedback({type: 'error', message: "Delete Failed", details: `Could not delete ${actualIdsToDeleteFromDB.length} deduction type(s). ${(error as Error).message}`});
        }
    } else if (feedbackMessages.length > 0) {
        setFeedback({type: 'info', message: "No Deletions Performed", details: feedbackMessages.join(' ')});
    }
  };

  const handleSaveDeductionType = async () => {
    setFeedback(null);
    if (!selectedCompanyId || !deductionTypeFormData.name.trim()) {
      setFeedback({type: 'error', message: "Validation Error", details: "Deduction type name is required."}); return;
    }
    try {
      if (editingDeductionType) {
        const updatedType: DeductionType = { ...editingDeductionType, name: editingDeductionType.isFixedName ? editingDeductionType.name : deductionTypeFormData.name.trim() };
        await putToStore<DeductionType>(STORE_NAMES.DEDUCTION_TYPES, updatedType, selectedCompanyId);
        setDeductionTypes(prev => prev.map(dt => dt.id === updatedType.id ? updatedType : dt).sort((a,b)=>a.order - b.order));
        setFeedback({type: 'success', message: "Deduction Type Updated"});
      } else {
        const maxOrder = deductionTypes.reduce((max, dt) => Math.max(max, dt.order), 0);
        const newType: DeductionType = {
          id: `dt_custom_${Date.now()}`, companyId: selectedCompanyId, name: deductionTypeFormData.name.trim(),
          order: maxOrder + 1, isFixedName: false, isDeletable: true,
        };
        await putToStore<DeductionType>(STORE_NAMES.DEDUCTION_TYPES, newType, selectedCompanyId);
        setDeductionTypes(prev => [...prev, newType].sort((a,b)=>a.order - b.order));
        setFeedback({type: 'success', message: "Deduction Type Added"});
      }
      setIsDeductionTypeDialogOpen(false);
    } catch (error) {
      setFeedback({type: 'error', message: "Save Failed", details: `Could not save deduction type. ${(error as Error).message}`});
    }
  };

  const deductionTypeColumnsForExport = [
    { key: 'id', label: 'ID', isIdLike: true },
    { key: 'name', label: 'Name' },
    { key: 'order', label: 'Order' },
    { key: 'isFixedName', label: 'IsFixedName' },
    { key: 'isDeletable', label: 'IsDeletable' },
  ];

  const exportDeductionTypesData = (fileType: "csv" | "xlsx" | "pdf") => {
    setFeedback(null);
    if (!selectedCompanyId) {
      setFeedback({type: 'error', message: "Error", details: "No company selected for export."});
      return;
    }
    if (deductionTypes.length === 0) {
      setFeedback({type: 'info', message: "No Data", details: "There are no deduction types to export for the current company."}); return;
    }

    const headers = deductionTypeColumnsForExport.map(col => col.label);
    const dataToExport = deductionTypes.map(dt => {
      const exportRow: Record<string, string | number | boolean> = {};
      deductionTypeColumnsForExport.forEach(col => {
        const value = dt[col.key as keyof Omit<DeductionType, 'companyId'>];
        if (col.isIdLike) {
            exportRow[col.label] = String(value || '');
        } else {
            exportRow[col.label] = value;
        }
      });
      return exportRow;
    });
    const companyNameForFile = sanitizeFilename(selectedCompanyName);
    const fileName = `${companyNameForFile}_deduction_types_export.${fileType}`;

    if (fileType === "csv") {
        const csvData = dataToExport.map(row => {
            const newRow: Record<string, string> = {};
            headers.forEach(header => {
                const colDef = deductionTypeColumnsForExport.find(c => c.label === header);
                let cellValue = String(row[header] || '');
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
        link.style.visibility = 'hidden'; document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "xlsx") {
        const xlsxData = dataToExport.map(row => {
            const newRow: Record<string, string|number|boolean>={};
            headers.forEach(h => {
                const colDef = deductionTypeColumnsForExport.find(c => c.label === h);
                if (colDef?.isIdLike) newRow[h] = String(row[h] || '');
                else newRow[h] = row[h];
            });
            return newRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(xlsxData, {header: headers, skipHeader: false});
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Deduction Types");
        XLSX.writeFile(workbook, fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") {
        const pdfData = dataToExport.map(row => deductionTypeColumnsForExport.map(col => String(row[col.label] || '')));
        const doc = new jsPDF({ orientation: 'landscape' });
        (doc as any).autoTable({
            head: [headers], body: pdfData, styles: { fontSize: 8 },
            headStyles: { fillColor: [102, 126, 234] }, margin: { top: 10 },
        });
        doc.save(fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    }
  };

  const handleDownloadDeductionTypeTemplate = () => {
    setFeedback(null);
    const headers = ['ID', 'Name'];
    const csvString = headers.join(',') + '\n';
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'deduction_types_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback({type: 'info', message: "Template Downloaded", details: "Deduction types template. Dates should be in DD/MM/YYYY format. Tip: If a field contains commas (e.g., \"Staff Welfare, Annual\"), ensure the entire field is enclosed in double quotes."});
  };

  const handleDeductionTypesImportClick = () => {
    setFeedback(null);
    if (!selectedCompanyId) {
      setFeedback({type: 'error', message: "Error", details: "Please select a company before importing deduction types."});
      return;
    }
    deductionTypesImportFileInputRef.current?.click();
  };

  const parseCSVToDeductionTypes = (
    csvText: string,
    currentCompanyId: string,
    existingCompanyTypes: DeductionType[]
  ): Promise<{ data: DeductionType[], processedDataRowCount: number, papaParseErrors: Papa.ParseError[], validationSkippedLog: string[] }> => {
      return new Promise((resolve) => {
          Papa.parse<Record<string, string>>(csvText, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                  const parsedDeductionTypes: DeductionType[] = [];
                  const validationSkippedLog: string[] = [];
                  let processedDataRowCount = 0;
                  let maxExistingOrder = existingCompanyTypes.reduce((max, dt) => Math.max(max, dt.order), 0);

                  results.data.forEach((rawRow, index) => {
                      processedDataRowCount++;
                      const originalLineNumber = index + 2;
                      const idKey = Object.keys(rawRow).find(k => k.trim().toLowerCase() === 'id');
                      const nameKey = Object.keys(rawRow).find(k => k.trim().toLowerCase() === 'name');

                      if (!idKey || !nameKey || !rawRow[idKey] || String(rawRow[idKey]).trim() === "" || !rawRow[nameKey] || String(rawRow[nameKey]).trim() === "") {
                          validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Missing required field(s): ID or Name.`);
                          return;
                      }
                      const id = String(rawRow[idKey]).trim();
                      const name = String(rawRow[nameKey]).trim();

                      const existingType = existingCompanyTypes.find(et => et.id === id && et.companyId === currentCompanyId);
                      if (existingType) {
                          if (existingType.id === DEFAULT_ADVANCE_DEDUCTION_TYPE_ID || existingType.id === DEFAULT_CHARGE_DEDUCTION_TYPE_ID || existingType.id === DEFAULT_LOAN_DEDUCTION_TYPE_ID) {
                              parsedDeductionTypes.push({ ...existingType }); // Name is fixed, don't update
                          } else {
                              parsedDeductionTypes.push({ ...existingType, name });
                          }
                      } else {
                          maxExistingOrder++;
                          parsedDeductionTypes.push({
                              id, companyId: currentCompanyId, name,
                              order: maxExistingOrder, isFixedName: false, isDeletable: true,
                          });
                      }
                  });
                  resolve({ data: parsedDeductionTypes, processedDataRowCount, papaParseErrors: results.errors, validationSkippedLog });
              }
          });
      });
  };

  const handleDeductionTypesFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    if (!selectedCompanyId) {
        setFeedback({type: 'error', message: "Error", details: "No company selected for import target."});
        return;
    }
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (!text || text.trim() === "") {
            setFeedback({type: 'info', message: "Import Note", details: "The CSV file appears to be empty."});
            return;
        }
        try {
          const { data: parsedData, processedDataRowCount, papaParseErrors, validationSkippedLog } = await parseCSVToDeductionTypes(text, selectedCompanyId, deductionTypes);
          let newCount = 0, updatedCount = 0;
          const itemsToBulkPut: DeductionType[] = [];
          const existingDeductionTypesInDB = await getAllFromStore<DeductionType>(STORE_NAMES.DEDUCTION_TYPES, selectedCompanyId);

          for (const importedDT of parsedData) {
            const existingIndex = existingDeductionTypesInDB.findIndex(dt => dt.id === importedDT.id && dt.companyId === selectedCompanyId);
            if (existingIndex > -1) {
              const currentDbVersion = existingDeductionTypesInDB[existingIndex];
              if(currentDbVersion.name !== importedDT.name) {
                 itemsToBulkPut.push(importedDT);
                 updatedCount++;
              }
            } else {
              itemsToBulkPut.push(importedDT);
              newCount++;
            }
          }

          if (itemsToBulkPut.length > 0) {
            await bulkPutToStore<DeductionType>(STORE_NAMES.DEDUCTION_TYPES, itemsToBulkPut, selectedCompanyId);
          }

          const updatedDeductionTypesList = await getAllFromStore<DeductionType>(STORE_NAMES.DEDUCTION_TYPES, selectedCompanyId);
          setDeductionTypes(updatedDeductionTypesList.sort((a,b) => a.order - b.order));

          let feedbackMessage = "";
          let feedbackTitle = "Import Processed";
          let feedbackType: FeedbackMessage['type'] = "info";
          const totalPapaParseErrors = papaParseErrors.length;
          const totalValidationSkipped = validationSkippedLog.length;

          if (newCount > 0 || updatedCount > 0) {
            feedbackTitle = "Import Successful";
            feedbackMessage = `${newCount} deduction types added, ${updatedCount} updated.`;
            feedbackType = 'success';
          } else if (parsedData.length === 0 && processedDataRowCount > 0 && (totalPapaParseErrors > 0 || totalValidationSkipped > 0)) {
            feedbackTitle = "Import Failed";
            feedbackMessage = `All ${processedDataRowCount} data row(s) were processed, but no valid deduction types could be imported.`;
            feedbackType = 'error';
          } else if (parsedData.length === 0 && processedDataRowCount === 0 && (totalPapaParseErrors > 0 || text.split('\\n').filter(l => l.trim() !== '').length > 1) ) {
            feedbackTitle = "Import Failed";
            feedbackMessage = `No data rows found or all rows had critical parsing errors. Please check CSV structure.`;
            feedbackType = 'error';
          } else if (newCount === 0 && updatedCount === 0 && totalPapaParseErrors === 0 && totalValidationSkipped === 0 && processedDataRowCount > 0) {
            feedbackTitle = "Import Note";
            feedbackMessage = `CSV processed. ${processedDataRowCount} data row(s) checked. No new deduction types were added, and no changes were found for existing types.`;
          } else {
             feedbackTitle = "Import Note";
             feedbackMessage = "No changes applied. The CSV might be empty, not conform to the template, or contain data identical to existing records.";
          }

          let details = "";
          if (totalPapaParseErrors > 0 || totalValidationSkipped > 0) {
            details += ` ${totalPapaParseErrors + totalValidationSkipped} row(s) had issues.`;
            if (validationSkippedLog.length > 0) details += ` First validation skip: ${validationSkippedLog[0]}`;
            else if (papaParseErrors.length > 0) details += ` First parsing error: ${papaParseErrors[0].message}`;
          }
          setFeedback({type: feedbackType, message: `${feedbackTitle}: ${feedbackMessage}`, details});
        } catch (error: any) {
          setFeedback({type: 'error', message: "Import Failed", details: error.message || "Could not parse CSV file for deduction types."});
          console.error("Deduction Types CSV Parsing Error:", error);
        }
      };
      reader.readAsText(file);
      if (event.target) event.target.value = '';
    }
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
      <Alert variant={variant} className={cn("mb-4", additionalAlertClasses)}>
        <IconComponent className="h-4 w-4" />
        <AlertTitle>{feedback.message}</AlertTitle>
        {feedback.details && <AlertDescription>{feedback.details}</AlertDescription>}
      </Alert>
    );
  };

  if (isLoadingCompanyContext) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading company information...</div>;
  }

  if (!selectedCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <BadgeMinus className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold">No Company Selected</p>
        <p className="text-muted-foreground">Please select a company to manage deductions.</p>
        <Button asChild className="mt-4">
          <Link href="/select-company">Go to Company Selection</Link>
        </Button>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading deductions data for the selected company...</div>;
  }

  return (
    <div className="space-y-8">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
      <input type="file" ref={deductionTypesImportFileInputRef} onChange={handleDeductionTypesFileUpload} accept=".csv" className="hidden" />

      <div className="flex items-center gap-2 mb-1">
        <BadgeMinus className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Deductions Management</h1>
      </div>
      <p className="text-muted-foreground -mt-6 mb-2">
        Define deduction types (e.g., Loan, Advance) and then manage individual staff deductions against these types.
      </p>
      {renderFeedbackMessage()}

      <Tabs defaultValue="deductions">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="deductions">Deductions</TabsTrigger>
          <TabsTrigger value="deductionTypes">Deduction Types</TabsTrigger>
        </TabsList>

        <TabsContent value="deductions">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-2 h-6 w-6 text-primary" />Deductions</CardTitle>
                <CardDescription>List of all deductions for staff in the current company.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                    <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="search" placeholder="Search deductions..." className="w-full pl-10" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); setSelectedItems(new Set()); setFeedback(null); }} disabled={!selectedCompanyId}/>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={!selectedCompanyId} onClick={() => setFeedback(null)}><Upload className="mr-2 h-4 w-4" /> Import / Template</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={handleDownloadDeductionTemplate}><Download className="mr-2 h-4 w-4" /> Download Template</DropdownMenuItem><DropdownMenuItem onClick={handleImportClick}><Upload className="mr-2 h-4 w-4" /> Upload Data</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={!selectedCompanyId || allDeductionsData.length === 0} onClick={() => setFeedback(null)}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-full sm:w-auto"><DropdownMenuItem onClick={() => exportDeductionData("csv")}><FileText className="mr-2 h-4 w-4" /> Export as CSV</DropdownMenuItem><DropdownMenuItem onClick={() => exportDeductionData("xlsx")}><FileSpreadsheet className="mr-2 h-4 w-4" /> Export as XLSX</DropdownMenuItem><DropdownMenuItem onClick={() => exportDeductionData("pdf")}><FileType className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                        <Button onClick={handleAddDeductionClick} disabled={!selectedCompanyId || staffList.length === 0 || deductionTypes.length === 0} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Deduction</Button>
                    </div>
                </div>

                {selectedItems.size > 0 && (<div className="my-2 flex items-center justify-between p-3 bg-muted/50 rounded-md"><span className="text-sm text-muted-foreground">{selectedItems.size} item(s) selected</span><Button variant="destructive" onClick={handleOpenBulkDeleteDialog} disabled={!selectedCompanyId}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected</Button></div>)}

                <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead className="sticky top-0 z-10 bg-card w-[50px]"><Checkbox checked={isAllOnPageSelected} onCheckedChange={(checked) => handleSelectAllOnPage(Boolean(checked))} aria-label="Select all deductions on page" disabled={paginatedDeductions.length === 0}/></TableHead><TableHead className="sticky top-0 z-10 bg-card">Staff</TableHead><TableHead className="sticky top-0 z-10 bg-card">Description</TableHead><TableHead className="sticky top-0 z-10 bg-card">Type</TableHead><TableHead className="sticky top-0 z-10 bg-card text-right">Original Amt.</TableHead><TableHead className="sticky top-0 z-10 bg-card text-right">Monthly Ded.</TableHead><TableHead className="sticky top-0 z-10 bg-card text-right">Deducted</TableHead><TableHead className="sticky top-0 z-10 bg-card text-right">Balance</TableHead><TableHead className="sticky top-0 z-10 bg-card">Start Date</TableHead><TableHead className="sticky top-0 z-10 bg-card">Status</TableHead><TableHead className="sticky top-0 z-10 bg-card text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                    {paginatedDeductions.map((deduction) => (<TableRow key={deduction.id} data-state={selectedItems.has(deduction.id) ? "selected" : ""}><TableCell><Checkbox checked={selectedItems.has(deduction.id)} onCheckedChange={(checked) => handleSelectRow(deduction.id, Boolean(checked))} aria-label={`Select row ${deduction.id}`}/></TableCell><TableCell className="font-medium">{deduction.staffName}</TableCell><TableCell>{deduction.description}</TableCell><TableCell>{deduction.deductionTypeName || "N/A"}</TableCell><TableCell className="text-right">{formatNumberForTable(deduction.originalAmount)}</TableCell><TableCell className="text-right">{formatNumberForTable(deduction.monthlyDeduction)}</TableCell><TableCell className="text-right">{formatNumberForTable(deduction.deductedSoFar)}</TableCell><TableCell className="text-right font-semibold">{formatNumberForTable(deduction.balance)}</TableCell><TableCell>{formatDateForDisplay(deduction.startDate)}</TableCell><TableCell><Badge variant={(deduction.balance || 0) > 0 ? "default" : "secondary"} className={cn((deduction.balance || 0) > 0 ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-500 hover:bg-gray-600 text-white")}>{(deduction.balance || 0) > 0 ? "Active" : "Completed"}</Badge></TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => handleEditDeductionClick(deduction)} title="Edit"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteSingleDeductionClick(deduction)} title="Delete" className="text-destructive hover:text-destructive/90"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}
                    {paginatedDeductions.length === 0 && (<TableRow><TableCell colSpan={11} className="text-center h-24">No deductions found for current company or matching criteria.</TableCell></TableRow>)}
                </TableBody></Table></div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        {selectedItems.size > 0 ? `${selectedItems.size} of ${totalItems} item(s) selected.` : `Page ${currentPage} of ${totalPages} (${totalItems} total items)`}
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex items-center space-x-2"><p className="text-sm font-medium">Rows per page</p><Select value={`${rowsPerPage}`} onValueChange={(value) => {setRowsPerPage(Number(value)); setCurrentPage(1); setSelectedItems(new Set());}}><SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${rowsPerPage}`} /></SelectTrigger><SelectContent side="top">{ROWS_PER_PAGE_OPTIONS.map((s) => (<SelectItem key={`ded-${s}`} value={`${s}`}>{s}</SelectItem>))}</SelectContent></Select></div>
                      <div className="flex items-center space-x-2"><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCurrentPage(1); setSelectedItems(new Set());}} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCurrentPage(p => p - 1); setSelectedItems(new Set());}} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCurrentPage(p => p + 1); setSelectedItems(new Set());}} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCurrentPage(totalPages); setSelectedItems(new Set());}} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button></div>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductionTypes">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Settings className="mr-2 h-6 w-6 text-primary" /> Deduction Types</CardTitle>
                <CardDescription className="mt-1">
                    Manage company deduction types. Core types &apos;Advance&apos;, &apos;Charge&apos;, and &apos;Loan&apos; are system-defined (order 1, 2, 3) and cannot be deleted or renamed. Add custom types; order determines payroll application sequence after core types.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                    <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search deduction types..."
                            className="w-full pl-10"
                            value={deductionTypeSearchTerm}
                            onChange={(e) => {setDeductionTypeSearchTerm(e.target.value); setDtCurrentPage(1); setFeedback(null);}}
                            disabled={!selectedCompanyId}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto" disabled={!selectedCompanyId} onClick={() => setFeedback(null)}>
                                    <Upload className="mr-2 h-4 w-4" /> Import / Template
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleDownloadDeductionTypeTemplate}>
                                    <Download className="mr-2 h-4 w-4" /> Download Template
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDeductionTypesImportClick}>
                                    <Upload className="mr-2 h-4 w-4" /> Upload Data
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto" disabled={!selectedCompanyId || deductionTypes.length === 0} onClick={() => setFeedback(null)}>
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-full sm:w-auto">
                                <DropdownMenuItem onClick={() => exportDeductionTypesData("csv")}><FileText className="mr-2 h-4 w-4" /> Export as CSV</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportDeductionTypesData("xlsx")}><FileSpreadsheet className="mr-2 h-4 w-4" /> Export as XLSX</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportDeductionTypesData("pdf")}><FileType className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleAddDeductionTypeClick} disabled={!selectedCompanyId} className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Deduction Type
                        </Button>
                    </div>
                </div>
                {selectedDeductionTypeItems.size > 0 && (
                    <div className="my-2 flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <span className="text-sm text-muted-foreground">{selectedDeductionTypeItems.size} deduction type(s) selected</span>
                        <Button variant="destructive" onClick={handleOpenBulkDeleteDeductionTypesDialog} disabled={!selectedCompanyId}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                        </Button>
                    </div>
                )}
                <div className="rounded-md border"><Table><TableHeader><TableRow>
                    <TableHead className="sticky top-0 z-10 bg-card w-[50px]">
                        <Checkbox
                            checked={isAllDeductionTypesOnPageSelected}
                            onCheckedChange={(checked) => handleSelectAllDeductionTypesOnPage(Boolean(checked))}
                            aria-label="Select all deduction types on page"
                            disabled={paginatedDeductionTypes.length === 0}
                        />
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card">Order</TableHead><TableHead className="sticky top-0 z-10 bg-card">Name</TableHead><TableHead className="sticky top-0 z-10 bg-card text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {paginatedDeductionTypes.map(dt => (
                          <TableRow key={dt.id} data-state={selectedDeductionTypeItems.has(dt.id) ? "selected" : ""}>
                              <TableCell>
                                <Checkbox
                                    checked={selectedDeductionTypeItems.has(dt.id)}
                                    onCheckedChange={(checked) => handleSelectDeductionTypeRow(dt.id, Boolean(checked))}
                                    aria-label={`Select deduction type ${dt.name}`}
                                    disabled={!dt.isDeletable}
                                />
                              </TableCell>
                              <TableCell>{dt.order}</TableCell>
                              <TableCell className="font-medium">{dt.name} {dt.isFixedName && <span className="text-xs text-muted-foreground ml-1">(Core)</span>}</TableCell>
                              <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditDeductionTypeClick(dt)} title="Edit Type" disabled={dt.isFixedName}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteDeductionTypeClick(dt)} title={dt.isDeletable ? "Delete Type" : "Core type cannot be deleted"} className={dt.isDeletable ? "text-destructive hover:text-destructive/90" : "text-muted-foreground cursor-not-allowed"} disabled={!dt.isDeletable}><Trash2 className="h-4 w-4" /></Button>
                              </TableCell>
                          </TableRow>
                          ))}
                          {paginatedDeductionTypes.length === 0 && (
                              <TableRow>
                                  <TableCell colSpan={4} className="text-center h-24">
                                  {deductionTypeSearchTerm && deductionTypes.length > 0 ? "No types match." : "No deduction types. Add 'Advance', 'Charge', 'Loan', or custom types."}
                                  </TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                    </Table></div>
                {dtTotalPages > 1 && (
                  <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        {selectedDeductionTypeItems.size > 0 ? `${selectedDeductionTypeItems.size} of ${dtTotalItems} type(s) selected.` : `Page ${dtCurrentPage} of ${dtTotalPages} (${dtTotalItems} total types)`}
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex items-center space-x-2"><p className="text-sm font-medium">Rows per page</p><Select value={`${dtRowsPerPage}`} onValueChange={(value) => {setDtRowsPerPage(Number(value)); setDtCurrentPage(1); setSelectedDeductionTypeItems(new Set());}}><SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${dtRowsPerPage}`} /></SelectTrigger><SelectContent side="top">{DT_ROWS_PER_PAGE_OPTIONS.map((s) => (<SelectItem key={`dt-${s}`} value={`${s}`}>{s}</SelectItem>))}</SelectContent></Select></div>
                      <div className="flex items-center space-x-2"><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setDtCurrentPage(1); setSelectedDeductionTypeItems(new Set());}} disabled={dtCurrentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setDtCurrentPage(p => p - 1); setSelectedDeductionTypeItems(new Set());}} disabled={dtCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setDtCurrentPage(p => p + 1); setSelectedDeductionTypeItems(new Set());}} disabled={dtCurrentPage === dtTotalPages}><ChevronRight className="h-4 w-4" /></Button><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setDtCurrentPage(dtTotalPages); setSelectedDeductionTypeItems(new Set());}} disabled={dtCurrentPage === dtTotalPages}><ChevronsRight className="h-4 w-4" /></Button></div>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <Dialog open={isDeductionDialogOpen} onOpenChange={(isOpen) => { setIsDeductionDialogOpen(isOpen); if(!isOpen) setFeedback(null); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{editingDeduction ? "Edit" : "Add New"} Deduction</DialogTitle><DialogDescription>{editingDeduction ? "Update details." : "Fill in details."}</DialogDescription></DialogHeader><div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2" tabIndex={0}>
        <div className="space-y-2"><Label htmlFor="staffId">Staff Member *</Label><Select name="staffId" value={deductionFormData.staffId} onValueChange={(value) => handleSelectChange('staffId', value)} required><SelectTrigger id="staffId"><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staffList.length === 0 ? (<SelectItem value="no-staff" disabled>No staff available.</SelectItem>) : (staffList.map(staff => (<SelectItem key={staff.id} value={staff.id}>{staff.firstName} {staff.lastName} ({staff.id})</SelectItem>)))}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="deductionTypeId">Deduction Type *</Label><Select name="deductionTypeId" value={deductionFormData.deductionTypeId} onValueChange={(value) => handleSelectChange('deductionTypeId', value)} required><SelectTrigger id="deductionTypeId"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{deductionTypes.length === 0 ? (<SelectItem value="no-types" disabled>No types defined.</SelectItem>) : (deductionTypes.map(type => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)))}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="description">Description *</Label><Input id="description" name="description" value={deductionFormData.description} onChange={handleInputChange} placeholder="e.g., Laptop Purchase Loan" required /></div>
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="originalAmount">Original Amount *</Label><Input id="originalAmount" name="originalAmount" type="number" value={deductionFormData.originalAmount || ""} onChange={handleInputChange} placeholder="0" min="0" step="1" required /></div><div className="space-y-2"><Label htmlFor="monthlyDeduction">Monthly Deduction *</Label><Input id="monthlyDeduction" name="monthlyDeduction" type="number" value={deductionFormData.monthlyDeduction || ""} onChange={handleInputChange} placeholder="0" min="0" step="1" required/></div></div>
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="deductedSoFar">Deducted So Far</Label><Input id="deductedSoFar" name="deductedSoFar" type="number" value={deductionFormData.deductedSoFar || ""} onChange={handleInputChange} placeholder="0" min="0" step="1"/></div><div className="space-y-2"><Label htmlFor="startDate">Start Date *</Label><Input id="startDate" name="startDate" type="date" value={deductionFormData.startDate} onChange={handleInputChange} required/></div></div>
      </div><DialogFooter className="border-t pt-4"><Button type="button" variant="outline" onClick={() => setIsDeductionDialogOpen(false)}>Cancel</Button><Button type="button" onClick={handleSaveDeduction} disabled={staffList.length === 0 || deductionTypes.length === 0}>Save Deduction</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={isDeleteDialogForItemOpen} onOpenChange={(isOpen) => { setIsDeleteDialogForItemOpen(isOpen); if (!isOpen) setFeedback(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete deduction "{deductionToDelete?.description}" for {deductionToDelete?.staffName}?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteSingleDeduction} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={(isOpen) => { setIsBulkDeleteDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>Delete {selectedItems.size} selected deduction(s)?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmBulkDeleteDeductions} className="bg-destructive hover:bg-destructive/90">Delete Selected</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <Dialog open={isDeductionTypeDialogOpen} onOpenChange={(isOpen) => { setIsDeductionTypeDialogOpen(isOpen); if(!isOpen) setFeedback(null); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingDeductionType ? "Edit" : "Add New"} Deduction Type</DialogTitle><DialogDescription>Define a category for deductions in this company.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deductionTypeName">Name *</Label>
              <Input id="deductionTypeName" name="name" value={deductionTypeFormData.name} onChange={handleDeductionTypeFormChange} placeholder="e.g., Staff Welfare" disabled={!!editingDeductionType && editingDeductionType.isFixedName} />
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDeductionTypeDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveDeductionType}>Save Type</Button></DialogFooter></DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDeductionTypeDialogOpen} onOpenChange={(isOpen) => { setIsDeleteDeductionTypeDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete deduction type "{deductionTypeToDelete?.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteDeductionType} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={isBulkDeleteDeductionTypesDialogOpen} onOpenChange={(isOpen) => { setIsBulkDeleteDeductionTypesDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>Delete {selectedDeductionTypeItems.size} selected deduction type(s)? Core types and types in use will be skipped.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmBulkDeleteDeductionTypes} className="bg-destructive hover:bg-destructive/90">Delete Selected</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

    
