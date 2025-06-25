"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Banknote, CalendarClock, LayoutGrid, ReceiptText } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading";
import Link from "next/link";
import { useCompany } from '@/context/CompanyContext';
import { addMonths, getYear, getMonth } from 'date-fns';
import { ServiceRegistry } from '@/lib/services/ServiceRegistry';
import { StaffMember } from '@/lib/types/staff';
import { PayrollRunSummary as PayrollRun } from '@/lib/types/payroll';

// --- Helper Functions ---
const monthOrder: { [key: string]: number } = {
  "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
  "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
};
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const formatNumberDisplay = (amount?: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0";
  }
  return Math.round(amount).toLocaleString('en-US');
};

const formatCurrencyForCard = (amount?: number): string => {
  return `RWF ${formatNumberDisplay(amount)}`;
};

export default function DashboardPage() {
  const { selectedCompanyId, isLoadingCompanyContext } = useCompany();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [services, setServices] = useState<ServiceRegistry | null>(null);

  const [totalActiveEmployees, setTotalActiveEmployees] = useState(0);
  const [nextPayrollRunDisplay, setNextPayrollRunDisplay] = useState("N/A");
  const [nextPayrollSubtext, setNextPayrollSubtext] = useState("No upcoming runs");
  
  const [totalPayrollCostDisplay, setTotalPayrollCostDisplay] = useState("N/A");
  const [payrollCostSubtext, setPayrollCostSubtext] = useState("No approved run or details unavailable");
  
  const [totalDeductionsMainDisplay, setTotalDeductionsMainDisplay] = useState("N/A");
  const [deductionsCardSubtext, setDeductionsCardSubtext] = useState("No approved run or details unavailable");

  useEffect(() => {
    setServices(ServiceRegistry.getInstance());
  }, []);

  useEffect(() => {    const fetchDataForDashboard = async () => {
      if (!selectedCompanyId || isLoadingCompanyContext || !services) {
        if (!isLoadingCompanyContext && !selectedCompanyId) setIsLoadingData(false);
        return;
      }
      setIsLoadingData(true);

      try {
        // Fetch staff data using OOP service
        const staffData = await services.staffService.getStaffByCompany(selectedCompanyId);
        const activeEmployees = staffData.filter((s: StaffMember) => s.status === "Active").length;
        setTotalActiveEmployees(activeEmployees);

        // Fetch payroll runs using PayrollService
        const payrollRuns = await services.payrollService.getPayrollRunSummaries(selectedCompanyId);
          
        const runs: PayrollRun[] = payrollRuns;
        const nonApprovedRuns = runs
          .filter((run: PayrollRun) => run.status !== "Approved")
          .sort((a: PayrollRun, b: PayrollRun) => {
            if (a.year !== b.year) return a.year - b.year;
            return (monthOrder[a.month] ?? 0) - (monthOrder[b.month] ?? 0);
          });

        if (nonApprovedRuns.length > 0) {
          const currentNonApprovedRun = nonApprovedRuns[0];
          if (currentNonApprovedRun) {
            setNextPayrollRunDisplay(`${currentNonApprovedRun.month} ${currentNonApprovedRun.year}`);
            setNextPayrollSubtext(`Status: ${currentNonApprovedRun.status}`);
          }
        } else {          const approvedRunsSortedForNext = runs
            .filter((run: PayrollRun) => run.status === "Approved")
            .sort((a: PayrollRun, b: PayrollRun) => {
              if (b.year !== a.year) return b.year - a.year;
              return (monthOrder[b.month] ?? 0) - (monthOrder[a.month] ?? 0);
            });

          let nextPeriodDate: Date;
          if (approvedRunsSortedForNext.length > 0) {
            const latestApprovedRun = approvedRunsSortedForNext[0];
            if (latestApprovedRun) {
              const latestRunDate = new Date(latestApprovedRun.year, monthOrder[latestApprovedRun.month] ?? 0);
              nextPeriodDate = addMonths(latestRunDate, 1);
            } else {
              nextPeriodDate = addMonths(new Date(), 1);
            }
          } else {
            nextPeriodDate = addMonths(new Date(),1);
          }
          setNextPayrollRunDisplay(`${monthNames[getMonth(nextPeriodDate)]} ${getYear(nextPeriodDate)}`);
          setNextPayrollSubtext("Status: Awaiting Creation");
        }        
        
        const approvedPayrollRuns = runs
          .filter((run: PayrollRun) => run.status === "Approved")
          .sort((a: PayrollRun, b: PayrollRun) => {
            if (b.year !== a.year) return b.year - a.year;
            return (monthOrder[b.month] ?? 0) - (monthOrder[a.month] ?? 0);
          });
        const lastApprovedRun = approvedPayrollRuns.length > 0 ? approvedPayrollRuns[0] : null;
        
        let newTotalPayrollCostDisplay = "N/A";
        let newPayrollCostSubtext = "No approved run or details unavailable";
        let newTotalDeductionsMainDisplay = "N/A";
        let newDeductionsCardSubtext = "No approved run or details unavailable";

        if (lastApprovedRun) {
            try {
                // Fetch payroll run details from PayrollService
                const runDetail = await services.payrollService.getPayrollRunDetail(lastApprovedRun.id, selectedCompanyId);
                  
                if (runDetail) {
                    // Payroll Cost Card
                    const totalCost = (runDetail.totalGrossSalary || 0) + (runDetail.totalEmployerRssb || 0);
                    newTotalPayrollCostDisplay = formatCurrencyForCard(totalCost);
                    newPayrollCostSubtext = `Gross: ${formatNumberDisplay(runDetail.totalGrossSalary)}, Empr RSSB: ${formatNumberDisplay(runDetail.totalEmployerRssb)} (for ${lastApprovedRun.month} ${lastApprovedRun.year})`;

                    // Deductions Card
                    const statutoryDed = (runDetail.totalEmployeeRssb || 0) + (runDetail.totalPaye || 0) + (runDetail.totalCbhiDeduction || 0);
                    const otherDed = runDetail.totalTotalDeductionsAppliedThisRun || 0;
                    const totalDedVal = statutoryDed + otherDed;
                    newTotalDeductionsMainDisplay = formatCurrencyForCard(totalDedVal);
                    newDeductionsCardSubtext = `Statutory: ${formatNumberDisplay(statutoryDed)}, Other: ${formatNumberDisplay(otherDed)} (for ${lastApprovedRun.month} ${lastApprovedRun.year})`;
                } else {
                    // If runDetail is null but lastApprovedRun exists, it means details are missing
                    newTotalPayrollCostDisplay = "N/A";
                    newPayrollCostSubtext = "Details unavailable for breakdown.";

                    newTotalDeductionsMainDisplay = "N/A";
                    newDeductionsCardSubtext = "Details unavailable for breakdown.";
                }
            } catch (detailError) {
                console.error("Error fetching payroll run detail for dashboard cards:", detailError);
                 newTotalPayrollCostDisplay = "N/A";
                 newPayrollCostSubtext = `Details unavailable for ${lastApprovedRun.month} ${lastApprovedRun.year}`;
                 newTotalDeductionsMainDisplay = "N/A";
                 newDeductionsCardSubtext = `Details unavailable for ${lastApprovedRun.month} ${lastApprovedRun.year}`;
            }
        }
        setTotalPayrollCostDisplay(newTotalPayrollCostDisplay);
        setPayrollCostSubtext(newPayrollCostSubtext);
        setTotalDeductionsMainDisplay(newTotalDeductionsMainDisplay);
        setDeductionsCardSubtext(newDeductionsCardSubtext);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setTotalActiveEmployees(0);
        setNextPayrollRunDisplay("Error");
        setNextPayrollSubtext("Error loading");
        setTotalPayrollCostDisplay("Error");
        setPayrollCostSubtext("Error loading");
        setTotalDeductionsMainDisplay("Error");
        setDeductionsCardSubtext("Error loading");
      }
      setIsLoadingData(false);
    };

    fetchDataForDashboard();
  }, [selectedCompanyId, isLoadingCompanyContext, services]);

  if (isLoadingCompanyContext || isLoadingData) {
    return <LoadingSpinner text="Loading dashboard data..." className="h-screen" />;
  }

  if (!selectedCompanyId && !isLoadingCompanyContext) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <LayoutGrid className="h-16 w-16 text-muted-foreground mb-6" />
        <h1 className="text-2xl font-semibold mb-2">No Company Selected</h1>
        <p className="text-muted-foreground mb-6">
          Please select a company to view its dashboard.
        </p>
        <Button asChild>
          <Link href="/select-company">Go to Company Selection</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LayoutGrid className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome back!</h1>
        </div>        <p className="text-muted-foreground">
          Here&apos;s an overview of your payroll status for the current company. All monetary values are in Rwandan Francs (RWF).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Employees</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payroll Run</CardTitle>
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nextPayrollRunDisplay}</div>
            <p className="text-xs text-muted-foreground">{nextPayrollSubtext}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll Cost (Last Run, RWF)</CardTitle>
            <Banknote className="h-5 w-5 text-muted-foreground" />
          </CardHeader>          <CardContent>
            <div className="text-2xl font-bold">{totalPayrollCostDisplay}</div>
            {(totalPayrollCostDisplay !== "N/A" && totalPayrollCostDisplay !== "Error") ? (
              <p className="text-xs text-muted-foreground">{payrollCostSubtext}</p>
            ) : null}
             {(totalPayrollCostDisplay === "N/A" && Boolean(payrollCostSubtext)) ? (
              <p className="text-xs text-muted-foreground">{payrollCostSubtext}</p>
            ) : null}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions (Last Run, RWF)</CardTitle>
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>            <div className="text-2xl font-bold">{totalDeductionsMainDisplay}</div>
            {(totalDeductionsMainDisplay !== "N/A" && totalDeductionsMainDisplay !== "Error") ? (
             <p className="text-xs text-muted-foreground">{deductionsCardSubtext}</p>
            ) : null}
            {(totalDeductionsMainDisplay === "N/A" && Boolean(deductionsCardSubtext)) ? (
              <p className="text-xs text-muted-foreground">{deductionsCardSubtext}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
