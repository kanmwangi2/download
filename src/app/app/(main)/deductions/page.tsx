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
import { PlusCircle, Edit, Trash2, Upload, Download, FileText, FileSpreadsheet, FileType, BadgeMinus, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Users, Settings } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useCompany } from '@/context/CompanyContext';
import Link from 'next/link';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import { isValid as isValidDate, format, parse } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedbackAlert, FeedbackMessage } from '@/components/ui/feedback-alert';
// Adjust the import to match the actual exports from '@/lib/types/deductions'
// import { Deduction, DeductionType } from '@/lib/types/deductions'; // Deduction is not exported from this module
import { DeductionType as ImportedDeductionType } from '@/lib/types/deductions';

// Extend DeductionType to include orderNumber and isDeletable for local use
export type DeductionType = ImportedDeductionType & {
  orderNumber: number;
  isDeletable: boolean;
};
import { StaffMember } from '@/lib/types/staff';

// Define Deduction type locally (adjust fields as needed to match your app's requirements)
export type Deduction = {
  id: string;
  staffId: string;
  deductionTypeId: string;
  description: string;
  originalAmount: number;
  monthlyDeduction: number;
  deductedSoFar: number;
  startDate: string;
  companyId: string;
  balance: number;
  staffName: string;
  deductionTypeName: string;
};
import { ServiceRegistry } from '@/lib/services/ServiceRegistry';
import { DEFAULT_LOAN_DEDUCTION_TYPE_ID, DEFAULT_ADVANCE_DEDUCTION_TYPE_ID, DEFAULT_CHARGE_DEDUCTION_TYPE_ID } from '@/lib/constants';


const defaultDeductionFormData: Omit<Deduction, 'id' | 'companyId' | 'balance' | 'staffName' | 'deductionTypeName'> = {
  staffId: "", deductionTypeId: "", description: "", originalAmount: 0,
  monthlyDeduction: 0, deductedSoFar: 0, startDate: new Date().toISOString().split('T')[0] || '',
};

const defaultNewDeductionTypeData: Omit<DeductionType, 'id' | 'companyId' | 'isFixedName' | 'isDeletable'> = {
  name: "",
  isDefault: false,
  orderNumber: 0
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
      return 'N/A';  } catch {
      return 'N/A';
  }
};


const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];
const DT_ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

const sanitizeFilename = (name: string | null | undefined): string => {
    if (!name) return 'UnknownCompany';
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
};

export default function DeductionsPage() {
  const { selectedCompanyId, selectedCompanyName, isLoadingCompanyContext } = useCompany();
  const services = useMemo(() => ServiceRegistry.getInstance(), []);

  // Common state
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Deductions state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [allDeductionsData, setAllDeductionsData] = useState<Deduction[]>([]);
  const [isDeductionDialogOpen, setIsDeductionDialogOpen] = useState(false);
  const [deductionFormData, setDeductionFormData] = useState<Partial<Deduction>>(defaultDeductionFormData);
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(null);
  const [deductionToDelete, setDeductionToDelete] = useState<Deduction | null>(null);
  const [isDeleteDialogForItemOpen, setIsDeleteDialogForItemOpen] = useState(false);
  const [deductionDialogFeedback, setDeductionDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [deleteDeductionDialogFeedback, setDeleteDeductionDialogFeedback] = useState<FeedbackMessage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteDeductionsDialogFeedback, setBulkDeleteDeductionsDialogFeedback] = useState<FeedbackMessage | null>(null);

  // Deduction Types state
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [isDeductionTypeDialogOpen, setIsDeductionTypeDialogOpen] = useState(false);
  const [deductionTypeFormData, setDeductionTypeFormData] = useState<Partial<DeductionType>>(defaultNewDeductionTypeData);
  const [editingDeductionType, setEditingDeductionType] = useState<DeductionType | null>(null);
  const [deductionTypeToDelete, setDeductionTypeToDelete] = useState<DeductionType | null>(null);
  const [isDeleteDeductionTypeDialogOpen, setIsDeleteDeductionTypeDialogOpen] = useState(false);
  const [deductionTypeDialogFeedback, setDeductionTypeDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [deleteDeductionTypeDialogFeedback, setDeleteDeductionTypeDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [deductionTypeSearchTerm, setDeductionTypeSearchTerm] = useState("");
  const [dtCurrentPage, setDtCurrentPage] = useState(1);
  const [dtRowsPerPage, setDtRowsPerPage] = useState(DT_ROWS_PER_PAGE_OPTIONS[0]);
  const [selectedDeductionTypeItems, setSelectedDeductionTypeItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteDeductionTypesDialogOpen, setIsBulkDeleteDeductionTypesDialogOpen] = useState(false);
  const [bulkDeleteDeductionTypesDialogFeedback, setBulkDeleteDeductionTypesDialogFeedback] = useState<FeedbackMessage | null>(null);
  const deductionTypesImportFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      if (selectedCompanyId) {
        try {
          setIsLoaded(false);
          setFeedback({ type: 'info', message: 'Loading data...' });
          const [staff, deductions, types] = await Promise.all([
            services.staffService.getStaffByCompany(selectedCompanyId),
            services.deductionService.getDeductionsByCompany(selectedCompanyId),
            services.deductionService.getDeductionTypes(selectedCompanyId)
          ]);
          setStaffList(staff);
          setAllDeductionsData(deductions);
          setDeductionTypes(
            types
              .map((t: ImportedDeductionType, idx: number) => ({
                ...t,
                orderNumber: typeof (t as any).orderNumber === "number" ? (t as any).orderNumber : idx + 1,
                isDeletable: typeof (t as any).isDeletable === "boolean"
                  ? (t as any).isDeletable
                  : !(
                      t.id === DEFAULT_LOAN_DEDUCTION_TYPE_ID ||
                      t.id === DEFAULT_ADVANCE_DEDUCTION_TYPE_ID ||
                      t.id === DEFAULT_CHARGE_DEDUCTION_TYPE_ID
                    ),
              }))
              .sort((a, b) => a.orderNumber - b.orderNumber)
          );
          setFeedback(null);
        } catch (error) {
          console.error("Failed to load initial data:", error);
          setFeedback({ type: 'error', message: 'Failed to load data', details: (error as Error).message });
        } finally {
          setIsLoaded(true);
        }
      } else {
        // Clear data if no company is selected
        setStaffList([]);
        setAllDeductionsData([]);
        setDeductionTypes([]);
        setIsLoaded(true);
      }
    };
    loadInitialData();
  }, [selectedCompanyId, services]);

  useEffect(() => {
    if (editingDeduction) {
      setDeductionFormData(editingDeduction);
    } else {
      setDeductionFormData(defaultDeductionFormData);
    }
  }, [editingDeduction]);

  useEffect(() => {
    if (editingDeductionType) {
      setDeductionTypeFormData(editingDeductionType);
    } else {
      setDeductionTypeFormData(defaultNewDeductionTypeData);
    }
  }, [editingDeductionType]);

  const filteredDeductionsSource = useMemo(() => allDeductionsData.filter(d =>
    (d.staffName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.deductionTypeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((d.balance || 0) > 0 ? "active" : "completed").includes(searchTerm.toLowerCase())
  ), [allDeductionsData, searchTerm]);

  const totalItems = filteredDeductionsSource.length;
  const totalPages = Math.ceil(totalItems / (rowsPerPage || 1)) || 1;
  const startIndex = (currentPage - 1) * (rowsPerPage || 1);
  const endIndex = startIndex + (rowsPerPage || 1);
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

  const handleAddDeductionClick = () => { 
    setFeedback(null); 
    setDeductionDialogFeedback(null); 
    setEditingDeduction(null); 
    setDeductionFormData(defaultDeductionFormData);
    setIsDeductionDialogOpen(true); 
  };
  const handleEditDeductionClick = (deduction: Deduction) => { 
    setFeedback(null); 
    setDeductionDialogFeedback(null); 
    setEditingDeduction(deduction); 
    setIsDeductionDialogOpen(true); 
  };
  const handleDeleteSingleDeductionClick = (deduction: Deduction) => { 
    setFeedback(null); 
    setDeleteDeductionDialogFeedback(null); 
    setDeductionToDelete(deduction); 
    setIsDeleteDialogForItemOpen(true); 
  };

  const deleteDeductionsByIds = async (idsToDelete: string[]) => {
    setFeedback(null);
    if (idsToDelete.length === 0 || !selectedCompanyId) return;
    try {
      await services.deductionService.deleteDeductions(idsToDelete);
      setAllDeductionsData(prev => prev.filter(d => !idsToDelete.includes(d.id)));
      setSelectedItems(prev => { const newSelected = new Set(prev); idsToDelete.forEach(id => newSelected.delete(id)); return newSelected; });
      setFeedback({type: 'success', message: `${idsToDelete.length} Deduction(s) Deleted`, details: `Successfully deleted ${idsToDelete.length} deduction(s).`});
      if (currentPage > 1 && paginatedDeductions.length === idsToDelete.length && filteredDeductionsSource.slice((currentPage - 2) * (rowsPerPage || 1), (currentPage - 1) * (rowsPerPage || 1)).length > 0) { setCurrentPage(currentPage - 1); }
      else if (currentPage > 1 && paginatedDeductions.length === idsToDelete.length && filteredDeductionsSource.slice((currentPage-1)*(rowsPerPage || 1)).length === 0){ setCurrentPage( Math.max(1, currentPage -1)); }
    } catch (error) { console.error("Error deleting deduction(s):", error); setFeedback({type: 'error', message: "Delete Failed", details: `Could not delete ${idsToDelete.length} deduction(s). ${(error as Error).message}`}); }
  };
  const confirmDeleteSingleDeduction = async () => { if (deductionToDelete) { await deleteDeductionsByIds([deductionToDelete.id]); } setIsDeleteDialogForItemOpen(false); setDeductionToDelete(null); };
  const handleOpenBulkDeleteDialog = () => { 
    setFeedback(null); 
    setBulkDeleteDeductionsDialogFeedback(null); 
    if (selectedItems.size === 0) { 
      setFeedback({type: 'info', message: "No Selection", details: "Please select deductions to delete."}); 
      return; 
    } 
    setIsBulkDeleteDialogOpen(true); 
  };
  const confirmBulkDeleteDeductions = async () => { await deleteDeductionsByIds(Array.from(selectedItems)); setIsBulkDeleteDialogOpen(false); };

  const handleSaveDeduction = async () => {
    setDeductionDialogFeedback(null);
    if (!selectedCompanyId) { setDeductionDialogFeedback({ type: 'error', message: "Error", details: "No company selected." }); return; }
    if (!deductionFormData.staffId || !deductionFormData.deductionTypeId || !deductionFormData.description || (deductionFormData.originalAmount || 0) <= 0 || (deductionFormData.monthlyDeduction || 0) <= 0) {
      setDeductionDialogFeedback({ type: 'error', message: "Validation Error", details: "Staff, Deduction Type, Description, Original Amount, and Monthly Deduction are required and must be valid." }); return;
    }
    const staffMember = staffList.find((s) => s.id === deductionFormData.staffId);
    if (!staffMember) { setDeductionDialogFeedback({ type: 'error', message: "Error", details: "Selected staff member not found." }); return; }
    const deductionTypeInfo = deductionTypes.find((dt: DeductionType) => dt.id === deductionFormData.deductionTypeId);
    if (!deductionTypeInfo) { setDeductionDialogFeedback({ type: 'error', message: "Error", details: "Selected deduction type not found." }); return; }
    
    const staffFullName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Unknown";
    
    try {
      if (editingDeduction) {
        const updatedDeduction: Deduction = {
          ...editingDeduction,
          ...deductionFormData,
          staffId: editingDeduction.staffId, // Ensure staffId is not changed during edit
          deductionTypeId: editingDeduction.deductionTypeId, // Ensure typeId is not changed
          companyId: selectedCompanyId,
          staffName: staffFullName,
          deductionTypeName: deductionTypeInfo.name,
          balance: (deductionFormData.originalAmount || 0) - (deductionFormData.deductedSoFar || 0),
        };
        const saved = await services.deductionService.updateDeduction(updatedDeduction);
        if (saved) {
          setAllDeductionsData(prev => prev.map(d => d.id === editingDeduction.id ? saved : d));
          setDeductionDialogFeedback({type: 'success', message: "Deduction Updated", details: `Deduction for ${staffFullName} has been updated.`});
        } else {
          throw new Error("Update failed to return the saved deduction.");
        }
      } else {
        const newDeduction: Omit<Deduction, 'id'> = {
          staffId: deductionFormData.staffId!,
          deductionTypeId: deductionFormData.deductionTypeId!,
          description: deductionFormData.description!,
          originalAmount: deductionFormData.originalAmount!,
          monthlyDeduction: deductionFormData.monthlyDeduction!,
          deductedSoFar: deductionFormData.deductedSoFar!,
          startDate: deductionFormData.startDate!,
          companyId: selectedCompanyId,
          balance: (deductionFormData.originalAmount || 0) - (deductionFormData.deductedSoFar || 0),
          staffName: staffFullName,
          deductionTypeName: deductionTypeInfo.name,
        };
        const savedDeduction = await services.deductionService.createDeduction(newDeduction);
        if (savedDeduction) {
          setAllDeductionsData(prev => [savedDeduction, ...prev].sort((a,b) => a.id.localeCompare(b.id)));
          setDeductionDialogFeedback({type: 'success', message: "Deduction Added", details: `New deduction added for ${staffFullName}.`});
        } else {
          throw new Error("Create failed to return the new deduction.");
        }
      }
      resetSelectionAndPage();
      setTimeout(() => setIsDeductionDialogOpen(false), 1500);
    } catch (error) {
      console.error("Error saving deduction:", error);
      setDeductionDialogFeedback({type: 'error', message: "Save Failed", details: `Could not save deduction. ${(error as Error).message}`});
    }
  };

  const _idLikeDeductionFieldsForExport = ['id', 'staffId', 'deductionTypeId'];
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
        const value = row[col.key as keyof Deduction];
        if (col.isIdLike) {
            exportRow[col.label] = String(value || '');
        } else if (['originalAmount', 'monthlyDeduction', 'deductedSoFar'].includes(col.key)) {
            exportRow[col.label] = Math.round((value as number) || 0);
        } else if (col.key === 'startDate' && value && typeof value === 'string' && isValidDate(parse(value, 'yyyy-MM-dd', new Date()))) {
            exportRow[col.label] = format(parse(value, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy');
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
            exportHeaders.forEach(h => {
                const colDef = deductionColumnsForExport.find(c => c.label === h);
                if (colDef?.isIdLike) {
                  newRow[h] = String(row[h] || '');
                } else {
                  newRow[h] = (typeof row[h] === 'number' ? row[h] : String(row[h] || ''));
                }
            });
            return newRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(xlsxData, {header: exportHeaders, skipHeader: false});
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Deductions");
        XLSX.writeFile(workbook, fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") {
        const pdfData = dataToExport.map(row => exportHeaders.map(header => String(row[header] || '')));
        const doc = new jsPDF({ orientation: 'landscape' });
        (doc as any).autoTable({
          head: [exportHeaders],
          body: pdfData,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [102, 126, 234] },
          margin: { top: 10 },
        });
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
          if (papaParseErrors.length > 0 && rawData.length === 0) { setFeedback({type: 'error', message: "Import Failed", details: `Critical CSV parsing error: ${papaParseErrors[0] ? papaParseErrors[0].message : 'Unknown error'}. No data processed.`}); return; }

          const validationSkippedLog: string[] = [];
          let newCount = 0; let updatedCount = 0;
          const itemsToBulkPut: Deduction[] = [];
          const currentDeductions: Deduction[] = allDeductionsData;
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
                const value = String(rawRow[csvHeader] || '').trim();
                if (['originalAmount', 'monthlyDeduction', 'deductedSoFar'].includes(deductionKey as string)) {
                  (deductionObject as any)[deductionKey] = parseFloat(value.replace(/,/g, '')) || 0;
                } else if (deductionKey === 'startDate' && value) {
                    const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
                    if (isValidDate(parsedDate)) {
                         deductionObject.startDate = format(parsedDate, 'yyyy-MM-dd');
                    } else {
                        validationSkippedLog.push(`Row ${originalLineNumber}: Invalid StartDate format ('${value}'). Expected DD/MM/YYYY. Field cleared.`);
                        rowParseError = true;
                    }
                } else { (deductionObject as any)[deductionKey] = value; }
              }
            }
            
            const requiredFields: (keyof Omit<Deduction, 'staffName' | 'deductionTypeName' | 'balance'>)[] = ['id', 'staffId', 'deductionTypeId', 'description', 'originalAmount', 'monthlyDeduction', 'startDate'];
            const missingFields = requiredFields.filter(field => !(deductionObject as any)[field] || String((deductionObject as any)[field]).trim() === "");
            if (missingFields.length > 0) { validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Missing required field(s): ${missingFields.map(f => deductionColumnsForExport.find(c => c.key === f)?.label || f).join(', ')}.`); rowParseError = true; }
            const staffMember2 = staffList.find((s) => s.id === deductionObject.staffId);
            if (!staffMember2 && deductionObject.staffId) { validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Staff ID ${deductionObject.staffId} not found.`); rowParseError = true; }
            const deductionTypeInfo = deductionTypes.find((dt: DeductionType) => dt.id === deductionObject.deductionTypeId && dt.companyId === selectedCompanyId);
            if (!deductionTypeInfo && deductionObject.deductionTypeId) { validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: DeductionTypeID ${deductionObject.deductionTypeId} not found.`); rowParseError = true; }

            if (!rowParseError && staffMember2 && deductionTypeInfo) {
              const importedDeduction = deductionObject as Omit<Deduction, 'staffName' | 'deductionTypeName' | 'balance'>;
              const fullImportedDeduction: Deduction = {
                  ...importedDeduction, companyId: selectedCompanyId,
                  staffName: `${staffMember2.firstName} ${staffMember2.lastName}`,
                  deductionTypeName: deductionTypeInfo.name,
                  balance: (importedDeduction.originalAmount || 0) - (importedDeduction.deductedSoFar || 0)
              };
              const existingIndex = currentDeductions.findIndex((d: Deduction) => d.id === fullImportedDeduction.id && d.companyId === selectedCompanyId);
              if (existingIndex > -1) { const existingDeduction = currentDeductions[existingIndex]; const hasChanges = Object.keys(fullImportedDeduction).some(key => (fullImportedDeduction as any)[key] !== undefined && (fullImportedDeduction as any)[key] !== (existingDeduction as any)[key]); if (hasChanges) { itemsToBulkPut.push(fullImportedDeduction); updatedCount++; }
              } else { itemsToBulkPut.push(fullImportedDeduction); newCount++; }
            }
          }

          if (itemsToBulkPut.length > 0) { 
            try {
              const upsertedDeductions = await services.deductionService.bulkUpsertDeductions(itemsToBulkPut);
              // After a bulk operation, it's safest to reload all the data to ensure UI consistency.
              const updatedDeductionsList = await services.deductionService.getDeductionsByCompany(selectedCompanyId);
              setAllDeductionsData(updatedDeductionsList);

              // Update counts based on the result from the service if needed, or just from the initial parse
              // For simplicity, we'll stick with the counts determined during parsing.

            } catch (error) {
              console.error("Error during bulk import:", error);
              setFeedback({type: 'error', message: "Import Failed", details: `Could not save deductions. ${(error as Error).message}`});
            }
          }

          const totalPapaParseErrors = papaParseErrors.length;
          const totalValidationSkipped = validationSkippedLog.length;

          let feedbackTitle = "Import Processed";
          let feedbackMessage = "";
          let feedbackType: FeedbackMessage['type'] = 'info';

          if (newCount > 0 || updatedCount > 0) {
            feedbackTitle = "Import Successful";
            feedbackMessage = `${newCount} new deduction(s) added, ${updatedCount} existing deduction(s) updated.`;
            feedbackType = 'success';
          } else if (totalValidationSkipped > 0 && rawData.length === totalValidationSkipped) {
            feedbackTitle = "Import Failed";
            feedbackMessage = "All rows had validation errors. No data was imported.";
            feedbackType = 'error';
          } else if (totalPapaParseErrors > 0 && rawData.length === 0) {
            feedbackTitle = "Import Failed";
            feedbackMessage = "Critical CSV parsing error. No data could be read.";
            feedbackType = 'error';
          } else if (itemsToBulkPut.length === 0 && rawData.length > 0 && totalPapaParseErrors === 0 && totalValidationSkipped === 0) {
            feedbackTitle = "Import Note";
            feedbackMessage = "No changes detected. The data in the file appears to be identical to the existing data.";
          } else {
            feedbackTitle = "Import Note";
            feedbackMessage = "No new or updated deductions found to import.";
          }

          let details = "";
          const issueDetails: string[] = [];
          if (totalPapaParseErrors > 0) {
            issueDetails.push(`${totalPapaParseErrors} CSV parsing error(s)`);
          }
          if (totalValidationSkipped > 0) {
            issueDetails.push(`${totalValidationSkipped} validation error(s)`);
          }

          if (issueDetails.length > 0) {
            details = `${totalPapaParseErrors + totalValidationSkipped} row(s) had issues. (${issueDetails.join(', ')}).`;
            const firstPapaError = papaParseErrors[0]?.message;
            const firstValidationError = validationSkippedLog[0];
            if (firstPapaError) {
              details += ` First CSV error: ${firstPapaError}`;
            } else if (firstValidationError) {
              details += ` First validation error: ${firstValidationError}`;
            }
          }
          
          setFeedback({ type: feedbackType, message: `${feedbackTitle}: ${feedbackMessage}`, details });
          resetSelectionAndPage();
          if (event.target) event.target.value = '';
        }
      });
    }
  };

  const displayableDeductionTypes = useMemo(() => {
    if (!deductionTypeSearchTerm) {
      return deductionTypes.sort((a: DeductionType, b: DeductionType) => a.orderNumber - b.orderNumber);
    }
    return deductionTypes.filter((dt: DeductionType) =>
        dt.name.toLowerCase().includes(deductionTypeSearchTerm.toLowerCase()) ||
        dt.id.toLowerCase().includes(deductionTypeSearchTerm.toLowerCase())
    ).sort((a: DeductionType, b: DeductionType) => a.orderNumber - b.orderNumber);
  }, [deductionTypes, deductionTypeSearchTerm]);

  const dtTotalItems = displayableDeductionTypes.length;
  const dtTotalPages = Math.ceil(dtTotalItems / (dtRowsPerPage || 1)) || 1;
  const dtStartIndex = (dtCurrentPage - 1) * (dtRowsPerPage || 1);
  const dtEndIndex = dtStartIndex + (dtRowsPerPage || 1);
  const paginatedDeductionTypes = displayableDeductionTypes.slice(dtStartIndex, dtEndIndex);
  const handleSelectDeductionTypeRow = (itemId: string, checked: boolean) => { setSelectedDeductionTypeItems(prev => { const newSelected = new Set(prev); if (checked) newSelected.add(itemId); else newSelected.delete(itemId); return newSelected; }); };
  const handleSelectAllDeductionTypesOnPage = (checked: boolean) => { const pageItemIds = paginatedDeductionTypes.map(item => item.id); if (checked) { setSelectedDeductionTypeItems(prev => new Set([...prev, ...pageItemIds])); } else { const pageItemIdsSet = new Set(pageItemIds); setSelectedDeductionTypeItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id)))); } };
  const isAllDeductionTypesOnPageSelected = paginatedDeductionTypes.length > 0 && paginatedDeductionTypes.every(item => selectedDeductionTypeItems.has(item.id));


  const handleDeductionTypeFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeductionTypeFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleAddDeductionTypeClick = () => { 
    setFeedback(null); 
    setDeductionTypeDialogFeedback(null); 
    setEditingDeductionType(null); 
    setDeductionTypeFormData(defaultNewDeductionTypeData);
    setIsDeductionTypeDialogOpen(true); 
  };
  const handleEditDeductionTypeClick = (type: DeductionType) => { 
    setFeedback(null); 
    setDeductionTypeDialogFeedback(null); 
    setEditingDeductionType(type); 
    setIsDeductionTypeDialogOpen(true); 
  };
  const handleDeleteDeductionTypeClick = (type: DeductionType) => {
    setFeedback(null);
    setDeleteDeductionTypeDialogFeedback(null);
    if (type.isDeletable) {
        const isUsed = allDeductionsData.some(ded => ded.deductionTypeId === type.id);
        if (isUsed) {
            setDeleteDeductionTypeDialogFeedback({type: 'error', message: "Deletion Blocked", details: `Deduction type "${type.name}" is currently assigned to one or more staff deductions. Please reassign or remove these deductions before deleting the type.`});
            return;
        }
        setDeductionTypeToDelete(type); setIsDeleteDeductionTypeDialogOpen(true);
    } else {
        setDeleteDeductionTypeDialogFeedback({type: 'info', message: "Action Denied", details: `"${type.name}" is a core deduction type and cannot be deleted.`});
    }
  };

  const confirmDeleteDeductionType = async () => { if (deductionTypeToDelete) { await deleteDeductionTypesByIds([deductionTypeToDelete.id]); } setIsDeleteDeductionTypeDialogOpen(false); setDeductionTypeToDelete(null); };
  const handleOpenBulkDeleteDeductionTypesDialog = () => { 
    setFeedback(null); 
    setBulkDeleteDeductionTypesDialogFeedback(null); 
    if (selectedDeductionTypeItems.size === 0) { 
      setFeedback({type: 'info', message: "No Selection", details: "Please select deduction types to delete."}); 
      return; 
    } 
    setIsBulkDeleteDeductionTypesDialogOpen(true); 
  };
  const confirmBulkDeleteDeductionTypes = async () => { await deleteDeductionTypesByIds(Array.from(selectedDeductionTypeItems)); setIsBulkDeleteDeductionTypesDialogOpen(false); };

  // --- DEDUCTION TYPE CRUD (Supabase) ---
  const deleteDeductionTypesByIds = async (idsToDelete: string[]) => {
    setFeedback(null);
    if (!selectedCompanyId || idsToDelete.length === 0) return;

    const deletableTypeNames: string[] = [];
    const skippedNonDeletable: string[] = [];
    const skippedInUse: string[] = [];
    const actualIdsToDeleteFromDB: string[] = [];
    for (const id of idsToDelete) {
      const type = deductionTypes.find((dt: DeductionType) => dt.id === id);
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
    const feedbackMessages: string[] = [];
    if (skippedNonDeletable.length > 0) feedbackMessages.push(`${skippedNonDeletable.length} core type(s) skipped.`);
    if (skippedInUse.length > 0) feedbackMessages.push(`${skippedInUse.length} type(s) in use skipped.`);
    if (actualIdsToDeleteFromDB.length > 0) {
      try {
        await services.deductionService.deleteDeductionTypes(actualIdsToDeleteFromDB);

        // After deletion, adjust page if necessary
        const deletedFromDisplayable = displayableDeductionTypes.filter((dt: DeductionType) => actualIdsToDeleteFromDB.includes(dt.id)).length;
        if (deletedFromDisplayable > 0) {
            const newTotalItems = displayableDeductionTypes.length - deletedFromDisplayable;
            const newTotalPages = Math.ceil(newTotalItems / (dtRowsPerPage || 1)) || 1;
            if (dtCurrentPage > newTotalPages) {
                setDtCurrentPage(newTotalPages > 0 ? newTotalPages : 1);
            }
        }

        setDeductionTypes(prev => prev.filter(dt => !actualIdsToDeleteFromDB.includes(dt.id)).sort((a, b) => a.orderNumber - b.orderNumber));
        setSelectedDeductionTypeItems(prev => {
          const newSelected = new Set(prev);
          actualIdsToDeleteFromDB.forEach(id => newSelected.delete(id));
          return newSelected;
        });
        
        feedbackMessages.unshift(`Successfully deleted ${actualIdsToDeleteFromDB.length} deduction type(s).`);
        setFeedback({ type: 'success', message: 'Deletion Processed', details: feedbackMessages.join(' ') });
      } catch (error) {
        setFeedback({ type: 'error', message: 'Delete Failed', details: `Could not delete ${actualIdsToDeleteFromDB.length} deduction type(s). ${(error as Error).message}` });
      }
    } else if (feedbackMessages.length > 0) {
      setFeedback({ type: 'info', message: 'No Deletions Performed', details: feedbackMessages.join(' ') });
    }
  };

  // --- DEDUCTION TYPE ADD/EDIT (Supabase) ---
  const handleSaveDeductionType = async () => {
    setDeductionTypeDialogFeedback(null);
    if (!selectedCompanyId || !deductionTypeFormData.name || !deductionTypeFormData.name.trim()) {
      setDeductionTypeDialogFeedback({ type: 'error', message: 'Validation Error', details: 'Deduction type name is required.' });
      return;
    }

    try {
      if (editingDeductionType) {
        const updatedTypeData: Partial<DeductionType> & { id: string } = {
          ...deductionTypeFormData,
          id: editingDeductionType.id,
          companyId: selectedCompanyId,
        };
        const saved = await services.deductionService.updateDeductionType(updatedTypeData);
        if (saved) {
          setDeductionTypes(prev => prev.map((dt: DeductionType) => {
            if (dt.id === saved.id) {
              // Ensure saved has orderNumber and isDeletable
              return {
                ...dt,
                ...saved,
                orderNumber: (saved as any).orderNumber ?? dt.orderNumber,
                isDeletable: (saved as any).isDeletable ?? dt.isDeletable,
              };
            }
            return dt;
          }).sort((a, b) => a.orderNumber - b.orderNumber));
          setDeductionTypeDialogFeedback({type: 'success', message: "Update Successful", details: `Deduction type "${saved.name}" updated.`});
        } else {
           setDeductionTypeDialogFeedback({type: 'error', message: "Update Failed", details: "Could not save changes to the deduction type."});
        }
      } else {
        const newDeductionTypeData: Omit<DeductionType, 'id' | 'isDeletable' | 'isFixedName'> = {
          ...deductionTypeFormData,
          name: deductionTypeFormData.name!,
          companyId: selectedCompanyId,
          orderNumber: (deductionTypes.reduce((max, dt) => Math.max(max, dt.orderNumber), 0) || 0) + 1,
          isDefault: deductionTypeFormData.isDefault ?? false,
        };
        const saved = await services.deductionService.createDeductionType(newDeductionTypeData);
        if (saved) {
          setDeductionTypes(prev => [
            ...prev,
            {
              ...saved,
              orderNumber: (saved as any).orderNumber ?? ((prev.reduce((max, dt) => Math.max(max, dt.orderNumber), 0) || 0) + 1),
              isDeletable: typeof (saved as any).isDeletable === "boolean"
                ? (saved as any).isDeletable
                : !(
                    saved.id === DEFAULT_LOAN_DEDUCTION_TYPE_ID ||
                    saved.id === DEFAULT_ADVANCE_DEDUCTION_TYPE_ID ||
                    saved.id === DEFAULT_CHARGE_DEDUCTION_TYPE_ID
                  ),
            }
          ].sort((a, b) => a.orderNumber - b.orderNumber));
          setDeductionTypeDialogFeedback({type: 'success', message: "Deduction Type Added", details: `New deduction type "${saved.name}" added.`});
        } else {
          setDeductionTypeDialogFeedback({type: 'error', message: "Save Failed", details: "Could not create the new deduction type."});
        }
      }
      setTimeout(() => setIsDeductionTypeDialogOpen(false), 1500);
    } catch (error) {
      setDeductionTypeDialogFeedback({ type: 'error', message: 'Save Failed', details: `Could not save deduction type. ${(error as Error).message}` });
    }
  };

}

