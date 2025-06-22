"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlusCircle, Eye, Search, Upload, Download, FileText, FileSpreadsheet, FileType, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users, Loader2, AlertTriangle, Info, CheckCircle2, Settings, Edit } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox";
import { countries } from "@/lib/countries";
import { StaffMember, StaffStatus, EmployeeCategory, staffFromBackend, staffToBackend } from '@/lib/staffData';
import { CustomFieldDefinition } from '@/lib/customFieldDefinitionData';
import { getSupabaseClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { isValid as isValidDate, parseISO, format, parse } from 'date-fns';
import { useCompany } from '@/context/CompanyContext';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// --- STAFF TABLE NAME CONSTANT ---
const STAFF_TABLE = 'staff_members';

const statusColors: Record<StaffStatus, string> = {
  Active: "bg-green-500 hover:bg-green-600",
  Inactive: "bg-gray-500 hover:bg-gray-600",
};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];
const CFD_ROWS_PER_PAGE_OPTIONS = [5, 10, 20];

const sanitizeFilename = (name: string | null | undefined): string => {
    if (!name) return 'UnknownCompany';
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
};

type FeedbackMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
};

const defaultCustomFieldDefinitionData: Omit<CustomFieldDefinition, 'id' | 'companyId' | 'orderNumber' | 'isDeletable'> = {
  name: "",
  type: "Text",
};


export default function StaffPage() {
  const { selectedCompanyId, selectedCompanyName, isLoadingCompanyContext } = useCompany();
  const [allStaffForCompany, setAllStaffForCompany] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDeleteStaffDialogOpen, setIsDeleteStaffDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [isCfdDialogOpen, setIsCfdDialogOpen] = useState(false);
  const [editingCfd, setEditingCfd] = useState<CustomFieldDefinition | null>(null);
  const [cfdFormData, setCfdFormData] = useState(defaultCustomFieldDefinitionData);
  const [isDeleteCfdDialogOpen, setIsDeleteCfdDialogOpen] = useState(false);
  const [cfdToDelete, setCfdToDelete] = useState<CustomFieldDefinition | null>(null);
  const [cfdSearchTerm, setCfdSearchTerm] = useState("");
  const [cfdCurrentPage, setCfdCurrentPage] = useState(1);
  const [cfdRowsPerPage, setCfdRowsPerPage] = useState(CFD_ROWS_PER_PAGE_OPTIONS[1]);
  const [selectedCfdItems, setSelectedCfdItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteCfdDialogOpen, setIsBulkDeleteCfdDialogOpen] = useState(false);
  const cfdImportFileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const loadData = async () => {
      if (isLoadingCompanyContext || !selectedCompanyId) {
        if (!isLoadingCompanyContext && !selectedCompanyId) {
            setAllStaffForCompany([]);
            setCustomFieldDefinitions([]);
            setIsLoaded(true);
        }
        return;
      }
      setIsLoaded(false);
      setFeedback(null);
      try {
        // Fetch staff from Supabase (snake_case)
        const { data: staff, error: staffError } = await getSupabaseClient()
          .from(STAFF_TABLE)
          .select('*')
          .eq('company_id', selectedCompanyId);
        if (staffError) throw staffError;
        setAllStaffForCompany((staff || []).map(staffFromBackend));
        // Fetch custom field definitions from Supabase (snake_case)
        const { data: cfds, error: cfdError } = await getSupabaseClient()
          .from('custom_field_definitions')
          .select('*')
          .eq('company_id', selectedCompanyId);
        if (cfdError) throw cfdError;
        setCustomFieldDefinitions((cfds || []).map((cfd: any) => ({ ...cfd, orderNumber: cfd.order_number })).sort((a, b) => a.orderNumber - b.orderNumber));
      } catch (error) {
        setAllStaffForCompany([]);
        setCustomFieldDefinitions([]);
        setFeedback({ type: 'error', message: 'Could not load company data.', details: (error as Error).message });
      }
      setIsLoaded(true);
    };
    loadData();
  }, [selectedCompanyId, isLoadingCompanyContext]);

  useEffect(() => {
    if (isCfdDialogOpen) {
        if(editingCfd) {
            setCfdFormData({ name: editingCfd.name, type: editingCfd.type });
        } else {
            setCfdFormData(defaultCustomFieldDefinitionData);
        }
    }
  }, [isCfdDialogOpen, editingCfd]);

  // Use allStaffForCompanyUI (camelCase) for all UI logic
  const allStaffForCompanyUI = allStaffForCompany.map(staffFromBackend);

  // Use allStaffForCompanyUI in all UI/filter/search/export logic
  const filteredStaffSource = useMemo(() => allStaffForCompanyUI.filter(
    (staff) =>
      staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.email && staff.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (staff.department && staff.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (staff.designation && staff.designation.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [allStaffForCompanyUI, searchTerm]);

  const totalItems = filteredStaffSource.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedStaff = filteredStaffSource.slice(startIndex, endIndex);

  const handleSelectRow = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => { const newSelected = new Set(prev); if (checked) newSelected.add(itemId); else newSelected.delete(itemId); return newSelected; });
  };
  const handleSelectAllOnPage = (checked: boolean) => {
    const pageItemIds = paginatedStaff.map(item => item.id);
    if (checked) { setSelectedItems(prev => new Set([...prev, ...pageItemIds])); }
    else { const pageItemIdsSet = new Set(pageItemIds); setSelectedItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id)))); }
  };
  const isAllOnPageSelected = paginatedStaff.length > 0 && paginatedStaff.every(item => selectedItems.has(item.id));
  const resetSelectionAndPage = () => { setSelectedItems(new Set()); setCurrentPage(1); };


  const handleAddStaff = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({ type: 'error', message: 'No company selected. Cannot add staff.' }); return; }
    const formData = new FormData(event.currentTarget);
    const customFieldsData: Record<string, string> = {};
    customFieldDefinitions.forEach(cfd => {
      const value = formData.get(`customField_${cfd.id}`) as string;
      if (value !== null && value.trim() !== '') {
        customFieldsData[cfd.id] = value.trim();
      }
    });
    const newStaffUI = {
      companyId: selectedCompanyId,
      firstName: formData.get('firstName') as string, lastName: formData.get('lastName') as string,
      staffNumber: formData.get('staffNumber') as string, email: formData.get('email') as string,
      phone: formData.get('phone') as string, staffRssbNumber: formData.get('staffRssbNumber') as string,
      employeeCategory: formData.get('employeeCategory') as EmployeeCategory || 'P',
      gender: formData.get('gender') as StaffMember['gender'] || undefined,
      birthDate: formData.get('birthDate') as string || undefined,
      department: formData.get('department') as string,
      designation: formData.get('designation') as string || undefined,
      employmentDate: formData.get('employmentDate') as string || undefined,
      nationality: formData.get('nationality') as string, idPassportNumber: formData.get('idPassportNumber') as string,
      province: formData.get('province') as string, district: formData.get('district') as string,
      sector: formData.get('sector') as string, cell: formData.get('cell') as string, village: formData.get('village') as string,
      bankName: formData.get('bankName') as string, bankCode: formData.get('bankCode') as string, bankAccountNumber: formData.get('bankAccountNumber') as string,
      bankBranch: formData.get('bankBranch') as string,
      keyContactName: formData.get('keyContactName') as string, keyContactRelationship: formData.get('keyContactRelationship') as string,
      keyContactPhone: formData.get('keyContactPhone') as string, status: formData.get('status') as StaffStatus,
      customFields: customFieldsData,
    };
    try {
      const { data: inserted, error } = await getSupabaseClient()
        .from(STAFF_TABLE)
        .insert(staffToBackend(newStaffUI))
        .select();
      if (error) throw error;
      if (inserted && inserted.length > 0) {
        setAllStaffForCompany(prev => [staffFromBackend(inserted[0]), ...prev].sort((a, b) => a.id.localeCompare(b.id)));
        setFeedback({ type: 'success', message: `Staff Added`, details: `${newStaffUI.firstName} ${newStaffUI.lastName} has been added.` });
      } else {
        setFeedback({ type: 'success', message: `Staff Added`, details: `Staff member has been added.` });
      }
      setIsAddStaffDialogOpen(false); event.currentTarget.reset(); resetSelectionAndPage();
    } catch (error) {
      setFeedback({ type: 'error', message: 'Save Failed', details: 'Could not add staff member.' });
    }
  };

  const handleDeleteStaffs = async (staffIds: string[]) => {
    setFeedback(null);
    if (staffIds.length === 0 || !selectedCompanyId) return;
    try {
      for (const id of staffIds) { 
          const staffMember = allStaffForCompany.find(s => s.id === id);
          await getSupabaseClient()
            .from(STAFF_TABLE)
            .delete()
            .eq('id', id)
            .eq('company_id', selectedCompanyId);
          if (staffMember) {
               //await logAuditEvent("Staff Deleted", `Staff member ${staffMember.firstName} ${staffMember.lastName} (ID: ${id}) deleted.`, selectedCompanyId, selectedCompanyName);
          }
      }
      setAllStaffForCompany(prev => prev.filter(s => !staffIds.includes(s.id)));
      setSelectedItems(prev => { const newSelected = new Set(prev); staffIds.forEach(id => newSelected.delete(id)); return newSelected; });
      setFeedback({ type: 'success', message: "Staff Deleted", details: `Successfully deleted ${staffIds.length} staff member(s).` });
      if (currentPage > 1 && paginatedStaff.length === staffIds.length && filteredStaffSource.slice((currentPage - 2) * rowsPerPage, (currentPage - 1) * rowsPerPage).length > 0) { setCurrentPage(currentPage - 1); }
      else if (currentPage > 1 && paginatedStaff.length === staffIds.length && filteredStaffSource.slice((currentPage-1)*rowsPerPage).length === 0){ setCurrentPage( Math.max(1, currentPage -1)); }
    } catch (error) { setFeedback({ type: 'error', message: "Delete Failed", details: `Could not delete ${staffIds.length} staff member(s).` }); }
  };
  const handleDeleteSingleStaffClick = (staff: StaffMember) => { setFeedback(null); setStaffToDelete(staff); setIsDeleteStaffDialogOpen(true); };
  const confirmDeleteSingleStaff = async () => { if (staffToDelete) { await handleDeleteStaffs([staffToDelete.id]); } setIsDeleteStaffDialogOpen(false); setStaffToDelete(null); };
  const handleOpenBulkDeleteDialog = () => { setFeedback(null); if (selectedItems.size === 0) { setFeedback({ type: "info", message: "No staff members selected." }); return; } setIsBulkDeleteDialogOpen(true); };
  const confirmBulkDeleteStaff = async () => { await handleDeleteStaffs(Array.from(selectedItems)); setIsBulkDeleteDialogOpen(false); };

  const staffDataColumnsForExport = useMemo(() => {
    const baseCols = [
        { key: 'id', label: 'ID', isIdLike: true }, { key: 'firstName', label: 'FirstName' }, { key: 'lastName', label: 'LastName' },
        { key: 'staffNumber', label: 'StaffNumber', isIdLike: true }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone', isIdLike: true },
        { key: 'staffRssbNumber', label: 'StaffRssbNumber', isIdLike: true }, { key: 'employeeCategory', label: 'EmployeeCategory' }, { key: 'gender', label: 'Gender' }, { key: 'birthDate', label: 'BirthDate' },
        { key: 'department', label: 'Department' }, { key: 'designation', label: 'Designation'}, { key: 'employmentDate', label: 'EmploymentDate'},
        { key: 'nationality', label: 'Nationality' }, { key: 'idPassportNumber', label: 'IDPassportNumber', isIdLike: true },
        { key: 'province', label: 'Province' }, { key: 'district', label: 'District' }, { key: 'sector', label: 'Sector' },
        { key: 'cell', label: 'Cell' }, { key: 'village', label: 'Village' }, { key: 'bankName', label: 'BankName' },
        { key: 'bankCode', label: 'BankCode', isIdLike: true }, { key: 'bankAccountNumber', label: 'BankAccountNumber', isIdLike: true }, { key: 'bankBranch', label: 'BankBranch' },
        { key: 'keyContactName', label: 'KeyContactName' }, { key: 'keyContactRelationship', label: 'KeyContactRelationship' },
        { key: 'keyContactPhone', label: 'KeyContactPhone', isIdLike: true }, { key: 'status', label: 'Status' },
    ];
    const customFieldCols = customFieldDefinitions.map(cfd => ({
        key: `custom_${cfd.id}`,
        label: `Custom: ${cfd.name}`,
        isIdLike: cfd.type === "Number" // Only numbers should be treated as ID-like if custom
    }));
    return [...baseCols, ...customFieldCols];
  }, [customFieldDefinitions]);

  const exportData = (fileType: "csv" | "xlsx" | "pdf") => {
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({ type: 'error', message: "Error", details: "No company selected for export."}); return; }
    if (allStaffForCompany.length === 0) { setFeedback({ type: 'info', message: "No Data", details: "There is no staff data to export."}); return; }

    const headers = staffDataColumnsForExport.map(col => col.label);
    const dataToExport = allStaffForCompany.map(staff => {
        const row: Record<string, string | number> = {};
        staffDataColumnsForExport.forEach(col => {
            let value: any;
            if (col.key.startsWith('custom_')) {
                const cfdId = col.key.substring(7);
                value = staff.custom_fields?.[cfdId];
            } else {
                value = (staff as any)[col.key];
            }

            if (col.isIdLike) {
                row[col.label] = String(value || '');
            } else if (typeof value === 'number') {
                row[col.label] = value;
            } else if ((col.key === 'birthDate' || col.key === 'employmentDate' || (col.key.startsWith('custom_') && customFieldDefinitions.find(cfd => `custom_${cfd.id}` === col.key)?.type === 'Date')) && value && isValidDate(parse(value, 'yyyy-MM-dd', new Date()))) {
                row[col.label] = format(parse(value, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy');
            } else {
                 row[col.label] = String(value || '');
            }
        });
        return row;
    });
    const companyNameForFile = sanitizeFilename(selectedCompanyName);
    const fileName = `${companyNameForFile}_staff_export.${fileType}`;

    if (fileType === "csv") {
      const csvData = dataToExport.map(row => {
        const newRow: Record<string, string> = {};
        headers.forEach(header => {
          const colDef = staffDataColumnsForExport.find(c => c.label === header);
          let cellValue = String(row[header] || '');
          if (colDef?.isIdLike && /^\d+$/.test(cellValue) && cellValue.length > 0) {
            cellValue = `'${cellValue}`;
          }
          newRow[header] = cellValue;
        });
        return newRow;
      });
      const csvString = Papa.unparse(csvData, {header: true, columns: headers});
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', fileName); document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); setFeedback({ type: 'success', message: `Export Successful`, details: `${fileName} downloaded.`});
    } else if (fileType === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport, {header: headers, skipHeader: false});
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Data");
      XLSX.writeFile(workbook, fileName);
      setFeedback({ type: 'success', message: `Export Successful`, details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") {
      const pdfData = dataToExport.map(row => headers.map(h => String(row[h] || '')));
      const doc = new jsPDF({ orientation: 'landscape' });
      (doc as any).autoTable({ head: [headers], body: pdfData, styles: { fontSize: 6 }, headStyles: { fillColor: [102, 126, 234] }, margin: { top: 10 } });
      doc.save(fileName);
      setFeedback({ type: 'success', message: `Export Successful`, details: `${fileName} downloaded.`});
    }
  };

  const handleDownloadStaffTemplate = () => {
    setFeedback(null);
    const headers = staffDataColumnsForExport.map(col => col.label);
    const csvString = headers.join(',') + '\n';
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', 'staff_import_template.csv'); document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); setFeedback({ type: 'info', message: "Staff import template downloaded.", details: "Includes current custom fields. Dates should be in DD/MM/YYYY format. If data has commas, enclose field in double quotes."});
  };
  const handleImportClick = () => { setFeedback(null); if (!selectedCompanyId) { setFeedback({ type: 'error', message: "Error", details: "Please select a company." }); return; } fileInputRef.current?.click(); };

  const parseCSVToStaff = async (csvText: string, currentCompanyId: string, currentCustomFieldDefinitions: CustomFieldDefinition[]): Promise<{ data: StaffMember[], processedDataRowCount: number, papaParseErrors: Papa.ParseError[], validationSkippedLog: string[] }> => {
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true, skipEmptyLines: true,
        complete: (results) => {
          const parsedData: StaffMember[] = []; const validationSkippedLog: string[] = []; let processedDataRowCount = 0;
          const headerToStaffKeyMap: Record<string, keyof StaffMember | `custom_${string}`> = {};
          staffDataColumnsForExport.forEach(col => { headerToStaffKeyMap[col.label.toLowerCase().replace(/\s+/g, '')] = col.key as keyof StaffMember | `custom_${string}`; });
          results.data.forEach((rawRow: any, index: number) => {
            processedDataRowCount++; const originalLineNumber = index + 2;
            // Use camelCase for UI, then map to backend
            const staffObject: any = { companyId: currentCompanyId, customFields: {} };
            let rowParseError = false;
            for (const csvHeader in rawRow) {
              const normalizedCsvHeader = csvHeader.trim().toLowerCase().replace(/\s+/g, '');
              const mappedKey = headerToStaffKeyMap[normalizedCsvHeader];
              if (mappedKey) {
                let value = String(rawRow[csvHeader] || '').trim();
                if (mappedKey.startsWith('custom_')) {
                    const cfdId = mappedKey.substring(7);
                    const cfd = currentCustomFieldDefinitions.find(c => c.id === cfdId);
                    if (cfd && staffObject.customFields) {
                        if (cfd.type === "Date" && value) {
                            const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
                            if (isValidDate(parsedDate)) {
                                staffObject.customFields[cfd.id] = format(parsedDate, 'yyyy-MM-dd');
                            } else {
                                validationSkippedLog.push(`Row ${originalLineNumber}: Invalid Date format for custom field '${cfd.name}' ('${value}'). Expected DD/MM/YYYY. Field cleared.`);
                                staffObject.customFields[cfd.id] = "";
                            }
                        } else {
                           staffObject.customFields[cfd.id] = value;
                        }
                    }
                } else if (mappedKey === 'birth_date' || mappedKey === 'employment_date') {
                    if (value) {
                        const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
                        if (isValidDate(parsedDate)) {
                            staffObject[mappedKey] = format(parsedDate, 'yyyy-MM-dd');
                        } else {
                            validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Invalid Date format for ${mappedKey} ('${value}'). Expected DD/MM/YYYY. Field cleared.`);
                            staffObject[mappedKey] = undefined;
                        }
                    } else {
                        staffObject[mappedKey] = undefined;
                    }
                }
                else { staffObject[mappedKey] = value; }
              }
            }
            // Use camelCase for required fields
            const requiredFields = ['id', 'firstName', 'lastName', 'email', 'department', 'status'];
            const missingFields: string[] = [];
            requiredFields.forEach(field => { if (!staffObject[field] || String(staffObject[field]).trim() === "") { missingFields.push(staffDataColumnsForExport.find(c => c.key === field)?.label || field); }});
            if (missingFields.length > 0) { validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Missing required field(s): ${missingFields.join(', ')}.`); rowParseError = true; }
            if (staffObject.status && !['Active', 'Inactive'].includes(staffObject.status)) { validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Invalid Status value: '${staffObject.status}'.`); rowParseError = true; }
            if (staffObject.employeeCategory && !['P', 'C', 'E', 'S'].includes(staffObject.employeeCategory)) { validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Invalid EmployeeCategory value: '${staffObject.employeeCategory}'.`); rowParseError = true; }

            if (!rowParseError) {
              parsedData.push({
                ...staffObject,
                id: staffObject.id?.trim(),
                firstName: staffObject.firstName?.trim(),
                lastName: staffObject.lastName?.trim(),
                email: staffObject.email?.trim(),
                department: staffObject.department?.trim(),
                status: staffObject.status,
                employeeCategory: staffObject.employeeCategory || 'P',
                customFields: staffObject.customFields || {}
              });
            }
          });
          resolve({ data: parsedData, processedDataRowCount, papaParseErrors: results.errors, validationSkippedLog });
        }
      });
    });
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    if (!selectedCompanyId) {
      setFeedback({ type: 'error', message: 'Error', details: 'No company selected.' });
      return;
    }
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (!text || text.trim() === '') {
          setFeedback({ type: 'info', message: 'Import Note: CSV file is empty.' });
          return;
        }
        try {
          const { data: parsedStaffArray, processedDataRowCount, papaParseErrors, validationSkippedLog } = await parseCSVToStaff(text, selectedCompanyId, customFieldDefinitions);
          let newCount = 0;
          let updatedCount = 0;
          const { data: currentStaffForCompany = [] } = await getSupabaseClient()
            .from(STAFF_TABLE)
            .select('*')
            .eq('company_id', selectedCompanyId);
          for (const importedStaff of parsedStaffArray) {
            const existingStaff = (currentStaffForCompany || []).find((s: StaffMember) => s.id === importedStaff.id && s.company_id === selectedCompanyId);
            if (existingStaff) {
              const hasChanges = Object.keys(importedStaff).some(key => (importedStaff as any)[key] !== undefined && (importedStaff as any)[key] !== (existingStaff as any)[key]) || JSON.stringify(importedStaff.custom_fields) !== JSON.stringify(existingStaff.custom_fields);
              if (hasChanges) {
                await getSupabaseClient().from(STAFF_TABLE).upsert([ staffToBackend({ ...existingStaff, ...importedStaff, companyId: selectedCompanyId }) ]);
                updatedCount++;
              }
            } else {
              await getSupabaseClient().from(STAFF_TABLE).upsert([ staffToBackend({ ...importedStaff, companyId: selectedCompanyId }) ]);
              newCount++;
            }
          }
          const { data: updatedStaffList = [] } = await getSupabaseClient()
            .from(STAFF_TABLE)
            .select('*')
            .eq('company_id', selectedCompanyId);
          setAllStaffForCompany((updatedStaffList || []).map(staffFromBackend).sort((a: StaffMember, b: StaffMember) => a.id.localeCompare(b.id)));
          resetSelectionAndPage();
          let fbMsg = '';
          let fbTitle = 'Import Processed';
          let fbType: FeedbackMessage['type'] = 'info';
          const totalPapaErrors = papaParseErrors.length;
          const totalValidSkipped = validationSkippedLog.length;
          if (newCount > 0 || updatedCount > 0) {
            fbTitle = 'Import Successful';
            fbMsg = `${newCount} staff added, ${updatedCount} staff updated.`;
            fbType = 'success';
          } else if (parsedStaffArray.length === 0 && processedDataRowCount > 0 && (totalPapaErrors > 0 || totalValidSkipped > 0)) {
            fbTitle = 'Import Failed';
            fbMsg = `All ${processedDataRowCount} data rows processed, but no valid records imported.`;
            fbType = 'error';
          } else if (parsedStaffArray.length === 0 && processedDataRowCount === 0 && (totalPapaErrors > 0 || text.split('\n').filter(l=>l.trim()!=='').length > 1)) {
            fbTitle = 'Import Failed';
            fbMsg = `No data rows found or all had critical parsing errors.`;
            fbType = 'error';
          } else if (newCount === 0 && updatedCount === 0 && totalPapaErrors === 0 && totalValidSkipped === 0 && processedDataRowCount > 0) {
            fbTitle = 'Import Note';
            fbMsg = `CSV processed. ${processedDataRowCount} rows checked. No changes.`;
          } else {
            fbTitle = 'Import Note';
            fbMsg = 'No changes applied. CSV empty or data identical.';
          }
          let details = '';
          if (totalPapaErrors > 0 || totalValidSkipped > 0) {
            details += ` ${totalPapaErrors + totalValidSkipped} row(s) had issues.`;
            if (validationSkippedLog.length > 0) details += ` First skip: ${validationSkippedLog[0]}`;
            else if (totalPapaErrors > 0) details += ` First parsing error: ${papaParseErrors[0].message}`;
          }
          setFeedback({ type: fbType, message: `${fbTitle}: ${fbMsg}`, details });
        } catch (error: any) {
          setFeedback({ type: 'error', message: 'Import Failed', details: `Error: ${error.message || 'Could not parse CSV.'}` });
        }
      };
      reader.readAsText(file);
      if (event.target) event.target.value = '';
    }
  };

  const filteredCfdSource = useMemo(() => customFieldDefinitions.filter(cfd => cfd.name.toLowerCase().includes(cfdSearchTerm.toLowerCase()) || cfd.type.toLowerCase().includes(cfdSearchTerm.toLowerCase())), [customFieldDefinitions, cfdSearchTerm]);
  const cfdTotalItems = filteredCfdSource.length;
  const cfdTotalPages = Math.ceil(cfdTotalItems / cfdRowsPerPage) || 1;
  const cfdStartIndex = (cfdCurrentPage - 1) * cfdRowsPerPage;
  const cfdEndIndex = cfdStartIndex + cfdRowsPerPage;
  const paginatedCfds = filteredCfdSource.slice(cfdStartIndex, cfdEndIndex);
  const handleSelectCfdRow = (itemId: string, checked: boolean) => { setSelectedCfdItems(prev => { const newSelected = new Set(prev); if (checked) newSelected.add(itemId); else newSelected.delete(itemId); return newSelected; }); };
  const handleSelectAllCfdsOnPage = (checked: boolean) => { const pageItemIds = paginatedCfds.map(item => item.id); if (checked) { setSelectedCfdItems(prev => new Set([...prev, ...pageItemIds])); } else { const pageItemIdsSet = new Set(pageItemIds); setSelectedCfdItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id)))); } };
  const isAllCfdsOnPageSelected = paginatedCfds.length > 0 && paginatedCfds.every(item => selectedCfdItems.has(item.id));
  const handleCfdInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setCfdFormData(prev => ({ ...prev, [name]: value })); };
  const handleCfdTypeChange = (value: "Text" | "Number" | "Date") => { setCfdFormData(prev => ({ ...prev, type: value })); };
  const handleAddCfdClick = () => { setFeedback(null); setEditingCfd(null); setIsCfdDialogOpen(true); };
  const handleEditCfdClick = (cfd: CustomFieldDefinition) => { setFeedback(null); setEditingCfd(cfd); setIsCfdDialogOpen(true); };
  const handleDeleteCfdClick = (cfd: CustomFieldDefinition) => { setFeedback(null); const isUsed = allStaffForCompany.some(staff => staff.custom_fields && staff.custom_fields.hasOwnProperty(cfd.id)); if (isUsed) { setFeedback({type: 'error', message: "Deletion Blocked", details: `Custom field "${cfd.name}" is in use by staff and cannot be deleted.`}); return; } setCfdToDelete(cfd); setIsDeleteCfdDialogOpen(true); };

  // Fix: TableBody status label index, cast staff.status to StaffStatus or string as needed
  const statusLabels = {
    Active: "Active",
    Inactive: "Inactive",
  };

  const deleteCfdsByIds = async (idsToDelete: string[]) => {
    setFeedback(null); if (!selectedCompanyId || idsToDelete.length === 0) return; let actualIdsToDelete: string[] = []; let skippedInUseCount = 0;
    for (const id of idsToDelete) { const isUsed = allStaffForCompany.some(staff => staff.custom_fields && staff.custom_fields.hasOwnProperty(id)); if (isUsed) { skippedInUseCount++; } else { actualIdsToDelete.push(id); } }
    if (actualIdsToDelete.length === 0 && skippedInUseCount > 0) { setFeedback({type: 'info', message: "Deletion Blocked", details: `${skippedInUseCount} custom field(s) are in use and were not deleted.`}); return; }
    if (actualIdsToDelete.length === 0) { setFeedback({type: 'info', message: "No fields to delete."}); return; }
    try {
      for (const id of actualIdsToDelete) { await getSupabaseClient()
          .from('custom_field_definitions')
          .delete()
          .eq('id', id)
          .eq('companyId', selectedCompanyId);
      }
      setCustomFieldDefinitions(prev => prev.filter(cfd => !actualIdsToDelete.includes(cfd.id)).sort((a,b) => a.orderNumber - b.orderNumber));
      setSelectedCfdItems(prev => { const newSelected = new Set(prev); actualIdsToDelete.forEach(id => newSelected.delete(id)); return newSelected; });
      let msg = `Successfully deleted ${actualIdsToDelete.length} custom field(s).`; if (skippedInUseCount > 0) { msg += ` ${skippedInUseCount} field(s) were skipped as they are in use.`; }
      setFeedback({type: 'success', message: "Deletion Processed", details: msg});
      if (cfdCurrentPage > 1 && paginatedCfds.length === actualIdsToDelete.filter(id=>paginatedCfds.some(cfd=>cfd.id===id)).length && filteredCfdSource.slice((cfdCurrentPage - 2) * cfdRowsPerPage, (cfdCurrentPage - 1) * cfdRowsPerPage).length > 0) { setCfdCurrentPage(p => p - 1); }
      else if (cfdCurrentPage > 1 && paginatedCfds.length === actualIdsToDelete.filter(id=>paginatedCfds.some(cfd=>cfd.id===id)).length && filteredCfdSource.slice((cfdCurrentPage -1) * cfdRowsPerPage).length === 0) { setCfdCurrentPage(p => Math.max(1, p - 1));}
    } catch (error) { setFeedback({type: 'error', message: "Delete Failed", details: (error as Error).message}); }
  };
  const confirmDeleteCfd = async () => { if (cfdToDelete) { await deleteCfdsByIds([cfdToDelete.id]); } setIsDeleteCfdDialogOpen(false); setCfdToDelete(null); };
  const handleOpenBulkDeleteCfdDialog = () => { setFeedback(null); if (selectedCfdItems.size === 0) { setFeedback({type: 'info', message: "No selection"}); return; } setIsBulkDeleteCfdDialogOpen(true); };
  const confirmBulkDeleteCfds = async () => { await deleteCfdsByIds(Array.from(selectedCfdItems)); setIsBulkDeleteCfdDialogOpen(false); };
  const handleSaveCfd = async () => {
    setFeedback(null); if (!selectedCompanyId || !cfdFormData.name.trim()) { setFeedback({type: 'error', message: "Validation Error", details: "Name is required."}); return; }
    const existingName = customFieldDefinitions.find(cfd => cfd.name.toLowerCase() === cfdFormData.name.trim().toLowerCase() && (!editingCfd || cfd.id !== editingCfd.id) && cfd.companyId === selectedCompanyId);
    if (existingName) { setFeedback({type: 'error', message: "Name Exists", details: "A custom field with this name already exists for this company."}); return; }
    try {
      if (editingCfd) { const updatedCfd: CustomFieldDefinition = { ...editingCfd, ...cfdFormData, companyId: selectedCompanyId }; await getSupabaseClient()
          .from('custom_field_definitions')
          .upsert([updatedCfd]);
          setCustomFieldDefinitions(prev => prev.map(cfd => cfd.id === editingCfd.id ? updatedCfd : cfd).sort((a,b) => a.orderNumber - b.orderNumber)); setFeedback({type: 'success', message: "Field Updated"});
      } else { const maxOrder = customFieldDefinitions.reduce((max, cfd) => Math.max(max, cfd.orderNumber), 0); const newCfd: CustomFieldDefinition = { id: `cf_${Date.now()}_${selectedCompanyId.substring(3)}`, companyId: selectedCompanyId, ...cfdFormData, orderNumber: maxOrder + 1, isDeletable: true }; await getSupabaseClient()
          .from('custom_field_definitions')
          .upsert([{ ...newCfd, order_number: newCfd.orderNumber }]);
          setCustomFieldDefinitions(prev => [...prev, newCfd].sort((a,b) => a.orderNumber - b.orderNumber)); setFeedback({type: 'success', message: "Field Added"}); }
      setIsCfdDialogOpen(false);
    } catch (error) { setFeedback({type: 'error', message: "Save Failed", details: (error as Error).message}); }
  };
  const cfdExportColumns = [{key: 'id', label: 'ID', isIdLike: true}, {key: 'name', label: 'Name'}, {key: 'type', label: 'Type'}];
  const exportCfdData = (fileType: "csv" | "xlsx" | "pdf") => {
    setFeedback(null); if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "No company selected."}); return; } if (customFieldDefinitions.length === 0) { setFeedback({type: 'info', message: "No Data"}); return; }
    const headers = cfdExportColumns.map(c => c.label);
    const dataToExport = customFieldDefinitions.map(row => {
      const exportRow: Record<string, string | number> = {};
      cfdExportColumns.forEach(col => {
        let value = (row as any)[col.key];
        if (col.isIdLike) {
          exportRow[col.label] = String(value || '');
        } else if (typeof value === 'number') {
          exportRow[col.label] = value;
        } else {
          exportRow[col.label] = String(value || '');
        }
      });
      return exportRow;
    });
    const companyNameForFile = sanitizeFilename(selectedCompanyName); const fileName = `${companyNameForFile}_custom_fields_export.${fileType}`;
    if (fileType === "csv") {
      const csvData = dataToExport.map(row => {
        const newRow: Record<string, string> = {};
        headers.forEach(header => {
          const colDef = cfdExportColumns.find(c => c.label === header);
          let cellValue = String(row[header] || '');
          if (colDef?.isIdLike && /^\d+$/.test(cellValue) && cellValue.length > 0) {
            cellValue = `'${cellValue}`;
          }
          newRow[header] = cellValue;
        });
        return newRow;
      });
      const csvString = Papa.unparse(csvData, { header: true, columns: headers });
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', fileName); document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "xlsx") { const worksheet = XLSX.utils.json_to_sheet(dataToExport, {header: headers, skipHeader: false}); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Custom Fields"); XLSX.writeFile(workbook, fileName); setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") { const doc = new jsPDF({ orientation: 'p' }); (doc as any).autoTable({ head: [headers], body: dataToExport.map(row => headers.map(header => String(row[header] || ''))), styles: { fontSize: 9 }, headStyles: { fillColor: [102, 126, 234] }, margin: { top: 10 } }); doc.save(fileName); setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`}); }
  };
  const handleDownloadCfdTemplate = () => { setFeedback(null); const headers = ['ID', 'Name', 'Type']; const csvString = headers.join(',') + '\n'; const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', 'custom_fields_template.csv'); document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); setFeedback({type: 'info', message: "Template Downloaded", details: "Dates should be in DD/MM/YYYY format. If a field contains commas, enclose field in double quotes."}); };
  const handleCfdImportClick = () => { setFeedback(null); if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "Please select a company."}); return; } cfdImportFileInputRef.current?.click(); };
  const handleCfdFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null); if (!selectedCompanyId) { setFeedback({ type: 'error', message: "Error", details: "No company selected." }); return; } const file = event.target.files?.[0];
    if (file) { Papa.parse(file, { header: true, skipEmptyLines: true, complete: async (results) => {
          const { data: rawData, errors: papaParseErrors } = results; if (papaParseErrors.length > 0 && rawData.length === 0) { setFeedback({type: 'error', message: "Import Failed", details: papaParseErrors[0].message}); return; }
          const validationSkippedLog: string[] = []; let newCount = 0, updatedCount = 0; const itemsToBulkPut: CustomFieldDefinition[] = []; const { data: existingCfds = [] } = await getSupabaseClient()
            .from('custom_field_definitions')
            .select('*')
            .eq('company_id', selectedCompanyId);
          let maxOrder = (existingCfds || []).reduce((max: number, cfd: any) => Math.max(max, cfd.order_number), 0);
          for (const [index, rawRowUntyped] of (rawData as any[]).entries()) {
            const rawRow = rawRowUntyped as Record<string, string>; const originalLineNumber = index + 2;
            const id = String(rawRow.ID || '').trim(); const name = String(rawRow.Name || '').trim(); const type = String(rawRow.Type || 'Text').trim() as "Text" | "Number" | "Date";
            if (!name) { validationSkippedLog.push(`Row ${originalLineNumber} skipped: Name is required.`); continue; }
            if (!["Text", "Number", "Date"].includes(type)) { validationSkippedLog.push(`Row ${originalLineNumber} (Name: ${name}) skipped: Invalid Type '${type}'. Must be Text, Number, or Date.`); continue; }
            const existingByName = (existingCfds || []).find((c: any) => c.name.toLowerCase() === name.toLowerCase() && c.id !== id && c.company_id === selectedCompanyId); if (existingByName) { validationSkippedLog.push(`Row ${originalLineNumber} (Name: ${name}) skipped: Name already exists for this company.`); continue; }
            const existingCfd = id ? (existingCfds || []).find((c: any) => c.id === id && c.company_id === selectedCompanyId) : null;
            if (existingCfd) { itemsToBulkPut.push({ ...existingCfd, name, type }); updatedCount++; }
            else { maxOrder++; itemsToBulkPut.push({ id: id || `cf_${Date.now()}_${selectedCompanyId.substring(3)}`, companyId: selectedCompanyId, name, type, orderNumber: maxOrder, isDeletable: true }); newCount++; }
          }
          if (itemsToBulkPut.length > 0) {
            for (const cfd of itemsToBulkPut) {
              await getSupabaseClient().from('custom_field_definitions').upsert([{ ...cfd, company_id: cfd.companyId }]);
            }
            const { data: updatedList = [] } = await getSupabaseClient()
              .from('custom_field_definitions')
              .select('*')
              .eq('company_id', selectedCompanyId);
            setCustomFieldDefinitions((updatedList || []).map((cfd: any) => ({ ...cfd, orderNumber: cfd.order_number })).sort((a: any, b: any) => a.orderNumber - b.orderNumber));
          }
          let fbMsg = ""; let fbTitle = "Import Processed"; let fbType: FeedbackMessage['type'] = 'info'; if (newCount > 0 || updatedCount > 0) { fbTitle = "Import Successful"; fbMsg = `${newCount} fields added, ${updatedCount} updated.`; fbType = 'success'; } else if (rawData.length > 0 && papaParseErrors.length === 0 && validationSkippedLog.length === 0) { fbMsg = `CSV processed. ${rawData.length} rows. No changes.`; } else { fbMsg = "No changes applied."; }
          let details = ""; if (papaParseErrors.length > 0 || validationSkippedLog.length > 0) { details += ` ${papaParseErrors.length + validationSkippedLog.length} row(s) had issues.`; if (validationSkippedLog.length > 0) details += ` First: ${validationSkippedLog[0]}`; else if (papaParseErrors.length > 0) details += ` First: ${papaParseErrors[0].message}`; }
          setFeedback({type: fbType, message: `${fbTitle}: ${fbMsg}`, details});
    }}); if (event.target) event.target.value = ''; }
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

  if (isLoadingCompanyContext) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading company information...</div>;
  if (!selectedCompanyId) return <div className="flex flex-col items-center justify-center h-64 text-center"><Users className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-xl font-semibold">No Company Selected</p><p className="text-muted-foreground">Please select a company to manage staff.</p><Button asChild className="mt-4"><Link href="/select-company">Go to Company Selection</Link></Button></div>;
  if (!isLoaded) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading staff data...</div>;

  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        const parsed = parse(dateString, 'yyyy-MM-dd', new Date()); 
        if (isValidDate(parsed)) {
            return format(parsed, 'dd/MM/yyyy');
        }
        return 'N/A';
    } catch (e) {
        return 'N/A';
    }
  };

  return (
    <div className="space-y-8">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
      <input type="file" ref={cfdImportFileInputRef} onChange={handleCfdFileUpload} accept=".csv" className="hidden" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div><div className="flex items-center gap-2 mb-1"><Users className="h-7 w-7 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Staff Management</h1></div><p className="text-muted-foreground">View, add, and manage employee records and custom fields for the current company.</p></div>
      </div>
      {renderFeedbackMessage()}

      <Tabs defaultValue="staffMembers">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="staffMembers">Staff Members</TabsTrigger>
          <TabsTrigger value="customFields">Custom Fields</TabsTrigger>
        </TabsList>

        <TabsContent value="staffMembers">
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Users className="mr-2 h-6 w-6 text-primary" />Staff Members</CardTitle><CardDescription>List of all staff members in the current company.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="search" placeholder="Search staff..." className="w-full pl-10" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); setSelectedItems(new Set()); setFeedback(null);}} disabled={!selectedCompanyId}/></div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={!selectedCompanyId} onClick={() => setFeedback(null)}><Upload className="mr-2 h-4 w-4" /> Import / Template</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={handleDownloadStaffTemplate}><Download className="mr-2 h-4 w-4" /> Download Template</DropdownMenuItem><DropdownMenuItem onClick={handleImportClick}><Upload className="mr-2 h-4 w-4" /> Upload Data</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={!selectedCompanyId || allStaffForCompany.length === 0} onClick={() => setFeedback(null)}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-full sm:w-auto"><DropdownMenuItem onClick={() => exportData("csv")}><FileText className="mr-2 h-4 w-4" /> Export as CSV</DropdownMenuItem><DropdownMenuItem onClick={() => exportData("xlsx")}><FileSpreadsheet className="mr-2 h-4 w-4" /> Export as XLSX</DropdownMenuItem><DropdownMenuItem onClick={() => exportData("pdf")}><FileType className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                  <Dialog open={isAddStaffDialogOpen} onOpenChange={(isOpen) => { setIsAddStaffDialogOpen(isOpen); if (!isOpen) setFeedback(null); }}>
                    <DialogTrigger asChild><Button className="w-full sm:w-auto" disabled={!selectedCompanyId} onClick={() => setFeedback(null)}><PlusCircle className="mr-2 h-4 w-4" /> Add Staff</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[725px] md:max-w-[850px] lg:max-w-[1000px]">
                      <form onSubmit={handleAddStaff}>
                        <DialogHeader><DialogTitle>Add New Staff Member</DialogTitle><DialogDescription>Fill in the details. Click save when done.</DialogDescription></DialogHeader>
                        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4" tabIndex={0}>
                          <h3 className="text-lg font-medium text-foreground border-b pb-2 mb-2">Personal &amp; Employment</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label htmlFor="firstName">First Name *</Label><Input id="firstName" name="firstName" required /></div>
                            <div className="space-y-2"><Label htmlFor="lastName">Last Name *</Label><Input id="lastName" name="lastName" required /></div>
                            <div className="space-y-2"><Label htmlFor="staffNumber">Staff Number</Label><Input id="staffNumber" name="staffNumber" /></div>
                            <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" name="email" type="email" required /></div>
                            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" /></div>
                            <div className="space-y-2"><Label htmlFor="staffRssbNumber">RSSB Number</Label><Input id="staffRssbNumber" name="staffRssbNumber" /></div>
                            <div className="space-y-2">
                                <Label htmlFor="employeeCategory">Employee Category</Label>
                                <Select name="employeeCategory" defaultValue="P">
                                  <SelectTrigger id="employeeCategory"><SelectValue placeholder="Select Category" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="P">P (Permanent)</SelectItem>
                                    <SelectItem value="C">C (Casual)</SelectItem>
                                    <SelectItem value="E">E (Exempted)</SelectItem>
                                    <SelectItem value="S">S (Second Employer)</SelectItem>
                                  </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"><Label htmlFor="gender">Gender</Label><Select name="gender"><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label htmlFor="birthDate">Birth Date</Label><Input id="birthDate" name="birthDate" type="date" /></div>
                            <div className="space-y-2"><Label htmlFor="department">Department *</Label><Select name="department" required><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Engineering">Engineering</SelectItem><SelectItem value="Marketing">Marketing</SelectItem><SelectItem value="Sales">Sales</SelectItem><SelectItem value="Human Resources">HR</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Operations">Operations</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label htmlFor="designation">Designation</Label><Input id="designation" name="designation"/></div>
                            <div className="space-y-2"><Label htmlFor="employmentDate">Employment Date</Label><Input id="employmentDate" name="employmentDate" type="date" /></div>
                            <div className="space-y-2"><Label htmlFor="nationality">Nationality</Label><Select name="nationality"><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent className="max-h-60">{countries.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent></Select></div>
                            <div className="space-y-2"><Label htmlFor="idPassportNumber">ID/Passport No.</Label><Input id="idPassportNumber" name="idPassportNumber"/></div>
                          </div>
                           <h3 className="text-lg font-medium text-foreground border-b pb-2 mt-6 mb-2">Address</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label htmlFor="province">Province</Label><Select name="province"><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="kigali_city">Kigali City</SelectItem><SelectItem value="eastern">Eastern</SelectItem><SelectItem value="northern">Northern</SelectItem><SelectItem value="southern">Southern</SelectItem><SelectItem value="western">Western</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label htmlFor="district">District</Label><Input id="district" name="district"/></div>
                                <div className="space-y-2"><Label htmlFor="sector">Sector</Label><Input id="sector" name="sector"/></div>
                                <div className="space-y-2"><Label htmlFor="cell">Cell</Label><Input id="cell" name="cell"/></div>
                                <div className="space-y-2"><Label htmlFor="village">Village</Label><Input id="village" name="village"/></div>
                           </div>
                          <h3 className="text-lg font-medium text-foreground border-b pb-2 mt-6 mb-2">Bank Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="bankName">Bank Name</Label><Input id="bankName" name="bankName" /></div>
                            <div className="space-y-2"><Label htmlFor="bankCode">Bank Code</Label><Input id="bankCode" name="bankCode" /></div>
                            <div className="space-y-2"><Label htmlFor="bankAccountNumber">Account No.</Label><Input id="bankAccountNumber" name="bankAccountNumber" /></div>
                            <div className="space-y-2"><Label htmlFor="bankBranch">Branch</Label><Input id="bankBranch" name="bankBranch" /></div>
                          </div>
                          <h3 className="text-lg font-medium text-foreground border-b pb-2 mt-6 mb-2">Emergency Contact</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label htmlFor="keyContactName">Name</Label><Input id="keyContactName" name="keyContactName" /></div>
                            <div className="space-y-2"><Label htmlFor="keyContactRelationship">Relationship</Label><Select name="keyContactRelationship"><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="spouse">Spouse</SelectItem><SelectItem value="parent">Parent</SelectItem><SelectItem value="sibling">Sibling</SelectItem><SelectItem value="child">Child</SelectItem><SelectItem value="friend">Friend</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label htmlFor="keyContactPhone">Phone</Label><Input id="keyContactPhone" name="keyContactPhone" type="tel" /></div>
                          </div>
                          <h3 className="text-lg font-medium text-foreground border-b pb-2 mt-6 mb-2">Employment Status</h3>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2"><Label htmlFor="status">Status *</Label><Select name="status" defaultValue="Active" required><SelectTrigger id="status"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select></div>
                           </div>
                           {customFieldDefinitions.length > 0 && (
                            <>
                                <h3 className="text-lg font-medium text-foreground border-b pb-2 mt-6 mb-2">Custom Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {customFieldDefinitions.map(cfd => (
                                        <div key={cfd.id} className="space-y-2">
                                            <Label htmlFor={`customField_${cfd.id}`}>{cfd.name}</Label>
                                            <Input id={`customField_${cfd.id}`} name={`customField_${cfd.id}`} type={cfd.type === "Number" ? "number" : cfd.type === "Date" ? "date" : "text"} />
                                        </div>
                                    ))}
                                </div>
                            </>
                           )}
                        </div>
                        <DialogFooter className="pt-4 border-t"><Button type="button" variant="outline" onClick={() => setIsAddStaffDialogOpen(false)}>Cancel</Button><Button type="submit">Save Staff</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              {selectedItems.size > 0 && (<div className="my-4 flex items-center justify-between p-3 bg-muted/50 rounded-md"><span className="text-sm text-muted-foreground">{selectedItems.size} staff selected</span><Button variant="destructive" onClick={handleOpenBulkDeleteDialog} disabled={!selectedCompanyId}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected</Button></div>)}
              <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap w-[50px]"><Checkbox checked={isAllOnPageSelected} onCheckedChange={handleSelectAllOnPage} aria-label="Select all on page" disabled={paginatedStaff.length === 0}/></TableHead><TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap">ID</TableHead><TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap">Name</TableHead><TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap">Email</TableHead><TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap">Department</TableHead><TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap">Birth Date</TableHead><TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap">Status</TableHead><TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{paginatedStaff.map(staff => (<TableRow key={staff.id} data-state={selectedItems.has(staff.id) ? "selected" : ""}><TableCell><Checkbox checked={selectedItems.has(staff.id)} onCheckedChange={(c) => handleSelectRow(staff.id, Boolean(c))} aria-label={`Select ${staff.id}`}/></TableCell><TableCell>{staff.id}</TableCell><TableCell className="font-medium">{staff.firstName} {staff.lastName}</TableCell><TableCell>{staff.email}</TableCell><TableCell>{staff.department}</TableCell><TableCell>{formatDateForDisplay(staff.birthDate)}</TableCell><TableCell><Badge className={`${statusColors[staff.status as StaffStatus] ?? "bg-gray-400"} text-white`}>{staff.status}</Badge></TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" asChild title="View/Edit" onClick={() => setFeedback(null)}><Link href={`/app/staff/${staff.id}`}><Eye className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive/90" onClick={() => handleDeleteSingleStaffClick(staff)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}{paginatedStaff.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center h-24">No staff members.</TableCell></TableRow>)}</TableBody></Table>
              </div>
              {totalPages > 1 && (<div className="flex items-center justify-between py-4"><div className="text-sm text-muted-foreground">{selectedItems.size > 0 ? `${selectedItems.size} of ${totalItems} row(s) selected.` : `Page ${currentPage} of ${totalPages} (${totalItems} total items)`}</div><div className="flex items-center space-x-6 lg:space-x-8"><div className="flex items-center space-x-2"><p className="text-sm font-medium">Rows per page</p><Select value={`${rowsPerPage}`} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); setSelectedItems(new Set());}}><SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${rowsPerPage}`} /></SelectTrigger><SelectContent side="top">{ROWS_PER_PAGE_OPTIONS.map(s => (<SelectItem key={s} value={`${s}`}>{s}</SelectItem>))}</SelectContent></Select></div><div className="flex w-[100px] items-center justify-center text-sm font-medium">Page {currentPage} of {totalPages}</div><div className="flex items-center space-x-2"><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCurrentPage(1); setSelectedItems(new Set());}} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCurrentPage(p => p - 1); setSelectedItems(new Set());}} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCurrentPage(p => p + 1); setSelectedItems(new Set());}} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCurrentPage(totalPages); setSelectedItems(new Set());}} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button></div></div></div>)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customFields">
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Settings className="mr-2 h-6 w-6 text-primary" />Custom Fields</CardTitle><CardDescription>Define company-specific custom fields for staff records. Available types: Text, Number, Date.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="search" placeholder="Search custom fields..." className="w-full pl-10" value={cfdSearchTerm} onChange={(e) => { setCfdSearchTerm(e.target.value); setCfdCurrentPage(1); setFeedback(null); }} disabled={!selectedCompanyId}/></div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={!selectedCompanyId} onClick={() => setFeedback(null)}><Upload className="mr-2 h-4 w-4" /> Import / Template</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={handleDownloadCfdTemplate}><Download className="mr-2 h-4 w-4" /> Download Template</DropdownMenuItem><DropdownMenuItem onClick={handleCfdImportClick}><Upload className="mr-2 h-4 w-4" /> Upload Data</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={!selectedCompanyId || customFieldDefinitions.length === 0} onClick={() => setFeedback(null)}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => exportCfdData("csv")}><FileText className="mr-2 h-4 w-4" /> Export as CSV</DropdownMenuItem><DropdownMenuItem onClick={() => exportCfdData("xlsx")}><FileSpreadsheet className="mr-2 h-4 w-4" /> Export as XLSX</DropdownMenuItem><DropdownMenuItem onClick={() => exportCfdData("pdf")}><FileType className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                  <Button onClick={handleAddCfdClick} disabled={!selectedCompanyId} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Custom Field</Button>
                </div>
              </div>
              {selectedCfdItems.size > 0 && (<div className="my-2 flex items-center justify-between p-3 bg-muted/50 rounded-md"><span className="text-sm text-muted-foreground">{selectedCfdItems.size} field(s) selected</span><Button variant="destructive" onClick={handleOpenBulkDeleteCfdDialog}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected</Button></div>)}
              <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead className="sticky top-0 z-10 bg-card w-[50px]"><Checkbox checked={isAllCfdsOnPageSelected} onCheckedChange={handleSelectAllCfdsOnPage} aria-label="Select all fields on page" disabled={paginatedCfds.length === 0}/></TableHead><TableHead className="sticky top-0 z-10 bg-card">Field Name</TableHead><TableHead className="sticky top-0 z-10 bg-card">Type</TableHead><TableHead className="sticky top-0 z-10 bg-card text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{paginatedCfds.map(cfd => (<TableRow key={cfd.id} data-state={selectedCfdItems.has(cfd.id) ? "selected" : ""}><TableCell><Checkbox checked={selectedCfdItems.has(cfd.id)} onCheckedChange={(c) => handleSelectCfdRow(cfd.id, Boolean(c))} aria-label={`Select ${cfd.name}`}/></TableCell><TableCell className="font-medium">{cfd.name}</TableCell><TableCell>{cfd.type}</TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => handleEditCfdClick(cfd)} title="Edit Field"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteCfdClick(cfd)} title="Delete Field" className="text-destructive hover:text-destructive/90"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}{paginatedCfds.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center h-24">No custom fields defined.</TableCell></TableRow>)}</TableBody></Table></div>
              {cfdTotalPages > 1 && (<div className="flex items-center justify-between py-4"><div className="text-sm text-muted-foreground">{selectedCfdItems.size > 0 ? `${selectedCfdItems.size} field(s) selected.` : `Page ${cfdCurrentPage} of ${cfdTotalPages} (${cfdTotalItems} fields)`}</div><div className="flex items-center space-x-6 lg:space-x-8"><div className="flex items-center space-x-2"><p className="text-sm font-medium">Rows per page</p><Select value={`${cfdRowsPerPage}`} onValueChange={(v) => { setCfdRowsPerPage(Number(v)); setCfdCurrentPage(1); setSelectedCfdItems(new Set());}}><SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${cfdRowsPerPage}`} /></SelectTrigger><SelectContent side="top">{CFD_ROWS_PER_PAGE_OPTIONS.map(s => (<SelectItem key={`cfd-${s}`} value={`${s}`}>{s}</SelectItem>))}</SelectContent></Select></div><div className="flex items-center space-x-2"><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCfdCurrentPage(1); setSelectedCfdItems(new Set());}} disabled={cfdCurrentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCfdCurrentPage(p => p - 1); setSelectedCfdItems(new Set());}} disabled={cfdCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCfdCurrentPage(p => p + 1); setSelectedCfdItems(new Set());}} disabled={cfdCurrentPage === cfdTotalPages}><ChevronRight className="h-4 w-4" /></Button><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCfdCurrentPage(totalPages); setSelectedCfdItems(new Set());}} disabled={cfdCurrentPage === cfdTotalPages}><ChevronsRight className="h-4 w-4" /></Button></div></div></div>)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      <AlertDialog open={isDeleteStaffDialogOpen} onOpenChange={(isOpen) => { setIsDeleteStaffDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete staff member: "{staffToDelete?.first_name} {staffToDelete?.last_name}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteSingleStaff} className="bg-destructive hover:bg-destructive/90">Delete Staff</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={(isOpen) => { setIsBulkDeleteDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete {selectedItems.size} selected staff member(s)? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmBulkDeleteStaff} className="bg-destructive hover:bg-destructive/90">Delete Selected Staff</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCfdDialogOpen} onOpenChange={(isOpen) => { setIsCfdDialogOpen(isOpen); if (!isOpen) setFeedback(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingCfd ? "Edit" : "Add New"} Custom Field</DialogTitle><DialogDescription>Define a new field for staff records in this company.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4"><div className="space-y-2"><Label htmlFor="cfdName">Field Name *</Label><Input id="cfdName" name="name" value={cfdFormData.name} onChange={handleCfdInputChange} placeholder="e.g., T-Shirt Size"/></div>
            <div className="space-y-2"><Label htmlFor="cfdType">Field Type *</Label><Select name="type" value={cfdFormData.type} onValueChange={(v) => handleCfdTypeChange(v as "Text" | "Number" | "Date")}><SelectTrigger id="cfdType"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="Text">Text</SelectItem><SelectItem value="Number">Number</SelectItem><SelectItem value="Date">Date</SelectItem></SelectContent></Select></div>
          </div><DialogFooter><Button variant="outline" onClick={() => setIsCfdDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveCfd}>Save Field</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteCfdDialogOpen} onOpenChange={(isOpen) => { setIsDeleteCfdDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete custom field "{cfdToDelete?.name}"? This cannot be undone if not in use.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteCfd} className="bg-destructive hover:bg-destructive/90">Delete Field</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isBulkDeleteCfdDialogOpen} onOpenChange={(isOpen) => { setIsBulkDeleteCfdDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>Delete {selectedCfdItems.size} selected custom field(s)? Fields in use by staff will be skipped.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmBulkDeleteCfds} className="bg-destructive hover:bg-destructive/90">Delete Selected Fields</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
