
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Banknote, CalendarClock, LayoutGrid, Loader2, ReceiptText } from "lucide-react";
import Link from "next/link";
import { useCompany } from '@/context/CompanyContext';
import { getAllFromStore, getFromStore, STORE_NAMES } from '@/lib/indexedDbUtils';
import type { StaffMember } from '@/lib/staffData';
import type { PayrollRunSummary } from '@/app/app/(main)/payroll/page';
import type { PayrollRunDetail } from '@/app/app/(main)/payroll/[id]/page';
import { addMonths, getYear, getMonth } from 'date-fns'; 

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

  const [totalActiveEmployees, setTotalActiveEmployees] = useState(0);
  const [nextPayrollRunDisplay, setNextPayrollRunDisplay] = useState("N/A");
  const [nextPayrollSubtext, setNextPayrollSubtext] = useState("No upcoming runs");
  
  const [totalPayrollCostDisplay, setTotalPayrollCostDisplay] = useState("N/A");
  const [payrollCostSubtext, setPayrollCostSubtext] = useState("No approved run or details unavailable");
  
  const [totalDeductionsMainDisplay, setTotalDeductionsMainDisplay] = useState("N/A");
  const [deductionsCardSubtext, setDeductionsCardSubtext] = useState("No approved run or details unavailable");


  useEffect(() => {
    const fetchDataForDashboard = async () => {
      if (!selectedCompanyId || isLoadingCompanyContext) {
        if (!isLoadingCompanyContext && !selectedCompanyId) setIsLoadingData(false);
        return;
      }
      setIsLoadingData(true);

      try {
        const staffData = await getAllFromStore<StaffMember>(STORE_NAMES.STAFF, selectedCompanyId);
        const activeEmployees = staffData.filter(s => s.status === "Active").length;
        setTotalActiveEmployees(activeEmployees);

        const payrollRuns = await getAllFromStore<PayrollRunSummary>(STORE_NAMES.PAYROLL_SUMMARIES, selectedCompanyId);

        const nonApprovedRuns = payrollRuns
          .filter(run => run.status !== "Approved")
          .sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return monthOrder[a.month] - monthOrder[b.month];
          });

        if (nonApprovedRuns.length > 0) {
          const currentNonApprovedRun = nonApprovedRuns[0];
          setNextPayrollRunDisplay(`${currentNonApprovedRun.month} ${currentNonApprovedRun.year}`);
          setNextPayrollSubtext(`Status: ${currentNonApprovedRun.status}`);
        } else {
          const approvedRunsSortedForNext = payrollRuns
            .filter(run => run.status === "Approved")
            .sort((a, b) => {
              if (b.year !== a.year) return b.year - a.year;
              return monthOrder[b.month] - monthOrder[a.month];
            });

          let nextPeriodDate: Date;
          if (approvedRunsSortedForNext.length > 0) {
            const latestApprovedRun = approvedRunsSortedForNext[0];
            const latestRunDate = new Date(latestApprovedRun.year, monthOrder[latestApprovedRun.month]);
            nextPeriodDate = addMonths(latestRunDate, 1);
          } else {
            nextPeriodDate = addMonths(new Date(),1);
          }
          setNextPayrollRunDisplay(`${monthNames[getMonth(nextPeriodDate)]} ${getYear(nextPeriodDate)}`);
          setNextPayrollSubtext("Status: Awaiting Creation");
        }


        const approvedPayrollRuns = payrollRuns
          .filter(run => run.status === "Approved")
          .sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return monthOrder[b.month] - monthOrder[a.month];
          });
        const lastApprovedRun = approvedPayrollRuns.length > 0 ? approvedPayrollRuns[0] : null;
        
        let newTotalPayrollCostDisplay = "N/A";
        let newPayrollCostSubtext = "No approved run or details unavailable";
        let newTotalDeductionsMainDisplay = "N/A";
        let newDeductionsCardSubtext = "No approved run or details unavailable";

        if (lastApprovedRun) {
            try {
                const runDetail = await getFromStore<PayrollRunDetail>(
                    STORE_NAMES.PAYROLL_RUN_DETAILS,
                    lastApprovedRun.id,
                    selectedCompanyId
                );
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
  }, [selectedCompanyId, isLoadingCompanyContext]);


  if (isLoadingCompanyContext || isLoadingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading dashboard data...</p>
      </div>
    );
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
        </div>
        <p className="text-muted-foreground">
          Here's an overview of your payroll status for the current company. All monetary values are in Rwandan Francs (RWF).
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
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayrollCostDisplay}</div>
            {(totalPayrollCostDisplay !== "N/A" && totalPayrollCostDisplay !== "Error") && (
              <p className="text-xs text-muted-foreground">{payrollCostSubtext}</p>
            )}
             {(totalPayrollCostDisplay === "N/A" && payrollCostSubtext) &&
              <p className="text-xs text-muted-foreground">{payrollCostSubtext}</p>
            }
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions (Last Run, RWF)</CardTitle>
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeductionsMainDisplay}</div>
            {(totalDeductionsMainDisplay !== "N/A" && totalDeductionsMainDisplay !== "Error") && (
             <p className="text-xs text-muted-foreground">{deductionsCardSubtext}</p>
            )}
            {(totalDeductionsMainDisplay === "N/A" && deductionsCardSubtext) &&
              <p className="text-xs text-muted-foreground">{deductionsCardSubtext}</p>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
