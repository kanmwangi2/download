
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
import { PlusCircle, Eye, CheckCircle, XCircle, AlertTriangle, Hourglass, Search, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal, Loader2, Users, Info, CheckCircle2 } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    getAllFromStore, putToStore, deleteFromStore, getFromStore,
    STORE_NAMES
} from '@/lib/indexedDbUtils';
import type { UserRole } from '@/lib/userData';
import { Checkbox } from "@/components/ui/checkbox";
import { useCompany } from '@/context/CompanyContext';
import { cn } from '@/lib/utils';
import type { Deduction as FullDeductionRecord } from '@/app/app/(main)/deductions/page';
import type { PayrollRunDetail as FullPayrollRunDetail, AppliedDeductionDetail } from '@/app/app/(main)/payroll/[id]/page';


export type PayrollStatus = "Draft" | "To Approve" | "Rejected" | "Approved";

export interface PayrollRunSummary {
  id: string;
  companyId: string;
  month: string;
  year: number;
  employees: number;
  grossSalary: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  rejectionReason?: string;
}

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  assignedCompanyIds: string[];
}

const CURRENT_USER_LOCALSTORAGE_KEY = "cheetahPayrollCurrentUser";

const statusConfig: Record<PayrollStatus, { color: string; icon: React.ElementType; textColor?: string }> = {
  Draft: { color: "bg-gray-500 hover:bg-gray-600", icon: Hourglass, textColor: "text-white" },
  "To Approve": { color: "bg-blue-500 hover:bg-blue-600", icon: AlertTriangle, textColor: "text-white" },
  Rejected: { color: "bg-red-500 hover:bg-red-600", icon: XCircle, textColor: "text-white" },
  Approved: { color: "bg-green-500 hover:bg-green-600", icon: CheckCircle, textColor: "text-white" },
};


const formatNumberForTable = (amount?: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0";
  }
  return Math.round(amount).toLocaleString('en-US');
};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

const monthNameToNumberString = (monthName: string): string => {
    const date = new Date(Date.parse(monthName +" 1, 2000"));
    const monthNumber = date.getMonth() + 1;
    return monthNumber < 10 ? `0${monthNumber}` : `${monthNumber}`;
};

type FeedbackMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
};

export default function PayrollPage() {
  const router = useRouter();
  const { selectedCompanyId, isLoadingCompanyContext } = useCompany();
  const [allPayrollRunsData, setAllPayrollRunsData] = useState<PayrollRunSummary[]>([]);
  const [isCreateRunDialogOpen, setIsCreateRunDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDeleteDialogForItemOpen, setIsDeleteDialogForItemOpen] = useState(false);
  const [runToDeleteSingle, setRunToDeleteSingle] = useState<PayrollRunSummary | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserJson = localStorage.getItem(CURRENT_USER_LOCALSTORAGE_KEY);
      if (storedUserJson) {
        try {
          setCurrentUser(JSON.parse(storedUserJson) as CurrentUser);
        } catch (error) {
          console.error("Error parsing current user:", error);
          router.push("/");
        }
      } else {
        router.push("/");
      }
    }
  }, [router]);

  useEffect(() => {
    const loadSummaries = async () => {
      if (isLoadingCompanyContext || !selectedCompanyId || typeof window === 'undefined') {
         if (!isLoadingCompanyContext && !selectedCompanyId) {
            setAllPayrollRunsData([]);
            setIsLoaded(true);
        }
        return;
      }
      setIsLoaded(false);
      setFeedback(null);
      try {
        const summaries = await getAllFromStore<PayrollRunSummary>(STORE_NAMES.PAYROLL_SUMMARIES, selectedCompanyId);
        setAllPayrollRunsData(summaries);
      } catch (error) {
        console.error("Error loading payroll summaries from IndexedDB:", error);
        setAllPayrollRunsData([]);
        setFeedback({type: 'error', message: "Error loading payroll runs.", details: (error as Error).message });
      }
      setIsLoaded(true);
    };
    loadSummaries();
  }, [selectedCompanyId, isLoadingCompanyContext]);


  const filteredRunsSource = useMemo(() => allPayrollRunsData.filter(
    (run) =>
      run.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.year.toString().includes(searchTerm) ||
      run.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.id.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => b.year - a.year || Date.parse(`01 ${b.month} ${b.year}`) - Date.parse(`01 ${a.month} ${a.year}`)),
  [allPayrollRunsData, searchTerm]);

  const totalItems = filteredRunsSource.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRuns = filteredRunsSource.slice(startIndex, endIndex);

  const existingNonApprovedRunForCompany = useMemo(() => {
    if (!selectedCompanyId) return null;
    return allPayrollRunsData.find(run => run.companyId === selectedCompanyId && run.status !== "Approved");
  }, [allPayrollRunsData, selectedCompanyId]);

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
  const isAllOnPageSelected = paginatedRuns.length > 0 && paginatedRuns.every(item => selectedItems.has(item.id));

  const resetSelectionAndPage = () => {
    setSelectedItems(new Set());
    setCurrentPage(1);
  };


  const handleCreateRun = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    if (!selectedCompanyId) {
        setFeedback({ type: 'error', message: "Error", details: "No company selected." });
        return;
    }
    if (existingNonApprovedRunForCompany) {
      setFeedback({
        type: 'error',
        message: "Action Restricted",
        details: `A payroll run for ${existingNonApprovedRunForCompany.month} ${existingNonApprovedRunForCompany.year} (Status: ${existingNonApprovedRunForCompany.status}) is already in progress. Please complete or delete it before creating a new one.`,
      });
      return;
    }

    const currentForm = event.currentTarget;
    const formData = new FormData(currentForm);
    const month = formData.get('month') as string;
    const year = parseInt(formData.get('year') as string);
    const monthNumberStr = monthNameToNumberString(month);
    const newRunId = `PR${year}${monthNumberStr}`;

    try {
      const existingSummaries = await getAllFromStore<PayrollRunSummary>(STORE_NAMES.PAYROLL_SUMMARIES, selectedCompanyId);
      const isDuplicate = existingSummaries.some(summary => summary.id === newRunId);

      if (isDuplicate) {
        setFeedback({
          type: 'error',
          message: "Duplicate Payroll Period",
          details: `A payroll run for ${month} ${year} (ID: ${newRunId}) already exists for this company. Please edit the existing run or delete it if necessary.`,
        });
        return;
      }

      const newRun: PayrollRunSummary = {
          id: newRunId,
          companyId: selectedCompanyId,
          month,
          year,
          employees: 0,
          grossSalary: 0,
          deductions: 0,
          netPay: 0,
          status: "Draft",
      };

      await putToStore<PayrollRunSummary>(STORE_NAMES.PAYROLL_SUMMARIES, newRun, selectedCompanyId);
      setAllPayrollRunsData(prev => [newRun, ...prev]);
      setFeedback({ type: 'success', message: "Payroll Run Created", details: `Payroll run for ${month} ${year} (ID: ${newRunId}) created as Draft. You will be redirected to process it.` });
      setIsCreateRunDialogOpen(false);
      if (currentForm) {
        currentForm.reset();
      }
      resetSelectionAndPage();
      router.push(`/app/payroll/${newRun.id}`);
    } catch (error) {
      console.error("Error saving new payroll run summary to IndexedDB:", error);
      setFeedback({ type: 'error', message: "Creation Failed", details: "Could not create payroll run." });
    }
  };

  const canDeleteRun = (runStatus: PayrollStatus): { allowed: boolean; title: string } => {
    if (!currentUser) return { allowed: false, title: "Login required" };
    const { role } = currentUser;

    if (role === "Primary Admin" || role === "App Admin") {
      return { allowed: true, title: "Delete Run (Admin)" };
    }
    if (role === "Company Admin" || role === "Payroll Preparer") {
      if (runStatus === "Draft" || runStatus === "Rejected") {
        return { allowed: true, title: "Delete Draft/Rejected Run" };
      }
      return { allowed: false, title: "Cannot delete runs not in Draft or Rejected state" };
    }
    if (role === "Payroll Approver") {
        return { allowed: false, title: "Payroll Approvers cannot delete runs" };
    }
    return { allowed: false, title: "Permission Denied" };
  };

  const deletePayrollRunsByIds = async (runIds: string[]) => {
    setFeedback(null);
    if (runIds.length === 0 || !selectedCompanyId) return;

    let actualIdsToDeleteFromDB: string[] = [];
    let skippedRunsCount = 0;

    for (const runId of runIds) {
        const run = allPayrollRunsData.find(r => r.id === runId && r.companyId === selectedCompanyId);
        if (!run) continue;
        const permission = canDeleteRun(run.status);
        if (permission.allowed) {
            actualIdsToDeleteFromDB.push(runId);
        } else {
            skippedRunsCount++;
        }
    }

    if (actualIdsToDeleteFromDB.length === 0 && skippedRunsCount > 0) {
        setFeedback({ type: 'info', message: "Deletion Denied", details: `Could not delete ${skippedRunsCount} run(s) due to permissions or status.` });
        return;
    }
    if (actualIdsToDeleteFromDB.length === 0) return;

    let deductionsReversedCount = 0;
    try {
        for (const id of actualIdsToDeleteFromDB) {
            const runDetail = await getFromStore<FullPayrollRunDetail>(STORE_NAMES.PAYROLL_RUN_DETAILS, id, selectedCompanyId);
            if (runDetail && runDetail.employees) {
                for (const employee of runDetail.employees) {
                    if (employee.appliedDeductions) {
                        for (const appliedDed of employee.appliedDeductions) {
                            const originalDeduction = await getFromStore<FullDeductionRecord>(STORE_NAMES.DEDUCTIONS, appliedDed.deductionId, selectedCompanyId);
                            if (originalDeduction) {
                                originalDeduction.deductedSoFar = Math.max(0, (originalDeduction.deductedSoFar || 0) - (appliedDed.amountApplied || 0));
                                originalDeduction.balance = (originalDeduction.originalAmount || 0) - originalDeduction.deductedSoFar;
                                await putToStore<FullDeductionRecord>(STORE_NAMES.DEDUCTIONS, originalDeduction, selectedCompanyId);
                                deductionsReversedCount++;
                            }
                        }
                    }
                }
            }
            await deleteFromStore(STORE_NAMES.PAYROLL_SUMMARIES, id, selectedCompanyId);
            await deleteFromStore(STORE_NAMES.PAYROLL_RUN_DETAILS, id, selectedCompanyId).catch(err => console.warn("No detailed run to delete or error:", err));
        }
        setAllPayrollRunsData(prev => prev.filter(run => !(actualIdsToDeleteFromDB.includes(run.id) && run.companyId === selectedCompanyId)));
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            actualIdsToDeleteFromDB.forEach(id => newSelected.delete(id));
            return newSelected;
        });

        let successMessage = `Successfully deleted ${actualIdsToDeleteFromDB.length} payroll run(s).`;
        if (deductionsReversedCount > 0) {
            successMessage += ` ${deductionsReversedCount} applied deduction entries were reversed.`;
        }
        if (skippedRunsCount > 0) {
            setFeedback({type: 'info', message: "Deletion Partially Completed", details: `${successMessage} ${skippedRunsCount} run(s) were skipped due to permissions or status.`});
        } else {
            setFeedback({type: 'success', message: "Payroll Run(s) Deleted", details: successMessage});
        }

        if (currentPage > 1 && paginatedRuns.length === actualIdsToDeleteFromDB.filter(id => paginatedRuns.some(pr => pr.id === id)).length && filteredRunsSource.slice((currentPage - 2) * rowsPerPage, (currentPage - 1) * rowsPerPage).length > 0) {
          setCurrentPage(currentPage - 1);
        } else if (currentPage > 1 && paginatedRuns.length === actualIdsToDeleteFromDB.filter(id => paginatedRuns.some(pr => pr.id === id)).length && filteredRunsSource.slice((currentPage-1)*rowsPerPage).length === 0){
           setCurrentPage( Math.max(1, currentPage -1));
        }

    } catch (error) {
        console.error("Error deleting payroll run(s) from IndexedDB:", error);
        setFeedback({ type: 'error', message: "Delete Failed", details: `Could not delete payroll run(s). ${(error as Error).message}` });
    }
  };

  const handleDeleteSingleRunClick = (run: PayrollRunSummary) => {
    setFeedback(null);
    const permission = canDeleteRun(run.status);
    if (!permission.allowed) {
        setFeedback({ type: 'error', message: "Deletion Denied", details: permission.title });
        return;
    }
    setRunToDeleteSingle(run);
    setIsDeleteDialogForItemOpen(true);
  };

  const confirmDeleteSingleRun = async () => {
    if (runToDeleteSingle) {
        await deletePayrollRunsByIds([runToDeleteSingle.id]);
    }
    setIsDeleteDialogForItemOpen(false);
    setRunToDeleteSingle(null);
  };

  const handleOpenBulkDeleteDialog = () => {
    setFeedback(null);
    if (selectedItems.size === 0) {
        setFeedback({ type: 'info', message: "No Selection", details: "Please select payroll runs to delete." });
        return;
    }
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDeleteRuns = async () => {
    await deletePayrollRunsByIds(Array.from(selectedItems));
    setIsBulkDeleteDialogOpen(false);
  };

  const renderFeedbackMessage = () => {
    if (!feedback) return null;
    let IconComponent;
    let alertVariant: "default" | "destructive" = "default";
    let additionalAlertClasses = "";

    switch (feedback.type) {
      case 'success':
        IconComponent = CheckCircle2;
        alertVariant = "default";
        additionalAlertClasses = "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600 [&>svg]:text-green-600 dark:[&>svg]:text-green-400";
        break;
      case 'error':
        IconComponent = AlertTriangle;
        alertVariant = "destructive";
        break;
      case 'info':
        IconComponent = Info;
        alertVariant = "default";
        break;
      default:
        return null;
    }
    return (
      <Alert variant={alertVariant} className={cn("mb-4", additionalAlertClasses)}>
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
        <SlidersHorizontal className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold">No Company Selected</p>
        <p className="text-muted-foreground">Please select a company to manage payroll runs.</p>
        <Button asChild className="mt-4">
          <Link href="/select-company">Go to Company Selection</Link>
        </Button>
      </div>
    );
  }

  if (!isLoaded || !currentUser) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading payroll runs or authenticating...</div>;
  }
  const canCurrentUserCreateRun = currentUser.role === 'Primary Admin' || currentUser.role === 'App Admin' || currentUser.role === 'Company Admin' || currentUser.role === 'Payroll Preparer';
  const runNewPayrollButtonDisabled = !canCurrentUserCreateRun || !selectedCompanyId || !!existingNonApprovedRunForCompany;
  const runNewPayrollTooltipContent = !selectedCompanyId ? "No company selected."
                                    : !canCurrentUserCreateRun ? "You do not have permission to create payroll runs."
                                    : existingNonApprovedRunForCompany ? `A run for ${existingNonApprovedRunForCompany.month} ${existingNonApprovedRunForCompany.year} (Status: ${existingNonApprovedRunForCompany.status}) is in progress.`
                                    : "Run a new payroll for the selected company.";

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">Payroll Processing</h1>
          </div>
          <p className="text-muted-foreground">
            Create, manage, and approve payroll runs for the current company. Data persists in your browser via IndexedDB.
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
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); setSelectedItems(new Set()); setFeedback(null); }}
                  disabled={!selectedCompanyId}
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                <Dialog open={isCreateRunDialogOpen} onOpenChange={(isOpen) => { setIsCreateRunDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}>
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
                    <form onSubmit={handleCreateRun}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="month" className="text-right">Month</Label>
                        <Select name="month" required defaultValue={new Date().toLocaleString('default', { month: 'long' })}>
                            <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
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
                            {[new Date().getFullYear() + 1, new Date().getFullYear(), new Date().getFullYear() -1].map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateRunDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Create Run</Button>
                    </DialogFooter>
                    </form>
                </DialogContent>
                </Dialog>
            </div>
          </div>
            {renderFeedbackMessage()}
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
                    const deletePermission = canDeleteRun(run.status);
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
                        <TableCell className="text-right">{formatNumberForTable(run.employees)}</TableCell>
                        <TableCell className="text-right">{formatNumberForTable(run.grossSalary)}</TableCell>
                        <TableCell className="text-right">{formatNumberForTable(run.deductions)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatNumberForTable(run.netPay)}</TableCell>
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

       <AlertDialog open={isDeleteDialogForItemOpen} onOpenChange={(isOpen) => {setIsDeleteDialogForItemOpen(isOpen); if (!isOpen) setFeedback(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete payroll run:
              ID {runToDeleteSingle?.id} ({runToDeleteSingle?.month} {runToDeleteSingle?.year}) and reverse any associated deductions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSingleRun} className="bg-destructive hover:bg-destructive/90">
              Delete Run
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={(isOpen) => {setIsBulkDeleteDialogOpen(isOpen); if (!isOpen) setFeedback(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedItems.size} selected payroll run(s)?
              This action cannot be undone. Only runs you have permission to delete will be affected, and their associated deductions will be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
          <li>Payroll run summaries and details are persisted using your browser's IndexedDB, scoped to the selected company.</li>
          <li>Deleting a payroll run will attempt to reverse any deductions that were applied as part of that specific run.</li>
        </ul>
      </div>
    </div>
  );
}

