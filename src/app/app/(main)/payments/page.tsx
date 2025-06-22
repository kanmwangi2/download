"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Download, FileText, FileSpreadsheet, FileType, Save, Edit, Trash2, Banknote, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Loader2, Users, PlusCircle, Settings, AlertTriangle, Info, CreditCard, CheckCircle2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { StaffMember } from '@/lib/staffData';
import { StaffPaymentDetails, defaultPaymentDetails } from '@/lib/paymentData';
import { PaymentType, DEFAULT_BASIC_PAY_ID, DEFAULT_TRANSPORT_ALLOWANCE_ID, initialPaymentTypesForCompanySeed, exampleUserDefinedPaymentTypesForUmoja, exampleUserDefinedPaymentTypesForIsoko } from '@/lib/paymentTypesData';
import { getSupabaseClient } from '@/lib/supabase';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useCompany } from '@/context/CompanyContext';
import Link from 'next/link';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatNumberForTable = (amount?: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0";
  return Math.round(amount).toLocaleString('en-US');
};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

const defaultNewPaymentTypeData: Omit<PaymentType, 'id' | 'companyId' | 'order' | 'isFixedName' | 'isDeletable'> = {
  name: "",
  type: "Gross",
};

const sanitizeFilename = (name: string | null | undefined): string => {
    if (!name) return 'UnknownCompany';
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
};

type FeedbackMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
};

// --- Supabase CRUD helpers ---
// Payment Types
const fetchPaymentTypes = async (companyId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('payment_types').select('*').eq('companyId', companyId);
  if (error) throw error;
  return data || [];
};
const upsertPaymentType = async (paymentType: any) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('payment_types').upsert([paymentType]);
  if (error) throw error;
};
const deletePaymentType = async (id: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('payment_types').delete().eq('id', id);
  if (error) throw error;
};
// Staff Payment Configs
const fetchStaffPaymentConfigs = async (companyId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('staff_payment_configs').select('*').eq('companyId', companyId);
  if (error) throw error;
  return data || [];
};
const upsertStaffPaymentConfig = async (config: any) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('staff_payment_configs').upsert([config]);
  if (error) throw error;
};
const deleteStaffPaymentConfig = async (companyId: string, staffId: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('staff_payment_configs').delete().eq('companyId', companyId).eq('staffId', staffId);
  if (error) throw error;
};


export default function PaymentsPage() {
  const { selectedCompanyId, selectedCompanyName, isLoadingCompanyContext } = useCompany();
  const staffPaymentImportFileInputRef = useRef<HTMLInputElement>(null);
  const paymentTypesImportFileInputRef = useRef<HTMLInputElement>(null);

  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [isPaymentTypeDialogOpen, setIsPaymentTypeDialogOpen] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null);
  const [paymentTypeFormData, setPaymentTypeFormData] = useState(defaultNewPaymentTypeData);
  const [isDeletePaymentTypeDialogOpen, setIsDeletePaymentTypeDialogOpen] = useState(false);
  const [paymentTypeToDelete, setPaymentTypeToDelete] = useState<PaymentType | null>(null);
  const [paymentTypeSearchTerm, setPaymentTypeSearchTerm] = useState("");
  const [ptCurrentPage, setPtCurrentPage] = useState(1);
  const [ptRowsPerPage, setPtRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [selectedPaymentTypeItems, setSelectedPaymentTypeItems] = useState<Set<string>>(new Set());
  const [isBulkDeletePaymentTypesDialogOpen, setIsBulkDeletePaymentTypesDialogOpen] = useState(false);


  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [paymentDataStore, setPaymentDataStore] = useState<Record<string, StaffPaymentDetails>>({});
  const [isStaffPaymentFormDialogOpen, setIsStaffPaymentFormDialogOpen] = useState(false);
  const [editingStaffForPayments, setEditingStaffForPayments] = useState<StaffMember | null>(null);
  const [currentStaffPaymentFormData, setCurrentStaffPaymentFormData] = useState<StaffPaymentDetails>(JSON.parse(JSON.stringify(defaultPaymentDetails)));

  const [isAddStaffPaymentDialogOpen, setIsAddStaffPaymentDialogOpen] = useState(false);
  const [selectedStaffIdForNewConfig, setSelectedStaffIdForNewConfig] = useState<string>("");

  const [isDeleteStaffPaymentRecordDialogOpen, setIsDeleteStaffPaymentRecordDialogOpen] = useState(false);
  const [staffIdForPaymentRecordDeletion, setStaffIdForPaymentRecordDeletion] = useState<string | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [staffPaymentSearchTerm, setStaffPaymentSearchTerm] = useState("");
  const [spCurrentPage, setSpCurrentPage] = useState(1);
  const [spRowsPerPage, setSpRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [selectedStaffPaymentItems, setSelectedStaffPaymentItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteStaffPaymentsDialogOpen, setIsBulkDeleteStaffPaymentsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);


  useEffect(() => {
    const loadData = async () => {
      if (isLoadingCompanyContext || !selectedCompanyId || typeof window === 'undefined') {
        if (!isLoadingCompanyContext && !selectedCompanyId) {
          setPaymentTypes([]); setStaffList([]); setPaymentDataStore({}); setIsLoaded(true);
        }
        return;
      }
      setIsLoaded(false);
      setFeedback(null);
      try {
        // Fetch payment types
        let companySpecificPaymentTypes = await fetchPaymentTypes(selectedCompanyId);

        let coreTypesModified = false;

        const ensureCoreType = async (id: string, name: string, order: number) => {
          const safePaymentTypes = companySpecificPaymentTypes || [];
          if (!safePaymentTypes.some(t => t.id === id)) {
            const coreType: PaymentType = {
              id, companyId: selectedCompanyId, name,
              type: "Gross", order, isFixedName: true, isDeletable: false,
            };
            await upsertPaymentType(coreType);
            coreTypesModified = true;
          }
        };

        await ensureCoreType(DEFAULT_BASIC_PAY_ID, "Basic Pay", 1);
        await ensureCoreType(DEFAULT_TRANSPORT_ALLOWANCE_ID, "Transport Allowance", 2);

        if (selectedCompanyId === "co_001") {
            for (const exampleType of exampleUserDefinedPaymentTypesForUmoja) {
                const safePaymentTypes = companySpecificPaymentTypes || [];
                if (!safePaymentTypes.some(t => t.id === exampleType.id)) {
                    await upsertPaymentType({ ...exampleType, companyId: selectedCompanyId });
                    coreTypesModified = true;
                }
            }
        } else if (selectedCompanyId === "co_002") {
            for (const exampleType of exampleUserDefinedPaymentTypesForIsoko) {
                const safePaymentTypes = companySpecificPaymentTypes || [];
                if (!safePaymentTypes.some(t => t.id === exampleType.id)) {
                    await upsertPaymentType({ ...exampleType, companyId: selectedCompanyId });
                    coreTypesModified = true;
                }
            }
        }

        if (coreTypesModified) {
          companySpecificPaymentTypes = await fetchPaymentTypes(selectedCompanyId);
        }

        if (companySpecificPaymentTypes.length === 0) {
            await ensureCoreType(DEFAULT_BASIC_PAY_ID, "Basic Pay", 1);
            await ensureCoreType(DEFAULT_TRANSPORT_ALLOWANCE_ID, "Transport Allowance", 2);
            companySpecificPaymentTypes = await fetchPaymentTypes(selectedCompanyId);
        }
        setPaymentTypes(companySpecificPaymentTypes);

        // Fetch staff list
        const { data: staff, error: staffError } = await getSupabaseClient()
          .from('staff')
          .select('*')
          .eq('companyId', selectedCompanyId);

        if (staffError) throw staffError;
        setStaffList(staff);

        // Fetch payment configs
        const paymentConfigs = await fetchStaffPaymentConfigs(selectedCompanyId);

        setPaymentDataStore(Object.fromEntries((paymentConfigs || []).map((config: any) => [config.staffId, config])));

      } catch (error) {
        console.error("Error loading data for Payments page:", error);
        setPaymentTypes([]); setStaffList([]); setPaymentDataStore({});
        setFeedback({type: 'error', message: "Loading Error", details: `Could not load payment data. ${(error as Error).message}`});
      }
      setIsLoaded(true);
    };
    loadData();
  }, [selectedCompanyId, isLoadingCompanyContext]);

  useEffect(() => {
    if (isPaymentTypeDialogOpen) {
      if (editingPaymentType) {
        setPaymentTypeFormData({ name: editingPaymentType.name, type: editingPaymentType.type });
      } else {
        setPaymentTypeFormData(defaultNewPaymentTypeData);
      }
    }
  }, [isPaymentTypeDialogOpen, editingPaymentType]);

  useEffect(() => {
    if (isStaffPaymentFormDialogOpen && editingStaffForPayments) {
      setCurrentStaffPaymentFormData(paymentDataStore[editingStaffForPayments.id] || JSON.parse(JSON.stringify(defaultPaymentDetails)));
    } else if (!isStaffPaymentFormDialogOpen) {
      setEditingStaffForPayments(null);
      setCurrentStaffPaymentFormData(JSON.parse(JSON.stringify(defaultPaymentDetails)));
    }
  }, [editingStaffForPayments, isStaffPaymentFormDialogOpen, paymentDataStore]);

  useEffect(() => {
    if (isAddStaffPaymentDialogOpen) {
      setCurrentStaffPaymentFormData(JSON.parse(JSON.stringify(defaultPaymentDetails)));
      setSelectedStaffIdForNewConfig("");
    } else if (!isAddStaffPaymentDialogOpen) {
      setSelectedStaffIdForNewConfig("");
      setCurrentStaffPaymentFormData(JSON.parse(JSON.stringify(defaultPaymentDetails)));
    }
  }, [isAddStaffPaymentDialogOpen]);

  const handlePaymentTypeFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentTypeFormData(prev => ({ ...prev, [name]: value }));
  };
  const handlePaymentTypeTypeChange = (value: "Gross" | "Net") => {
    setPaymentTypeFormData(prev => ({ ...prev, type: value }));
  };
  const handleAddPaymentTypeClick = () => { setFeedback(null); setEditingPaymentType(null); setIsPaymentTypeDialogOpen(true); };
  const handleEditPaymentTypeClick = (type: PaymentType) => { setFeedback(null); setEditingPaymentType(type); setIsPaymentTypeDialogOpen(true); };

  const handleDeletePaymentTypeClick = (type: PaymentType) => {
    setFeedback(null);
    if (type.isDeletable) {
        const isUsed = Object.values(paymentDataStore).some(config => config.hasOwnProperty(type.id));
        if (isUsed) {
            setFeedback({type: 'error', message: "Deletion Blocked", details: `Payment type "${type.name}" is currently configured for one or more staff members. Please remove it from all staff payment configurations before attempting to delete.`});
            return;
        }
        setPaymentTypeToDelete(type); setIsDeletePaymentTypeDialogOpen(true);
    } else {
        setFeedback({type: 'info', message: "Action Denied", details: `"${type.name}" is a core payment type and cannot be deleted.`});
    }
  };

  const confirmDeletePaymentType = async () => { if (paymentTypeToDelete) {
    await deletePaymentType(paymentTypeToDelete.id);
    setPaymentTypes(prev => prev.filter(pt => pt.id !== paymentTypeToDelete.id));
  } setIsDeletePaymentTypeDialogOpen(false); setPaymentTypeToDelete(null); };
  const handleOpenBulkDeletePaymentTypesDialog = () => { setFeedback(null); if (selectedPaymentTypeItems.size === 0) { setFeedback({type: 'info', message: "No Selection", details: "Please select payment types to delete."}); return; } setIsBulkDeletePaymentTypesDialogOpen(true); };
  const confirmBulkDeletePaymentTypes = async () => {
    const supabase = getSupabaseClient();
    await supabase.from('payment_types').delete().in('id', Array.from(selectedPaymentTypeItems));
    setPaymentTypes(prev => prev.filter(pt => !selectedPaymentTypeItems.has(pt.id)));
    setSelectedPaymentTypeItems(prev => {
        const newSelected = new Set(prev);
        Array.from(selectedPaymentTypeItems).forEach(id => newSelected.delete(id));
        return newSelected;
    });
    setIsBulkDeletePaymentTypesDialogOpen(false);
  };


  const handleSavePaymentType = async () => {
    setFeedback(null);
    if (!selectedCompanyId || !paymentTypeFormData.name.trim()) {
      setFeedback({type: 'error', message: "Validation Error", details: "Payment type name is required."}); return;
    }
    try {
      if (editingPaymentType) {
        const updatedType: PaymentType = { ...editingPaymentType, name: editingPaymentType.isFixedName ? editingPaymentType.name : paymentTypeFormData.name.trim(), type: paymentTypeFormData.type };
        await upsertPaymentType(updatedType);
        setPaymentTypes(prev => prev.map(pt => pt.id === updatedType.id ? updatedType : pt).sort((a,b)=>a.order - b.order));
        setFeedback({type: 'success', message: "Payment Type Updated"});
      } else {
        const maxOrder = paymentTypes.reduce((max, pt) => Math.max(max, pt.order), 0);
        const newType: PaymentType = {
          id: `pt_custom_${Date.now()}`, companyId: selectedCompanyId, name: paymentTypeFormData.name.trim(),
          type: paymentTypeFormData.type, order: maxOrder + 1, isFixedName: false, isDeletable: true,
        };
        await upsertPaymentType(newType);
        setPaymentTypes(prev => [...prev, newType].sort((a,b)=>a.order - b.order));
        setFeedback({type: 'success', message: "Payment Type Added"});
      }
      setIsPaymentTypeDialogOpen(false);
    } catch (error) {
      setFeedback({type: 'error', message: "Save Failed", details: `Could not save payment type. ${(error as Error).message}`});
    }
  };

  const handleStaffPaymentFormAmountChange = (paymentTypeId: string, value: string) => {
    const numericValue = parseFloat(value.replace(/,/g, ''));
    setCurrentStaffPaymentFormData(prev => ({
      ...prev,
      [paymentTypeId]: isNaN(numericValue) ? 0 : numericValue,
    }));
  };

  const handleEditStaffPaymentClick = (staff: StaffMember) => { setFeedback(null); setEditingStaffForPayments(staff); setIsStaffPaymentFormDialogOpen(true); };
  const handleAddStaffPaymentConfigClick = () => { setFeedback(null); setIsAddStaffPaymentDialogOpen(true); };
  const handleDeleteStaffPaymentRecordClick = (staffId: string) => { setFeedback(null); setStaffIdForPaymentRecordDeletion(staffId); setIsDeleteStaffPaymentRecordDialogOpen(true);};

  const deleteStaffPaymentRecords = async (staffIdsToDelete: string[]) => {
    setFeedback(null);
    if (staffIdsToDelete.length === 0 || !selectedCompanyId) return;
    let deletedCount = 0;
    let errorCount = 0;
    for (const staffId of staffIdsToDelete) {
      try {
        await deleteStaffPaymentConfig(selectedCompanyId, staffId);
        deletedCount++;
      } catch (error) { console.error(`Error deleting payment config for staff ${staffId}:`, error); errorCount++; }
    }
    if (deletedCount > 0) {
      const { data: updatedPaymentStore } = await getSupabaseClient()
        .from('staff_payment_configs')
        .select('*')
        .eq('companyId', selectedCompanyId);
      setPaymentDataStore(Object.fromEntries((updatedPaymentStore || []).map((config: any) => [config.staffId, config])));
      setSelectedStaffPaymentItems(prev => { const updatedSelection = new Set(prev); staffIdsToDelete.forEach(id => updatedSelection.delete(id)); return updatedSelection; });
      if (spCurrentPage > 1 && paginatedStaffPayments.length === staffIdsToDelete.filter(id => paginatedStaffPayments.some(psp => psp.staffId === id)).length && staffPaymentTableData.slice((spCurrentPage - 2) * spRowsPerPage, (spCurrentPage - 1) * spRowsPerPage).length > 0) { setSpCurrentPage(spCurrentPage - 1); }
      else if (spCurrentPage > 1 && paginatedStaffPayments.length === staffIdsToDelete.filter(id => paginatedStaffPayments.some(psp => psp.staffId === id)).length && staffPaymentTableData.slice((spCurrentPage-1)*spRowsPerPage).length === 0){ setSpCurrentPage( Math.max(1, spCurrentPage -1)); }
    }
    if (deletedCount > 0 && errorCount === 0) {
      setFeedback({type: 'success', message: "Payment Record(s) Deleted", details: `${deletedCount} payment record(s) removed.`});
    } else if (deletedCount > 0 && errorCount > 0) {
      setFeedback({type: 'info', message: "Partial Deletion", details: `${deletedCount} record(s) deleted, ${errorCount} failed.`});
    } else if (errorCount > 0) {
      setFeedback({type: 'error', message: "Delete Error", details: `Could not delete ${errorCount} payment record(s).`});
    }
  };
  const confirmDeleteSingleStaffPaymentRecord = async () => { if (staffIdForPaymentRecordDeletion) { await deleteStaffPaymentRecords([staffIdForPaymentRecordDeletion]); } setIsDeleteStaffPaymentRecordDialogOpen(false); setStaffIdForPaymentRecordDeletion(null); };
  const handleOpenBulkDeleteStaffPaymentsDialog = () => { setFeedback(null); if (selectedStaffPaymentItems.size === 0) { setFeedback({type: 'info', message: "No Selection", details: "Please select payment records to delete."}); return; } setIsBulkDeleteStaffPaymentsDialogOpen(true); };
  const confirmBulkDeleteStaffPayments = async () => { await deleteStaffPaymentRecords(Array.from(selectedStaffPaymentItems)); setIsBulkDeleteStaffPaymentsDialogOpen(false); };

  const validateStaffPaymentFormData = (formData: StaffPaymentDetails): boolean => {
    for (const paymentTypeId in formData) { if (formData[paymentTypeId] === null || formData[paymentTypeId] === undefined || (typeof formData[paymentTypeId] === 'number' && isNaN(formData[paymentTypeId] as number))) { return false; } }
    return true;
  };

  const handleSaveEditedStaffPaymentDetails = async () => {
    setFeedback(null);
    if (!editingStaffForPayments || !selectedCompanyId) return;
    if (!validateStaffPaymentFormData(currentStaffPaymentFormData)) { setFeedback({type: 'error', message: "Validation Error", details: "Please ensure all amount fields are valid numbers."}); return; }
    try {
      await upsertStaffPaymentConfig({ ...currentStaffPaymentFormData, companyId: selectedCompanyId, id: editingStaffForPayments.id });
      const { data: updatedPaymentStore } = await getSupabaseClient()
        .from('staff_payment_configs')
        .select('*')
        .eq('companyId', selectedCompanyId);
      setPaymentDataStore(Object.fromEntries((updatedPaymentStore || []).map((config: any) => [config.staffId, config])));
      setFeedback({type: 'success', message: "Staff Payments Saved", details: `Details for ${editingStaffForPayments.firstName} ${editingStaffForPayments.lastName} updated.`});
    } catch (error) { setFeedback({type: 'error', message: "Save Failed", details: `Could not save staff payment details. ${(error as Error).message}`}); }
    setIsStaffPaymentFormDialogOpen(false);
  };

  const handleSaveNewStaffPaymentConfig = async () => {
    setFeedback(null);
    if (!selectedStaffIdForNewConfig || !selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "Please select a staff member."}); return; }
    if (paymentTypes.length === 0) { setFeedback({type: 'error', message: "Error", details: "No payment types defined for this company."}); return; }
    if (!validateStaffPaymentFormData(currentStaffPaymentFormData)) { setFeedback({type: 'error', message: "Validation Error", details: "Please ensure all amount fields are valid numbers."}); return; }
    try {
      await upsertStaffPaymentConfig({ ...currentStaffPaymentFormData, companyId: selectedCompanyId, id: selectedStaffIdForNewConfig });
      const { data: updatedPaymentStore } = await getSupabaseClient()
        .from('staff_payment_configs')
        .select('*')
        .eq('companyId', selectedCompanyId);
      setPaymentDataStore(Object.fromEntries((updatedPaymentStore || []).map((config: any) => [config.staffId, config])));
      const staffMember = staffList.find(s => s.id === selectedStaffIdForNewConfig);
      setFeedback({type: 'success', message: "Payment Configuration Added", details: `Payment details added for ${staffMember?.firstName} ${staffMember?.lastName}.`});
      setIsAddStaffPaymentDialogOpen(false);
    } catch (error) { setFeedback({type: 'error', message: "Save Failed", details: `Could not save new payment configuration. ${(error as Error).message}`}); }
  };

  const displayablePaymentTypes = useMemo(() => {
    if (!paymentTypeSearchTerm) {
      return paymentTypes.sort((a, b) => a.order - b.order);
    }
    return paymentTypes.filter(pt =>
        pt.name.toLowerCase().includes(paymentTypeSearchTerm.toLowerCase()) ||
        pt.type.toLowerCase().includes(paymentTypeSearchTerm.toLowerCase()) ||
        pt.id.toLowerCase().includes(paymentTypeSearchTerm.toLowerCase())
    ).sort((a,b) => a.order - b.order);
  }, [paymentTypes, paymentTypeSearchTerm]);


  const ptTotalItems = displayablePaymentTypes.length;
  const ptTotalPages = Math.ceil(ptTotalItems / ptRowsPerPage) || 1;
  const ptStartIndex = (ptCurrentPage - 1) * ptRowsPerPage;
  const ptEndIndex = ptStartIndex + ptRowsPerPage;
  const paginatedPaymentTypes = displayablePaymentTypes.slice(ptStartIndex, ptEndIndex);
  const handleSelectPaymentTypeRow = (itemId: string, checked: boolean) => { setSelectedPaymentTypeItems(prev => { const newSelected = new Set(prev); if (checked) newSelected.add(itemId); else newSelected.delete(itemId); return newSelected; }); };
  const handleSelectAllPaymentTypesOnPage = (checked: boolean) => { const pageItemIds = paginatedPaymentTypes.map(item => item.id); if (checked) { setSelectedPaymentTypeItems(prev => new Set([...prev, ...pageItemIds])); } else { const pageItemIdsSet = new Set(pageItemIds); setSelectedPaymentTypeItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id)))); } };
  const isAllPaymentTypesOnPageSelected = paginatedPaymentTypes.length > 0 && paginatedPaymentTypes.every(item => selectedPaymentTypeItems.has(item.id));


  const staffPaymentTableData = useMemo(() => staffList.filter(staff => staff.firstName.toLowerCase().includes(staffPaymentSearchTerm.toLowerCase()) || staff.lastName.toLowerCase().includes(staffPaymentSearchTerm.toLowerCase()) || staff.id.toLowerCase().includes(staffPaymentSearchTerm.toLowerCase())).map(staff => ({ staffId: staff.id, staffName: `${staff.firstName} ${staff.lastName}`, isConfigured: !!paymentDataStore[staff.id] })), [paymentDataStore, staffList, staffPaymentSearchTerm]);
  const spTotalItems = staffPaymentTableData.length;
  const spTotalPages = Math.ceil(spTotalItems / spRowsPerPage) || 1;
  const spStartIndex = (spCurrentPage - 1) * spRowsPerPage;
  const spEndIndex = spStartIndex + spRowsPerPage;
  const paginatedStaffPayments = staffPaymentTableData.slice(spStartIndex, spEndIndex);

  const handleSelectStaffPaymentRow = (itemId: string, checked: boolean) => { setSelectedStaffPaymentItems(prev => { const newSelected = new Set(prev); if (checked) newSelected.add(itemId); else newSelected.delete(itemId); return newSelected; }); };
  const handleSelectAllStaffPaymentsOnPage = (checked: boolean) => { const pageItemIds = paginatedStaffPayments.map(item => item.staffId); if (checked) { setSelectedStaffPaymentItems(prev => new Set([...prev, ...pageItemIds])); } else { const pageItemIdsSet = new Set(pageItemIds); setSelectedStaffPaymentItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id)))); } };
  const isAllStaffPaymentsOnPageSelected = paginatedStaffPayments.length > 0 && paginatedStaffPayments.every(item => selectedStaffPaymentItems.has(item.staffId));
  const staffWithoutPaymentConfig = useMemo(() => staffList.filter(staff => !paymentDataStore[staff.id]), [staffList, paymentDataStore]);

  const exportStaffPaymentData = (fileType: "csv" | "xlsx" | "pdf") => {
    setFeedback(null);
    if (!selectedCompanyId || staffList.length === 0) { setFeedback({type: 'error', message: "Error", details: "No company selected or no staff data to export."}); return; }
    const sortedPaymentTypesForExport = [...paymentTypes].sort((a,b) => a.order - b.order);
    const exportHeaders = ['StaffID', 'StaffName', ...sortedPaymentTypesForExport.map(pt => pt.name)];
    const dataToExport = staffList.map(staff => {
      const details = paymentDataStore[staff.id] || {};
      const row: Record<string, string | number> = { 'StaffID': String(staff.id), 'StaffName': `${staff.firstName} ${staff.lastName}`};
      sortedPaymentTypesForExport.forEach(pt => { row[pt.name] = details[pt.id] || 0; }); // Amounts are numbers
      return row;
    });
    const companyNameForFile = sanitizeFilename(selectedCompanyName);
    const fileName = `${companyNameForFile}_payments_export.${fileType}`;

    if (fileType === "csv") {
      const csvData = dataToExport.map(row => {
        const newRow: Record<string, string> = {};
        exportHeaders.forEach(header => {
            let cellValue = String(row[header] || (header === 'StaffID' || header === 'StaffName' ? '' : '0')); // Ensure StaffID is string
            if (header === 'StaffID' && /^\d+$/.test(cellValue) && cellValue.length > 0) {
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
        const newRow: Record<string, string | number> = {};
        exportHeaders.forEach(h => {
            if (h === 'StaffID') newRow[h] = String(row[h] || ''); // Explicitly string for StaffID
            else newRow[h] = (typeof row[h] === 'number' ? row[h] : String(row[h] || ''));
        });
        return newRow;
      });
      const worksheet = XLSX.utils.json_to_sheet(xlsxData, {header: exportHeaders, skipHeader: false});
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Details");
      XLSX.writeFile(workbook, fileName);
      setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") {
      const pdfData = dataToExport.map(row => exportHeaders.map(header => typeof row[header] === 'number' ? formatNumberForTable(row[header] as number) : String(row[header] || '')));
      const doc = new jsPDF({ orientation: 'landscape' });
      (doc as any).autoTable({ head: [exportHeaders], body: pdfData, styles: { fontSize: 6, cellPadding: 1.5 }, headStyles: { fillColor: [102, 126, 234] }, margin: { top: 10 } });
      doc.save(fileName);
      setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    }
  };

  const handleDownloadStaffPaymentTemplate = () => {
      setFeedback(null);
      if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "Please select a company first."}); return; }
      if (paymentTypes.length === 0) { setFeedback({type: 'error', message: "Error", details: "No payment types defined for this company to create a template."}); return; }
      const headers = ['StaffID', ...paymentTypes.map(pt => pt.name)];
      const csvString = headers.join(',') + '\n';
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'payments_import_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({type: 'info', message: "Template Downloaded", details: "Staff payment config template. Tip: If a field contains commas (e.g., numbers like \"1,250,000\" or payment type names like \"Meal Allowance, Special\"), ensure the entire field (including the header) is enclosed in double quotes in your CSV."});
  };

  const handleStaffPaymentImportClick = () => { setFeedback(null); if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "Please select a company before importing."}); return; } staffPaymentImportFileInputRef.current?.click(); };

  const parseCSVToPaymentDetails = (
    csvText: string,
    currentCompanyId: string,
    currentPaymentTypes: PaymentType[],
    currentStaffList: StaffMember[]
  ): Promise<{ data: { staffId: string, details: StaffPaymentDetails }[], processedDataRowCount: number, papaParseErrors: Papa.ParseError[], validationSkippedLog: string[] }> => {
      return new Promise((resolve) => {
          Papa.parse<Record<string, string>>(csvText, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                  const parsedPaymentDetails: { staffId: string, details: StaffPaymentDetails }[] = [];
                  const validationSkippedLog: string[] = [];
                  let processedDataRowCount = 0;

                  const headerToPaymentTypeIdMap: Record<string, string> = {};
                  currentPaymentTypes.forEach(pt => {
                      headerToPaymentTypeIdMap[pt.name.toLowerCase().replace(/\s+/g, '')] = pt.id;
                  });

                  results.data.forEach((rawRow, index) => {
                      processedDataRowCount++;
                      const originalLineNumber = index + 2;
                      const staffIdKey = Object.keys(rawRow).find(k => k.trim().toLowerCase() === 'staffid');

                      if (!staffIdKey || !rawRow[staffIdKey] || String(rawRow[staffIdKey]).trim() === "") {
                          validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Missing StaffID.`);
                          return;
                      }
                      const staffId = String(rawRow[staffIdKey]).trim();

                      if (!currentStaffList.find(s => s.id === staffId && s.companyId === currentCompanyId)) {
                          validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Staff ID ${staffId} not found for current company.`);
                          return;
                      }

                      const details: StaffPaymentDetails = {};
                      let hasValidAmount = false;
                      for (const csvHeader in rawRow) {
                          const normalizedHeader = csvHeader.trim().toLowerCase();
                          if (normalizedHeader === 'staffid' || normalizedHeader === 'staffname') continue;
                          
                          const normalizedCsvHeaderForMap = normalizedHeader.replace(/\s+/g, '');
                          const paymentTypeId = headerToPaymentTypeIdMap[normalizedCsvHeaderForMap];

                          if (paymentTypeId) {
                              const amountString = String(rawRow[csvHeader] || '0').trim().replace(/,/g, '');
                              const amount = parseFloat(amountString);
                              details[paymentTypeId] = isNaN(amount) ? 0 : amount;
                              if (!isNaN(amount)) hasValidAmount = true;
                          }
                      }
                      if (!hasValidAmount && Object.keys(details).length === 0) {
                         validationSkippedLog.push(`Row ${originalLineNumber} for StaffID ${staffId} skipped. Reason: No valid payment amounts found for defined payment types.`);
                         return;
                      }
                      parsedPaymentDetails.push({ staffId, details });
                  });
                  resolve({ data: parsedPaymentDetails, processedDataRowCount, papaParseErrors: results.errors, validationSkippedLog });
              }
          });
      });
  };

  const handleStaffPaymentFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "No company selected for import target."}); return; }
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
          const { data: parsedData, processedDataRowCount, papaParseErrors, validationSkippedLog } = await parseCSVToPaymentDetails(text, selectedCompanyId, paymentTypes, staffList);
          let newCount = 0; let updatedCount = 0;
          for (const item of parsedData) {
            // Supabase: Upsert staff payment config
            await upsertStaffPaymentConfig({ ...item.details, companyId: selectedCompanyId, staffId: item.staffId });
            // Optionally, you can check if the config exists by fetching it first if needed
          }
          // Supabase: Fetch all staff payment configs for the company
          const updatedPaymentStore = await fetchStaffPaymentConfigs(selectedCompanyId);
          setPaymentDataStore(Object.fromEntries((updatedPaymentStore || []).map((config: any) => [config.staffId, config])));

          let feedbackMessage = "";
          let feedbackTitle = "Import Processed";
          let feedbackType: FeedbackMessage['type'] = "info";
          const totalPapaParseErrors = papaParseErrors.length;
          const totalValidationSkipped = validationSkippedLog.length;

          if (newCount > 0 || updatedCount > 0) {
            feedbackTitle = "Import Successful";
            feedbackMessage = `${newCount} records added, ${updatedCount} records updated.`;
            feedbackType = 'success';
          } else if (parsedData.length === 0 && processedDataRowCount > 0 && (totalPapaParseErrors > 0 || totalValidationSkipped > 0)) {
            feedbackTitle = "Import Failed";
            feedbackMessage = `All ${processedDataRowCount} data row(s) were processed, but no valid payment configurations could be imported.`;
            feedbackType = 'error';
          } else if (parsedData.length === 0 && processedDataRowCount === 0 && (totalPapaParseErrors > 0 || text.split('\\n').filter(l => l.trim() !== '').length > 1) ) {
            feedbackTitle = "Import Failed";
            feedbackMessage = `No data rows found or all rows had critical parsing errors. Please check CSV structure.`;
            feedbackType = 'error';
          } else if (newCount === 0 && updatedCount === 0 && totalPapaParseErrors === 0 && totalValidationSkipped === 0 && processedDataRowCount > 0) {
            feedbackTitle = "Import Note";
            feedbackMessage = `CSV processed. ${processedDataRowCount} data row(s) checked. No new records were added, and no changes were found for existing payment configurations.`;
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
          setSelectedStaffPaymentItems(new Set()); setSpCurrentPage(1);
        } catch (error: any) { setFeedback({type: 'error', message: "Import Failed", details: error.message || "Could not parse CSV file."}); console.error("CSV Parsing Error:", error); }
      };
      reader.readAsText(file); if (event.target) event.target.value = '';
    }
  };

  const paymentTypeColumnsForExport = [
    { key: 'id', label: 'ID', isIdLike: true },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type (Gross/Net)' },
    { key: 'order', label: 'Order' },
    { key: 'isFixedName', label: 'IsFixedName' },
    { key: 'isDeletable', label: 'IsDeletable' },
  ];

  const exportPaymentTypesData = (fileType: "csv" | "xlsx" | "pdf") => {
    setFeedback(null);
    if (!selectedCompanyId) {
      setFeedback({type: 'error', message: "Error", details: "No company selected for export."});
      return;
    }
    if (paymentTypes.length === 0) {
      setFeedback({type: 'info', message: "No Data", details: "There are no payment types to export for the current company."}); return;
    }

    const headers = paymentTypeColumnsForExport.map(col => col.label);
    const dataToExport = paymentTypes.map(pt => {
      const exportRow: Record<string, string | number | boolean> = {};
      paymentTypeColumnsForExport.forEach(col => {
        const value = pt[col.key as keyof Omit<PaymentType, 'companyId'>];
        if (col.isIdLike) {
          exportRow[col.label] = String(value || '');
        } else {
          exportRow[col.label] = value;
        }
      });
      return exportRow;
    });

    const companyNameForFile = sanitizeFilename(selectedCompanyName);
    const fileName = `${companyNameForFile}_payment_types_export.${fileType}`;

    if (fileType === "csv") {
      const csvData = dataToExport.map(row => {
        const newRow: Record<string, string> = {};
        headers.forEach(header => {
            const colDef = paymentTypeColumnsForExport.find(c => c.label === header);
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
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "xlsx") {
        const xlsxData = dataToExport.map(row => {
            const newRow: Record<string, string|number|boolean>={};
            headers.forEach(h => {
                const colDef = paymentTypeColumnsForExport.find(c => c.label === h);
                if (colDef?.isIdLike) newRow[h] = String(row[h] || '');
                else newRow[h] = row[h];
            });
            return newRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(xlsxData, {header: headers, skipHeader: false});
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Types");
        XLSX.writeFile(workbook, fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") {
      const pdfData = dataToExport.map(row => paymentTypeColumnsForExport.map(col => String(row[col.label] || '')));
      const doc = new jsPDF({ orientation: 'landscape' });
      (doc as any).autoTable({
        head: [headers],
        body: pdfData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [102, 126, 234] },
        margin: { top: 10 },
      });
      doc.save(fileName);
      setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    }
  };

  const handleDownloadPaymentTypeTemplate = () => {
    setFeedback(null);
    const headers = ['ID', 'Name', 'Type'];
    const csvString = headers.join(',') + '\n';
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'payment_types_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback({type: 'info', message: "Template Downloaded", details: "Payment types template. Tip: If a field contains commas (e.g., \"Bonus, End of Year\"), ensure the entire field is enclosed in double quotes in your CSV."});
  };

  const handlePaymentTypesImportClick = () => {
    setFeedback(null);
    if (!selectedCompanyId) {
      setFeedback({type: 'error', message: "Error", details: "Please select a company before importing payment types."});
      return;
    }
    paymentTypesImportFileInputRef.current?.click();
  };

  const parseCSVToPaymentTypes = (
    csvText: string,
    currentCompanyId: string,
    existingCompanyTypes: PaymentType[]
  ): Promise<{ data: PaymentType[], processedDataRowCount: number, papaParseErrors: Papa.ParseError[], validationSkippedLog: string[] }> => {
      return new Promise((resolve) => {
          Papa.parse<Record<string, string>>(csvText, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                  const parsedPaymentTypes: PaymentType[] = [];
                  const validationSkippedLog: string[] = [];
                  let processedDataRowCount = 0;
                  let maxExistingOrder = existingCompanyTypes.reduce((max, pt) => Math.max(max, pt.order), 0);

                  results.data.forEach((rawRow, index) => {
                      processedDataRowCount++;
                      const originalLineNumber = index + 2;
                      const idKey = Object.keys(rawRow).find(k => k.trim().toLowerCase() === 'id');
                      const nameKey = Object.keys(rawRow).find(k => k.trim().toLowerCase() === 'name');
                      const typeKey = Object.keys(rawRow).find(k => k.trim().toLowerCase() === 'type');

                      if (!idKey || !nameKey || !typeKey ||
                          !rawRow[idKey] || String(rawRow[idKey]).trim() === "" ||
                          !rawRow[nameKey] || String(rawRow[nameKey]).trim() === "" ||
                          !rawRow[typeKey] || String(rawRow[typeKey]).trim() === "") {
                          validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Missing required field(s): ID, Name, or Type.`);
                          return;
                      }

                      const id = String(rawRow[idKey]).trim();
                      const name = String(rawRow[nameKey]).trim();
                      let type = String(rawRow[typeKey]).trim() as "Gross" | "Net";

                      if (type !== "Gross" && type !== "Net") {
                          validationSkippedLog.push(`Row ${originalLineNumber} (ID: ${id}): Invalid Type value "${type}". Defaulting to Gross.`);
                          type = "Gross";
                      }

                      const existingType = existingCompanyTypes.find(et => et.id === id && et.companyId === currentCompanyId);
                      if (existingType) {
                          if (existingType.id === DEFAULT_BASIC_PAY_ID || existingType.id === DEFAULT_TRANSPORT_ALLOWANCE_ID) {
                              parsedPaymentTypes.push({ ...existingType, type });
                          } else {
                              parsedPaymentTypes.push({ ...existingType, name, type });
                          }
                      } else {
                          maxExistingOrder++;
                          parsedPaymentTypes.push({
                              id, companyId: currentCompanyId, name, type,
                              order: maxExistingOrder, isFixedName: false, isDeletable: true,
                          });
                      }
                  });
                  resolve({ data: parsedPaymentTypes, processedDataRowCount, papaParseErrors: results.errors, validationSkippedLog });
              }
          });
      });
  };

  const handlePaymentTypesFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
          const { data: parsedData, processedDataRowCount, papaParseErrors, validationSkippedLog } = await parseCSVToPaymentTypes(text, selectedCompanyId, paymentTypes);
          let newCount = 0, updatedCount = 0;
          const itemsToBulkPut: PaymentType[] = [];
          const { data: updatedPaymentTypesList = [] } = await getSupabaseClient().from('payment_types').select('*').eq('companyId', selectedCompanyId);

          const safeExistingPaymentTypesInDB = updatedPaymentTypesList || [];
          for (const importedPT of parsedData) {
            const existingIndex = safeExistingPaymentTypesInDB.findIndex((pt: PaymentType) => pt.id === importedPT.id && pt.companyId === selectedCompanyId);
            if (existingIndex > -1) {
              const currentDbVersion = safeExistingPaymentTypesInDB[existingIndex];
              if(currentDbVersion.name !== importedPT.name || currentDbVersion.type !== importedPT.type || ((currentDbVersion.id === DEFAULT_BASIC_PAY_ID || currentDbVersion.id === DEFAULT_TRANSPORT_ALLOWANCE_ID) && currentDbVersion.type !== importedPT.type)) {
                 itemsToBulkPut.push(importedPT);
                 updatedCount++;
              }
            } else {
              itemsToBulkPut.push(importedPT);
              newCount++;
            }
          }
          if (itemsToBulkPut.length > 0) {
            for (const pt of itemsToBulkPut) {
              await upsertPaymentType(pt);
            }
          }
          const safeUpdatedPaymentTypesList = updatedPaymentTypesList || [];
          setPaymentTypes(safeUpdatedPaymentTypesList.sort((a: PaymentType, b: PaymentType) => a.order - b.order));

          let feedbackMessage = "";
          let feedbackTitle = "Import Processed";
          let feedbackType: FeedbackMessage['type'] = "info";
          const totalPapaParseErrors = papaParseErrors.length;
          const totalValidationSkipped = validationSkippedLog.length;

          if (newCount > 0 || updatedCount > 0) {
            feedbackTitle = "Import Successful";
            feedbackMessage = `${newCount} payment types added, ${updatedCount} updated.`;
            feedbackType = 'success';
          } else if (parsedData.length === 0 && processedDataRowCount > 0 && (totalPapaParseErrors > 0 || totalValidationSkipped > 0)) {
            feedbackTitle = "Import Failed";
            feedbackMessage = `All ${processedDataRowCount} data row(s) were processed, but no valid payment types could be imported.`;
            feedbackType = 'error';
          } else if (parsedData.length === 0 && processedDataRowCount === 0 && (totalPapaParseErrors > 0 || text.split('\\n').filter(l => l.trim() !== '').length > 1) ) {
            feedbackTitle = "Import Failed";
            feedbackMessage = `No data rows found or all rows had critical parsing errors. Please check CSV structure.`;
            feedbackType = 'error';
          } else if (newCount === 0 && updatedCount === 0 && totalPapaParseErrors === 0 && totalValidationSkipped === 0 && processedDataRowCount > 0) {
            feedbackTitle = "Import Note";
            feedbackMessage = `CSV processed. ${processedDataRowCount} data row(s) checked. No new payment types were added, and no changes were found for existing types.`;
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
          setFeedback({type: 'error', message: "Import Failed", details: error.message || "Could not parse CSV file for payment types."});
          console.error("Payment Types CSV Parsing Error:", error);
        }
      };
      reader.readAsText(file); if (event.target) event.target.value = '';
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
      <Alert variant={variant} className={cn("my-4", additionalAlertClasses)}>
        <IconComponent className="h-4 w-4" />
        <AlertTitle>{feedback.message}</AlertTitle>
        {feedback.details && <AlertDescription>{feedback.details}</AlertDescription>}
      </Alert>
    );
  };


  if (isLoadingCompanyContext) return (<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading company information...</div>);
  if (!selectedCompanyId) return (<div className="flex flex-col items-center justify-center h-64 text-center"><Banknote className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-xl font-semibold">No Company Selected</p><p className="text-muted-foreground">Please select a company to manage payment configurations.</p><Button asChild className="mt-4"><Link href="/select-company">Go to Company Selection</Link></Button></div>);
  if (!isLoaded) return (<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading payment data for selected company...</div>);

  const addStaffPaymentButtonTooltip =
    !selectedCompanyId ? "Please select a company first."
    : paymentTypes.length === 0 ? "Define Payment Types first for this company."
    : staffWithoutPaymentConfig.length === 0 ? "All staff in this company already have payment configurations."
    : "Add new payment configuration for a staff member.";

  return (
    <div className="space-y-8">
      <input type="file" ref={staffPaymentImportFileInputRef} onChange={handleStaffPaymentFileUpload} accept=".csv" className="hidden" />
      <input type="file" ref={paymentTypesImportFileInputRef} onChange={handlePaymentTypesFileUpload} accept=".csv" className="hidden" />

      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Payments Management</h1>
      </div>
      <p className="text-muted-foreground -mt-6 mb-2">
        Define payment types for your company (e.g., Basic Pay, Allowances) and then configure individual staff payments against these types.
      </p>
      {renderFeedbackMessage()}

      <Tabs defaultValue="payments">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="paymentTypes">Payment Types</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Banknote className="mr-2 h-6 w-6 text-primary" />Payments</CardTitle>
                <CardDescription>List of all payments to respective staff.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                    <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="search" placeholder="Search staff..." className="w-full pl-10" value={staffPaymentSearchTerm} onChange={(e) => { setStaffPaymentSearchTerm(e.target.value); setSpCurrentPage(1); setSelectedStaffPaymentItems(new Set()); setFeedback(null);}} disabled={!selectedCompanyId}/>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto" disabled={!selectedCompanyId} onClick={() => setFeedback(null)}>
                                    <Upload className="mr-2 h-4 w-4" /> Import / Template
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleDownloadStaffPaymentTemplate}>
                                    <Download className="mr-2 h-4 w-4" /> Download Template
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleStaffPaymentImportClick}>
                                    <Upload className="mr-2 h-4 w-4" /> Upload Data
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={!selectedCompanyId || staffList.length === 0 || paymentTypes.length === 0} onClick={() => setFeedback(null)}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-full sm:w-auto">
                            <DropdownMenuItem onClick={() => exportStaffPaymentData("csv")}><FileText className="mr-2 h-4 w-4" /> Export as CSV</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportStaffPaymentData("xlsx")}><FileSpreadsheet className="mr-2 h-4 w-4" /> Export as XLSX</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportStaffPaymentData("pdf")}><FileType className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={handleAddStaffPaymentConfigClick} className="w-full sm:w-auto" disabled={!selectedCompanyId || paymentTypes.length === 0 || staffWithoutPaymentConfig.length === 0}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Staff Payment
                                </Button>
                            </TooltipTrigger>
                            {(!selectedCompanyId || paymentTypes.length === 0 || staffWithoutPaymentConfig.length === 0) && (
                                <TooltipContent><p>{addStaffPaymentButtonTooltip}</p></TooltipContent>
                            )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {selectedStaffPaymentItems.size > 0 && (<div className="my-2 flex items-center justify-between p-3 bg-muted/50 rounded-md"><span className="text-sm text-muted-foreground">{selectedStaffPaymentItems.size} record(s) selected</span><Button variant="destructive" onClick={handleOpenBulkDeleteStaffPaymentsDialog} disabled={!selectedCompanyId}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected Records</Button></div>)}

                <div className="rounded-md border"><Table>
                <TableHeader><TableRow><TableHead className="sticky top-0 z-10 bg-card w-[50px]"><Checkbox checked={isAllStaffPaymentsOnPageSelected} onCheckedChange={(checked) => handleSelectAllStaffPaymentsOnPage(Boolean(checked))} aria-label="Select all staff payments on current page" disabled={paginatedStaffPayments.length === 0}/></TableHead><TableHead className="sticky top-0 z-10 bg-card">Staff ID</TableHead><TableHead className="sticky top-0 z-10 bg-card">Staff Name</TableHead><TableHead className="sticky top-0 z-10 bg-card">Configuration Status</TableHead><TableHead className="sticky top-0 z-10 bg-card text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                    {paginatedStaffPayments.map((staffPay) => (<TableRow key={staffPay.staffId} data-state={selectedStaffPaymentItems.has(staffPay.staffId) ? "selected" : ""}><TableCell><Checkbox checked={selectedStaffPaymentItems.has(staffPay.staffId)} onCheckedChange={(checked) => handleSelectStaffPaymentRow(staffPay.staffId, Boolean(checked))} aria-label={`Select row ${staffPay.staffId}`}/></TableCell><TableCell>{staffPay.staffId}</TableCell><TableCell className="font-medium">{staffPay.staffName}</TableCell><TableCell>{staffPay.isConfigured ? "Configured" : "Not Configured"}</TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => handleEditStaffPaymentClick(staffList.find(s => s.id === staffPay.staffId)!)} title="Edit Payment Details"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteStaffPaymentRecordClick(staffPay.staffId)} title="Delete Payment Record" className="text-destructive hover:text-destructive/90" disabled={!staffPay.isConfigured}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}
                    {paginatedStaffPayments.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center h-24">No staff members found for current company or matching criteria.</TableCell></TableRow>)}
                </TableBody></Table></div>
                {spTotalPages > 1 && (
                  <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                      {selectedStaffPaymentItems.size > 0 ? `${selectedStaffPaymentItems.size} of ${spTotalItems} record(s) selected.` : `Page ${spCurrentPage} of ${spTotalPages} (${spTotalItems} total records)`}
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select value={`${spRowsPerPage}`} onValueChange={(value) => {setSpRowsPerPage(Number(value)); setSpCurrentPage(1); setSelectedStaffPaymentItems(new Set());}}>
                          <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${spRowsPerPage}`} /></SelectTrigger>
                          <SelectContent side="top">
                            {ROWS_PER_PAGE_OPTIONS.map((pageSize) => (<SelectItem key={`sp-${pageSize}`} value={`${pageSize}`}>{pageSize}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setSpCurrentPage(1); setSelectedStaffPaymentItems(new Set());}} disabled={spCurrentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setSpCurrentPage(prev => prev - 1); setSelectedStaffPaymentItems(new Set());}} disabled={spCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setSpCurrentPage(prev => prev + 1); setSelectedStaffPaymentItems(new Set());}} disabled={spCurrentPage === spTotalPages}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setSpCurrentPage(spTotalPages); setSelectedStaffPaymentItems(new Set());}} disabled={spCurrentPage === spTotalPages}><ChevronsRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="paymentTypes">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Settings className="mr-2 h-6 w-6 text-primary" />Payment Types</CardTitle>
                 <CardDescription className="mt-1">
                     Manage company payment types (e.g., Basic Pay, Allowances) and set their Gross/Net status. &apos;Basic Pay&apos; (fundamental) &amp; &apos;Transport Allowance&apos; (for statutory calculations) are core, non-deletable types with fixed names, but their Gross/Net status is editable. Add custom types; order impacts payroll.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                    <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search payment types..."
                            className="w-full pl-10"
                            value={paymentTypeSearchTerm}
                            onChange={(e) => {setPaymentTypeSearchTerm(e.target.value); setPtCurrentPage(1); setFeedback(null);}}
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
                                <DropdownMenuItem onClick={handleDownloadPaymentTypeTemplate}>
                                    <Download className="mr-2 h-4 w-4" /> Download Template
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handlePaymentTypesImportClick}>
                                    <Upload className="mr-2 h-4 w-4" /> Upload Data
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto" disabled={!selectedCompanyId || paymentTypes.length === 0} onClick={() => setFeedback(null)}>
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-full sm:w-auto">
                                <DropdownMenuItem onClick={() => exportPaymentTypesData("csv")}><FileText className="mr-2 h-4 w-4" /> Export as CSV</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportPaymentTypesData("xlsx")}><FileSpreadsheet className="mr-2 h-4 w-4" /> Export as XLSX</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportPaymentTypesData("pdf")}><FileType className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleAddPaymentTypeClick} disabled={!selectedCompanyId} className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Payment Type
                        </Button>
                    </div>
                </div>
                {selectedPaymentTypeItems.size > 0 && (
                    <div className="my-2 flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <span className="text-sm text-muted-foreground">{selectedPaymentTypeItems.size} payment type(s) selected</span>
                        <Button variant="destructive" onClick={handleOpenBulkDeletePaymentTypesDialog} disabled={!selectedCompanyId}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                        </Button>
                    </div>
                )}
                <div className="rounded-md border"><Table><TableHeader><TableRow>
                    <TableHead className="sticky top-0 z-10 bg-card w-[50px]">
                        <Checkbox
                            checked={isAllPaymentTypesOnPageSelected}
                            onCheckedChange={(checked) => handleSelectAllPaymentTypesOnPage(Boolean(checked))}
                            aria-label="Select all payment types on page"
                            disabled={paginatedPaymentTypes.length === 0}
                        />
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card">Order</TableHead><TableHead className="sticky top-0 z-10 bg-card">Name</TableHead><TableHead className="sticky top-0 z-10 bg-card">Type (Gross/Net)</TableHead><TableHead className="sticky top-0 z-10 bg-card text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {paginatedPaymentTypes.map(pt => (
                          <TableRow key={pt.id} data-state={selectedPaymentTypeItems.has(pt.id) ? "selected" : ""}>
                              <TableCell>
                                <Checkbox
                                    checked={selectedPaymentTypeItems.has(pt.id)}
                                    onCheckedChange={(checked) => handleSelectPaymentTypeRow(pt.id, Boolean(checked))}
                                    aria-label={`Select payment type ${pt.name}`}
                                    disabled={!pt.isDeletable}
                                />
                              </TableCell>
                              <TableCell>{pt.order}</TableCell>
                              <TableCell className="font-medium">{pt.name} {(pt.id === DEFAULT_BASIC_PAY_ID || pt.id === DEFAULT_TRANSPORT_ALLOWANCE_ID) && <span className="text-xs text-muted-foreground ml-1">(Core)</span>}
                              {pt.name.toLowerCase() === "house allowance" && (
                                  <TooltipProvider delayDuration={100}>
                                      <Tooltip>

                                      <TooltipTrigger asChild><Info className="h-3.5 w-3.5 ml-1.5 text-primary/80 inline-block cursor-help" /></TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs"><p>Naming this &apos;House Allowance&apos; will automatically map its calculated gross value to the &apos;Cash Allowance (House)&apos; column in relevant statutory reports.</p></TooltipContent>
                                      </Tooltip>
                                  </TooltipProvider>
                                  )}
                              </TableCell>
                              <TableCell>{pt.type}</TableCell>
                              <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditPaymentTypeClick(pt)} title="Edit Type"><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeletePaymentTypeClick(pt)} title={pt.isDeletable ? "Delete Type" : "Core type cannot be deleted"} className={pt.isDeletable ? "text-destructive hover:text-destructive/90" : "text-muted-foreground cursor-not-allowed"} disabled={!pt.isDeletable}><Trash2 className="h-4 w-4" /></Button>
                              </TableCell>
                          </TableRow>
                          ))}
                          {paginatedPaymentTypes.length === 0 && (
                              <TableRow>
                                  <TableCell colSpan={5} className="text-center h-24">
                                  {paymentTypeSearchTerm && paymentTypes.length > 0 ? "No payment types match your search." : "No payment types defined for this company. Add 'Basic Pay' and 'Transport Allowance' or custom types."}
                                  </TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                    </Table></div>
                {ptTotalPages > 1 && (
                  <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                      {selectedPaymentTypeItems.size > 0 ? `${selectedPaymentTypeItems.size} of ${ptTotalItems} type(s) selected.` : `Page ${ptCurrentPage} of ${ptTotalPages} (${ptTotalItems} total types)`}
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select value={`${ptRowsPerPage}`} onValueChange={(value) => {setPtRowsPerPage(Number(value)); setPtCurrentPage(1); setSelectedPaymentTypeItems(new Set());}}>
                          <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${ptRowsPerPage}`} /></SelectTrigger>
                          <SelectContent side="top">
                            {ROWS_PER_PAGE_OPTIONS.map((pageSize) => (<SelectItem key={`pt-${pageSize}`} value={`${pageSize}`}>{pageSize}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setPtCurrentPage(1); setSelectedPaymentTypeItems(new Set());}} disabled={ptCurrentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setPtCurrentPage(prev => prev - 1); setSelectedPaymentTypeItems(new Set());}} disabled={ptCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setPtCurrentPage(prev => prev + 1); setSelectedPaymentTypeItems(new Set());}} disabled={ptCurrentPage === ptTotalPages}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setPtCurrentPage(ptTotalPages); setSelectedPaymentTypeItems(new Set());}} disabled={ptCurrentPage === ptTotalPages}><ChevronsRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <Dialog open={isPaymentTypeDialogOpen} onOpenChange={(isOpen) => { setIsPaymentTypeDialogOpen(isOpen); if(!isOpen) setFeedback(null); }}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingPaymentType ? "Edit" : "Add New"} Payment Type</DialogTitle><DialogDescription>Define a payment component and its Gross/Net status for this company.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentTypeName">Name *</Label>
              <Input id="paymentTypeName" name="name" value={paymentTypeFormData.name} onChange={handlePaymentTypeFormChange} placeholder="e.g., Meal Allowance" disabled={!!editingPaymentType && editingPaymentType.isFixedName} />
              {paymentTypeFormData.name.trim().toLowerCase() === "house allowance" && (!editingPaymentType || !editingPaymentType.isFixedName) && (
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <Info className="h-3 w-3 mr-1.5 text-primary/80" /> Note: Naming this &apos;House Allowance&apos; will automatically map its calculated gross value to the &apos;Cash Allowance (House)&apos; column in relevant statutory reports.
                  </p>
              )}
            </div>
            <div className="space-y-2"><Label>Type *</Label><RadioGroup value={paymentTypeFormData.type} onValueChange={handlePaymentTypeTypeChange} className="flex space-x-3 pt-1"><div className="flex items-center space-x-1.5"><RadioGroupItem value="Gross" id="paymentTypeGross" /><Label htmlFor="paymentTypeGross" className="font-normal">Gross</Label></div><div className="flex items-center space-x-1.5"><RadioGroupItem value="Net" id="paymentTypeNet" /><Label htmlFor="paymentTypeNet" className="font-normal">Net</Label></div></RadioGroup></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsPaymentTypeDialogOpen(false)}>Cancel</Button><Button onClick={handleSavePaymentType}>Save Type</Button></DialogFooter></DialogContent>
      </Dialog>
      <AlertDialog open={isDeletePaymentTypeDialogOpen} onOpenChange={(isOpen) => { setIsDeletePaymentTypeDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete payment type "{paymentTypeToDelete?.name}"? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeletePaymentType} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isBulkDeletePaymentTypesDialogOpen} onOpenChange={(isOpen) => { setIsBulkDeletePaymentTypesDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>Delete {selectedPaymentTypeItems.size} selected payment type(s)? Core types and types in use will be skipped.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmBulkDeletePaymentTypes} className="bg-destructive hover:bg-destructive/90">Delete Selected</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Dialog open={isStaffPaymentFormDialogOpen} onOpenChange={(isOpen) => { setIsStaffPaymentFormDialogOpen(isOpen); if(!isOpen) setFeedback(null); }}>
        <DialogContent className="sm:max-w-lg md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Payment Details for {editingStaffForPayments?.firstName} {editingStaffForPayments?.lastName}</DialogTitle>
            <DialogDescription>Update amounts for each defined Payment Type (Gross/Net status is fixed by type).</DialogDescription>
          </DialogHeader>
          <ScrollArea>
            <div>
              {paymentTypes.map(pt => (
                <div key={pt.id} className="space-y-2 p-3 border rounded-md bg-muted/20">
                  <Label htmlFor={`staffpay-${pt.id}`}>{pt.name} ({pt.type})</Label>
                  <Input id={`staffpay-${pt.id}`} type="number" value={currentStaffPaymentFormData[pt.id] || ""} onChange={(e) => handleStaffPaymentFormAmountChange(pt.id, e.target.value)} placeholder="0" min="0" step="1" />
                </div>
              ))}
              {paymentTypes.length === 0 && <p className="text-muted-foreground text-center col-span-full">No payment types defined for this company yet.</p>}
            </div>
          </ScrollArea>
          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setIsStaffPaymentFormDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveEditedStaffPaymentDetails} disabled={paymentTypes.length === 0}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddStaffPaymentDialogOpen} onOpenChange={(isOpen) => { setIsAddStaffPaymentDialogOpen(isOpen); if (!isOpen) setFeedback(null); }}>
        <DialogContent className="sm:max-w-lg md:max-w-xl"><DialogHeader><DialogTitle>Add New Staff Payment Configuration</DialogTitle><DialogDescription>Select staff from current company without existing payment details.</DialogDescription></DialogHeader><ScrollArea className="max-h-[60vh] pr-3" tabIndex={0}><div className="space-y-4 py-4">
          <div className="space-y-2"><Label htmlFor="addStaffSelect">Staff Member *</Label><Select value={selectedStaffIdForNewConfig} onValueChange={setSelectedStaffIdForNewConfig} required><SelectTrigger id="addStaffSelect"><SelectValue placeholder="Select staff member" /></SelectTrigger><SelectContent>{staffWithoutPaymentConfig.length === 0 ? (<SelectItem value="no-staff" disabled>No staff available without payment config.</SelectItem>) : (staffWithoutPaymentConfig.map(staff => (<SelectItem key={staff.id} value={staff.id}>{staff.firstName} {staff.lastName} ({staff.id})</SelectItem>)))}</SelectContent></Select></div>
          {selectedStaffIdForNewConfig && paymentTypes.length > 0 && (<div className="grid grid-cols-1 gap-4">{paymentTypes.map(pt => (<div key={`add-${pt.id}`} className="space-y-2 p-3 border rounded-md bg-muted/20"><Label htmlFor={`addstaffpay-${pt.id}`}>{pt.name} ({pt.type})</Label><Input id={`addstaffpay-${pt.id}`} type="number" value={currentStaffPaymentFormData[pt.id] || ""} onChange={(e) => handleStaffPaymentFormAmountChange(pt.id, e.target.value)} placeholder="0" min="0" step="1"/></div>))}</div>)}
          {paymentTypes.length === 0 && <p className="text-muted-foreground text-center col-span-full py-4">No payment types defined for this company. Please add payment types first.</p>}
        </div></ScrollArea><DialogFooter className="border-t pt-4"><Button type="button" variant="outline" onClick={() => setIsAddStaffPaymentDialogOpen(false)}>Cancel</Button><Button type="button" onClick={handleSaveNewStaffPaymentConfig} disabled={!selectedStaffIdForNewConfig || staffWithoutPaymentConfig.length === 0 || paymentTypes.length === 0}><Save className="mr-2 h-4 w-4" /> Save New Configuration</Button></DialogFooter></DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteStaffPaymentRecordDialogOpen} onOpenChange={(isOpen) => { setIsDeleteStaffPaymentRecordDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Remove payment record for staff ID "{staffIdForPaymentRecordDeletion}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteSingleStaffPaymentRecord} className="bg-destructive hover:bg-destructive/90">Delete Payment Record</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isBulkDeleteStaffPaymentsDialogOpen} onOpenChange={(isOpen) => { setIsBulkDeleteStaffPaymentsDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>Delete payment records for {selectedStaffPaymentItems.size} selected staff member(s)?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmBulkDeleteStaffPayments} className="bg-destructive hover:bg-destructive/90">Delete Selected Records</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

