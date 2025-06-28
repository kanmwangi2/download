"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, FileSpreadsheet, Edit, Trash2, Banknote, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Loader2, PlusCircle, Settings, Info, CreditCard } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompany } from '@/context/CompanyContext';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeedbackAlert, type FeedbackMessage } from '@/components/ui/feedback-alert';

// Import services
import { ServiceRegistry } from '@/lib/services/ServiceRegistry';
import { PaymentType } from '@/lib/types';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

const defaultNewPaymentTypeData: Omit<PaymentType, 'id' | 'companyId' | 'orderNumber' | 'isFixedName' | 'isDeletable'> = {
  name: "",
  type: "Gross",
  isTaxable: false,
  isPensionable: false,
};

export default function PaymentsPage() {
  const { selectedCompanyId, isLoadingCompanyContext } = useCompany(); // Removed selectedCompanyName
  
  // Component State
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("payment-types");

  // Initialize services
  const [services, setServices] = useState<ServiceRegistry | null>(null);

  // Payment Types data state
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [paymentTypeSearchTerm, setPaymentTypeSearchTerm] = useState("");
  const [paymentTypeCurrentPage, setPaymentTypeCurrentPage] = useState(1);
  const [paymentTypeRowsPerPage, setPaymentTypeRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);

  // Dialog states (removed unused)
  const [isPaymentTypeDialogOpen, setIsPaymentTypeDialogOpen] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null);
  const [paymentTypeFormData, setPaymentTypeFormData] = useState<Omit<PaymentType, 'id' | 'companyId' | 'orderNumber' | 'isFixedName' | 'isDeletable'>>(defaultNewPaymentTypeData);

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
        // Fetch payment types
        const fetchedPaymentTypes = await services.paymentTypeService.getByCompanyId(selectedCompanyId);
        setPaymentTypes(fetchedPaymentTypes);

        setIsLoaded(true);
      } catch (error: unknown) { // Changed from any to unknown
        console.error("Error fetching payment data:", error);
        setFeedback({
          type: "error",
          message: "Failed to load payment data. Please try again."
        });
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [selectedCompanyId, isLoadingCompanyContext, services]);

  // Computed values for payment types
  const filteredPaymentTypes = useMemo(() => {
    return paymentTypes.filter(paymentType =>
      paymentType.name.toLowerCase().includes(paymentTypeSearchTerm.toLowerCase())
    );
  }, [paymentTypes, paymentTypeSearchTerm]);

  const paymentTypeTotalPages = Math.ceil(filteredPaymentTypes.length / (paymentTypeRowsPerPage || 10));
  const paginatedPaymentTypes = useMemo(() => {
    const rowsPerPage = paymentTypeRowsPerPage || 10;
    const startIndex = (paymentTypeCurrentPage - 1) * rowsPerPage;
    return filteredPaymentTypes.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredPaymentTypes, paymentTypeCurrentPage, paymentTypeRowsPerPage]);

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
          <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Company Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select a company to manage payments.
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
          <span className="ml-2">Loading payment data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Payment Management</h1>
      <p className="text-muted-foreground mb-6">
        Manage payment types and staff payment configurations for your company.
      </p>
      
      <FeedbackAlert feedback={feedback} />

      <Tabs defaultValue="payment-types" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payment-types">
            <CreditCard className="mr-2 h-4 w-4" /> Payment Types
          </TabsTrigger>
          <TabsTrigger value="staff-payments">
            <Banknote className="mr-2 h-4 w-4" /> Staff Payments
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="payment-types">
          <Card>
            <CardHeader>
              <CardTitle>Manage Payment Types</CardTitle>
              <CardDescription>
                Define and configure payment types for your organization. 
                Currently managing {paymentTypes.length} payment types.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => console.warn('Add Payment Type')} className="flex-1">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Payment Type
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
                    placeholder="Search payment types..."
                    value={paymentTypeSearchTerm}
                    onChange={(e) => setPaymentTypeSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Payment Types Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Taxable</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPaymentTypes.map((paymentType) => (
                      <TableRow key={paymentType.id}>
                        <TableCell className="font-medium">{paymentType.name}</TableCell>
                        <TableCell className="capitalize">{paymentType.type}</TableCell>
                        <TableCell>{paymentType.isTaxable ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{paymentType.isFixedName ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => console.warn('Edit', paymentType.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => console.warn('Delete', paymentType.id)}
                                disabled={!paymentType.isDeletable}
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
                    Showing {(paymentTypeCurrentPage - 1) * (paymentTypeRowsPerPage || 10) + 1} to{' '}
                    {Math.min(paymentTypeCurrentPage * (paymentTypeRowsPerPage || 10), filteredPaymentTypes.length)} of{' '}
                    {filteredPaymentTypes.length} entries
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select
                    value={(paymentTypeRowsPerPage || 10).toString()}
                    onValueChange={(value) => {
                      setPaymentTypeRowsPerPage(Number(value));
                      setPaymentTypeCurrentPage(1);
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
                      onClick={() => setPaymentTypeCurrentPage(1)}
                      disabled={paymentTypeCurrentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentTypeCurrentPage(paymentTypeCurrentPage - 1)}
                      disabled={paymentTypeCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Page {paymentTypeCurrentPage} of {paymentTypeTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentTypeCurrentPage(paymentTypeCurrentPage + 1)}
                      disabled={paymentTypeCurrentPage === paymentTypeTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentTypeCurrentPage(paymentTypeTotalPages)}
                      disabled={paymentTypeCurrentPage === paymentTypeTotalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {paymentTypes.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payment types found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff-payments">
          <Card>
            <CardHeader>
              <CardTitle>
                <Banknote className="inline mr-2 h-5 w-5" />
                Staff Payments
              </CardTitle>
              <CardDescription>
                Configure payment details for staff members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Staff Payments management interface will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}