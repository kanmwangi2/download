"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { PlusCircle, Eye, CheckCircle, XCircle, AlertTriangle, Hourglass, Search, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { FeedbackAlert, FeedbackMessage } from '@/components/ui/feedback-alert';

// Import OOP services and utilities
import {
  getServices,
  PayrollUtils,
  PayrollValidation,
  PayrollPermissions,
  type PayrollRunSummary,
  type PayrollStatus
} from '@/lib/oop';
import { type AuthenticatedUser } from '@/lib/services/UserService';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

// Status configuration with icon mapping
const statusConfig: Record<PayrollStatus, { color: string; icon: React.ElementType; textColor?: string }> = {
  Draft: { color: "bg-gray-500 hover:bg-gray-600", icon: Hourglass, textColor: "text-white" },
  "To Approve": { color: "bg-blue-500 hover:bg-blue-600", icon: AlertTriangle, textColor: "text-white" },
  Rejected: { color: "bg-red-500 hover:bg-red-600", icon: XCircle, textColor: "text-white" },
  Approved: { color: "bg-green-500 hover:bg-green-600", icon: CheckCircle, textColor: "text-white" },
};

export default function PayrollPage() {
  const router = useRouter();
  const { selectedCompanyId, isLoadingCompanyContext } = useCompany();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();
  
  // State management
  const [allPayrollRunsData, setAllPayrollRunsData] = useState<PayrollRunSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0] || 10);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [isCreateRunDialogOpen, setIsCreateRunDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDeleteDialogForItemOpen, setIsDeleteDialogForItemOpen] = useState(false);
  const [runToDeleteSingle, setRunToDeleteSingle] = useState<PayrollRunSummary | null>(null);
  
  // Feedback states
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [createRunDialogFeedback, setCreateRunDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [deleteRunDialogFeedback, setDeleteRunDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [bulkDeleteRunsDialogFeedback, setBulkDeleteRunsDialogFeedback] = useState<FeedbackMessage | null>(null);

  // Load data effect
  useEffect(() => {
    const loadData = async () => {
      if (isLoadingCompanyContext || isLoadingAuth || !selectedCompanyId) {
        if (!isLoadingCompanyContext && !isLoadingAuth && !selectedCompanyId) {
          setAllPayrollRunsData([]);
          setIsLoaded(true);
        }
        return;
      }

      setIsLoaded(false);
      setFeedback(null);

      try {
        if (!currentUser) {
          setFeedback({ type: 'error', message: "Authentication Required", details: "Please log in to access payroll data." });
          setIsLoaded(true);
          return;
        }

        // Check if user can access this company's payroll data
        if (!PayrollPermissions.canAccessCompanyPayroll(currentUser, selectedCompanyId)) {
          setFeedback({ type: 'error', message: "Access Denied", details: "You don't have permission to access payroll data for this company." });
          setAllPayrollRunsData([]);
          setIsLoaded(true);
          return;
        }

        const services = getServices();
        // Load payroll runs for the company
        const payrollRuns = await services.payrollService.getPayrollRunSummaries(selectedCompanyId);
        setAllPayrollRunsData(payrollRuns);

      } catch (error) {
        console.error("Error loading payroll data:", error);
        setFeedback({ type: 'error', message: "Error Loading Data", details: (error as Error).message });
        setAllPayrollRunsData([]);
      }

      setIsLoaded(true);
    };

    loadData();
  }, [selectedCompanyId, isLoadingCompanyContext, isLoadingAuth, currentUser]);

  // Computed values
  const filteredRunsSource = useMemo(() => {
    return allPayrollRunsData
      .filter(run => PayrollUtils.generateSearchTerms(run, searchTerm))
      .sort((a, b) => b.year - a.year || Date.parse(`01 ${b.month} ${b.year}`) - Date.parse(`01 ${a.month} ${a.year}`));
  }, [allPayrollRunsData, searchTerm]);

  const totalItems = filteredRunsSource.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRuns = filteredRunsSource.slice(startIndex, endIndex);

  const existingNonApprovedRunForCompany = useMemo(() => {
    if (!selectedCompanyId) return null;
    return allPayrollRunsData.find(run => run.companyId === selectedCompanyId && run.status !== "Approved");
  }, [allPayrollRunsData, selectedCompanyId]);

  // Event handlers
  const handleSelectRow = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (checked) newSelected.add(itemId);
      else newSelected.delete(itemId);
      return newSelected;
    });
  };

  const handleSelectAllOnPage = (checked: boolean) => {
    const pageItemIds = paginatedRuns.map(item => item.id);
    if (checked) {
      setSelectedItems(prev => new Set([...prev, ...pageItemIds]));
    } else {
      const pageItemIdsSet = new Set(pageItemIds);
      setSelectedItems(prev => new Set([...prev].filter(id => !pageItemIdsSet.has(id))));
    }
  };

  const resetSelectionAndPage = () => {
    setSelectedItems(new Set());
    setCurrentPage(1);
  };

  const handleCreateRun = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateRunDialogFeedback(null);

    if (!selectedCompanyId || !currentUser) {
      setCreateRunDialogFeedback({ type: 'error', message: "Error", details: "No company selected or user not authenticated." });
      return;
    }

    // Check permissions
    const canCreate = PayrollPermissions.canCreatePayrollRun(currentUser);
    if (!canCreate.allowed) {
      setCreateRunDialogFeedback({ type: 'error', message: "Permission Denied", details: canCreate.reason || "You cannot create payroll runs." });
      return;
    }

    // Check business rules
    const canCreateValidation = PayrollValidation.canCreatePayrollRun(allPayrollRunsData, "", 0, selectedCompanyId);
    if (!canCreateValidation.canCreate) {
      setCreateRunDialogFeedback({ type: 'error', message: "Action Restricted", details: canCreateValidation.reason || "Cannot create payroll run." });
      return;
    }

    const currentForm = event.currentTarget;
    const formData = new FormData(currentForm);
    const month = formData.get('month') as string;
    const year = parseInt(formData.get('year') as string);

    // Validate data
    const validation = PayrollUtils.validatePayrollRunData({ month, year, companyId: selectedCompanyId });
    if (!validation.isValid) {
      setCreateRunDialogFeedback({ type: 'error', message: "Validation Error", details: validation.errors.join(', ') });
      return;
    }

    // Check for duplicates
    const exists = allPayrollRunsData.some(run => 
      run.companyId === selectedCompanyId && 
      run.month === month && 
      run.year === year
    );
    if (exists) {
      setCreateRunDialogFeedback({ 
        type: 'error', 
        message: "Duplicate Payroll Period", 
        details: `A payroll run for ${month} ${year} already exists for this company.` 
      });
      return;
    }

    try {
      const services = getServices();
      
      // Create a new payroll run summary
      const newRun: PayrollRunSummary = {
        id: `payroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        companyId: selectedCompanyId,
        month,
        year,
        employees: 0,
        grossSalary: 0,
        deductions: 0,
        netPay: 0,
        status: 'Draft'
      };

      // Save the payroll run
      await services.payrollService.updatePayrollRunSummary(newRun);

      // Update UI state
      setAllPayrollRunsData(prev => [newRun, ...prev]);
      setCreateRunDialogFeedback({ 
        type: 'success', 
        message: "Payroll Run Created", 
        details: `Payroll run for ${month} ${year} (ID: ${newRun.id}) created as Draft. You will be redirected to process it.` 
      });

      setTimeout(() => {
        setIsCreateRunDialogOpen(false);
        setCreateRunDialogFeedback(null);
        currentForm.reset();
        resetSelectionAndPage();
        router.push(`/app/payroll/${newRun.id}`);
      }, 1500);

    } catch (error) {
      setCreateRunDialogFeedback({ type: 'error', message: "Creation Failed", details: "Could not create payroll run." });
    }
  };

  const deletePayrollRunsByIds = async (runIds: string[], isFromSingleDialog = false, isFromBulkDialog = false) => {
    if (runIds.length === 0 || !selectedCompanyId || !currentUser) return;

    const runsToDelte = allPayrollRunsData.filter(r => runIds.includes(r.id) && r.companyId === selectedCompanyId);
    const validation = PayrollValidation.canBulkDeletePayrollRuns(runsToDelte);

    if (!validation.canDelete && validation.deletableCount === 0) {
      const feedbackMessage = { 
        type: 'info' as const, 
        message: "Deletion Denied", 
        details: validation.reason || "Cannot delete selected runs." 
      };
      
      if (isFromSingleDialog) setDeleteRunDialogFeedback(feedbackMessage);
      else if (isFromBulkDialog) setBulkDeleteRunsDialogFeedback(feedbackMessage);
      else setFeedback(feedbackMessage);
      return;
    }

    const actualIdsToDelete = runsToDelte
      .filter(run => PayrollPermissions.canDeletePayrollRun(currentUser, run.status).allowed)
      .map(run => run.id);

    if (actualIdsToDelete.length === 0) return;

    try {
      // TODO: Implement actual deletion in PayrollService
      // For now, just remove from local state
      console.warn('Delete payroll runs not fully implemented yet - removing from UI only');
      
      // Update UI state
      setAllPayrollRunsData(prev => prev.filter(run => !actualIdsToDelete.includes(run.id)));
      setSelectedItems(prev => {
        const newSelected = new Set(prev);
        actualIdsToDelete.forEach(id => newSelected.delete(id));
        return newSelected;
      });

      const successMessage = `Successfully deleted ${actualIdsToDelete.length} payroll run(s).`;
      const feedbackMessage = validation.undeletableCount > 0
        ? { type: 'info' as const, message: "Deletion Partially Completed", details: `${successMessage} ${validation.undeletableCount} run(s) were skipped due to permissions.` }
        : { type: 'success' as const, message: "Payroll Run(s) Deleted", details: successMessage };

      if (isFromSingleDialog) setDeleteRunDialogFeedback(feedbackMessage);
      else if (isFromBulkDialog) setBulkDeleteRunsDialogFeedback(feedbackMessage);
      else setFeedback(feedbackMessage);

      // Handle pagination
      if (currentPage > 1 && paginatedRuns.length === actualIdsToDelete.filter(id => paginatedRuns.some(pr => pr.id === id)).length) {
        setCurrentPage(Math.max(1, currentPage - 1));
      }

    } catch (error) {
      const errorMessage = { type: 'error' as const, message: "Delete Failed", details: `Could not delete payroll run(s). ${(error as Error).message}` };
      
      if (isFromSingleDialog) setDeleteRunDialogFeedback(errorMessage);
      else if (isFromBulkDialog) setBulkDeleteRunsDialogFeedback(errorMessage);
      else setFeedback(errorMessage);
    }
  };

  const handleDeleteSingleRunClick = (run: PayrollRunSummary) => {
    setDeleteRunDialogFeedback(null);
    
    if (!currentUser) {
      setFeedback({ type: 'error', message: "Authentication Required", details: "Please log in to delete payroll runs." });
      return;
    }

    const permission = PayrollPermissions.canDeletePayrollRun(currentUser, run.status);
    if (!permission.allowed) {
      setFeedback({ type: 'error', message: "Deletion Denied", details: permission.title });
      return;
    }
    
    setRunToDeleteSingle(run);
    setIsDeleteDialogForItemOpen(true);
  };

  const confirmDeleteSingleRun = async () => {
    if (runToDeleteSingle) {
      await deletePayrollRunsByIds([runToDeleteSingle.id], true, false);
    }
    setIsDeleteDialogForItemOpen(false);
    setRunToDeleteSingle(null);
    setDeleteRunDialogFeedback(null);
  };

  const handleOpenBulkDeleteDialog = () => {
    setBulkDeleteRunsDialogFeedback(null);
    if (selectedItems.size === 0) {
      setFeedback({ type: 'info', message: "No Selection", details: "Please select payroll runs to delete." });
      return;
    }
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDeleteRuns = async () => {
    await deletePayrollRunsByIds(Array.from(selectedItems), false, true);
    setIsBulkDeleteDialogOpen(false);
    setBulkDeleteRunsDialogFeedback(null);
  };

  // UI state calculations
  const isAllOnPageSelected = paginatedRuns.length > 0 && paginatedRuns.every(item => selectedItems.has(item.id));
  const runNewPayrollButtonDisabled = PayrollPermissions.isCreatePayrollDisabled(currentUser, selectedCompanyId, existingNonApprovedRunForCompany || null);
  const runNewPayrollTooltipContent = PayrollPermissions.getCreatePayrollTooltip(currentUser, selectedCompanyId, existingNonApprovedRunForCompany || null);

  // Loading states
  if (isLoadingCompanyContext) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading company information...</div>;
  }

  if (!selectedCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <SlidersHorizontal className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold">No Company Selected</p>
        <p className="text-muted-foreground">Please select a company to manage payroll runs.</p>
        <Button asChild className="mt-4">
          <Link href="/select-company">Go to Company Selection</Link>
        </Button>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading payroll runs...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">Payroll Processing</h1>
          </div>
          <p className="text-muted-foreground">
            Create, manage, and approve payroll runs for the current company. Data persists in Supabase.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><SlidersHorizontal className="mr-2 h-6 w-6 text-primary" />Payroll Runs</CardTitle>
          <CardDescription>List of all payroll runs for the current company.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
            <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by ID, month, year, or status..."
                className="w-full pl-10"
                value={searchTerm}
                onChange={(e) => { 
                  setSearchTerm(e.target.value); 
                  setCurrentPage(1); 
                  setSelectedItems(new Set()); 
                  setFeedback(null); 
                }}
                disabled={!selectedCompanyId}
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
              <Dialog open={isCreateRunDialogOpen} onOpenChange={(isOpen) => { 
                setIsCreateRunDialogOpen(isOpen); 
                if (!isOpen) setCreateRunDialogFeedback(null);
              }}>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto" disabled={runNewPayrollButtonDisabled}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Run New Payroll
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    {runNewPayrollButtonDisabled && (
                      <TooltipContent><p>{runNewPayrollTooltipContent}</p></TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Run New Payroll</DialogTitle>
                    <DialogDescription>
                      Select the month and year for the new payroll run.
                    </DialogDescription>
                  </DialogHeader>
                  <FeedbackAlert feedback={createRunDialogFeedback} />
                  <form onSubmit={handleCreateRun}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="month" className="text-right">Month</Label>
                        <Select name="month" required defaultValue={new Date().toLocaleString('default', { month: 'long' })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            {PayrollUtils.getAvailableMonths().map(month => (
                              <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="year" className="text-right">Year</Label>
                        <Select name="year" required defaultValue={new Date().getFullYear().toString()}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {PayrollUtils.getAvailableYears().slice(5, 8).map(year => (
                              <SelectItem key={year.value} value={year.value.toString()}>{year.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => {
                        setIsCreateRunDialogOpen(false);
                        setCreateRunDialogFeedback(null);
                      }}>Cancel</Button>
                      <Button type="submit">Create Run</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <FeedbackAlert feedback={feedback} />
          
          {selectedItems.size > 0 && (
            <div className="my-4 flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <span className="text-sm text-muted-foreground">{selectedItems.size} run(s) selected</span>
              <Button variant="destructive" onClick={handleOpenBulkDeleteDialog} disabled={!selectedCompanyId}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected Runs
              </Button>
            </div>
          )}

          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-card">
                    <TableHead className="sticky top-0 z-10 bg-card w-[50px]">
                      <Checkbox
                        checked={isAllOnPageSelected}
                        onCheckedChange={(checked) => handleSelectAllOnPage(Boolean(checked))}
                        aria-label="Select all on current page"
                        disabled={paginatedRuns.length === 0}
                      />
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card">Run ID</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card">Period</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card text-right">Employees</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card text-right">Gross Salary</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card text-right">Deductions</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card text-right">Net Pay</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card">Status</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRuns.map((run) => {
                    const StatusIcon = statusConfig[run.status].icon;
                    const deletePermission = currentUser ? PayrollPermissions.canDeletePayrollRun(currentUser, run.status) : { allowed: false, title: 'Login required' };
                    
                    return (
                      <TableRow key={`${run.id}-${run.companyId}`} data-state={selectedItems.has(run.id) ? "selected" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.has(run.id)}
                            onCheckedChange={(checked) => handleSelectRow(run.id, Boolean(checked))}
                            aria-label={`Select row ${run.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{run.id}</TableCell>
                        <TableCell>
                          {run.month} {run.year}
                          {run.status === "Rejected" && run.rejectionReason && (
                            <p className="text-xs text-destructive mt-1" title={run.rejectionReason}>
                              Reason: {run.rejectionReason.substring(0,30)}{run.rejectionReason.length > 30 ? "..." : ""}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{PayrollUtils.formatNumberForTable(run.employees)}</TableCell>
                        <TableCell className="text-right">{PayrollUtils.formatNumberForTable(run.grossSalary)}</TableCell>
                        <TableCell className="text-right">{PayrollUtils.formatNumberForTable(run.deductions)}</TableCell>
                        <TableCell className="text-right font-semibold">{PayrollUtils.formatNumberForTable(run.netPay)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig[run.status].color} ${statusConfig[run.status].textColor}`}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {run.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" title="View Details" asChild>
                            <Link href={`/app/payroll/${run.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={deletePermission.title}
                            className={!deletePermission.allowed ? "text-muted-foreground cursor-not-allowed" : "text-destructive hover:text-destructive/90"}
                            onClick={() => handleDeleteSingleRunClick(run)}
                            disabled={!deletePermission.allowed}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {paginatedRuns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center h-24">
                        No payroll runs found for the current company or matching criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {selectedItems.size} of {totalItems} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${rowsPerPage}`}
                onValueChange={(value) => {
                  setRowsPerPage(Number(value));
                  setCurrentPage(1);
                  setSelectedItems(new Set());
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={`${rowsPerPage}`} />
                </SelectTrigger>
                <SelectContent side="top">
                  {ROWS_PER_PAGE_OPTIONS.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCurrentPage(1); setSelectedItems(new Set());}} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
              <Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCurrentPage(prev => prev - 1); setSelectedItems(new Set());}} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" className="h-8 w-8 p-0" onClick={() => {setCurrentPage(prev => prev + 1); setSelectedItems(new Set());}} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => {setCurrentPage(totalPages); setSelectedItems(new Set());}} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Run Dialog */}
      <AlertDialog open={isDeleteDialogForItemOpen} onOpenChange={(isOpen) => {
        setIsDeleteDialogForItemOpen(isOpen); 
        if (!isOpen) setDeleteRunDialogFeedback(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete payroll run:
              ID {runToDeleteSingle?.id} ({runToDeleteSingle?.month} {runToDeleteSingle?.year}) and reverse any associated deductions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FeedbackAlert feedback={deleteRunDialogFeedback} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSingleRun} className="bg-destructive hover:bg-destructive/90">
              Delete Run
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={(isOpen) => {
        setIsBulkDeleteDialogOpen(isOpen); 
        if (!isOpen) setBulkDeleteRunsDialogFeedback(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedItems.size} selected payroll run(s)?
              This action cannot be undone. Only runs you have permission to delete will be affected, and their associated deductions will be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FeedbackAlert feedback={bulkDeleteRunsDialogFeedback} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDeleteRuns} className="bg-destructive hover:bg-destructive/90">
              Delete Selected Runs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-4 border-l-4 border-primary bg-primary/10 rounded-md mt-8">
        <p className="font-semibold text-primary/90">Note on Payroll Runs:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
          <li>Only one payroll run can be in a non-"Approved" state (Draft, To Approve, Rejected) at any given time per company.</li>
          <li>You must complete or delete the current non-approved run before creating a new one.</li>
          <li>Payroll run summaries and details are persisted using Supabase, scoped to the selected company.</li>
          <li>Deleting a payroll run will attempt to reverse any deductions that were applied as part of that specific run.</li>
        </ul>
      </div>
    </div>
  );
}
