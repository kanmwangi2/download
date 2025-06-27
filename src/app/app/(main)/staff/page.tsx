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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Download, FileText, FileSpreadsheet, Edit, Trash2, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, PlusCircle, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { isValid as isValidDate, format, parse } from 'date-fns';
import { useCompany } from '@/context/CompanyContext';
import Papa from 'papaparse';
import { FeedbackAlert, type FeedbackMessage } from '@/components/ui/feedback-alert';
import { ServiceRegistry } from '@/lib/services/ServiceRegistry';
import { StaffMember } from '@/lib/types/staff';
import { CustomFieldDefinition } from '@/lib/types/custom-fields';

const serviceRegistry = ServiceRegistry.getInstance();

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

const defaultNewCustomFieldData: Omit<CustomFieldDefinition, 'id' | 'companyId' | 'orderNumber' | 'isDeletable'> = {
  name: "",
  type: "Text",
};

const sanitizeFilename = (name: string | null | undefined): string => {
    if (!name) return 'UnknownCompany';
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
};

export default function StaffPage() {
  const { selectedCompanyId, selectedCompanyName, isLoadingCompanyContext } = useCompany();
  
  // Component State
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("staff");
  const [customFieldDialogFeedback, setCustomFieldDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [deleteCustomFieldDialogFeedback, setDeleteCustomFieldDialogFeedback] = useState<FeedbackMessage | null>(null);

  // File input refs
  const staffImportFileInputRef = useRef<HTMLInputElement>(null);
  const customFieldImportFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize OOP services
  const [services, setServices] = useState<ServiceRegistry | null>(null);

  // Staff data state
  const [allStaffForCompany, setAllStaffForCompany] = useState<StaffMember[]>([]);
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const [staffRowsPerPage, setStaffRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [selectedStaffItems, setSelectedStaffItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteStaffDialogOpen, setIsBulkDeleteStaffDialogOpen] = useState(false);

  // Custom fields state
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [isCustomFieldDialogOpen, setIsCustomFieldDialogOpen] = useState(false);
  const [editingCustomField, setEditingCustomField] = useState<CustomFieldDefinition | null>(null);
  const [customFieldFormData, setCustomFieldFormData] = useState<Omit<CustomFieldDefinition, 'id' | 'companyId' | 'orderNumber' | 'isDeletable'>>(defaultNewCustomFieldData);
  const [isDeleteCustomFieldDialogOpen, setIsDeleteCustomFieldDialogOpen] = useState(false);
  const [customFieldToDelete, setCustomFieldToDelete] = useState<CustomFieldDefinition | null>(null);
  const [customFieldSearchTerm, setCustomFieldSearchTerm] = useState("");
  const [cfCurrentPage, setCfCurrentPage] = useState(1);
  const [cfRowsPerPage, setCfRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [bulkDeleteStaffDialogFeedback, setBulkDeleteStaffDialogFeedback] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    setServices(serviceRegistry);
  }, []);

  // Load data effect
  useEffect(() => {
    const loadData = async () => {
      if (isLoadingCompanyContext || !selectedCompanyId || !services) {
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
        const [staffData, customFieldsData] = await Promise.all([
          services.staffService.getStaffByCompany(selectedCompanyId),
          services.customFieldDefinitionService.getByCompanyId(selectedCompanyId)
        ]);
        
        setAllStaffForCompany(staffData || []);
        setCustomFieldDefinitions(customFieldsData.sort((a: CustomFieldDefinition, b: CustomFieldDefinition) => a.orderNumber - b.orderNumber));
      } catch (error) {
        setAllStaffForCompany([]);
        setCustomFieldDefinitions([]);
        setFeedback({ type: 'error', message: 'Could not load company data.', details: (error as Error).message });
      }
      setIsLoaded(true);
    };
    loadData();
  }, [selectedCompanyId, isLoadingCompanyContext, services]);

  const allStaffForCompanyUI = useMemo(() => {
    return allStaffForCompany.filter(staff =>
      Object.values(staff).some(value =>
        String(value).toLowerCase().includes(staffSearchTerm.toLowerCase())
      )
    );
  }, [allStaffForCompany, staffSearchTerm]);

  // Pagination for Staff
  const staffTotalPages = useMemo(() => Math.ceil(allStaffForCompanyUI.length / (staffRowsPerPage || 10)), [allStaffForCompanyUI, staffRowsPerPage]);

  const paginatedStaff = useMemo(() => {
    const startIndex = (staffCurrentPage - 1) * (staffRowsPerPage || 10);
    return allStaffForCompanyUI.slice(startIndex, startIndex + (staffRowsPerPage || 10));
  }, [allStaffForCompanyUI, staffCurrentPage, staffRowsPerPage]);


  // Staff data columns for export
  const staffDataColumnsForExport = useMemo(() => {
    const baseCols = [
        { key: 'id', label: 'ID', isIdLike: true }, 
        { key: 'firstName', label: 'FirstName' }, 
        { key: 'lastName', label: 'LastName' },
        { key: 'staffNumber', label: 'StaffNumber', isIdLike: true }, 
        { key: 'email', label: 'Email' }, 
        { key: 'phone', label: 'Phone', isIdLike: true },
        { key: 'staffRssbNumber', label: 'StaffRssbNumber', isIdLike: true }, 
        { key: 'employeeCategory', label: 'EmployeeCategory' }, 
        { key: 'gender', label: 'Gender' }, 
        { key: 'birthDate', label: 'BirthDate' },
        { key: 'department', label: 'Department' }, 
        { key: 'designation', label: 'Designation'}, 
        { key: 'employmentDate', label: 'EmploymentDate'},
        { key: 'nationality', label: 'Nationality' }, 
        { key: 'idPassportNumber', label: 'IDPassportNumber', isIdLike: true },
        { key: 'province', label: 'Province' }, 
        { key: 'district', label: 'District' }, 
        { key: 'sector', label: 'Sector'},
        { key: 'cell', label: 'Cell' }, 
        { key: 'village', label: 'Village' }, 
        { key: 'bankName', label: 'BankName' },
        { key: 'bankCode', label: 'BankCode', isIdLike: true }, 
        { key: 'bankAccountNumber', label: 'BankAccountNumber', isIdLike: true }, 
        { key: 'bankBranch', label: 'BankBranch' },
        { key: 'keyContactName', label: 'KeyContactName' }, 
        { key: 'keyContactRelationship', label: 'KeyContactRelationship' },
        { key: 'keyContactPhone', label: 'KeyContactPhone', isIdLike: true }, 
        { key: 'status', label: 'Status' },
    ];
    const customFieldCols = customFieldDefinitions.map(cfd => ({
        key: `custom_${cfd.id}`,
        label: `Custom: ${cfd.name}`,
        isIdLike: cfd.type === "Number"
    }));
    return [...baseCols, ...customFieldCols];
  }, [customFieldDefinitions]);

  const exportData = (fileType: "csv" | "xlsx" | "pdf") => {
    setFeedback(null);
    if (!selectedCompanyId) {
        setFeedback({ type: 'error', message: "Error", details: "No company selected for export."});
        return;
    }
    if (allStaffForCompanyUI.length === 0) {
        setFeedback({ type: 'info', message: "No Data", details: "There is no staff data to export."});
        return;
    }

    const headers = staffDataColumnsForExport.map(col => col.label);
    const dataToExport = allStaffForCompanyUI.map(staff => {
        const row: Record<string, string | number> = {};
        staffDataColumnsForExport.forEach(col => {
            let value: any;
            if (col.key.startsWith('custom_')) {
                const cfdId = col.key.substring(7);
                value = staff.customFields?.[cfdId];
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

    const downloadFile = (blob: Blob, fileName: string) => {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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
        const csvString = Papa.unparse([newRow], { header: true });
        const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
        downloadFile(blob, fileName);
        setFeedback({ type: 'success', message: `Export Successful`, details: `${fileName} downloaded.`});
      });
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
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'staff_import_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'info', message: "Staff import template downloaded.", details: "Includes current custom fields. Dates should be in DD/MM/YYYY format. If data has commas, enclose field in double quotes."});
    };
    const handleImportClick = () => { setFeedback(null); if (!selectedCompanyId) { setFeedback({ type: 'error', message: "Error", details: "Please select a company." }); return; } staffImportFileInputRef.current?.click(); };

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
              const staffObject: any = { companyId: currentCompanyId, customFields: {} };
              let rowParseError = false;
              for (const csvHeader in rawRow) {
                const normalizedCsvHeader = csvHeader.trim().toLowerCase().replace(/\s+/g, '');
                const mappedKey = headerToStaffKeyMap[normalizedCsvHeader];
                if (mappedKey) {
                  const value = String(rawRow[csvHeader] || '').trim();
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
                  } else if (mappedKey === 'birthDate' || mappedKey === 'employmentDate') {
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
              const requiredFields: (keyof StaffMember)[] = ['id', 'firstName', 'lastName', 'email', 'department', 'status'];
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
                } as StaffMember);
              }
            });
            resolve({ data: parsedData, processedDataRowCount, papaParseErrors: results.errors, validationSkippedLog });
          }
        });
      });
    };
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      setFeedback(null);
      if (!selectedCompanyId || !services) {
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
            const currentStaffForCompany = await services.staffService.getStaffByCompany(selectedCompanyId);
            
            let upsertError: any = null;
            for (const importedStaff of parsedStaffArray) {
              const existingStaff = currentStaffForCompany.find((s: StaffMember) => s.id === importedStaff.id && s.companyId === selectedCompanyId);
              if (existingStaff) {
                const hasChanges = Object.keys(importedStaff).some(key => (importedStaff as any)[key] !== undefined && (importedStaff as any)[key] !== (existingStaff as any)[key]) || JSON.stringify(importedStaff.customFields) !== JSON.stringify(existingStaff.customFields);
                if (hasChanges) {
                  try {
                    const { companyId, ...updateData } = importedStaff;
                    await services.staffService.update(existingStaff.id, updateData);
                    updatedCount++;
                  } catch (error) {
                    upsertError = error;
                  }
                }
              } else {
                try {
                  await services.staffService.create({ ...importedStaff, companyId: selectedCompanyId });
                  newCount++;
                } catch (error) {
                  upsertError = error;
                }
              }
            }
            
            const updatedStaffList = await services.staffService.getStaffByCompany(selectedCompanyId);
            setAllStaffForCompany(updatedStaffList.sort((a: StaffMember, b: StaffMember) => a.id.localeCompare(b.id)));
            
            let fbTitle: string;
            let fbMsg: string;
            let fbType: FeedbackMessage['type'];
            let details = '';

            const totalPapaErrors = papaParseErrors.length;
            const totalValidSkipped = validationSkippedLog.length;

            if (validationSkippedLog.length > 0) {
                console.warn("Validation Skipped Log:", validationSkippedLog);
                details += ` ${validationSkippedLog.length} rows had validation issues (see console).`;
            }
            if (totalPapaErrors > 0) {
                console.error("PapaParse Errors:", papaParseErrors);
                details += ` ${totalPapaErrors} rows failed to parse.`;
            }

            if (upsertError) {
              fbTitle = 'Import Failed';
              fbMsg = `Database error: ${(upsertError as Error).message || upsertError}`;
              fbType = 'error';
            } else if (newCount > 0 || updatedCount > 0) {
              fbTitle = 'Import Successful';
              fbMsg = `${newCount} staff added, ${updatedCount} staff updated.`;
              fbType = 'success';
            } else if (parsedStaffArray.length === 0 && processedDataRowCount > 0) {
              fbTitle = 'Import Failed';
              fbMsg = `All ${processedDataRowCount} data rows processed, but no valid records were imported.`;
              fbType = 'error';
            } else if (processedDataRowCount === 0) {
              fbTitle = 'Import Note';
              fbMsg = `No data rows found in the file.`;
              fbType = 'info';
            } else { // newCount === 0 && updatedCount === 0 && processedDataRowCount > 0
              fbTitle = 'Import Note';
              fbMsg = `CSV processed. ${processedDataRowCount} rows checked. No changes were applied.`;
              if (totalValidSkipped > 0) {
                  fbMsg += ` All rows may have been skipped or were identical to existing records.`;
              }
              fbType = 'info';
            }
            
            setFeedback({ type: fbType, message: fbTitle, details: fbMsg + details });
          } catch (error) {
            setFeedback({ type: 'error', message: 'Import Failed', details: `Failed to process file: ${(error as Error).message}` });
          }
        };
      reader.readAsText(file);
      }
      if (event.target) {
        event.target.value = '';
      }
    };

  const exportCustomFields = (fileType: "csv" | "xlsx" | "pdf") => {
    setFeedback(null);
    if (!selectedCompanyId) {
        setFeedback({ type: 'error', message: "Error", details: "No company selected for export."});
        return;
    }
    if (filteredCustomFields.length === 0) {
        setFeedback({ type: 'info', message: "No Data", details: "There are no custom fields to export."});
        return;
    }

    const headers = ['ID', 'Name', 'Type', 'Order', 'Deletable'];
    const dataToExport = filteredCustomFields.map(cf => ({
        ID: cf.id,
        Name: cf.name,
        Type: cf.type,
        Order: cf.orderNumber,
        Deletable: cf.isDeletable
    }));

    const companyNameForFile = sanitizeFilename(selectedCompanyName);
    const fileName = `${companyNameForFile}_custom_fields_export.${fileType}`;

    const downloadFile = (blob: Blob, fileName: string) => {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (fileType === "csv") {
      const csvString = Papa.unparse(dataToExport, { header: true });
      const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
      downloadFile(blob, fileName);
      setFeedback({ type: 'success', message: `Export Successful`, details: `${fileName} downloaded.`});
    } else if (fileType === "xlsx") {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Custom Fields");
        XLSX.writeFile(workbook, fileName);
        setFeedback({ type: 'success', message: `Export Successful`, details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") {
        const doc = new jsPDF();
        (doc as any).autoTable({ head: [headers], body: dataToExport.map(d => [d.ID, d.Name, d.Type, d.Order, d.Deletable]), styles: { fontSize: 10 }, headStyles: { fillColor: [102, 126, 234] } });
        doc.save(fileName);
        setFeedback({ type: 'success', message: `Export Successful`, details: `${fileName} downloaded.`});
    }
  };

  const handleDownloadCustomFieldTemplate = () => {
      setFeedback(null);
      const headers = ['id', 'name', 'type'];
      const csvString = headers.join(',') + '\n';
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'custom_fields_import_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'info', message: "Custom field import template downloaded.", details: "Provide 'id' to update an existing field. 'type' can be Text, Number, or Date."});
  };

  const handleImportCustomFieldsClick = () => {
      setFeedback(null);
      if (!selectedCompanyId) {
          setFeedback({ type: 'error', message: "Error", details: "Please select a company." });
          return;
      }
      customFieldImportFileInputRef.current?.click();
  };

  const handleCustomFieldFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    if (!selectedCompanyId || !services) {
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
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const importedFields = results.data as any[];
            let newCount = 0;
            let updatedCount = 0;
            let errorCount = 0;
            let errorDetails = '';

            for (const field of importedFields) {
              const { id, name, type } = field;
              if (!name || !type || !['Text', 'Number', 'Date'].includes(type)) {
                errorCount++;
                errorDetails += `Skipped row: missing name or invalid type. Data: ${JSON.stringify(field)}\n`;
                continue;
              }

              try {
                if (id) { // Update existing
                  const existingField = customFieldDefinitions.find(cf => cf.id === id);
                  if (existingField) {
                    await services.customFieldDefinitionService.update(id, { name, type });
                    updatedCount++;
                  } else {
                     // If ID provided but not found, treat as an error or create new? Let's treat as error.
                     errorCount++;
                     errorDetails += `Skipped row: Field with ID '${id}' not found for update.\n`;
                  }
                } else { // Create new
                  const newOrderNumber = customFieldDefinitions.length > 0 ? Math.max(...customFieldDefinitions.map(f => f.orderNumber)) + 1 : 1;
                  await services.customFieldDefinitionService.create({
                    name,
                    type,
                    companyId: selectedCompanyId,
                    orderNumber: newOrderNumber,
                    isDeletable: true,
                  });
                  newCount++;
                }
              } catch (error) {
                errorCount++;
                errorDetails += `Error processing row: ${JSON.stringify(field)}. Error: ${(error as Error).message}\n`;
              }
            }

            const customFieldsData = await services.customFieldDefinitionService.getByCompanyId(selectedCompanyId);
            setCustomFieldDefinitions(customFieldsData.sort((a, b) => a.orderNumber - b.orderNumber));

            if (errorCount > 0) {
                setFeedback({ type: 'error', message: `Import completed with ${errorCount} errors.`, details: `New: ${newCount}, Updated: ${updatedCount}. Errors:\n${errorDetails}` });
            } else {
                setFeedback({ type: 'success', message: 'Custom fields imported successfully.', details: `New: ${newCount}, Updated: ${updatedCount}.` });
            }
          }
        });
      };
      reader.readAsText(file);
    }
    // Reset file input
    if (event.target) {
        event.target.value = '';
    }
  };

  // Handlers for custom fields
  const handleEditCustomField = (field: CustomFieldDefinition) => {
    setEditingCustomField(field);
    setCustomFieldFormData({ name: field.name, type: field.type });
    setIsCustomFieldDialogOpen(true);
    setCustomFieldDialogFeedback(null);
  };

  const handleDeleteCustomField = (field: CustomFieldDefinition) => {
    setCustomFieldToDelete(field);
    setIsDeleteCustomFieldDialogOpen(true);
    setDeleteCustomFieldDialogFeedback(null);
  };

  const handleSaveCustomField = async () => {
    if (!selectedCompanyId || !services) return;
    setCustomFieldDialogFeedback(null);

    if (!customFieldFormData.name.trim()) {
        setCustomFieldDialogFeedback({ type: 'error', message: 'Name is required.' });
        return;
    }

    try {
        if (editingCustomField) {
            await services.customFieldDefinitionService.update(editingCustomField.id, {
                name: customFieldFormData.name,
                type: customFieldFormData.type,
            });
            setFeedback({ type: 'success', message: 'Custom field updated successfully.' });
        } else {
            const newOrderNumber = customFieldDefinitions.length > 0 
                ? Math.max(...customFieldDefinitions.map(f => f.orderNumber)) + 1 
                : 1;

            await services.customFieldDefinitionService.create({
                ...customFieldFormData,
                companyId: selectedCompanyId,
                orderNumber: newOrderNumber,
                isDeletable: true,
            });
            setFeedback({ type: 'success', message: 'Custom field created successfully.' });
        }

        const customFieldsData = await services.customFieldDefinitionService.getByCompanyId(selectedCompanyId);
        setCustomFieldDefinitions(customFieldsData.sort((a, b) => a.orderNumber - b.orderNumber));
        setIsCustomFieldDialogOpen(false);
    } catch (error) {
        setCustomFieldDialogFeedback({ type: 'error', message: 'Failed to save custom field.', details: (error as Error).message });
    }
  };

  const confirmDeleteCustomField = async () => {
    if (!customFieldToDelete || !selectedCompanyId || !services) return;

    try {
        await services.customFieldDefinitionService.delete(customFieldToDelete.id);
        setFeedback({ type: 'success', message: `Custom field '${customFieldToDelete.name}' deleted.` });
        
        const customFieldsData = await services.customFieldDefinitionService.getByCompanyId(selectedCompanyId);
        setCustomFieldDefinitions(customFieldsData.sort((a, b) => a.orderNumber - b.orderNumber));
        setIsDeleteCustomFieldDialogOpen(false);
    } catch (error) {
        setDeleteCustomFieldDialogFeedback({ type: 'error', message: 'Failed to delete custom field.', details: (error as Error).message });
    }
  };

  const confirmBulkDeleteStaff = async () => {
    if (selectedStaffItems.size === 0 || !selectedCompanyId || !services) return;
    setBulkDeleteStaffDialogFeedback(null);

    try {
        await services.staffService.bulkDelete(Array.from(selectedStaffItems));
        setFeedback({ type: 'success', message: `${selectedStaffItems.size} staff member(s) deleted.` });
        
        const staffData = await services.staffService.getStaffByCompany(selectedCompanyId);
        setAllStaffForCompany(staffData || []);
        setSelectedStaffItems(new Set());
        setIsBulkDeleteStaffDialogOpen(false);
    } catch (error) {
        setBulkDeleteStaffDialogFeedback({ type: 'error', message: 'Failed to delete staff members.', details: (error as Error).message });
    }
  };

  // Memoized values for custom fields table
  const filteredCustomFields = useMemo(() => {
    return customFieldDefinitions.filter(cf =>
        cf.name.toLowerCase().includes(customFieldSearchTerm.toLowerCase())
    );
  }, [customFieldDefinitions, customFieldSearchTerm]);

  const paginatedCustomFields = useMemo(() => {
      const startIndex = (cfCurrentPage - 1) * (cfRowsPerPage || 10);
      return filteredCustomFields.slice(startIndex, startIndex + (cfRowsPerPage || 10));
  }, [filteredCustomFields, cfCurrentPage, cfRowsPerPage]);

  const cfTotalPages = Math.ceil(filteredCustomFields.length / (cfRowsPerPage || 10));

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Staff and Custom Fields</h1>
      <p className="text-muted-foreground mb-6">
        Manage staff members and define custom data fields for your company.
      </p>
      
      <FeedbackAlert feedback={feedback} />

      <Tabs defaultValue="staff" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staff">
            <Users className="mr-2 h-4 w-4" /> Staff
          </TabsTrigger>
          <TabsTrigger value="custom-fields">
            <Settings className="mr-2 h-4 w-4" /> Custom Fields
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Manage Staff</CardTitle>
              <CardDescription>
                Import, export, and manage your staff data. 
                Currently managing {allStaffForCompany.length} staff members.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleImportClick} className="flex-1">
                  <Upload className="mr-2 h-4 w-4" /> Import Staff
                </Button>
                <Button onClick={handleDownloadStaffTemplate} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" /> Download Template
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      Export Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => exportData('csv')}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportData('xlsx')}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportData('pdf')}>
                      <FileText className="mr-2 h-4 w-4" /> Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedStaffItems.size > 0 && (
                    <Button variant="destructive" onClick={() => setIsBulkDeleteStaffDialogOpen(true)} className="flex-1">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedStaffItems.size})
                    </Button>
                )}
              </div>
              <input
                type="file"
                ref={staffImportFileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                style={{ display: 'none' }}
              />
              <div className="flex justify-between items-center">
                  <div className="w-1/3">
                      <Input
                          placeholder="Search staff..."
                          value={staffSearchTerm}
                          onChange={(e) => setStaffSearchTerm(e.target.value)}
                      />
                  </div>
              </div>
              <ScrollArea className="rounded-md border">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>
                                <Checkbox
                                    checked={paginatedStaff.length > 0 && selectedStaffItems.size > 0 && selectedStaffItems.size === paginatedStaff.length}
                                    onCheckedChange={(checked) => {
                                        const newSelectedItems = new Set(selectedStaffItems);
                                        if (checked) {
                                            paginatedStaff.forEach((staff: StaffMember) => newSelectedItems.add(staff.id));
                                        } else {
                                            paginatedStaff.forEach((staff: StaffMember) => newSelectedItems.delete(staff.id));
                                        }
                                        setSelectedStaffItems(newSelectedItems);
                                    }}
                                    aria-label="Select all rows on this page"
                                />
                              </TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Department</TableHead>
                              <TableHead>Status</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {paginatedStaff.length > 0 ? (
                              paginatedStaff.map((staff: StaffMember) => (
                                  <TableRow key={staff.id} data-state={selectedStaffItems.has(staff.id) ? "selected" : undefined}>
                                      <TableCell>
                                        <Checkbox
                                            checked={selectedStaffItems.has(staff.id)}
                                            onCheckedChange={(checked) => {
                                                const newSelectedItems = new Set(selectedStaffItems);
                                                if (checked) {
                                                    newSelectedItems.add(staff.id);
                                                } else {
                                                    newSelectedItems.delete(staff.id);
                                                }
                                                setSelectedStaffItems(newSelectedItems);
                                            }}
                                            aria-label={`Select row for ${staff.firstName} ${staff.lastName}`}
                                        />
                                      </TableCell>
                                      <TableCell>{staff.firstName} {staff.lastName}</TableCell>
                                      <TableCell>{staff.email}</TableCell>
                                      <TableCell>{staff.department}</TableCell>
                                      <TableCell>{staff.status}</TableCell>
                                  </TableRow>
                              ))
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={5} className="text-center">
                                      No staff found.
                                  </TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </ScrollArea>
              <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                      {selectedStaffItems.size} of {allStaffForCompanyUI.length} row(s) selected.
                  </div>
                  <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Rows per page:</span>
                      <Select
                          value={`${staffRowsPerPage}`}
                          onValueChange={(value) => {
                              setStaffRowsPerPage(Number(value));
                              setStaffCurrentPage(1);
                          }}
                      >
                          <SelectTrigger className="h-8 w-[70px]">
                              <SelectValue placeholder={staffRowsPerPage} />
                          </SelectTrigger>
                          <SelectContent>
                              {ROWS_PER_PAGE_OPTIONS.map(option => (
                                  <SelectItem key={option} value={`${option}`}>{option}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <div className="text-sm text-muted-foreground">
                          Page {staffCurrentPage} of {staffTotalPages}
                      </div>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStaffCurrentPage(1)} disabled={staffCurrentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStaffCurrentPage(p => p - 1)} disabled={staffCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStaffCurrentPage(p => p + 1)} disabled={staffCurrentPage === staffTotalPages}><ChevronRight className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStaffCurrentPage(staffTotalPages)} disabled={staffCurrentPage === staffTotalPages}><ChevronsRight className="h-4 w-4" /></Button>
                  </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom-fields">
          <Card>
            <CardHeader>
              <CardTitle>Manage Custom Fields</CardTitle>
              <CardDescription>
                Add, edit, or remove custom fields to tailor staff data to your needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => {
                    setEditingCustomField(null);
                    setCustomFieldFormData(defaultNewCustomFieldData);
                    setIsCustomFieldDialogOpen(true);
                    setCustomFieldDialogFeedback(null);
                  }} className="flex-1">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                  </Button>
                  <Button onClick={handleImportCustomFieldsClick} className="flex-1">
                    <Upload className="mr-2 h-4 w-4" /> Import Fields
                  </Button>
                  <Button onClick={handleDownloadCustomFieldTemplate} variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" /> Download Template
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        Export Fields
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => exportCustomFields('csv')}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportCustomFields('xlsx')}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportCustomFields('pdf')}>
                        <FileText className="mr-2 h-4 w-4" /> Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
              <input
                type="file"
                ref={customFieldImportFileInputRef}
                onChange={handleCustomFieldFileUpload}
                accept=".csv"
                style={{ display: 'none' }}
              />
              <div className="flex justify-between items-center pt-4">
                  <div className="w-1/3">
                      <Input
                          placeholder="Search custom fields..."
                          value={customFieldSearchTerm}
                          onChange={(e) => setCustomFieldSearchTerm(e.target.value)}
                      />
                  </div>
              </div>
              <ScrollArea className="rounded-md border">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {paginatedCustomFields.length > 0 ? (
                              paginatedCustomFields.map(cf => (
                                  <TableRow key={cf.id}>
                                      <TableCell>{cf.name}</TableCell>
                                      <TableCell>{cf.type}</TableCell>
                                      <TableCell className="text-right">
                                          <TooltipProvider>
                                              <Tooltip>
                                                  <TooltipTrigger asChild>
                                                      <Button variant="ghost" size="icon" onClick={() => handleEditCustomField(cf)}>
                                                          <Edit className="h-4 w-4" />
                                                      </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>Edit</TooltipContent>
                                              </Tooltip>
                                              <Tooltip>
                                                  <TooltipTrigger asChild>
                                                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomField(cf)} disabled={!cf.isDeletable}>
                                                          <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>{cf.isDeletable ? "Delete" : "This field cannot be deleted"}</TooltipContent>
                                              </Tooltip>
                                          </TooltipProvider>
                                      </TableCell>
                                  </TableRow>
                              ))
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={3} className="text-center">
                                      No custom fields found.
                                  </TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </ScrollArea>
              <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                      Page {cfCurrentPage} of {cfTotalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setCfCurrentPage(1)} disabled={cfCurrentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setCfCurrentPage(p => p - 1)} disabled={cfCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setCfCurrentPage(p => p + 1)} disabled={cfCurrentPage === cfTotalPages}><ChevronRight className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setCfCurrentPage(cfTotalPages)} disabled={cfCurrentPage === cfTotalPages}><ChevronsRight className="h-4 w-4" /></Button>
                  </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs for Custom Fields */}
      <Dialog open={isCustomFieldDialogOpen} onOpenChange={setIsCustomFieldDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingCustomField ? 'Edit' : 'Add'} Custom Field</DialogTitle>
                  <DialogDescription>
                      {editingCustomField ? 'Update the details of your custom field.' : 'Create a new custom field to track additional staff information.'}
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" value={customFieldFormData.name} onChange={(e) => setCustomFieldFormData({...customFieldFormData, name: e.target.value})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="type" className="text-right">Type</Label>
                      <Select value={customFieldFormData.type} onValueChange={(value) => setCustomFieldFormData({...customFieldFormData, type: value as "Text" | "Number" | "Date"})}>
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Text">Text</SelectItem>
                              <SelectItem value="Number">Number</SelectItem>
                              <SelectItem value="Date">Date</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <FeedbackAlert feedback={customFieldDialogFeedback} />
              <DialogFooter>
                  <Button onClick={handleSaveCustomField}>Save</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteCustomFieldDialogOpen} onOpenChange={setIsDeleteCustomFieldDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the custom field '{customFieldToDelete?.name}'.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <FeedbackAlert feedback={deleteCustomFieldDialogFeedback} />
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDeleteCustomField}>Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteStaffDialogOpen} onOpenChange={setIsBulkDeleteStaffDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently delete {selectedStaffItems.size} selected staff member(s).
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <FeedbackAlert feedback={bulkDeleteStaffDialogFeedback} />
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmBulkDeleteStaff}>Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}