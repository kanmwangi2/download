"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, FileText, FileSpreadsheet, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, BadgeMinus, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useCompany } from '@/context/CompanyContext';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select';
import { FeedbackAlert, type FeedbackMessage } from '@/components/ui/feedback-alert';

// Import services
import { ServiceRegistry } from '@/lib/services/ServiceRegistry';

// Import proper types
import { DeductionType } from '@/lib/types/deductionTypes';
import { StaffDeduction } from '@/lib/types/deductions';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

export default function DeductionsPage() {
  const { selectedCompanyId, isLoadingCompanyContext } = useCompany();
  
  // Component State
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("deduction-types");

  // Initialize services
  const [services, setServices] = useState<ServiceRegistry | null>(null);

  // Deduction Types data state
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [deductionTypeSearchTerm, setDeductionTypeSearchTerm] = useState("");
  const [deductionTypeCurrentPage, setDeductionTypeCurrentPage] = useState(1);
  const [deductionTypeRowsPerPage, setDeductionTypeRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);

  // Staff Deductions data state
  const [staffDeductions, setStaffDeductions] = useState<StaffDeduction[]>([]);
  const [staffDeductionSearchTerm, setStaffDeductionSearchTerm] = useState("");
  const [staffDeductionCurrentPage, setStaffDeductionCurrentPage] = useState(1);
  const [staffDeductionRowsPerPage, setStaffDeductionRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);

  useEffect(() => {
    setServices(ServiceRegistry.getInstance());
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCompanyId || isLoadingCompanyContext || !services) {
        if (!isLoadingCompanyContext && !selectedCompanyId) setIsLoaded(true);
        return;
      }

      try {
        // For now, use mock data since services might not be fully implemented
        setDeductionTypes([]);
        setStaffDeductions([]);
        setIsLoaded(true);
      } catch (error: unknown) { // Changed from any to unknown
        console.error("Error fetching deduction data:", error);
        setFeedback({
          type: "error",
          message: "Failed to load deduction data. Please try again."
        });
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [selectedCompanyId, isLoadingCompanyContext, services]);

  // Computed values for deduction types
  const filteredDeductionTypes = useMemo(() => {
    return deductionTypes.filter(deductionType =>
      deductionType.name.toLowerCase().includes(deductionTypeSearchTerm.toLowerCase())
    );
  }, [deductionTypes, deductionTypeSearchTerm]);

  const deductionTypeTotalPages = Math.ceil(filteredDeductionTypes.length / (deductionTypeRowsPerPage || 10));
  const paginatedDeductionTypes = useMemo(() => {
    const rowsPerPage = deductionTypeRowsPerPage || 10;
    const startIndex = (deductionTypeCurrentPage - 1) * rowsPerPage;
    return filteredDeductionTypes.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredDeductionTypes, deductionTypeCurrentPage, deductionTypeRowsPerPage]);

  // Computed values for staff deductions
  const filteredStaffDeductions = useMemo(() => {
    return staffDeductions.filter(deduction =>
      deduction.deductionType.toLowerCase().includes(staffDeductionSearchTerm.toLowerCase())
    );
  }, [staffDeductions, staffDeductionSearchTerm]);

  const staffDeductionTotalPages = Math.ceil(filteredStaffDeductions.length / (staffDeductionRowsPerPage || 10));
  const paginatedStaffDeductions = useMemo(() => {
    const rowsPerPage = staffDeductionRowsPerPage || 10;
    const startIndex = (staffDeductionCurrentPage - 1) * rowsPerPage;
    return filteredStaffDeductions.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredStaffDeductions, staffDeductionCurrentPage, staffDeductionRowsPerPage]);

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
          <BadgeMinus className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Company Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select a company to manage deductions.
          </p>
          <Button asChild>
            <Link href="/select-company">Select Company</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading deduction data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Deduction Management</h1>
      <p className="text-muted-foreground mb-6">
        Manage deduction types and staff deductions for your company.
      </p>
      
      <FeedbackAlert feedback={feedback} />

      <Tabs defaultValue="deduction-types" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deduction-types">
            <Settings className="mr-2 h-4 w-4" /> Deduction Types
          </TabsTrigger>
          <TabsTrigger value="staff-deductions">
            <BadgeMinus className="mr-2 h-4 w-4" /> Staff Deductions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="deduction-types">
          <Card>
            <CardHeader>
              <CardTitle>Manage Deduction Types</CardTitle>
              <CardDescription>
                Define and configure deduction types for your organization. 
                Currently managing {deductionTypes.length} deduction types.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => console.warn('Add Deduction Type')} className="flex-1">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Deduction Type
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      Export Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => console.warn('Export CSV')}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.warn('Export Excel')}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.warn('Export PDF')}>
                      <FileText className="mr-2 h-4 w-4" /> Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Search and filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search deduction types..."
                    value={deductionTypeSearchTerm}
                    onChange={(e) => setDeductionTypeSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Deduction Types Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Fixed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDeductionTypes.map((deductionType) => (
                      <TableRow key={deductionType.id}>
                        <TableCell className="font-medium">{deductionType.name}</TableCell>
                        <TableCell>{deductionType.description || '-'}</TableCell>
                        <TableCell>{deductionType.isFixedName ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => console.warn('Edit', deductionType.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => console.warn('Delete', deductionType.id)}
                                disabled={!deductionType.isDeletable}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {(deductionTypeCurrentPage - 1) * (deductionTypeRowsPerPage || 10) + 1} to{' '}
                    {Math.min(deductionTypeCurrentPage * (deductionTypeRowsPerPage || 10), filteredDeductionTypes.length)} of{' '}
                    {filteredDeductionTypes.length} entries
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select
                    value={(deductionTypeRowsPerPage || 10).toString()}
                    onValueChange={(value) => {
                      setDeductionTypeRowsPerPage(Number(value));
                      setDeductionTypeCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROWS_PER_PAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option.toString()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeductionTypeCurrentPage(1)}
                      disabled={deductionTypeCurrentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeductionTypeCurrentPage(deductionTypeCurrentPage - 1)}
                      disabled={deductionTypeCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Page {deductionTypeCurrentPage} of {deductionTypeTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeductionTypeCurrentPage(deductionTypeCurrentPage + 1)}
                      disabled={deductionTypeCurrentPage === deductionTypeTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeductionTypeCurrentPage(deductionTypeTotalPages)}
                      disabled={deductionTypeCurrentPage === deductionTypeTotalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {deductionTypes.length === 0 && (
                <div className="text-center py-8">
                  <BadgeMinus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No deduction types found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff-deductions">
          <Card>
            <CardHeader>
              <CardTitle>
                <BadgeMinus className="inline mr-2 h-5 w-5" />
                Staff Deductions
              </CardTitle>
              <CardDescription>
                Manage deductions for individual staff members. 
                Currently managing {staffDeductions.length} staff deductions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => console.warn('Add Staff Deduction')} className="flex-1">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Staff Deduction
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      Export Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => console.warn('Export CSV')}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.warn('Export Excel')}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.warn('Export PDF')}>
                      <FileText className="mr-2 h-4 w-4" /> Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Search and filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search staff deductions..."
                    value={staffDeductionSearchTerm}
                    onChange={(e) => setStaffDeductionSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Staff Deductions Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Deduction Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStaffDeductions.map((deduction) => (
                      <TableRow key={deduction.id}>
                        <TableCell className="font-medium">Staff Member {deduction.staffId}</TableCell>
                        <TableCell>{deduction.deductionType}</TableCell>
                        <TableCell>
                          {deduction.isPercentage ? `${deduction.amount}%` : `$${deduction.amount.toFixed(2)}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={deduction.isActive ? "default" : "secondary"}>
                            {deduction.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => console.warn('Edit', deduction.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => console.warn('Delete', deduction.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {(staffDeductionCurrentPage - 1) * (staffDeductionRowsPerPage || 10) + 1} to{' '}
                    {Math.min(staffDeductionCurrentPage * (staffDeductionRowsPerPage || 10), filteredStaffDeductions.length)} of{' '}
                    {filteredStaffDeductions.length} entries
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select
                    value={(staffDeductionRowsPerPage || 10).toString()}
                    onValueChange={(value) => {
                      setStaffDeductionRowsPerPage(Number(value));
                      setStaffDeductionCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROWS_PER_PAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option.toString()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStaffDeductionCurrentPage(1)}
                      disabled={staffDeductionCurrentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStaffDeductionCurrentPage(staffDeductionCurrentPage - 1)}
                      disabled={staffDeductionCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Page {staffDeductionCurrentPage} of {staffDeductionTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStaffDeductionCurrentPage(staffDeductionCurrentPage + 1)}
                      disabled={staffDeductionCurrentPage === staffDeductionTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStaffDeductionCurrentPage(staffDeductionTotalPages)}
                      disabled={staffDeductionCurrentPage === staffDeductionTotalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {staffDeductions.length === 0 && (
                <div className="text-center py-8">
                  <BadgeMinus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No staff deductions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}