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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Eye, EyeOff, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload, Download, FileText, FileSpreadsheet, FileType, AlertTriangle, Info, CheckCircle2 } from "lucide-react"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSupabaseClient } from '@/lib/supabase';
import { 
    type UserRole, 
    type Company, 
    type User
} from '@/lib/userData';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from '@/lib/utils';

// All localStorage and indexedDbUtils references have been removed. This component now relies solely on Supabase for user management data.

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

const USER_ROLE_VALUES = [
  "Primary Admin",
  "App Admin",
  "Company Admin",
  "Payroll Approver",
  "Payroll Preparer"
];

type FeedbackMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
};

import { userToBackend, userFromBackend } from '@/lib/case-conversion';
// UI type for all state and form logic
export type UserUI = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  assignedCompanyIds: string[];
  password?: string;
  phone?: string;
};

const defaultNewUserFormDataUI: UserUI = {
  firstName: "",
  lastName: "",
  email: "",
  role: "Payroll Preparer",
  assignedCompanyIds: [],
  password: "",
  phone: "",
};

export default function UserManagementTab() {
  const [allUsers, setAllUsers] = useState<UserUI[]>([]); 
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserUI>(defaultNewUserFormDataUI);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPasswordInDialog, setShowPasswordInDialog] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState(""); 
  const globalUsersImportFileInputRef = useRef<HTMLInputElement>(null);


  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userRowsPerPage, setUserRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [selectedUserItems, setSelectedUserItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteUsersDialogOpen, setIsBulkDeleteUsersDialogOpen] = useState(false);
  const [availableCompaniesForAssignment, setAvailableCompaniesForAssignment] = useState<Company[]>([]);


  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoaded(false);
      setFeedback(null);
      try {
        const supabase = getSupabaseClient();
        const { data: users, error: userError } = await supabase.from('users').select('*');
        if (userError) throw userError;
        setAllUsers((users || []).map(userFromBackend));
        const { data: companies, error: companyError } = await supabase.from('companies').select('*');
        if (companyError) throw companyError;
        setAvailableCompaniesForAssignment(companies || []);      } catch {
        setAllUsers([]); 
        setAvailableCompaniesForAssignment([]);
        setFeedback({type: 'error', message: "Loading Error", details: "Could not load initial data."})
      } finally {
        setIsLoaded(true);
      }
    };
    loadInitialData();
  }, []);

  const primaryAdminExists = allUsers.some(user => user.role === "Primary Admin");
  const currentPrimaryAdmin = allUsers.find(user => user.role === "Primary Admin");


  useEffect(() => {
    setShowPasswordInDialog(false); 
    if (editingUser) {
      // Map backend User (snake_case) to UI User (camelCase)
      const uiUser = userFromBackend(editingUser);
      let assignedIds = [...(uiUser.assignedCompanyIds || [])];
      if (uiUser.role === "Primary Admin" || uiUser.role === "App Admin") {
        assignedIds = availableCompaniesForAssignment.map(c => c.id);
      }
      setFormData({
        id: uiUser.id,
        firstName: uiUser.firstName,
        lastName: uiUser.lastName,
        email: uiUser.email,        phone: uiUser.phone || "",
        role: uiUser.role,
        assignedCompanyIds: assignedIds,
        password: "",
      });
    } else {
      let initialAssignedIds = defaultNewUserFormDataUI.assignedCompanyIds || [];
      if (defaultNewUserFormDataUI.role === "Primary Admin" || defaultNewUserFormDataUI.role === "App Admin") {
        initialAssignedIds = availableCompaniesForAssignment.map(c => c.id);      }
      setFormData({ ...defaultNewUserFormDataUI, assignedCompanyIds: initialAssignedIds, password: "" });
    }
  }, [editingUser, isUserDialogOpen, availableCompaniesForAssignment]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: UserRole) => {
    setFormData(prev => {
        const newAssignedCompanyIds = (value === "Primary Admin" || value === "App Admin")
            ? availableCompaniesForAssignment.map(c => c.id)
            : (editingUser && editingUser.role === value ? prev.assignedCompanyIds : []); 
        return { ...prev, role: value, assignedCompanyIds: newAssignedCompanyIds };
    });
  };
  const handleCompanyAssignmentChange = (companyId: string, checked: boolean | "indeterminate") => {
    setFormData(prev => {
      const newAssignedCompanyIds = checked === true
        ? [...prev.assignedCompanyIds, companyId]
        : prev.assignedCompanyIds.filter((id: string) => id !== companyId);
      return { ...prev, assignedCompanyIds: newAssignedCompanyIds };
    });
  };

  const handleAddUserClick = () => {
    setFeedback(null);
    setEditingUser(null);
    setIsUserDialogOpen(true);
  };
  const deleteUsersByIds = async (idsToDelete: string[]) => {
    setFeedback(null);
    if (idsToDelete.length === 0) return;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('users').delete().in('id', idsToDelete);
      if (error) throw error;
      setAllUsers(prev => prev.filter((user) => user.id && !idsToDelete.includes(user.id)));
      setSelectedUserItems(prev => {
        const newSelected = new Set(prev);
        idsToDelete.forEach(id => newSelected.delete(id));
        return newSelected;
      });
      setFeedback({ type: 'success', message: "User(s) Deleted", details: `Successfully deleted ${idsToDelete.length} user(s).` });    } catch {
      setFeedback({ type: 'error', message: "Delete Failed", details: `Could not delete ${idsToDelete.length} user(s).` });
    }
  };

  const confirmDeleteUser = async () => { if (userToDelete) { await deleteUsersByIds([userToDelete.id]); } setIsDeleteDialogOpen(false); setUserToDelete(null); };
  const handleOpenBulkDeleteUsersDialog = () => { setFeedback(null); if (selectedUserItems.size === 0) { setFeedback({type: 'info', message: "No Selection", details: "Please select users to delete."}); return; } setIsBulkDeleteUsersDialogOpen(true); };
  const confirmBulkDeleteUsers = async () => { await deleteUsersByIds(Array.from(selectedUserItems)); setIsBulkDeleteUsersDialogOpen(false); };


  const handleSaveUser = async () => {
    setFeedback(null);
    if (editingUser && editingUser.role === "Primary Admin" && formData.role !== "Primary Admin") {
        setFeedback({type: 'error', message: "Action Denied", details: "The Primary Admin's role cannot be changed."});
        return;
    }
    if (formData.role === "Primary Admin" && currentPrimaryAdmin && editingUser?.id !== currentPrimaryAdmin.id) {
        setFeedback({type: 'error', message: "Action Denied", details: "There can only be one Primary Admin. Please change the role."});
        return;
    }
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setFeedback({type: 'error', message: "Validation Error", details: "First name, last name, and email are required."});
      return;
    }
    if (!editingUser && !formData.password) {
       setFeedback({type: 'error', message: "Validation Error", details: "Password is required for new users."});
      return;
    }
    const newEmail = formData.email.trim().toLowerCase();
    try {
      const supabase = getSupabaseClient();
      const finalAssignedCompanyIds =
        formData.role === "Primary Admin" || formData.role === "App Admin"
          ? availableCompaniesForAssignment.map(c => c.id)
          : formData.assignedCompanyIds;
      if (editingUser) {
        const updatedUser = userToBackend({ ...editingUser, ...formData, email: newEmail, assignedCompanyIds: finalAssignedCompanyIds });
        const { error } = await supabase.from('users').update(updatedUser).eq('id', editingUser.id);
        if (error) throw error;
        setAllUsers(prevUsers => prevUsers.map((user) => user.id === editingUser.id ? { ...formData, id: editingUser.id } : user));
        setFeedback({type: 'success', message: "User Updated", details: `${formData.firstName} ${formData.lastName}'s details have been updated.`});
      } else {
        const { data: inserted, error } = await supabase.from('users').insert(userToBackend({ ...formData, email: newEmail, assignedCompanyIds: finalAssignedCompanyIds })).select();
        if (error) throw error;
        if (inserted && inserted.length > 0) {
          setAllUsers(prevUsers => [...prevUsers, userFromBackend(inserted[0])]);
          setFeedback({type: 'success', message: "User Added", details: `${formData.firstName} ${formData.lastName} has been added.`});
        } else {
          setFeedback({type: 'success', message: "User Added", details: `${formData.firstName} ${formData.lastName} has been added.`});
        }
      }
      setIsUserDialogOpen(false);    } catch (error) {
      setFeedback({type: 'error', message: "Save Failed", details: `Could not save user. ${error instanceof Error ? error.message : 'Unknown error'}`});
    }
  };

  const getCompanyNames = (companyIds: string[], role: UserRole) => {
    if (role === "Primary Admin" || role === "App Admin") {
        return "All Companies";
    }
    return companyIds
      .map(id => availableCompaniesForAssignment.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(", ") || "None";
  };

  const filteredUsersSource = useMemo(() => {
    if (!userSearchTerm) return allUsers;
    const lowerSearchTerm = userSearchTerm.toLowerCase();
    return allUsers.filter(user => 
      user.firstName.toLowerCase().includes(lowerSearchTerm) ||
      user.lastName.toLowerCase().includes(lowerSearchTerm) ||
      user.email.toLowerCase().includes(lowerSearchTerm) ||
      user.role.toLowerCase().includes(lowerSearchTerm)
    );
  }, [allUsers, userSearchTerm]);
  const userTotalItems = filteredUsersSource.length;
  const userTotalPages = Math.ceil(userTotalItems / (userRowsPerPage || 10)) || 1;
  const userStartIndex = (userCurrentPage - 1) * (userRowsPerPage || 10);
  const userEndIndex = userStartIndex + (userRowsPerPage || 10);
  const paginatedUsers = filteredUsersSource.slice(userStartIndex, userEndIndex);

  const handleSelectUserRow = (itemId: string, checked: boolean) => {
    setSelectedUserItems(prev => { const newSelected = new Set(prev); if (checked) newSelected.add(itemId); else newSelected.delete(itemId); return newSelected; });
  };
  const handleSelectAllUsersOnPage = (checked: boolean) => {
    const pageItemIds = paginatedUsers.map(item => item.id).filter((id): id is string => !!id);
    if (checked) {
      setSelectedUserItems(prev => new Set([...prev, ...pageItemIds]));
    } else {
      const pageItemIdsSet = new Set(pageItemIds);
      setSelectedUserItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id))));
    }
  };
  const isAllUsersOnPageSelected = paginatedUsers.length > 0 && paginatedUsers.every(item => item.id && selectedUserItems.has(item.id));

  const globalUsersExportColumns = [ { key: 'id', label: 'ID', isIdLike: true }, { key: 'firstName', label: 'FirstName' }, { key: 'lastName', label: 'LastName' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone', isIdLike: true }, { key: 'role', label: 'Role' }, { key: 'assignedCompanyIds', label: 'AssignedCompanyIDs', isIdLike: true}];

  const exportGlobalUserData = (fileType: "csv" | "xlsx" | "pdf") => {
    setFeedback(null);
    if (allUsers.length === 0) {
      setFeedback({ type: 'info', message: "No Data", details: `There are no users to export.` });
      return;
    }
    const headers = globalUsersExportColumns.map(c => c.label);
    const dataToExport = allUsers.map(user => {
      const row: Record<string, string | number> = {};
      globalUsersExportColumns.forEach(col => {        let value: string | number | string[] | undefined;
        if (col.key === 'assignedCompanyIds') {
          value = user.assignedCompanyIds.join(',');
        } else {
          value = user[col.key as keyof UserUI];
        }
        if (col.isIdLike) {
          row[col.label] = String(value || '');
        } else if (typeof value === 'number') {
          row[col.label] = value;
        } else {
          row[col.label] = String(value || '');
        }
      });
      return row;
    });

    const fileName = `global_users_export.${fileType}`;
    if (fileType === "csv") {
        const csvData = dataToExport.map(row => {
            const newRow: Record<string, string> = {};
            headers.forEach(header => {
                const colDef = globalUsersExportColumns.find(c => c.label === header);
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
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "xlsx") {
         const xlsxData = dataToExport.map(row => {
            const newRow: Record<string, string|number>={};
            headers.forEach(h => {
                const colDef = globalUsersExportColumns.find(c => c.label === h);
                if (colDef?.isIdLike) newRow[h] = String(row[h] || '');
                else newRow[h] = (typeof row[h] === 'number' ? row[h] : String(row[h] || ''));
            });
            return newRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(xlsxData, {header: headers, skipHeader: false});
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Global Users");
        XLSX.writeFile(workbook, fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    } else if (fileType === "pdf") {
        const pdfData = dataToExport.map(row => headers.map(header => String(row[header] || '')));
        const doc = new jsPDF({ orientation: 'landscape' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doc as any).autoTable({ head: [headers], body: pdfData, styles: { fontSize: 7 }, headStyles: { fillColor: [102, 126, 234] }, margin: { top: 10 }, });
        doc.save(fileName);
        setFeedback({type: 'success', message: "Export Successful", details: `${fileName} downloaded.`});
    }
  };

  const handleDownloadGlobalUserTemplate = () => { setFeedback(null); const headers = ['ID', 'FirstName', 'LastName', 'Email', 'Phone', 'Role', 'Password', 'AssignedCompanyIDs']; const csvString = headers.join(',') + '\n'; const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', `users_import_template.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); setFeedback({type: 'info', message: "Template Downloaded", details: "Tip: For AssignedCompanyIDs, use a comma-separated list of valid company IDs."}); };
  const handleGlobalUserImportClick = () => { setFeedback(null); globalUsersImportFileInputRef.current?.click(); };

  const handleGlobalUserFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: async (results) => {
          const { data: rawData, errors: papaParseErrors } = results;          if (papaParseErrors.length > 0 && rawData.length === 0) { setFeedback({type: 'error', message: "Import Failed", details: `Critical CSV parsing error: ${papaParseErrors[0]?.message || 'Unknown error'}.`}); return; }
          const validationSkippedLog: string[] = []; let newCount = 0, updatedCount = 0; const itemsToBulkUpsert: Record<string, unknown>[] = [];
          const validCompanyIds = availableCompaniesForAssignment.map(c => c.id);
          const supabase = getSupabaseClient();
          const { data: existingUsersRaw = [], error: fetchUsersError } = await supabase.from('users').select('*');
          const existingUsers = (existingUsersRaw || []).map(userFromBackend);
          if (fetchUsersError) {
            setFeedback({type: 'error', message: "Import Failed", details: `Could not fetch users from Supabase: ${fetchUsersError.message}`});
            return;
          }
          for (const [index, rawRowUntyped] of rawData.entries()) {
            const rawRow = rawRowUntyped as Record<string, string>; const originalLineNumber = index + 2;
            const id = String(rawRow.ID || '').trim(); const firstName = String(rawRow.FirstName || '').trim(); const lastName = String(rawRow.LastName || '').trim(); const email = String(rawRow.Email || '').trim().toLowerCase(); const phone = String(rawRow.Phone || '').trim(); const role = String(rawRow.Role || '').trim() as UserRole; const password = String(rawRow.Password || '').trim(); const assignedCompanyIDsStr = String(rawRow.AssignedCompanyIDs || '').trim();
            if (!USER_ROLE_VALUES.includes(role)) { validationSkippedLog.push(`Row ${originalLineNumber} (Email: ${email}) skipped: Invalid Role '${role}'.`); continue;}
            let assignedCompanyIdsArray: string[] = [];
            if (role === "Primary Admin" || role === "App Admin") { assignedCompanyIdsArray = validCompanyIds; }
            else if (assignedCompanyIDsStr) { assignedCompanyIdsArray = assignedCompanyIDsStr.split(',').map(cid => cid.trim()).filter(cid => validCompanyIds.includes(cid)); if (assignedCompanyIdsArray.length !== assignedCompanyIDsStr.split(',').map(cid => cid.trim()).length) { validationSkippedLog.push(`Row ${originalLineNumber} (Email: ${email}): Some AssignedCompanyIDs were invalid and removed.`); } }
            const existingUserById = id ? existingUsers.find(u => u.id === id) : null;
            const existingUserByEmail = existingUsers.find(u => u.email === email);
            if (id) { 
              if (existingUserById) {
                if (existingUserByEmail && existingUserByEmail.id !== id) { validationSkippedLog.push(`Row ${originalLineNumber} (ID: ${id}) skipped: New email ${email} conflicts with existing user ${existingUserByEmail.id}.`); continue;}
                if (existingUserById.role === "Primary Admin" && role !== "Primary Admin") { validationSkippedLog.push(`Row ${originalLineNumber} (ID: ${id}) skipped: Primary Admin role cannot be changed.`); continue; }
                if (role === "Primary Admin" && currentPrimaryAdmin && currentPrimaryAdmin.id !== id) { validationSkippedLog.push(`Row ${originalLineNumber} (ID: ${id}) skipped: Another user is already Primary Admin.`); continue; }
                itemsToBulkUpsert.push(userToBackend({ ...existingUserById, firstName, lastName, email, phone, role, password: password || existingUserById.password, assignedCompanyIds: assignedCompanyIdsArray })); updatedCount++;
              } else { validationSkippedLog.push(`Row ${originalLineNumber} (ID: ${id}) skipped: User ID not found for update.`); continue; }
            } else { 
              if (!password) { validationSkippedLog.push(`Row ${originalLineNumber} (Email: ${email}) skipped: Password required for new user.`); continue; }
              if (existingUserByEmail) { validationSkippedLog.push(`Row ${originalLineNumber} (Email: ${email}) skipped: Email already exists.`); continue; }
              if (role === "Primary Admin" && primaryAdminExists) { validationSkippedLog.push(`Row ${originalLineNumber} (Email: ${email}) skipped: Primary Admin already exists.`); continue; }
              itemsToBulkUpsert.push(userToBackend({ firstName, lastName, email, phone, role, password, assignedCompanyIds: assignedCompanyIdsArray })); newCount++; // Do not assign id manually
            }
          }
          if (itemsToBulkUpsert.length > 0) {
            const { error: upsertError } = await supabase.from('users').upsert(itemsToBulkUpsert, { onConflict: 'id' });
            if (upsertError) {
              setFeedback({type: 'error', message: "Import Failed", details: `Could not upsert users: ${upsertError.message}`});
              return;
            }
            const { data: updatedListRaw = [], error: refreshError } = await supabase.from('users').select('*');
            const updatedList = (updatedListRaw || []).map(userFromBackend);
            if (!refreshError) setAllUsers(updatedList);
          }
          let feedbackMessage = ""; let feedbackTitle = "Import Processed"; let feedbackType: FeedbackMessage['type'] = 'info'; if (newCount > 0 || updatedCount > 0) { feedbackTitle = "Import Successful"; feedbackMessage = `${newCount} users added, ${updatedCount} updated.`; feedbackType = 'success'; } else if (rawData.length > 0 && papaParseErrors.length === 0 && validationSkippedLog.length === 0) { feedbackMessage = `CSV processed. ${rawData.length} rows checked. No changes.`; } else { feedbackMessage = "No changes applied."; } 
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
    return <div>Loading users...</div>;
  }

  return (
    <Card>
      <input type="file" ref={globalUsersImportFileInputRef} onChange={handleGlobalUserFileUpload} accept=".csv" className="hidden" />
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Create, edit, delete users, and manage their roles and company access.
          The Primary Admin cannot be deleted or have their role changed. Data is persisted in Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderFeedbackMessage()}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4">
            <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search users by name, email, role..."
                    className="w-full pl-10"
                    value={userSearchTerm}
                    onChange={(e) => {setUserSearchTerm(e.target.value); setUserCurrentPage(1); setFeedback(null);}}
                />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                 <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" onClick={() => setFeedback(null)}><Upload className="mr-2 h-4 w-4" /> Import / Template</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={handleDownloadGlobalUserTemplate}><Download className="mr-2 h-4 w-4" /> Download Template</DropdownMenuItem><DropdownMenuItem onClick={handleGlobalUserImportClick}><Upload className="mr-2 h-4 w-4" /> Upload Data</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto" disabled={allUsers.length === 0} onClick={() => setFeedback(null)}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => exportGlobalUserData('csv')}><FileText className="mr-2 h-4 w-4" /> CSV</DropdownMenuItem><DropdownMenuItem onClick={() => exportGlobalUserData('xlsx')}><FileSpreadsheet className="mr-2 h-4 w-4" /> XLSX</DropdownMenuItem><DropdownMenuItem onClick={() => exportGlobalUserData('pdf')}><FileType className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                <Button onClick={handleAddUserClick} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New User
                </Button>
            </div>
        </div>
        {selectedUserItems.size > 0 && (<div className="my-2 flex items-center justify-between p-3 bg-muted/50 rounded-md"><span className="text-sm text-muted-foreground">{selectedUserItems.size} item(s) selected</span><Button variant="destructive" onClick={handleOpenBulkDeleteUsersDialog}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected</Button></div>)}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 z-10 bg-card w-[50px]"><Checkbox checked={isAllUsersOnPageSelected} onCheckedChange={(checked) => handleSelectAllUsersOnPage(Boolean(checked))} aria-label="Select all users on page" disabled={paginatedUsers.length === 0}/></TableHead>
                <TableHead className="sticky top-0 z-10 bg-card">Name</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card">Email</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card">Role</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card">Assigned Companies</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.filter(user => user.id).map(user => (
                <TableRow key={user.id} data-state={selectedUserItems.has(user.id!)}>
                  <TableCell><Checkbox checked={selectedUserItems.has(user.id!)} onCheckedChange={(checked) => handleSelectUserRow(user.id!, Boolean(checked))} aria-label={`Select user ${user.firstName} ${user.lastName}`} disabled={user.role === 'Primary Admin'}/></TableCell>
                  <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{getCompanyNames(user.assignedCompanyIds, user.role)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setEditingUser(userToBackend(user))} 
                      title="Edit User"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setUserToDelete(userToBackend(user))}
                      disabled={user.role === "Primary Admin"}
                      title={user.role === "Primary Admin" ? "Cannot delete Primary Admin" : "Delete User"}
                      className={user.role === "Primary Admin" ? "text-muted-foreground cursor-not-allowed" : "text-destructive hover:text-destructive"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedUsers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        {userSearchTerm ? "No users match your search." : "No users found."}
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {userTotalPages > 1 && (
        <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
            {selectedUserItems.size > 0 ? `${selectedUserItems.size} item(s) selected.` : `Page ${userCurrentPage} of ${userTotalPages} (${userTotalItems} total users)`}
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select value={`${userRowsPerPage}`} onValueChange={(value) => {setUserRowsPerPage(Number(value)); setUserCurrentPage(1); setSelectedUserItems(new Set());}}>
                <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${userRowsPerPage}`} /></SelectTrigger>
                <SelectContent side="top">
                    {ROWS_PER_PAGE_OPTIONS.map((pageSize) => (<SelectItem key={`user-${pageSize}`} value={`${pageSize}`}>{pageSize}</SelectItem>))}
                </SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setUserCurrentPage(1); setSelectedUserItems(new Set());}} disabled={userCurrentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setUserCurrentPage(prev => prev - 1); setSelectedUserItems(new Set());}} disabled={userCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setUserCurrentPage(prev => prev + 1); setSelectedUserItems(new Set());}} disabled={userCurrentPage === userTotalPages}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setUserCurrentPage(userTotalPages); setSelectedUserItems(new Set());}} disabled={userCurrentPage === userTotalPages}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
            </div>
        </div>
        )}
      </CardContent>

      <Dialog open={isUserDialogOpen} onOpenChange={(isOpen) => {setIsUserDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update the user's details." : "Fill in the details for the new user."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2" tabIndex={0}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone || ""} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="passwordDialog">Password {editingUser ? "(Leave blank to keep current)" : "*"}</Label>
                <div className="relative">
                    <Input 
                        id="passwordDialog" 
                        name="password" 
                        type={showPasswordInDialog ? "text" : "password"} 
                        value={formData.password || ""} 
                        onChange={handleInputChange} 
                        placeholder={editingUser ? "Enter new password to change" : "Enter password for new user"} 
                        required={!editingUser}
                        className="pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPasswordInDialog(!showPasswordInDialog)}
                        tabIndex={-1}
                    >
                        {showPasswordInDialog ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showPasswordInDialog ? "Hide password" : "Show password"}</span>
                    </Button>
                </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={handleRoleChange}
                disabled={editingUser?.role === "Primary Admin"}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>                  <SelectItem 
                    value="Primary Admin" 
                    disabled={Boolean(primaryAdminExists && editingUser?.id !== currentPrimaryAdmin?.id)}
                  >
                    Primary Admin (Max 1)
                  </SelectItem>
                  <SelectItem value="App Admin">App Admin</SelectItem>
                  <SelectItem value="Company Admin">Company Admin</SelectItem>
                  <SelectItem value="Payroll Approver">Payroll Approver</SelectItem>
                  <SelectItem value="Payroll Preparer">Payroll Preparer</SelectItem>
                </SelectContent>
              </Select>              {Boolean(editingUser?.role === "Primary Admin") && (
                <p className="text-xs text-muted-foreground">The Primary Admin&apos;s role cannot be changed.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Assigned Companies</Label>
              { (formData.role === "Primary Admin" || formData.role === "App Admin") ? (
                <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                    Access to all companies is automatically granted for this role.
                </p>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto border p-2 rounded-md">
                    {availableCompaniesForAssignment.map(company => (
                    <div key={company.id} className="flex items-center space-x-2">
                        <Checkbox
                        id={`company-${company.id}`}
                        checked={formData.assignedCompanyIds.includes(company.id)}
                        onCheckedChange={(checked) => handleCompanyAssignmentChange(company.id, checked)}
                        disabled={formData.role === "Primary Admin" || formData.role === "App Admin"}
                        />
                        <Label htmlFor={`company-${company.id}`} className="font-normal">
                        {company.name}
                        </Label>
                    </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveUser}>Save User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>              This action cannot be undone. This will permanently delete the user
              &quot;{userToDelete ? `${userToDelete.first_name ?? ''} ${userToDelete.last_name ?? ''}` : ''}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isBulkDeleteUsersDialogOpen} onOpenChange={setIsBulkDeleteUsersDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>Delete {selectedUserItems.size} selected user(s)? Primary Admin cannot be deleted.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmBulkDeleteUsers} className="bg-destructive hover:bg-destructive/90">Delete Selected</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </Card>
  );
}

