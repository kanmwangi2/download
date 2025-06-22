"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Eye, EyeOff, Edit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Loader2, Building, Save, PercentCircle, Users, UserCog, PlusCircle, Trash2, Search, Upload, CheckCircle2, AlertTriangle, Info, Download, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser, UserRole, Company as AppCompany } from '@/lib/userData';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export interface Department {
  id: string;
  companyId: string;
  name: string;
  description?: string;
}

const UMOJA_COMPANY_ID = "co_001";
const ISOKO_COMPANY_ID = "co_002";


export const initialDepartments: Omit<Department, 'companyId'>[] = [
  { id: "dept_eng_co001", name: "Engineering", description: "Software development and R&D" },
  { id: "dept_mkt_co001", name: "Marketing", description: "Product promotion and sales strategy" },
  { id: "dept_hr_co001", name: "Human Resources", description: "Employee management and relations" },
  { id: "dept_fin_co001", name: "Finance", description: "Financial planning and accounting" },
  { id: "dept_ops_co001", name: "Operations", description: "Day-to-day business activities" },
  { id: "dept_sales_co002", name: "Sales & Marketing (Isoko)", description: "Isoko sales and promotion" },
  { id: "dept_log_co002", name: "Logistics (Isoko)", description: "Isoko warehousing and distribution" },

];

const defaultDepartmentFormData = { name: "", description: "" };

export interface CompanyProfileData {
  name: string;
  address?: string;
  registrationNumber?: string;
  taxId?: string;
  contactEmail?: string;
  contactPhone?: string;
  currency: string;
  isPayeActive: boolean;
  isPensionActive: boolean;
  isMaternityActive: boolean;
  isCbhiActive: boolean;
  isRamaActive: boolean;
  primaryBusiness?: string;
}

export const defaultInitialCompanyProfile: CompanyProfileData = {
  name: "Default Company Name",
  address: "",
  registrationNumber: "",
  taxId: "",
  contactEmail: "",
  contactPhone: "",
  currency: "RWF",
  isPayeActive: true,
  isPensionActive: true,
  isMaternityActive: true,
  isCbhiActive: true,
  isRamaActive: true,
  primaryBusiness: "",
};

type TaxExemptionKey = 'isPayeActive' | 'isPensionActive' | 'isMaternityActive' | 'isCbhiActive' | 'isRamaActive';

interface TaxToggleAction {
  taxType: TaxExemptionKey;
  newState: boolean;
  taxName: string;
}

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

const sanitizeFilename = (name: string | null | undefined): string => {
    if (!name) return 'UnknownCompany';
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
};

type FeedbackMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
};

// --- Supabase migration: Remove all legacy utility calls and constants ---
// Replace all data access with Supabase queries. Example below:

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Helper: get current user from Supabase
async function supabaseUserFromContextOrSession(): Promise<any> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  // You may want to map user_metadata to your app's User type
  return { ...data.user.user_metadata, id: data.user.id };
}

// Helper: fetch company profile from Supabase
async function fetchCompanyProfile(companyId: string): Promise<CompanyProfileData | null> {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('id', companyId)
    .single();
  if (error) return null;
  return data as CompanyProfileData;
}

// Helper: fetch departments from Supabase
async function fetchDepartments(companyId: string): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('companyId', companyId);
  if (error) return [];
  return data as Department[];
}

// --- User type (frontend: camelCase only) ---
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  assignedCompanyIds: string[];
  password?: string;
}

// --- User mapping utilities ---
function userFromBackend(data: any): User {
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    assignedCompanyIds: data.assigned_company_ids || [],
    password: data.password,
  };
}

function userToBackend(user: User): any {
  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    assigned_company_ids: user.assignedCompanyIds || [],
    password: user.password,
  };
}

// Helper: fetch company users from Supabase
async function fetchCompanyUsers(companyId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .contains('assigned_company_ids', [companyId]);
  if (error || !data) return [];
  return data.map(userFromBackend);
}

// Helper: update company profile in Supabase
async function updateCompanyProfile(companyId: string, profile: CompanyProfileData) {
  await supabase
    .from('company_profiles')
    .update(profile)
    .eq('id', companyId);
}

// Helper: update department in Supabase
async function updateDepartment(companyId: string, department: Department) {
  await supabase
    .from('departments')
    .update(department)
    .eq('id', department.id)
    .eq('companyId', companyId);
}

// Helper: delete department in Supabase
async function deleteDepartment(companyId: string, departmentId: string) {
  await supabase
    .from('departments')
    .delete()
    .eq('id', departmentId)
    .eq('companyId', companyId);
}

// Remove export from defaultNewUserFormData to avoid export conflict
const defaultNewUserFormData: Omit<User, 'id'> & { password?: string } = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'Payroll Preparer',
  assignedCompanyIds: [],
  password: '',
};

export default function CompanySettingsPage() {
  const { selectedCompanyId, selectedCompanyName, isLoadingCompanyContext } = useCompany();
  const router = useRouter();

  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData | null>(null);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentFormData, setDepartmentFormData] = useState(defaultDepartmentFormData);
  const [isDeleteDepartmentDialogOpen, setIsDeleteDepartmentDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
  const departmentImportFileInputRef = useRef<HTMLInputElement>(null);

  const [deptCurrentPage, setDeptCurrentPage] = useState(1);
  const [deptRowsPerPage, setDeptRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [selectedDepartmentItems, setSelectedDepartmentItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteDepartmentsDialogOpen, setIsBulkDeleteDepartmentsDialogOpen] = useState(false);

  const [isTaxToggleAlertOpen, setIsTaxToggleAlertOpen] = useState(false);
  const [taxToggleAction, setTaxToggleAction] = useState<TaxToggleAction | null>(null);

  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [isCompanyUserDialogOpen, setIsCompanyUserDialogOpen] = useState(false);
  const [editingCompanyUser, setEditingCompanyUser] = useState<User | null>(null);
  const [companyUserFormData, setCompanyUserFormData] = useState<Omit<User, 'id'> & { password?: string }>(defaultNewUserFormData);
  const [originalEmailForEdit, setOriginalEmailForEdit] = useState<string>("");
  const [isDeleteCompanyUserDialogOpen, setIsDeleteCompanyUserDialogOpen] = useState(false);
  const [companyUserToDelete, setCompanyUserToDelete] = useState<User | null>(null);
  const [companyUserSearchTerm, setCompanyUserSearchTerm] = useState("");
  const companyUsersImportFileInputRef = useRef<HTMLInputElement>(null);
  const [compUserCurrentPage, setCompUserCurrentPage] = useState(1);
  const [compUserRowsPerPage, setCompUserRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [showPasswordInCompanyUserDialog, setShowPasswordInCompanyUserDialog] = useState(false);
  const [pageCurrentUserRole, setPageCurrentUserRole] = useState<UserRole | null>(null);
  const [selectedCompanyUserItems, setSelectedCompanyUserItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteCompanyUsersDialogOpen, setIsBulkDeleteCompanyUsersDialogOpen] = useState(false);


  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);


  useEffect(() => {
    const checkAccess = async () => {
      if (isLoadingCompanyContext) return;

      if (!selectedCompanyId) {
        setFeedback({type: 'info', message: "No Company Selected", details: "Redirecting to company selection."});
        router.replace("/select-company");
        setAccessGranted(false);
        return;
      }

      // Supabase-only: get current user from context/session
      const user = await supabaseUserFromContextOrSession();
      if (!user) {
        setFeedback({type: 'error', message: "Authentication Required"});
        router.replace("/");
        setAccessGranted(false);
        return;
      }

      try {
        setPageCurrentUserRole(user.role);
        let hasAccess = false;
        if (user.role === "Primary Admin" || user.role === "App Admin") {
          hasAccess = true;
        } else if (user.role === "Company Admin" && user.assignedCompanyIds?.includes(selectedCompanyId)) {
          hasAccess = true;
        }

        if (hasAccess) {
          setAccessGranted(true);
        } else {
          setAccessGranted(false);
          setFeedback({
            type: 'error',
            message: "Access Denied",
            details: "You do not have permission to view these company settings."
          });
          router.replace("/app/dashboard");
        }
      } catch (e) {
        console.error("Error processing user session for company settings:", e);
        setFeedback({type: 'error', message: "Session Error"});
        router.replace("/");
        setAccessGranted(false);
      }
    };
    checkAccess();
  }, [isLoadingCompanyContext, selectedCompanyId, router]);


  useEffect(() => {
    const loadPageData = async () => {
      if (accessGranted === null || !accessGranted || isLoadingCompanyContext || !selectedCompanyId || typeof window === 'undefined') {
        if (accessGranted === false) setIsDataLoaded(true);
        return;
      }
      setIsDataLoaded(false);
      setFeedback(null);
      try {
        const profile = await fetchCompanyProfile(selectedCompanyId);
        setCompanyProfile(profile || defaultInitialCompanyProfile);
        const departments = await fetchDepartments(selectedCompanyId);
        setAllDepartments(departments);
        const users = await fetchCompanyUsers(selectedCompanyId);
        setCompanyUsers(users);
      } catch (error) {
        setCompanyProfile(null); setAllDepartments([]); setCompanyUsers([]);
        setFeedback({type: 'error', message: "Error Loading Settings", details: (error as Error).message});
      }
      setIsDataLoaded(true);
    };

    if(accessGranted) {
      loadPageData();
    }
  }, [selectedCompanyId, selectedCompanyName, isLoadingCompanyContext, accessGranted]);


  useEffect(() => {
    if (isDepartmentDialogOpen) {
      if (editingDepartment) {
        setDepartmentFormData({ name: editingDepartment.name, description: editingDepartment.description || "" });
      } else { setDepartmentFormData(defaultDepartmentFormData); }
    }
  }, [isDepartmentDialogOpen, editingDepartment]);

  useEffect(() => {
    setShowPasswordInCompanyUserDialog(false);
    if (editingCompanyUser) {
      setCompanyUserFormData({
        firstName: editingCompanyUser.firstName,
        lastName: editingCompanyUser.lastName,
        email: editingCompanyUser.email,
        role: editingCompanyUser.role,
        assignedCompanyIds: [selectedCompanyId!],
        password: "",
        phone: editingCompanyUser.phone || "",
      });
      setOriginalEmailForEdit(editingCompanyUser.email);
    } else {
      setCompanyUserFormData({ ...defaultNewUserFormData, assignedCompanyIds: [selectedCompanyId!], role: "Payroll Preparer", password: "" });
      setOriginalEmailForEdit("");
    }
  }, [editingCompanyUser, isCompanyUserDialogOpen, selectedCompanyId]);

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFeedback(null);
    const { name, value } = e.target;
    setCompanyProfile(prev => (prev ? { ...prev, [name]: value, currency: "RWF" } : null));
  };

  const handleTaxToggleChange = (taxType: TaxExemptionKey, newCheckedState: boolean, taxName: string) => {
    setFeedback(null);
    if (!companyProfile) return;
    if (companyProfile[taxType] !== newCheckedState) {
        setTaxToggleAction({ taxType, newState: newCheckedState, taxName }); setIsTaxToggleAlertOpen(true);
    }
  };
  const confirmTaxToggle = () => {
    if (taxToggleAction && companyProfile) {
      setCompanyProfile(prev => (prev ? { ...prev, [taxToggleAction.taxType]: taxToggleAction.newState } : null));
    }
    setIsTaxToggleAlertOpen(false); setTaxToggleAction(null);
  };

  const handleSaveProfileDetails = async (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    setFeedback(null);
    if (!selectedCompanyId || !companyProfile) {
      setFeedback({type: 'error', message: "Error", details: "No company selected or profile data missing."});
      return;
    }
    if (!companyProfile.name.trim()) {
      setFeedback({type: 'error', message: "Validation Error", details: "Company Name cannot be empty."});
      return;
    }
    // Only save profile specific fields if tax settings are separate
    const profileDataToSave: CompanyProfileData = {
      name: companyProfile.name,
      address: companyProfile.address,
      registrationNumber: companyProfile.registrationNumber,
      taxId: companyProfile.taxId,
      contactEmail: companyProfile.contactEmail,
      contactPhone: companyProfile.contactPhone,
      currency: "RWF", // Always RWF
      isPayeActive: companyProfile.isPayeActive, // Keep existing tax settings
      isPensionActive: companyProfile.isPensionActive,
      isMaternityActive: companyProfile.isMaternityActive,
      isCbhiActive: companyProfile.isCbhiActive,
      isRamaActive: companyProfile.isRamaActive,
      primaryBusiness: companyProfile.primaryBusiness,
    };

    try {
      await updateCompanyProfile(selectedCompanyId, profileDataToSave);
      setCompanyProfile(profileDataToSave); // Update local state with what was saved
      setFeedback({type: 'success', message: "Company Profile Saved", details: "Your company profile information has been updated."});
    } catch (error) {
      setFeedback({type: 'error', message: "Save Failed", details: `Could not save company profile. ${(error as Error).message}`});
    }
  };

  const handleSaveTaxExemptions = async () => {
    setFeedback(null);
    if (!selectedCompanyId || !companyProfile) {
      setFeedback({type: 'error', message: "Error", details: "No company selected or profile data missing."});
      return;
    }
    try {
      // The companyProfile state already reflects changes from confirmed toggles
      await updateCompanyProfile(selectedCompanyId, companyProfile);
      setFeedback({type: 'success', message: "Tax Exemption Settings Saved", details: "Tax exemption settings have been updated."});
    } catch (error) {
      setFeedback({type: 'error', message: "Save Failed", details: `Could not save tax exemption settings. ${(error as Error).message}`});
    }
  };


  const handleDepartmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDepartmentFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleAddDepartmentClick = () => { setFeedback(null); setEditingDepartment(null); setIsDepartmentDialogOpen(true); };
  const handleEditDepartmentClick = (department: Department) => { setFeedback(null); setEditingDepartment(department); setIsDepartmentDialogOpen(true); };
  const handleDeleteDepartmentClick = (department: Department) => { setFeedback(null); setDepartmentToDelete(department); setIsDeleteDepartmentDialogOpen(true); };

  const deleteDepartmentsByIds = async (idsToDelete: string[]) => {
    setFeedback(null);
    if (!selectedCompanyId || idsToDelete.length === 0) return;
    try {
      for (const id of idsToDelete) {
        await deleteDepartment(selectedCompanyId, id);
      }
      setAllDepartments(prev => prev.filter(dept => !idsToDelete.includes(dept.id)));
      setSelectedDepartmentItems(prev => { const newSelected = new Set(prev); idsToDelete.forEach(id => newSelected.delete(id)); return newSelected; });
      setFeedback({type: 'success', message: "Department(s) Deleted", details: `Successfully deleted ${idsToDelete.length} department(s).`});
      if (deptCurrentPage > 1 && paginatedDepartments.length === idsToDelete.length && filteredDepartmentsSource.slice((deptCurrentPage - 2) * deptRowsPerPage, (deptCurrentPage - 1) * deptRowsPerPage).length > 0) { setDeptCurrentPage(deptCurrentPage - 1); }
      else if (deptCurrentPage > 1 && paginatedDepartments.length === idsToDelete.length && filteredDepartmentsSource.slice((deptCurrentPage-1)*deptRowsPerPage).length === 0){ setDeptCurrentPage( Math.max(1, deptCurrentPage -1)); }
    } catch (error) {
      console.error("Error deleting department(s) from IndexedDB:", error);
      setFeedback({type: 'error', message: "Delete Failed", details: `Could not delete ${idsToDelete.length} department(s). ${(error as Error).message}`});
    }
  };

  const confirmDeleteDepartment = async () => { if (departmentToDelete) { await deleteDepartmentsByIds([departmentToDelete.id]); } setIsDeleteDepartmentDialogOpen(false); setDepartmentToDelete(null); };
  const handleOpenBulkDeleteDepartmentsDialog = () => { setFeedback(null); if (selectedDepartmentItems.size === 0) { setFeedback({type: 'info', message: "No Selection", details: "Please select departments to delete."}); return; } setIsBulkDeleteDepartmentsDialogOpen(true); };
  const confirmBulkDeleteDepartments = async () => { await deleteDepartmentsByIds(Array.from(selectedDepartmentItems)); setIsBulkDeleteDepartmentsDialogOpen(false); };

  const handleSaveDepartment = async () => {
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "No company selected."}); return; }
    if (!departmentFormData.name.trim()) { setFeedback({type: 'error', message: "Validation Error", details: "Department name cannot be empty."}); return; }
    try {
      if (editingDepartment) {
        const updatedDept: Department = { ...editingDepartment, ...departmentFormData, companyId: selectedCompanyId };
        await updateDepartment(selectedCompanyId, updatedDept);
        setAllDepartments(prev => prev.map(dept => dept.id === editingDepartment.id ? updatedDept : dept));
        setFeedback({type: 'success', message: "Department Updated", details: `Department "${departmentFormData.name}" has been updated.`});
      } else {
        const newDepartment: Department = { id: `dept_${Date.now()}_${selectedCompanyId.substring(3)}`, companyId: selectedCompanyId, ...departmentFormData };
        await updateDepartment(selectedCompanyId, newDepartment);
        setAllDepartments(prev => [newDepartment, ...prev]);
        setFeedback({type: 'success', message: "Department Added", details: `Department "${newDepartment.name}" has been added.`});
      }
    } catch (error) { setFeedback({type: 'error', message: "Save Failed", details: `Could not save department. ${(error as Error).message}`}); }
    setIsDepartmentDialogOpen(false);
  };

  const handleCompanyUserInputFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyUserFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleCompanyUserRoleChange = (value: UserRole) => {
    if (value === "Payroll Preparer" || value === "Payroll Approver") {
        setCompanyUserFormData(prev => ({ ...prev, role: value }));
    }
  };

  const handleAddCompanyUserClick = () => { setFeedback(null); setEditingCompanyUser(null); setIsCompanyUserDialogOpen(true); };
  const handleEditCompanyUserClick = (user: User) => { setFeedback(null); setEditingCompanyUser(user); setIsCompanyUserDialogOpen(true); };
  const handleDeleteCompanyUserClick = (user: User) => { setFeedback(null); setCompanyUserToDelete(user); setIsDeleteCompanyUserDialogOpen(true); };

  const deleteCompanyUsersByIds = async (idsToDelete: string[]) => {
    setFeedback(null);
    if (!selectedCompanyId || idsToDelete.length === 0) return;
    try {
      for (const userId of idsToDelete) {
        await supabase
          .from('users')
          .delete()
          .eq('id', userId)
          .eq('companyId', selectedCompanyId);
      }
      setCompanyUsers(prev => prev.filter(u => !idsToDelete.includes(u.id)));
      setSelectedCompanyUserItems(prev => { const newSelected = new Set(prev); idsToDelete.forEach(id => newSelected.delete(id)); return newSelected; });
      setFeedback({type: 'success', message: "User(s) Deleted", details: `Successfully removed ${idsToDelete.length} user(s).`});
      if (compUserCurrentPage > 1 && paginatedCompanyUsers.length === idsToDelete.length && filteredCompanyUsersSource.slice((compUserCurrentPage - 2) * compUserRowsPerPage, (compUserCurrentPage - 1) * compUserRowsPerPage).length > 0) { setCompUserCurrentPage(compUserCurrentPage - 1); }
      else if (compUserCurrentPage > 1 && paginatedCompanyUsers.length === idsToDelete.length && filteredCompanyUsersSource.slice((compUserCurrentPage-1)*compUserRowsPerPage).length === 0){ setCompUserCurrentPage( Math.max(1, compUserCurrentPage -1)); }
    } catch (error) {
      console.error("Error deleting company user(s):", error);
      setFeedback({type: 'error', message: "Delete Failed", details: `Could not delete ${idsToDelete.length} user(s). ${(error as Error).message}`});
    }
  };

  const confirmDeleteCompanyUser = async () => { if (companyUserToDelete) { await deleteCompanyUsersByIds([companyUserToDelete.id]); } setIsDeleteCompanyUserDialogOpen(false); setCompanyUserToDelete(null); };
  const handleOpenBulkDeleteCompanyUsersDialog = () => { setFeedback(null); if (selectedCompanyUserItems.size === 0) { setFeedback({type: 'info', message: "No Selection", details: "Please select users to delete."}); return; } setIsBulkDeleteCompanyUsersDialogOpen(true); };
  const confirmBulkDeleteCompanyUsers = async () => { await deleteCompanyUsersByIds(Array.from(selectedCompanyUserItems)); setIsBulkDeleteCompanyUsersDialogOpen(false); };

  const handleSaveCompanyUser = async () => {
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "No company selected."}); return; }
    if (!companyUserFormData.firstName || !companyUserFormData.lastName || !companyUserFormData.email) { setFeedback({type: 'error', message: "Validation Error", details: "First name, last name, and email are required."}); return; }
    if (!editingCompanyUser && !companyUserFormData.password) { setFeedback({type: 'error', message: "Validation Error", details: "Password is required for new users."}); return; }
    if (companyUserFormData.role !== "Payroll Preparer" && companyUserFormData.role !== "Payroll Approver") { setFeedback({type: 'error', message: "Validation Error", details: "Invalid role selected. Only Preparer or Approver allowed here."}); return; }

    const newEmail = companyUserFormData.email.trim().toLowerCase();
    if (newEmail !== originalEmailForEdit.toLowerCase()) {
        const { data: existingUserWithNewEmail } = await supabase
          .from('users')
          .select('*')
          .eq('email', newEmail)
          .maybeSingle();
        if (existingUserWithNewEmail && (!editingCompanyUser || existingUserWithNewEmail.id !== editingCompanyUser.id)) {
            setFeedback({type: 'error', message: "Email Exists", details: "This email address is already in use by another account."});
            return;
        }
    }

    try {
      if (editingCompanyUser) {
        const updatedUser: User = { ...editingCompanyUser, ...companyUserFormData, email: newEmail, assignedCompanyIds: [selectedCompanyId] };
        if (companyUserFormData.password && companyUserFormData.password.trim() !== "") { updatedUser.password = companyUserFormData.password.trim(); }
        await supabase
          .from('users')
          .update(userToBackend(updatedUser))
          .eq('id', editingCompanyUser.id);
        setCompanyUsers(prev => prev.map(u => u.id === editingCompanyUser.id ? updatedUser : u));
        setFeedback({type: 'success', message: "User Updated", details: `Details for ${companyUserFormData.firstName} ${companyUserFormData.lastName} updated.`});
      } else {
        const newUserId = `usr_comp_${Date.now()}`;
        const newUser: User = { id: newUserId, ...companyUserFormData, email: newEmail, password: companyUserFormData.password!, assignedCompanyIds: [selectedCompanyId] };
        await supabase
          .from('users')
          .insert(userToBackend(newUser));
        setCompanyUsers(prev => [newUser, ...prev]);
        setFeedback({type: 'success', message: "User Added", details: `${newUser.firstName} ${newUser.lastName} added to this company.`});
      }
      setIsCompanyUserDialogOpen(false);
    } catch (error: any) {
        if (error.name === 'ConstraintError' || (error.message && error.message.includes('unique'))) { setFeedback({type: 'error', message: "Save Failed", details: "Email address already exists globally."});
        } else { setFeedback({type: 'error', message: "Save Failed", details: `Could not save user: ${error.message || 'Unknown error'}`}); }
    }
  };

  const filteredDepartmentsSource = useMemo(() => {
    if (!departmentSearchTerm) return allDepartments;
    const lowerSearchTerm = departmentSearchTerm.toLowerCase();
    return allDepartments.filter(dept => dept.name.toLowerCase().includes(lowerSearchTerm) || (dept.description && dept.description.toLowerCase().includes(lowerSearchTerm)));
  }, [allDepartments, departmentSearchTerm]);
  const deptTotalItems = filteredDepartmentsSource.length;
  const deptTotalPages = Math.ceil(deptTotalItems / deptRowsPerPage) || 1;
  const deptStartIndex = (deptCurrentPage - 1) * deptRowsPerPage;
  const deptEndIndex = deptStartIndex + deptRowsPerPage;
  const paginatedDepartments = filteredDepartmentsSource.slice(deptStartIndex, deptEndIndex);

  const handleSelectDepartmentRow = (itemId: string, checked: boolean) => {
    setSelectedDepartmentItems(prev => { const newSelected = new Set(prev); if (checked) newSelected.add(itemId); else newSelected.delete(itemId); return newSelected; });
  };
  const handleSelectAllDepartmentsOnPage = (checked: boolean) => {
    const pageItemIds = paginatedDepartments.map(item => item.id);
    if (checked) { setSelectedDepartmentItems(prev => new Set([...prev, ...pageItemIds])); }
    else { const pageItemIdsSet = new Set(pageItemIds); setSelectedDepartmentItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id)))); }
  };
  const isAllDepartmentsOnPageSelected = paginatedDepartments.length > 0 && paginatedDepartments.every(item => selectedDepartmentItems.has(item.id));


  const filteredCompanyUsersSource = useMemo(() => {
    if (!companyUserSearchTerm) return companyUsers;
    const lowerSearchTerm = companyUserSearchTerm.toLowerCase();
    return companyUsers.filter(user => user.firstName.toLowerCase().includes(lowerSearchTerm) || user.lastName.toLowerCase().includes(lowerSearchTerm) || user.email.toLowerCase().includes(lowerSearchTerm) || user.role.toLowerCase().includes(lowerSearchTerm));
  }, [companyUsers, companyUserSearchTerm]);
  const compUserTotalItems = filteredCompanyUsersSource.length;
  const compUserTotalPages = Math.ceil(compUserTotalItems / compUserRowsPerPage) || 1;
  const compUserStartIndex = (compUserCurrentPage - 1) * compUserRowsPerPage;
  const compUserEndIndex = compUserStartIndex + compUserRowsPerPage;
  const paginatedCompanyUsers = filteredCompanyUsersSource.slice(compUserStartIndex, compUserEndIndex);

  const handleSelectCompanyUserRow = (itemId: string, checked: boolean) => {
    setSelectedCompanyUserItems(prev => { const newSelected = new Set(prev); if (checked) newSelected.add(itemId); else newSelected.delete(itemId); return newSelected; });
  };
  const handleSelectAllCompanyUsersOnPage = (checked: boolean) => {
    const pageItemIds = paginatedCompanyUsers.map(item => item.id);
    if (checked) { setSelectedCompanyUserItems(prev => new Set([...prev, ...pageItemIds])); }
    else { const pageItemIdsSet = new Set(pageItemIds); setSelectedCompanyUserItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id)))); }
  };
  const isAllCompanyUsersOnPageSelected = paginatedCompanyUsers.length > 0 && paginatedCompanyUsers.every(item => selectedCompanyUserItems.has(item.id));

  const canManageCompanyUsers = pageCurrentUserRole === 'Company Admin' || pageCurrentUserRole === 'App Admin' || pageCurrentUserRole === 'Primary Admin';

  const departmentExportColumns = [ { key: 'id', label: 'ID', isIdLike: true }, { key: 'name', label: 'Name' }, { key: 'description', label: 'Description' }];
  const companyUsersExportColumns = [ { key: 'id', label: 'ID', isIdLike: true }, { key: 'firstName', label: 'FirstName' }, { key: 'lastName', label: 'LastName' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone', isIdLike: true }, { key: 'role', label: 'Role' }];

  const exportGenericData = (data: any[], columns: {key: string, label: string, isIdLike?: boolean}[], baseFileName: string, fileType: "csv" | "xlsx" | "pdf") => {
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "No company selected for export."}); return; }
    if (data.length === 0) { setFeedback({type: 'info', message: "No Data", details: `There is no data to export for ${baseFileName}.`}); return; }

    const headers = columns.map(c => c.label);
    const dataToExport = data.map(row => {
        const exportRow: Record<string, string | number> = {};
        columns.forEach(col => {
            const value = row[col.key as keyof typeof row];
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

    const companyNameForFile = sanitizeFilename(selectedCompanyName);
    const fileName = `${companyNameForFile}_${baseFileName}_export.${fileType}`;

    if (fileType === "csv") {
        const csvData = dataToExport.map(row => {
            const newRow: Record<string, string> = {};
            headers.forEach(header => {
                const colDef = columns.find(c => c.label === header);
                let cellValue = String(row[header] || (typeof row[header] === 'number' ? '0' : ''));
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
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "xlsx") {
        const xlsxData = dataToExport.map(row => {
            const newRow: Record<string, string|number>={};
            headers.forEach(h => {
                const colDef = columns.find(c => c.label === h);
                if (colDef?.isIdLike) newRow[h] = String(row[h] || '');
                else newRow[h] = (typeof row[h] === 'number' ? row[h] : String(row[h] || ''));
            });
            return newRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(xlsxData, {header: headers, skipHeader: false});
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, baseFileName.substring(0,30));
        XLSX.writeFile(workbook, fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") {
        const pdfData = dataToExport.map(row => headers.map(header => String(row[header] || '')));
        const doc = new jsPDF({ orientation: 'landscape' });
        (doc as any).autoTable({ head: [headers], body: pdfData, styles: { fontSize: 7 }, headStyles: { fillColor: [102, 126, 234] }, margin: { top: 10 }, });
        doc.save(fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    }
  };

  const handleDownloadTemplate = (headers: string[], baseFileName: string) => { setFeedback(null); const csvString = headers.join(',') + '\n'; const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', `${baseFileName}_template.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); setFeedback({type: 'info', message: "Template Downloaded", details: "Tip: If a field contains commas (e.g., numbers like \"1,250,000\" or text with commas), ensure the entire field is enclosed in double quotes in your CSV."}); };
  const handleDepartmentImportClick = () => { setFeedback(null); if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "Please select a company."}); return; } departmentImportFileInputRef.current?.click(); };
  const handleCompanyUserImportClick = () => { setFeedback(null); if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "Please select a company."}); return; } companyUsersImportFileInputRef.current?.click(); };

  const handleDepartmentFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "No company selected."}); return; }
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: async (results) => {
          const { data: rawData, errors: papaParseErrors } = results;
          if (papaParseErrors.length > 0 && rawData.length === 0) { setFeedback({type: 'error', message: "Import Failed", details: `Critical CSV parsing error: ${papaParseErrors[0].message}.`}); return; }
          const validationSkippedLog: string[] = []; let newCount = 0, updatedCount = 0; const itemsToBulkPut: Department[] = [];
          const existingDepts = await fetchDepartments(selectedCompanyId);
          for (const [index, rawRowUntyped] of rawData.entries()) {
            const rawRow = rawRowUntyped as Record<string, string>; const originalLineNumber = index + 2;
            const idKey = Object.keys(rawRow).find(k => k.trim().toLowerCase() === 'id');
            const nameKey = Object.keys(rawRow).find(k => k.trim().toLowerCase() === 'name');
            const descKey = Object.keys(rawRow).find(k => k.trim().toLowerCase() === 'description');
            const id = idKey ? String(rawRow[idKey] || '').trim() : ''; const name = nameKey ? String(rawRow[nameKey] || '').trim() : ''; const description = descKey ? String(rawRow[descKey] || '').trim() : '';
            if (!name) { validationSkippedLog.push(`Row ${originalLineNumber} skipped. Reason: Name is required.`); continue; }
            const existingDept = id ? existingDepts.find(d => d.id === id && d.companyId === selectedCompanyId) : null;
            if (existingDept) { itemsToBulkPut.push({ ...existingDept, name, description }); updatedCount++; }
            else { itemsToBulkPut.push({ id: id || `dept_${Date.now()}_${index}`, companyId: selectedCompanyId, name, description }); newCount++; }
          }
          if (itemsToBulkPut.length > 0) { await supabase.from('departments').upsert(itemsToBulkPut); const updatedList = await fetchDepartments(selectedCompanyId); setAllDepartments(updatedList); }
          let feedbackMessage = ""; let feedbackTitle = "Import Processed"; let feedbackType: FeedbackMessage['type'] = 'info'; if (newCount > 0 || updatedCount > 0) { feedbackTitle = "Import Successful"; feedbackMessage = `${newCount} departments added, ${updatedCount} updated.`; feedbackType = 'success'; } else if (rawData.length > 0 && papaParseErrors.length === 0 && validationSkippedLog.length === 0) { feedbackMessage = `CSV processed. ${rawData.length} rows checked. No changes.`; } else { feedbackMessage = "No changes applied."; }
          let details = "";
          if (papaParseErrors.length > 0 || validationSkippedLog.length > 0) { details += ` ${papaParseErrors.length + validationSkippedLog.length} row(s) had issues.`; if (validationSkippedLog.length > 0) details += ` First: ${validationSkippedLog[0]}`; else if (papaParseErrors.length > 0) details += ` First: ${papaParseErrors[0].message}`; }
          setFeedback({type: feedbackType, message: `${feedbackTitle}: ${feedbackMessage}`, details});
        }
      }); if (event.target) event.target.value = '';
    }
  };

  const handleCompanyUserFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({type: 'error', message: "Error", details: "No company selected."}); return; }
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: async (results) => {
          const { data: rawData, errors: papaParseErrors } = results;
          if (papaParseErrors.length > 0 && rawData.length === 0) { setFeedback({type: 'error', message: "Import Failed", details: `Critical CSV parsing error: ${papaParseErrors[0].message}.`}); return; }
          const validationSkippedLog: string[] = []; let newCount = 0, updatedCount = 0; const itemsToBulkPut: User[] = [];
          const allGlobalUsers = await supabase
            .from('users')
            .select('*');
          for (const [index, rawRowUntyped] of rawData.entries()) {
            const rawRow = rawRowUntyped as Record<string, string>; const originalLineNumber = index + 2;
            const id = String(rawRow.ID || '').trim(); const first_name = String(rawRow.FirstName || '').trim(); const last_name = String(rawRow.LastName || '').trim(); const email = String(rawRow.Email || '').trim().toLowerCase(); const phone = String(rawRow.Phone || '').trim(); const role = String(rawRow.Role || '').trim() as UserRole; const password = String(rawRow.Password || '').trim();
            if (!first_name || !last_name || !email) { validationSkippedLog.push(`Row ${originalLineNumber} skipped: Missing FirstName, LastName, or Email.`); continue; }
            if (role !== "Payroll Preparer" && role !== "Payroll Approver") { validationSkippedLog.push(`Row ${originalLineNumber} (Email: ${email}) skipped: Invalid Role '${role}'. Must be Payroll Preparer or Payroll Approver for company-level import.`); continue; }
            const existingUserByEmail = (allGlobalUsers.data ?? []).find((u: any) => u.email === email);
            const existingUserById = id ? (allGlobalUsers.data ?? []).find((u: any) => u.id === id) : null;
            if (id) {
              if (existingUserById) {
                if (existingUserById.email !== email && existingUserByEmail) { validationSkippedLog.push(`Row ${originalLineNumber} (ID: ${id}) skipped: New email ${email} already used by another user.`); continue; }
                if (!existingUserById.assigned_company_ids.includes(selectedCompanyId) || (existingUserById.role !== "Payroll Preparer" && existingUserById.role !== "Payroll Approver")) { validationSkippedLog.push(`Row ${originalLineNumber} (ID: ${id}) skipped: User not managed by this company or has an incompatible role for this import type.`); continue;}
                itemsToBulkPut.push(userFromBackend({ ...existingUserById, ...rawRow, password: password || existingUserById.password, assigned_company_ids: [selectedCompanyId] })); updatedCount++;
              } else { validationSkippedLog.push(`Row ${originalLineNumber} (ID: ${id}) skipped: User ID not found for update.`); continue; }
            } else {
              if (!password) { validationSkippedLog.push(`Row ${originalLineNumber} (Email: ${email}) skipped: Password required for new user.`); continue; }
              if (existingUserByEmail) { validationSkippedLog.push(`Row ${originalLineNumber} (Email: ${email}) skipped: Email already exists.`); continue; }
              itemsToBulkPut.push(userFromBackend({ id: `usr_comp_${Date.now()}_${index}`, first_name, last_name, email, phone, role, password, assigned_company_ids: [selectedCompanyId] })); newCount++;
            }
          }
          if (itemsToBulkPut.length > 0) { await supabase.from('users').upsert(itemsToBulkPut); const updatedGlobalUsers = await supabase.from('users').select('*'); setCompanyUsers((updatedGlobalUsers.data ?? []).filter((u: any) => u.assignedCompanyIds?.includes(selectedCompanyId) && (u.role === "Payroll Preparer" || u.role === "Payroll Approver"))); }
          let feedbackMessage = ""; let feedbackTitle = "Import Processed"; let feedbackType: FeedbackMessage['type'] = 'info'; if (newCount > 0 || updatedCount > 0) { feedbackTitle = "Import Successful"; feedbackMessage = `${newCount} users added, ${updatedCount} updated for this company.`; feedbackType = 'success'; } else if (rawData.length > 0 && papaParseErrors.length === 0 && validationSkippedLog.length === 0) { feedbackMessage = `CSV processed. ${rawData.length} rows checked. No changes.`; } else { feedbackMessage = "No changes applied."; }
          let details = "";
          if (papaParseErrors.length > 0 || validationSkippedLog.length > 0) { details += ` ${papaParseErrors.length + validationSkippedLog.length} row(s) had issues.`; if (validationSkippedLog.length > 0) details += ` First: ${validationSkippedLog[0]}`; else if (papaParseErrors.length > 0) details += ` First: ${papaParseErrors[0].message}`; }
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
      <Alert variant={variant} className={cn("my-4", additionalAlertClasses)}>
        <IconComponent className="h-4 w-4" />
        <AlertTitle>{feedback.message}</AlertTitle>
        {feedback.details && <AlertDescription>{feedback.details}</AlertDescription>}
      </Alert>
    );
  };

  if (isLoadingCompanyContext || accessGranted === null) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Verifying access and loading company information...</div>;
  }

  if (accessGranted === false) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-xl font-semibold">Access Denied</p>
        <p className="text-muted-foreground">You do not have permission to view these company settings.</p>
        <Button asChild className="mt-4">
          <Link href="/app/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!selectedCompanyId && !isLoadingCompanyContext) {
     return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Building className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold">No Company Selected</p>
        <p className="text-muted-foreground">Please select a company to manage its settings.</p>
        <Button asChild className="mt-4">
          <Link href="/select-company">Go to Company Selection</Link>
        </Button>
      </div>
    );
  }

  if (!isDataLoaded || !companyProfile) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading company settings...</div>;
  }

  return (
    <div className="space-y-8">
      <input type="file" ref={departmentImportFileInputRef} onChange={handleDepartmentFileUpload} accept=".csv" className="hidden" />
      <input type="file" ref={companyUsersImportFileInputRef} onChange={handleCompanyUserFileUpload} accept=".csv" className="hidden" />
      <div><div className="flex items-center gap-2 mb-1"><Building className="mr-2 h-7 w-7 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Company Settings</h1></div><p className="text-muted-foreground mb-2">Manage your company&apos;s profile, tax exemptions, departments, and company-specific user access.</p></div>
      {renderFeedbackMessage()}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4">
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="taxExemptions">Tax Exemptions</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="companyUsers">Company Users</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <form onSubmit={handleSaveProfileDetails}>
            <Card>
                <CardHeader><CardTitle className="flex items-center"><Building className="mr-2 h-6 w-6 text-primary" />Company Profile</CardTitle><CardDescription>Update your company&apos;s primary information.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label htmlFor="companyName">Company Name *</Label><Input id="companyName" name="name" value={companyProfile.name} onChange={handleProfileInputChange} required /></div>
                        <div className="space-y-2"><Label htmlFor="registrationNumber">Registration Number</Label><Input id="registrationNumber" name="registrationNumber" value={companyProfile.registrationNumber || ""} onChange={handleProfileInputChange} /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="address">Company Address</Label><Textarea id="address" name="address" value={companyProfile.address || ""} onChange={handleProfileInputChange} placeholder="Enter full company address" /></div>
                    <div className="space-y-2"><Label htmlFor="primaryBusiness">Primary Business</Label><Input id="primaryBusiness" name="primaryBusiness" value={companyProfile.primaryBusiness || ""} onChange={handleProfileInputChange} placeholder="e.g., Technology, Manufacturing"/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label htmlFor="taxId">TIN Number</Label><Input id="taxId" name="taxId" value={companyProfile.taxId || ""} onChange={handleProfileInputChange} /></div>
                        <div className="space-y-2"><Label htmlFor="contactEmail">Contact Email</Label><Input id="contactEmail" name="contactEmail" type="email" value={companyProfile.contactEmail || ""} onChange={handleProfileInputChange} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label htmlFor="contactPhone">Contact Phone</Label><Input id="contactPhone" name="contactPhone" type="tel" value={companyProfile.contactPhone || ""} onChange={handleProfileInputChange} /></div>
                        <div className="space-y-2"><Label htmlFor="currencyDisplay">Operating Currency</Label><Input id="currencyDisplay" name="currencyDisplay" value="RWF - Rwandan Franc" disabled className="bg-muted/50" /></div>
                    </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Profile Details</Button>
                </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="taxExemptions">
            <Card>
                <CardHeader><CardTitle className="flex items-center"><PercentCircle className="mr-2 h-6 w-6 text-primary" />Tax Exemption Settings</CardTitle><CardDescription>Toggle tax applicability for this company. If a tax is inactive, its rate will be treated as 0% during payroll calculation.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    {[{ key: 'isPayeActive', label: 'PAYE (Income Tax)', description: 'Is Pay As You Earn tax active for this company?' },{ key: 'isPensionActive', label: 'Pension Contribution', description: 'Are employer and employee pension contributions active?' },{ key: 'isMaternityActive', label: 'Maternity Contribution', description: 'Are employer and employee maternity contributions active?' },{ key: 'isCbhiActive', label: 'CBHI (Community Health Insurance)', description: 'Is CBHI contribution active for this company?' }, { key: 'isRamaActive', label: 'RAMA Contribution', description: 'Are employer and employee RAMA contributions (on basic salary) active?' }].map(taxItem => (
                        <div key={taxItem.key} className="flex items-center justify-between p-3 border rounded-md">
                            <Label htmlFor={taxItem.key} className="flex flex-col space-y-1 cursor-pointer"><span>{taxItem.label}</span><span className="font-normal leading-snug text-muted-foreground text-xs">{taxItem.description}</span></Label>
                            <Switch id={taxItem.key} checked={companyProfile[taxItem.key as TaxExemptionKey]} onCheckedChange={(checked) => handleTaxToggleChange(taxItem.key as TaxExemptionKey, checked, taxItem.label)}/>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveTaxExemptions}><Save className="mr-2 h-4 w-4" /> Save Tax Exemptions</Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="departments">
            <Card><CardHeader><CardTitle className="flex items-center"><Users className="mr-2 h-6 w-6 text-primary" />Departments Management</CardTitle><CardDescription>Add, edit, and manage departments within the current company.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="search" placeholder="Search departments..." className="w-full pl-10" value={departmentSearchTerm} onChange={(e) => {setDepartmentSearchTerm(e.target.value); setDeptCurrentPage(1); setFeedback(null);}}/></div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" onClick={() => setFeedback(null)}><Upload className="mr-2 h-4 w-4" /> Import / Template</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={()=>handleDownloadTemplate(['ID', 'Name', 'Description'], 'departments_import')}><Download className="mr-2 h-4 w-4" /> Download Template</DropdownMenuItem><DropdownMenuItem onClick={handleDepartmentImportClick}><Upload className="mr-2 h-4 w-4" /> Upload Data</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={allDepartments.length === 0} onClick={() => setFeedback(null)}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => exportGenericData(allDepartments, departmentExportColumns, 'departments_data', 'csv')}><FileText className="mr-2 h-4 w-4" /> CSV</DropdownMenuItem><DropdownMenuItem onClick={() => exportGenericData(allDepartments, departmentExportColumns, 'departments_data', 'xlsx')}><FileSpreadsheet className="mr-2 h-4 w-4" /> XLSX</DropdownMenuItem><DropdownMenuItem onClick={() => exportGenericData(allDepartments, departmentExportColumns, 'departments_data', 'pdf')}><FileType className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                    <Button onClick={handleAddDepartmentClick} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Department</Button>
                </div>
              </div>
              {selectedDepartmentItems.size > 0 && (<div className="my-2 flex items-center justify-between p-3 bg-muted/50 rounded-md"><span className="text-sm text-muted-foreground">{selectedDepartmentItems.size} item(s) selected</span><Button variant="destructive" onClick={handleOpenBulkDeleteDepartmentsDialog} disabled={!selectedCompanyId}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected</Button></div>)}
              <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead className="sticky top-0 z-10 bg-card w-[50px]"><Checkbox checked={isAllDepartmentsOnPageSelected} onCheckedChange={(checked) => handleSelectAllDepartmentsOnPage(Boolean(checked))} aria-label="Select all departments on page" disabled={paginatedDepartments.length === 0}/></TableHead><TableHead className="sticky top-0 z-10 bg-card">Name</TableHead><TableHead className="sticky top-0 z-10 bg-card">Description</TableHead><TableHead className="sticky top-0 z-10 bg-card text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{paginatedDepartments.map((dept) => (<TableRow key={dept.id} data-state={selectedDepartmentItems.has(dept.id) ? "selected" : ""}><TableCell><Checkbox checked={selectedDepartmentItems.has(dept.id)} onCheckedChange={(checked) => handleSelectDepartmentRow(dept.id, Boolean(checked))} aria-label={`Select department ${dept.name}`}/></TableCell><TableCell className="font-medium">{dept.name}</TableCell><TableCell>{dept.description || "N/A"}</TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => handleEditDepartmentClick(dept)} title="Edit Department"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteDepartmentClick(dept)} title="Delete Department" className="text-destructive hover:text-destructive/90"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}{paginatedDepartments.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center h-24">{departmentSearchTerm ? "No departments match search." : "No departments found."}</TableCell></TableRow>)}</TableBody></Table></div>
              {deptTotalPages > 1 && (<div className="flex items-center justify-between py-4"><div className="text-sm text-muted-foreground">{selectedDepartmentItems.size > 0 ? `${selectedDepartmentItems.size} item(s) selected.` : `Page ${deptCurrentPage} of ${deptTotalPages} (${deptTotalItems} total departments)`}</div><div className="flex items-center space-x-6 lg:space-x-8"><div className="flex items-center space-x-2"><p className="text-sm font-medium">Rows per page</p><Select value={`${deptRowsPerPage}`} onValueChange={(value) => {setDeptRowsPerPage(Number(value)); setDeptCurrentPage(1); setSelectedDepartmentItems(new Set());}}><SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${deptRowsPerPage}`} /></SelectTrigger><SelectContent side="top">{ROWS_PER_PAGE_OPTIONS.map((s) => (<SelectItem key={`dept-${s}`} value={`${s}`}>{s}</SelectItem>))}</SelectContent></Select></div><div className="flex items-center space-x-2"><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setDeptCurrentPage(1); setSelectedDepartmentItems(new Set());}} disabled={deptCurrentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setDeptCurrentPage(p => p - 1); setSelectedDepartmentItems(new Set());}} disabled={deptCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setDeptCurrentPage(p => p + 1); setSelectedDepartmentItems(new Set());}} disabled={deptCurrentPage === deptTotalPages}><ChevronRight className="h-4 w-4" /></Button><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setDeptCurrentPage(deptTotalPages); setSelectedDepartmentItems(new Set());}} disabled={deptCurrentPage === deptTotalPages}><ChevronsRight className="h-4 w-4" /></Button></div></div></div>)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companyUsers">
          {canManageCompanyUsers ? (
            <Card><CardHeader><CardTitle className="flex items-center"><UserCog className="mr-2 h-6 w-6 text-primary" />User Management</CardTitle><CardDescription>Add, edit, or remove users with 'Payroll Preparer' or 'Payroll Approver' roles for this company.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                    <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="search" placeholder="Search users..." className="w-full pl-10" value={companyUserSearchTerm} onChange={(e) => {setCompanyUserSearchTerm(e.target.value); setCompUserCurrentPage(1); setFeedback(null);}}/></div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" onClick={() => setFeedback(null)}><Upload className="mr-2 h-4 w-4" /> Import / Template</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={()=>handleDownloadTemplate(['ID', 'FirstName', 'LastName', 'Email', 'Phone', 'Role', 'Password'], 'company_users_import')}><Download className="mr-2 h-4 w-4" /> Download Template</DropdownMenuItem><DropdownMenuItem onClick={handleCompanyUserImportClick}><Upload className="mr-2 h-4 w-4" /> Upload Data</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={companyUsers.length === 0} onClick={() => setFeedback(null)}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => exportGenericData(companyUsers, companyUsersExportColumns, 'company_users_data', 'csv')}><FileText className="mr-2 h-4 w-4" /> CSV</DropdownMenuItem><DropdownMenuItem onClick={() => exportGenericData(companyUsers, companyUsersExportColumns, 'company_users_data', 'xlsx')}><FileSpreadsheet className="mr-2 h-4 w-4" /> XLSX</DropdownMenuItem><DropdownMenuItem onClick={() => exportGenericData(companyUsers, companyUsersExportColumns, 'company_users_data', 'pdf')}><FileType className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                        <Button onClick={handleAddCompanyUserClick} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add User to Company</Button>
                    </div>
                </div>
              {selectedCompanyUserItems.size > 0 && (<div className="my-2 flex items-center justify-between p-3 bg-muted/50 rounded-md"><span className="text-sm text-muted-foreground">{selectedCompanyUserItems.size} item(s) selected</span><Button variant="destructive" onClick={handleOpenBulkDeleteCompanyUsersDialog} disabled={!selectedCompanyId}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected</Button></div>)}
              <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead className="sticky top-0 z-10 bg-card w-[50px]"><Checkbox checked={isAllCompanyUsersOnPageSelected} onCheckedChange={(checked) => handleSelectAllCompanyUsersOnPage(Boolean(checked))} aria-label="Select all users on page" disabled={paginatedCompanyUsers.length === 0}/></TableHead><TableHead className="sticky top-0 z-10 bg-card">Name</TableHead><TableHead className="sticky top-0 z-10 bg-card">Email</TableHead><TableHead className="sticky top-0 z-10 bg-card">Role</TableHead><TableHead className="sticky top-0 z-10 bg-card text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{paginatedCompanyUsers.map((user) => (<TableRow key={user.id} data-state={selectedCompanyUserItems.has(user.id) ? "selected" : ""}><TableCell><Checkbox checked={selectedCompanyUserItems.has(user.id)} onCheckedChange={(checked) => handleSelectCompanyUserRow(user.id, Boolean(checked))} aria-label={`Select user ${user.firstName} ${user.lastName}`}/></TableCell><TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.role}</TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => handleEditCompanyUserClick(user)} title="Edit User"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteCompanyUserClick(user)} title="Remove User from Company" className="text-destructive hover:text-destructive/90"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}{paginatedCompanyUsers.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center h-24">{companyUserSearchTerm ? "No users match search." : "No users managed by this company."}</TableCell></TableRow>)}</TableBody></Table></div>
              {compUserTotalPages > 1 && (<div className="flex items-center justify-between py-4"><div className="text-sm text-muted-foreground">{selectedCompanyUserItems.size > 0 ? `${selectedCompanyUserItems.size} item(s) selected.` : `Page ${compUserCurrentPage} of ${compUserTotalPages} (${compUserTotalItems} users)`}</div><div className="flex items-center space-x-6 lg:space-x-8"><div className="flex items-center space-x-2"><p className="text-sm font-medium">Rows per page</p><Select value={`${compUserRowsPerPage}`} onValueChange={(value) => {setCompUserRowsPerPage(Number(value)); setCompUserCurrentPage(1); setSelectedCompanyUserItems(new Set());}}><SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${compUserRowsPerPage}`} /></SelectTrigger><SelectContent side="top">{ROWS_PER_PAGE_OPTIONS.map((s) => (<SelectItem key={`compuser-${s}`} value={`${s}`}>{s}</SelectItem>))}</SelectContent></Select></div><div className="flex items-center space-x-2"><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCompUserCurrentPage(1); setSelectedCompanyUserItems(new Set());}} disabled={compUserCurrentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCompUserCurrentPage(p => p - 1); setSelectedCompanyUserItems(new Set());}} disabled={compUserCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCompUserCurrentPage(p => p + 1); setSelectedCompanyUserItems(new Set());}} disabled={compUserCurrentPage === compUserTotalPages}><ChevronRight className="h-4 w-4" /></Button><Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCompUserCurrentPage(compUserTotalPages); setSelectedCompanyUserItems(new Set());}} disabled={compUserCurrentPage === compUserTotalPages}><ChevronsRight className="h-4 w-4" /></Button></div></div></div>)}
            </CardContent>
          </Card>
          ) : (
            <Card><CardContent className="p-6 text-center"><AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-lg font-semibold">Access Denied</p><p className="text-muted-foreground">You do not have permission to manage users for this company.</p></CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDepartmentDialogOpen} onOpenChange={(isOpen) => { setIsDepartmentDialogOpen(isOpen); if(!isOpen) setFeedback(null); }}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>{editingDepartment ? "Edit Department" : "Add New Department"}</DialogTitle><DialogDescription>{editingDepartment ? "Update department." : "Fill in details."}</DialogDescription></DialogHeader><div className="grid gap-4 py-4" tabIndex={0}><div className="space-y-2"><Label htmlFor="departmentName">Department Name *</Label><Input id="departmentName" name="name" value={departmentFormData.name} onChange={handleDepartmentInputChange} placeholder="e.g., Engineering" /></div><div className="space-y-2"><Label htmlFor="departmentDescription">Description</Label><Textarea id="departmentDescription" name="description" value={departmentFormData.description} onChange={handleDepartmentInputChange} placeholder="Briefly describe" /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsDepartmentDialogOpen(false)}>Cancel</Button><Button type="button" onClick={handleSaveDepartment}>Save</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={isCompanyUserDialogOpen} onOpenChange={(isOpen) => {setIsCompanyUserDialogOpen(isOpen); if(!isOpen) setFeedback(null);}}>
        <DialogContent className="sm:max-w-[525px]"><DialogHeader><DialogTitle>{editingCompanyUser ? "Edit User" : "Add New User to Company"}</DialogTitle><DialogDescription>{editingCompanyUser ? "Update user details." : "Fill in details for the new user."}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2" tabIndex={0}>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="cu_firstName">First Name *</Label><Input id="cu_firstName" name="firstName" value={companyUserFormData.firstName} onChange={handleCompanyUserInputFormChange} required /></div><div className="space-y-2"><Label htmlFor="cu_lastName">Last Name *</Label><Input id="cu_lastName" name="lastName" value={companyUserFormData.lastName} onChange={handleCompanyUserInputFormChange} required /></div></div>
            <div className="space-y-2"><Label htmlFor="cu_email">Email *</Label><Input id="cu_email" name="email" type="email" value={companyUserFormData.email} onChange={handleCompanyUserInputFormChange} required disabled={!!editingCompanyUser && pageCurrentUserRole === 'Company Admin'} /></div>
            <div className="space-y-2"><Label htmlFor="cu_phone">Phone</Label><Input id="cu_phone" name="phone" type="tel" value={companyUserFormData.phone || ""} onChange={handleCompanyUserInputFormChange} /></div>
            <div className="space-y-2"><Label htmlFor="cu_password">Password {editingCompanyUser ? "(Leave blank to keep)" : "*"}</Label><div className="relative"><Input id="cu_password" name="password" type={showPasswordInCompanyUserDialog ? "text" : "password"} value={companyUserFormData.password || ""} onChange={handleCompanyUserInputFormChange} required={!editingCompanyUser} className="pr-10"/><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2" onClick={()=>setShowPasswordInCompanyUserDialog(!showPasswordInCompanyUserDialog)} tabIndex={-1}>{showPasswordInCompanyUserDialog ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</Button></div></div>
            <div className="space-y-2"><Label htmlFor="cu_role">Role *</Label><Select value={companyUserFormData.role} onValueChange={(value) => handleCompanyUserRoleChange(value as UserRole)} required><SelectTrigger id="cu_role"><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent><SelectItem value="Payroll Preparer">Payroll Preparer</SelectItem><SelectItem value="Payroll Approver">Payroll Approver</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter className="pt-4 border-t"><Button type="button" variant="outline" onClick={() => setIsCompanyUserDialogOpen(false)}>Cancel</Button><Button type="button" onClick={handleSaveCompanyUser}>Save User</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteCompanyUserDialogOpen} onOpenChange={setIsDeleteCompanyUserDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Remove user "{companyUserToDelete?.firstName} {companyUserToDelete?.lastName}" from this company?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteCompanyUser} className="bg-destructive hover:bg-destructive/90">Remove User</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={isBulkDeleteCompanyUsersDialogOpen} onOpenChange={setIsBulkDeleteCompanyUsersDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>Delete {selectedCompanyUserItems.size} selected user(s)?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmBulkDeleteCompanyUsers} className="bg-destructive hover:bg-destructive/90">Delete Selected</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
// All localStorage and indexedDbUtils references have been removed. This page now relies solely on Supabase for company settings data.
// Linting fixes applied: removed unused CURRENT_USER_LOCALSTORAGE_KEY, added missing types, fixed implicit any, and ensured all JSX elements are typed.
