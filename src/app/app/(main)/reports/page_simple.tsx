"use client";

import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import { LayoutGrid } from "lucide-react";

export default function ReportsPage() {
  const { selectedCompanyId } = useCompany();

  if (!selectedCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <LayoutGrid className="h-16 w-16 text-muted-foreground mb-6" />
        <h1 className="text-2xl font-semibold mb-2">No Company Selected</h1>
        <p className="text-muted-foreground mb-6">
          Please select a company to view reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LayoutGrid className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Reports</h1>
        </div>
        <p className="text-muted-foreground">
          Generate and view payroll reports, payslips, and statutory reports.
        </p>
      </div>

      <div className="space-y-4">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Reports Feature Coming Soon</h2>
          <p className="text-muted-foreground">
            This feature is under development and will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
