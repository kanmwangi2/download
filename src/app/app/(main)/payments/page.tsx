"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Download, FileText, FileSpreadsheet, FileType, Save, Edit, Trash2, Banknote, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Loader2, PlusCircle, Settings, Info, CreditCard } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from '@/components/ui/scroll-area';
import { StaffMember } from '@/lib/types/staff';
import { PaymentType, StaffPayment, DEFAULT_BASIC_PAY_ID, DEFAULT_TRANSPORT_ALLOWANCE_ID } from '@/lib/types/payments';
import Papa from 'papaparse';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useCompany } from '@/context/CompanyContext';
import Link from 'next/link';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeedbackAlert, type FeedbackMessage } from '@/components/ui/feedback-alert';

// Import services
import { ServiceRegistry } from '@/lib/services/ServiceRegistry';

// Type for staff payment details mapping
type StaffPaymentDetails = Record<string, number>;
const defaultPaymentDetails: StaffPaymentDetails = {};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000];

const defaultNewPaymentTypeData: Omit<PaymentType, 'id' | 'companyId' | 'orderNumber' | 'isFixedName' | 'isDeletable'> = {
  name: "",
  type: "allowance",
  isTaxable: false,
  isDefault: false,
};

const sanitizeFilename = (name: string | null | undefined): string => {
    if (!name) return 'UnknownCompany';
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
};

const formatCurrency = (amount?: number): string => {
  if (!amount || isNaN(amount)) return "0";
  return Math.round(amount).toLocaleString();
};

const formatNumberForTable = (amount: number): string => {
  return Math.round(amount).toLocaleString();
};

export default function PaymentsPage() {
  const { selectedCompanyId, selectedCompanyName, isLoadingCompanyContext } = useCompany();
  const staffPaymentImportFileInputRef = useRef<HTMLInputElement>(null);
  const paymentTypesImportFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize services
  const services = useMemo(() => ServiceRegistry.getInstance(), []);

  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [isPaymentTypeDialogOpen, setIsPaymentTypeDialogOpen] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null);
  const [paymentTypeFormData, setPaymentTypeFormData] = useState(defaultNewPaymentTypeData);
  const [isDeletePaymentTypeDialogOpen, setIsDeletePaymentTypeDialogOpen] = useState(false);
  const [paymentTypeToDelete, setPaymentTypeToDelete] = useState<PaymentType | null>(null);
  const [paymentTypeSearchTerm, setPaymentTypeSearchTerm] = useState("");
  const [ptCurrentPage, setPtCurrentPage] = useState(1);
  const [ptRowsPerPage, setPtRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [selectedPaymentTypeItems, setSelectedPaymentTypeItems] = useState<Set<string>>(new Set());
  const [isBulkDeletePaymentTypesDialogOpen, setIsBulkDeletePaymentTypesDialogOpen] = useState(false);

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [paymentDataStore, setPaymentDataStore] = useState<Record<string, StaffPaymentDetails>>({});
  const [isStaffPaymentFormDialogOpen, setIsStaffPaymentFormDialogOpen] = useState(false);
  const [editingStaffForPayments, setEditingStaffForPayments] = useState<StaffMember | null>(null);
  const [currentStaffPaymentFormData, setCurrentStaffPaymentFormData] = useState<StaffPaymentDetails>(JSON.parse(JSON.stringify(defaultPaymentDetails)));

  const [isAddStaffPaymentDialogOpen, setIsAddStaffPaymentDialogOpen] = useState(false);
  const [selectedStaffIdForNewConfig, setSelectedStaffIdForNewConfig] = useState<string>("");

  const [isDeleteStaffPaymentRecordDialogOpen, setIsDeleteStaffPaymentRecordDialogOpen] = useState(false);
  const [staffIdForPaymentRecordDeletion, setStaffIdForPaymentRecordDeletion] = useState<string | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [staffPaymentSearchTerm, setStaffPaymentSearchTerm] = useState("");
  const [spCurrentPage, setSpCurrentPage] = useState(1);
  const [spRowsPerPage, setSpRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [selectedStaffPaymentItems, setSelectedStaffPaymentItems] = useState<Set<string>>(new Set());
  const [isBulkDeleteStaffPaymentsDialogOpen, setIsBulkDeleteStaffPaymentsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  // Dialog-specific feedback states
  const [paymentTypeDialogFeedback, setPaymentTypeDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [deletePaymentTypeDialogFeedback, setDeletePaymentTypeDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [bulkDeletePaymentTypesDialogFeedback, setBulkDeletePaymentTypesDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [staffPaymentFormDialogFeedback, setStaffPaymentFormDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [addStaffPaymentDialogFeedback, setAddStaffPaymentDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [deleteStaffPaymentDialogFeedback, setDeleteStaffPaymentDialogFeedback] = useState<FeedbackMessage | null>(null);
  const [bulkDeleteStaffPaymentsDialogFeedback, setBulkDeleteStaffPaymentsDialogFeedback] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (isLoadingCompanyContext || !selectedCompanyId || typeof window === 'undefined') {
        if (!isLoadingCompanyContext && !selectedCompanyId) {
          setPaymentTypes([]); setStaffList([]); setPaymentDataStore({}); setIsLoaded(true);
        }
        return;
      }
      setIsLoaded(false);
      setFeedback(null);
      
      try {
        // Use services to fetch data
        const [paymentTypesData, staffData, paymentConfigs] = await Promise.all([
          services.paymentTypeService.getByCompanyId(selectedCompanyId),
          services.staffService.getByCompanyId(selectedCompanyId),
          services.staffPaymentConfigService.getByCompanyId(selectedCompanyId)
        ]);

        setPaymentTypes(paymentTypesData);
        setStaffList(staffData);
        
        // Map payment configs to the existing data structure
        const paymentStore: Record<string, StaffPaymentDetails> = {};
        paymentConfigs.forEach((config: any) => {
          if (!paymentStore[config.staffId]) {
            paymentStore[config.staffId] = {};
          }
          paymentStore[config.staffId]![config.paymentTypeId] = config.amount || 0;
        });
        
        setPaymentDataStore(paymentStore);

      } catch (error) {
        console.error("Error loading data for Payments page:", error);
        setPaymentTypes([]); setStaffList([]); setPaymentDataStore({});
        setFeedback({
          type: 'error', 
          message: "Loading Error", 
          details: `Could not load payment data. ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      setIsLoaded(true);
    };
    loadData();
  }, [selectedCompanyId, isLoadingCompanyContext, services]);

  // Component rendering placeholder
  if (isLoadingCompanyContext) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!selectedCompanyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Company Selected</CardTitle>
          <CardDescription>Please select a company to manage payments.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Management</h1>
      </div>

      <FeedbackAlert feedback={feedback} />

      <Button 
        variant="outline" 
        onClick={() => setFeedback(null)}
        className={feedback ? "mb-4" : "hidden"}
      >
        Clear Messages
      </Button>

      <Tabs defaultValue="payment-types" className="w-full">
        <TabsList>
          <TabsTrigger value="payment-types">Payment Types</TabsTrigger>
          <TabsTrigger value="staff-payments">Staff Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="payment-types">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Payment Types
              </CardTitle>
              <CardDescription>
                Manage payment types for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Payment Types management interface will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff-payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
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
