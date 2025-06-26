"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, FileSpreadsheet, Download, Calendar as CalendarIcon, BarChart3, PieChart, TrendingUp, Users, DollarSign, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCompany } from '@/context/CompanyContext';
import Link from 'next/link';
import { FeedbackAlert, type FeedbackMessage } from '@/components/ui/feedback-alert';

type ReportType = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  available: boolean;
};

const REPORT_TYPES: ReportType[] = [
  {
    id: 'payroll-summary',
    name: 'Payroll Summary',
    description: 'Comprehensive overview of payroll data for selected period',
    category: 'Payroll',
    icon: <DollarSign className="h-5 w-5" />,
    available: false
  },
  {
    id: 'staff-report',
    name: 'Staff Report',
    description: 'Detailed staff information and employment statistics',
    category: 'Human Resources',
    icon: <Users className="h-5 w-5" />,
    available: false
  },
  {
    id: 'deductions-report',
    name: 'Deductions Report',
    description: 'Summary of all deductions applied during the period',
    category: 'Payroll',
    icon: <TrendingUp className="h-5 w-5" />,
    available: false
  },
  {
    id: 'tax-report',
    name: 'Tax Report',
    description: 'Tax calculations and compliance information',
    category: 'Finance',
    icon: <BarChart3 className="h-5 w-5" />,
    available: false
  },
  {
    id: 'payment-types',
    name: 'Payment Types Analysis',
    description: 'Analysis of payment types and distributions',
    category: 'Analytics',
    icon: <PieChart className="h-5 w-5" />,
    available: false
  }
];

export default function ReportsPage() {
  const { selectedCompanyId, selectedCompanyName, isLoadingCompanyContext } = useCompany();
  
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [reportFormat, setReportFormat] = useState<string>("pdf");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      setFeedback({
        type: "error",
        message: "Please select a report type"
      });
      return;
    }

    if (!fromDate || !toDate) {
      setFeedback({
        type: "error",
        message: "Please select both start and end dates"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      setFeedback({
        type: "info",
        message: `Report generation is not yet implemented. Selected: ${selectedReportType} from ${format(fromDate, 'PPP')} to ${format(toDate, 'PPP')} in ${reportFormat.toUpperCase()} format.`
      });
    }, 2000);
  };

  // Loading states
  if (isLoadingCompanyContext) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading company context...</span>
        </div>
      </div>
    );
  }

  if (!selectedCompanyId && !isLoadingCompanyContext) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Company Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select a company to generate reports.
          </p>
          <Button asChild>
            <Link href="/select-company">Select Company</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Reports</h1>
      <p className="text-muted-foreground mb-6">
        Generate comprehensive reports for {selectedCompanyName || 'your company'}.
      </p>

      <FeedbackAlert feedback={feedback} />

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">
            <FileText className="mr-2 h-4 w-4" /> Generate Reports
          </TabsTrigger>
          <TabsTrigger value="history">
            <BarChart3 className="mr-2 h-4 w-4" /> Report History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Report Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>
                  Configure and generate reports for your company data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((report) => (
                        <SelectItem key={report.id} value={report.id} disabled={!report.available}>
                          <div className="flex items-center space-x-2">
                            {report.icon}
                            <span>{report.name}</span>
                            {!report.available && (
                              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !fromDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fromDate ? format(fromDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={fromDate}
                          onSelect={setFromDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !toDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {toDate ? format(toDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={toDate}
                          onSelect={setToDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Format</label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <FileText className="mr-2 h-4 w-4 inline" /> PDF
                      </SelectItem>
                      <SelectItem value="excel">
                        <FileSpreadsheet className="mr-2 h-4 w-4 inline" /> Excel
                      </SelectItem>
                      <SelectItem value="csv">
                        <FileSpreadsheet className="mr-2 h-4 w-4 inline" /> CSV
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerateReport} 
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Available Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Available Reports</CardTitle>
                <CardDescription>
                  Choose from various report types to analyze your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {REPORT_TYPES.map((report) => (
                    <div 
                      key={report.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedReportType === report.id && "border-primary bg-primary/5",
                        !report.available && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => report.available && setSelectedReportType(report.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {report.icon}
                        <div>
                          <div className="font-medium text-sm">{report.name}</div>
                          <div className="text-xs text-muted-foreground">{report.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{report.category}</Badge>
                        {!report.available && (
                          <Badge variant="secondary">Coming Soon</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                View and download previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Report history functionality will be implemented once report generation is active.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
