"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Building, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload, Download, FileText, FileSpreadsheet, FileType, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSupabaseClient } from '@/lib/supabase';
import type { Company as UserDataCompany } from '@/lib/userData';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';

// Utility: Convert camelCase company to snake_case for backend
function companyToBackend(company: Company | Omit<Company, 'id'>): Record<string, unknown> {
  return {
    ...(('id' in company) && { id: company.id }),
    name: company.name,
    tin_number: company.tinNumber,
    address: company.address,
    email: company.email,
    phone: company.phone,
    primary_business: company.primaryBusiness,
  };
}
// Utility: Convert backend company to camelCase for frontend
function companyFromBackend(company: Record<string, unknown>): Company {
  return {
    id: company.id as string,
    name: company.name as string,
    tinNumber: company.tin_number as string,
    address: company.address as string,
    email: company.email as string,
    phone: company.phone as string,
    primaryBusiness: company.primary_business as string,
  };
}

export interface Company extends UserDataCompany {
  tinNumber?: string;
  address?: string;
  email?: string;
  phone?: string;
  primaryBusiness?: string;
}

export const initialCompaniesDataForSeed: Company[] = [
  {
    id: "co_001",
    name: "Umoja Tech Solutions (Demo)",
    tinNumber: "TIN102345678",
    address: "KN 5 Rd, Kigali Heights, Kigali, Rwanda",
    email: "info@umojatech.rw",
    phone: "0788123456",
    primaryBusiness: "Software Development & IT Consulting",
  },
  {
    id: "co_002",
    name: "Isoko Trading Co. (Demo)",
    tinNumber: "TIN103456789",
    address: "CHIC Complex, Nyarugenge, Kigali",
    email: "sales@isoko.rw",
    phone: "0788234567",
    primaryBusiness: "General Trading & Imports",
  },
];


const defaultNewCompany: Omit<Company, 'id'> = {
  name: "",
  tinNumber: "",
  address: "",
  email: "",
  phone: "",
  primaryBusiness: "",
};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

type FeedbackMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
};

export default function CompanyManagementTab() {
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<Omit<Company, 'id'>>(defaultNewCompany);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const companyImportFileInputRef = useRef<HTMLInputElement>(null);

  const [compCurrentPage, setCompCurrentPage] = useState(1);
  const [compRowsPerPage, setCompRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [selectedCompanyItems, setSelectedCompanyItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteCompaniesDialogOpen, setIsBulkDeleteCompaniesDialogOpen] = useState(false);


  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoaded(false);
      setFeedback(null);
      try {        const supabase = getSupabaseClient();
        const { data: companies, error } = await supabase.from('companies').select('*');
        if (error) throw error;
        setAllCompanies((companies || []).map(companyFromBackend));
      } catch {
        setAllCompanies([]);
        setFeedback({ type: "error", message: "Loading Error", details: "Could not load company records."})
      } finally {
        setIsLoaded(true);
      }
    };
    loadCompanies();
  }, []);


  useEffect(() => {
    if (editingCompany) {
      setFormData({
        name: editingCompany.name,
        tinNumber: editingCompany.tinNumber || "",
        address: editingCompany.address || "",
        email: editingCompany.email || "",
        phone: editingCompany.phone || "",
        primaryBusiness: editingCompany.primaryBusiness || "",
      });
    } else {
      setFormData(defaultNewCompany);
    }
  }, [editingCompany, isCompanyDialogOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCompanyClick = () => {
    setFeedback(null);
    setEditingCompany(null);
    setIsCompanyDialogOpen(true);
  };

  const handleEditCompanyClick = (company: Company) => {
    setFeedback(null);
    setEditingCompany(company);
    setIsCompanyDialogOpen(true);
  };

  const handleDeleteCompanyClick = (company: Company) => {
    setFeedback(null);
    setCompanyToDelete(company);
    setIsDeleteDialogOpen(true);
  };

  const deleteCompaniesByIds = async (idsToDelete: string[]) => {
    setFeedback(null);
    if (idsToDelete.length === 0) return;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('companies').delete().in('id', idsToDelete);
      if (error) throw error;
      setAllCompanies(prev => prev.filter(comp => !idsToDelete.includes(comp.id)));      setSelectedCompanyItems(prev => { const newSelected = new Set(prev); idsToDelete.forEach(id => newSelected.delete(id)); return newSelected; });
      setFeedback({type: 'success', message: "Company(s) Deleted", details: `Successfully deleted ${idsToDelete.length} company(s).`});
    } catch {
      setFeedback({type: 'error', message: "Delete Failed", details: `Could not delete ${idsToDelete.length} company(s).`});
    }
  };

  const confirmDeleteCompany = async () => { if (companyToDelete) { await deleteCompaniesByIds([companyToDelete.id]); } setIsDeleteDialogOpen(false); setCompanyToDelete(null); };
  const handleOpenBulkDeleteCompaniesDialog = () => { setFeedback(null); if (selectedCompanyItems.size === 0) { setFeedback({type: 'info', message: "No Selection", details: "Please select companies to delete."}); return; } setIsBulkDeleteCompaniesDialogOpen(true); };
  const confirmBulkDeleteCompanies = async () => { await deleteCompaniesByIds(Array.from(selectedCompanyItems)); setIsBulkDeleteCompaniesDialogOpen(false); };

  const handleSaveCompany = async () => {
    setFeedback(null);
    if (!formData.name || !formData.tinNumber) {
      setFeedback({type: 'error', message: "Validation Error", details: "Company Name and TIN Number are required."});
      return;
    }
    try {
      const supabase = getSupabaseClient();
      if (editingCompany) {
        const updatedCompany = companyToBackend({ ...editingCompany, ...formData });
        const { error } = await supabase.from('companies').update(updatedCompany).eq('id', editingCompany.id);
        if (error) throw error;
        setAllCompanies(prevCompanies => prevCompanies.map(company => company.id === editingCompany.id ? { ...formData, id: editingCompany.id } : company));
        setFeedback({type: 'success', message: "Company Updated", details: `Company "${formData.name}" has been updated.`});
      } else {
        const { data: inserted, error } = await supabase.from('companies').insert(companyToBackend(formData)).select();
        if (error) throw error;
        if (inserted && inserted.length > 0) {
          setAllCompanies(prevCompanies => [...prevCompanies, companyFromBackend(inserted[0])]);
          setFeedback({type: 'success', message: "Company Added", details: `Company "${inserted[0].name}" has been added.`});
        } else {
          setFeedback({type: 'success', message: "Company Added", details: `Company has been added.`});
        }
      }      setIsCompanyDialogOpen(false);
    } catch (error) {
      setFeedback({type: 'error', message: "Save Failed", details: `Could not save company. ${error instanceof Error ? error.message : 'Unknown error'}`});
    }
  };

  const filteredCompaniesSource = useMemo(() => {
    if (!companySearchTerm) return allCompanies;
    const lowerSearchTerm = companySearchTerm.toLowerCase();
    return allCompanies.filter(company =>
      company.name.toLowerCase().includes(lowerSearchTerm) ||
      (company.tinNumber && company.tinNumber.toLowerCase().includes(lowerSearchTerm)) ||
      (company.primaryBusiness && company.primaryBusiness.toLowerCase().includes(lowerSearchTerm)) ||
      (company.email && company.email.toLowerCase().includes(lowerSearchTerm))
    );
  }, [allCompanies, companySearchTerm]);
  const compTotalItems = filteredCompaniesSource.length;
  const compTotalPages = Math.ceil(compTotalItems / (compRowsPerPage || 10)) || 1;
  const compStartIndex = (compCurrentPage - 1) * (compRowsPerPage || 10);
  const compEndIndex = compStartIndex + (compRowsPerPage || 10);
  const paginatedCompanies = filteredCompaniesSource.slice(compStartIndex, compEndIndex);

  const handleSelectCompanyRow = (itemId: string, checked: boolean) => {
    setSelectedCompanyItems(prev => { const newSelected = new Set(prev); if (checked) newSelected.add(itemId); else newSelected.delete(itemId); return newSelected; });
  };
  const handleSelectAllCompaniesOnPage = (checked: boolean) => {
    const pageItemIds = paginatedCompanies.map(item => item.id);
    if (checked) { setSelectedCompanyItems(prev => new Set([...prev, ...pageItemIds])); }
    else { const pageItemIdsSet = new Set(pageItemIds); setSelectedCompanyItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id)))); }
  };  const isAllCompaniesOnPageSelected = paginatedCompanies.length > 0 && paginatedCompanies.every(item => selectedCompanyItems.has(item.id));

  // --- EXPORT/IMPORT LOGIC ---
  // Helper: Map camelCase UI company to export row with correct headers
  type CompanyExportRow = {
    ID: string;
    Name: string;
    TINNumber: string;
    Address: string;
    Email: string;
    Phone: string;
    PrimaryBusiness: string;
    [key: string]: string; // Add index signature for dynamic access
  };
  function companyToExportRow(company: Company): CompanyExportRow {
    return {
      ID: company.id || '',
      Name: company.name || '',
      TINNumber: company.tinNumber || '',
      Address: company.address || '',
      Email: company.email || '',
      Phone: company.phone || '',
      PrimaryBusiness: company.primaryBusiness || '',
    };
  }
  // Helper: Map import row (from CSV) to camelCase UI company (no id)
  function importRowToCompany(row: Record<string, string>): Omit<Company, 'id'> {
    return {
      name: row.Name?.trim() || '',
      tinNumber: row.TINNumber?.trim() || '',
      address: row.Address?.trim() || '',
      email: row.Email?.trim() || '',
      phone: row.Phone?.trim() || '',
      primaryBusiness: row.PrimaryBusiness?.trim() || '',
    };
  }

  // When exporting, always use camelCase for UI, but map to backend for file headers
  const exportGlobalCompanyData = (fileType: "csv" | "xlsx" | "pdf") => {
    setFeedback(null);
    if (allCompanies.length === 0) { setFeedback({type: 'info', message: "No Data", details: `There are no companies to export.`}); return; }
    const headers = ['ID', 'Name', 'TINNumber', 'Address', 'Email', 'Phone', 'PrimaryBusiness'] as (keyof CompanyExportRow)[];
    const dataToExport = allCompanies.map(companyToExportRow);
    const fileName = `global_companies_export.${fileType}`;

    if (fileType === "csv") {
        const csvData = dataToExport.map(row => {
            const newRow: Record<string, string> = {};
            headers.forEach(header => {
                let cellValue = String(row[header] || '');
                if ((header === 'ID' || header === 'TINNumber' || header === 'Phone') && /^\d+$/.test(cellValue) && cellValue.length > 0) {
                  cellValue = `'${cellValue}`;
                }
                newRow[header] = cellValue;
            });
            return newRow;
        });
        const csvString = Papa.unparse(csvData, { header: true, columns: headers as string[] });
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a'); const url = URL.createObjectURL(blob);
        link.setAttribute('href', url); link.setAttribute('download', fileName);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "xlsx") {
        const xlsxData = dataToExport.map(row => {
            const newRow: Record<string, string|number> = {};
            headers.forEach(h => {
                newRow[h] = row[h] || '';
            });
            return newRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(xlsxData, {header: headers as string[], skipHeader: false});
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Global Companies");
        XLSX.writeFile(workbook, fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") {        const pdfData = dataToExport.map(row => headers.map(header => String(row[header] || '')));
        const doc = new jsPDF({ orientation: 'landscape' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doc as any).autoTable({ head: [headers as string[]], body: pdfData, styles: { fontSize: 7 }, headStyles: { fillColor: [102, 126, 234] }, margin: { top: 10 }, });
        doc.save(fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    }
  };

  const handleDownloadGlobalCompanyTemplate = () => {
    setFeedback(null);
    const headers = ['ID', 'Name', 'TINNumber', 'Address', 'Email', 'Phone', 'PrimaryBusiness'];
    const csvString = headers.join(',') + '\n';
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `global_companies_import_template.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback({type: 'info', message: "Template Downloaded", details: "Tip: If a field contains commas, ensure the entire field is enclosed in double quotes."});
  };
  const handleGlobalCompanyImportClick = () => { setFeedback(null); companyImportFileInputRef.current?.click(); };

  // When importing, always map file headers to camelCase, then to backend snake_case before upsert
  const handleGlobalCompanyFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file as File, {
        header: true, skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<Record<string, string>>) => {
          const { data: rawData, errors: papaParseErrors } = results;
          if (papaParseErrors.length > 0 && rawData.length === 0) { setFeedback({type: 'error', message: "Import Failed", details: `Critical CSV parsing error: ${papaParseErrors[0]?.message || 'Unknown error'}.`}); return; }
          const validationSkippedLog: string[] = []; let newCount = 0, updatedCount = 0; const itemsToBulkPut: Record<string, unknown>[] = [];
          // Fetch existing companies from Supabase
          const supabase = getSupabaseClient();
          const { data: existingCompanies, error: fetchError } = await supabase.from('companies').select('*');
          if (fetchError) {
            setFeedback({type: 'error', message: "Import Failed", details: "Could not fetch existing companies from Supabase."});
            return;
          }
          const existingCompaniesCamel = (existingCompanies || []).map(companyFromBackend);
          for (const [index, rawRowUntyped] of rawData.entries()) {
            const rawRow = rawRowUntyped as Record<string, string>; const originalLineNumber = index + 2;
            const id = String(rawRow.ID || '').trim();
            const companyData = importRowToCompany(rawRow);
            if (!companyData.name || !companyData.tinNumber) { validationSkippedLog.push(`Row ${originalLineNumber} skipped: Name and TINNumber are required.`); continue; }
            const existingComp = id ? existingCompaniesCamel.find((c: Company) => c.id === id) : null;
            if (existingComp) { itemsToBulkPut.push(companyToBackend({ ...existingComp, ...companyData })); updatedCount++; }
            else { itemsToBulkPut.push(companyToBackend(companyData)); newCount++; }
          }
          if (itemsToBulkPut.length > 0) {
            const { error: upsertError } = await supabase.from('companies').upsert(itemsToBulkPut, { onConflict: 'id' });
            if (upsertError) {
              setFeedback({type: 'error', message: "Import Failed", details: "Could not import companies to Supabase."});
              return;
            }
            const { data: updatedList, error: reloadError } = await supabase.from('companies').select('*');
            if (!reloadError && updatedList) setAllCompanies((updatedList || []).map(companyFromBackend));
          }
          let feedbackMessage = ""; let feedbackTitle = "Import Processed"; let feedbackType: FeedbackMessage['type'] = 'info'; if (newCount > 0 || updatedCount > 0) { feedbackTitle = "Import Successful"; feedbackMessage = `${newCount} companies added, ${updatedCount} updated.`; feedbackType = 'success'; } else if (rawData.length > 0 && papaParseErrors.length === 0 && validationSkippedLog.length === 0) { feedbackMessage = `CSV processed. ${rawData.length} rows checked. No changes.`; } else { feedbackMessage = "No changes applied."; }
          let details = "";
          if (papaParseErrors.length > 0 || validationSkippedLog.length > 0) { details += ` ${papaParseErrors.length + validationSkippedLog.length} row(s) had issues.`; if (validationSkippedLog.length > 0) details += ` First validation skip: ${validationSkippedLog[0]}`; else if (papaParseErrors.length > 0) details += ` First parsing error: ${papaParseErrors[0]?.message || 'Unknown error'}`; }
          setFeedback({type: feedbackType, message: `${feedbackTitle}: ${feedbackMessage}`, details});
        }
      }); if (event.target) event.target.value = '';
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
        {Boolean(feedback.details) && <AlertDescription>{feedback.details}</AlertDescription>}
      </Alert>
    );
  };


  if (!isLoaded) {
      return <div>Loading companies...</div>;
  }

  return (
    <Card>
      <input type="file" ref={companyImportFileInputRef} onChange={handleGlobalCompanyFileUpload} accept=".csv" className="hidden" />
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="mr-2 h-5 w-5" /> Company Management
        </CardTitle>
        <CardDescription>
          Add, edit, and manage company records available across the application.
          These companies will be assignable to users. Data is persisted in Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderFeedbackMessage()}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4">
            <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search companies by name, TIN..."
                    className="w-full pl-10"
                    value={companySearchTerm}
                    onChange={(e) => {setCompanySearchTerm(e.target.value); setCompCurrentPage(1); setFeedback(null);}}
                />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" onClick={() => setFeedback(null)}><Upload className="mr-2 h-4 w-4" /> Import / Template</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={handleDownloadGlobalCompanyTemplate}><Download className="mr-2 h-4 w-4" /> Download Template</DropdownMenuItem><DropdownMenuItem onClick={handleGlobalCompanyImportClick}><Upload className="mr-2 h-4 w-4" /> Upload Data</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={allCompanies.length === 0} onClick={() => setFeedback(null)}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => exportGlobalCompanyData('csv')}><FileText className="mr-2 h-4 w-4" /> CSV</DropdownMenuItem><DropdownMenuItem onClick={() => exportGlobalCompanyData('xlsx')}><FileSpreadsheet className="mr-2 h-4 w-4" /> XLSX</DropdownMenuItem><DropdownMenuItem onClick={() => exportGlobalCompanyData('pdf')}><FileType className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                <Button onClick={handleAddCompanyClick} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Company
                </Button>
            </div>
        </div>
        {selectedCompanyItems.size > 0 && (<div className="my-2 flex items-center justify-between p-3 bg-muted/50 rounded-md"><span className="text-sm text-muted-foreground">{selectedCompanyItems.size} item(s) selected</span><Button variant="destructive" onClick={handleOpenBulkDeleteCompaniesDialog}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected</Button></div>)}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 z-10 bg-card w-[50px]"><Checkbox checked={isAllCompaniesOnPageSelected} onCheckedChange={(checked) => handleSelectAllCompaniesOnPage(Boolean(checked))} aria-label="Select all companies on page" disabled={paginatedCompanies.length === 0}/></TableHead>
                <TableHead className="sticky top-0 z-10 bg-card">Name</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card">TIN Number</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card">Primary Business</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCompanies.map(company => (
                <TableRow key={company.id} data-state={selectedCompanyItems.has(company.id) ? "selected" : ""}>
                  <TableCell><Checkbox checked={selectedCompanyItems.has(company.id)} onCheckedChange={(checked) => handleSelectCompanyRow(company.id, Boolean(checked))} aria-label={`Select company ${company.name}`}/></TableCell>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.tinNumber}</TableCell>
                  <TableCell>{company.primaryBusiness}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditCompanyClick(company)} title="Edit Company">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCompanyClick(company)}
                      title="Delete Company"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedCompanies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    {companySearchTerm ? "No companies match your search." : "No companies found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {compTotalPages > 1 && (
        <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
            {selectedCompanyItems.size > 0 ? `${selectedCompanyItems.size} item(s) selected.` : `Page ${compCurrentPage} of ${compTotalPages} (${compTotalItems} total companies)`}
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select value={`${compRowsPerPage}`} onValueChange={(value) => {setCompRowsPerPage(Number(value)); setCompCurrentPage(1); setSelectedCompanyItems(new Set());}}>
                <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${compRowsPerPage}`} /></SelectTrigger>
                <SelectContent side="top">
                    {ROWS_PER_PAGE_OPTIONS.map((pageSize) => (<SelectItem key={`comp-${pageSize}`} value={`${pageSize}`}>{pageSize}</SelectItem>))}
                </SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCompCurrentPage(1); setSelectedCompanyItems(new Set());}} disabled={compCurrentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCompCurrentPage(prev => prev - 1); setSelectedCompanyItems(new Set());}} disabled={compCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCompCurrentPage(prev => prev + 1); setSelectedCompanyItems(new Set());}} disabled={compCurrentPage === compTotalPages}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCompCurrentPage(compTotalPages); setSelectedCompanyItems(new Set());}} disabled={compCurrentPage === compTotalPages}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
            </div>
        </div>
        )}
      </CardContent>

      <Dialog open={isCompanyDialogOpen} onOpenChange={(isOpen) => { setIsCompanyDialogOpen(isOpen); if(!isOpen) setFeedback(null); }}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
            <DialogDescription>
              {editingCompany ? "Update the company's details." : "Fill in the details for the new company."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4" tabIndex={0}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter company name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tinNumber">TIN Number *</Label>
                <Input id="tinNumber" name="tinNumber" value={formData.tinNumber} onChange={handleInputChange} placeholder="Enter TIN number" required />
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="primaryBusiness">Primary Business</Label>
                <Input id="primaryBusiness" name="primaryBusiness" value={formData.primaryBusiness || ""} onChange={handleInputChange} placeholder="e.g., Technology, Manufacturing"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Company Address</Label>
              <Textarea id="address" name="address" value={formData.address || ""} onChange={handleInputChange} placeholder="Enter full company address" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Company Email</Label>
                <Input id="email" name="email" type="email" value={formData.email || ""} onChange={handleInputChange} placeholder="contact@company.com"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Company Phone</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone || ""} onChange={handleInputChange} placeholder="e.g., 078XXXXXXX"/>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCompanyDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveCompany}>Save Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company: &quot;{companyToDelete?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCompany} className="bg-destructive hover:bg-destructive/90">
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isBulkDeleteCompaniesDialogOpen} onOpenChange={setIsBulkDeleteCompaniesDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>Delete {selectedCompanyItems.size} selected company(s)?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmBulkDeleteCompanies} className="bg-destructive hover:bg-destructive/90">Delete Selected</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </Card>
  );
}

// All localStorage and indexedDbUtils references have been removed. This component now relies solely on Supabase for company management data.
