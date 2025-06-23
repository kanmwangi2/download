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
      try {        // Fetch staff from Supabase (keep as snake_case backend format)
        const { data: staff, error: staffError } = await getSupabaseClient()
          .from(STAFF_TABLE)
          .select('*')
          .eq('company_id', selectedCompanyId);
        if (staffError) throw staffError;
        setAllStaffForCompany(staff || []);
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
  }, [isCfdDialogOpen, editingCfd]);  // Transform backend data to UI format (camelCase) for filtering and display
  const allStaffForCompanyUI = useMemo(() => 
    allStaffForCompany.map(staffFromBackend), [allStaffForCompany]
  );

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
      if (error) throw error;      if (inserted && inserted.length > 0) {
        setAllStaffForCompany(prev => [inserted[0], ...prev].sort((a, b) => a.id.localeCompare(b.id)));
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
            .eq('company_id', selectedCompanyId);          if (staffMember) {
               //await logAuditEvent("Staff Deleted", `Staff member ${staffMember.first_name} ${staffMember.last_name} (ID: ${id}) deleted.`, selectedCompanyId, selectedCompanyName);
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
    if (!selectedCompanyId) { setFeedback({ type: 'error', message: "Error", details: "No company selected for export."}); return; }    if (allStaffForCompanyUI.length === 0) { setFeedback({ type: 'info', message: "No Data", details: "There is no staff data to export."}); return; }

    const headers = staffDataColumnsForExport.map(col => col.label);
    const dataToExport = allStaffForCompanyUI.map(staff => {
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
          let upsertError: any = null;
          for (const importedStaff of parsedStaffArray) {
            const existingStaff = (currentStaffForCompany || []).find((s: StaffMember) => s.id === importedStaff.id && s.company_id === selectedCompanyId);
            if (existingStaff) {
              const hasChanges = Object.keys(importedStaff).some(key => (importedStaff as any)[key] !== undefined && (importedStaff as any)[key] !== (existingStaff as any)[key]) || JSON.stringify(importedStaff.custom_fields) !== JSON.stringify(existingStaff.custom_fields);
              if (hasChanges) {
                const { error } = await getSupabaseClient().from(STAFF_TABLE).upsert([ staffToBackend({ ...existingStaff, ...importedStaff, companyId: selectedCompanyId }) ]);
                if (error) upsertError = error;
                updatedCount++;
              }
            } else {
              const { error } = await getSupabaseClient().from(STAFF_TABLE).upsert([ staffToBackend({ ...importedStaff, companyId: selectedCompanyId }) ]);
              if (error) upsertError = error;
              newCount++;
            }
          }
          const { data: updatedStaffList = [] } = await getSupabaseClient()
            .from(STAFF_TABLE)
            .select('*')
            .eq('company_id', selectedCompanyId);
          setAllStaffForCompany((updatedStaffList || []).sort((a: any, b: any) => a.id.localeCompare(b.id)));
          resetSelectionAndPage();
          let fbMsg = '';
          let fbTitle = 'Import Processed';
          let fbType: FeedbackMessage['type'] = 'info';
          const totalPapaErrors = papaParseErrors.length;
          const totalValidSkipped = validationSkippedLog.length;
          if (upsertError) {
            fbTitle = 'Import Failed';
            fbMsg = `Database error: ${upsertError.message || upsertError}`;
            fbType = 'error';
          } else if (newCount > 0 || updatedCount > 0) {
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
            fbMsg = `CSV processed. ${processedDataRowCount} rows checked. No changes.`;          } else if (newCount === 0 && updatedCount === 0 && processedDataRowCount > 0) {
            fbTitle = 'Import Failed';
            fbMsg = `No staff imported or updated. All rows may have been skipped or identical to existing records.`;
            fbType = 'error';
          } else {
            fbTitle = 'Import Note';
            fbMsg = 'No changes applied. CSV empty or data identical.';
          }
          let details = '';          if (totalPapaErrors > 0 || totalValidSkipped > 0) {
            details += ` ${totalPapaErrors + totalValidSkipped} row(s) had issues.`;
          }
          setFeedback({ type: fbType, message: fbTitle, details: fbMsg + details });
        } catch (error) {
          setFeedback({ type: 'error', message: 'Import Failed', details: `Failed to process file: ${(error as Error).message}` });
        }
      };      reader.readAsText(file);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Staff Management</h1>
      <p className="text-muted-foreground mb-4">
        Manage staff data with Supabase database integration.
      </p>
      
      {feedback && (
        <div className={`mb-4 p-4 rounded-md ${
          feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <h4 className="font-medium">{feedback.message}</h4>
          {feedback.details && <p className="text-sm mt-1">{feedback.details}</p>}
        </div>
      )}

      <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleImportClick} className="flex-1">
            Import Staff
          </Button>
          <Button onClick={handleDownloadStaffTemplate} variant="outline" className="flex-1">
            Download Template
          </Button>
          <Button onClick={() => exportData('csv')} variant="outline" className="flex-1">
            Export CSV
          </Button>
          <Button onClick={() => exportData('xlsx')} variant="outline" className="flex-1">
            Export Excel
          </Button>
          <Button onClick={() => exportData('pdf')} variant="outline" className="flex-1">
            Export PDF
          </Button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".csv"
          style={{ display: 'none' }}
        />

        <div className="text-center">
          <p className="text-muted-foreground">
            Staff data is stored securely in Supabase database.
            {allStaffForCompany.length > 0 && ` Currently managing ${allStaffForCompany.length} staff members.`}
          </p>
        </div>
      </div>
    </div>
  );
}