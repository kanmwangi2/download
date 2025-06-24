"use client";

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, parseISO, isValid } from 'date-fns';
import { useCompany } from '@/context/CompanyContext';

// Temporary type until Supabase audit logging is implemented
type AuditLogEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  company_id: string;
  timestamp: string;
  details?: Record<string, any>;
};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return 'N/A';
  const date = parseISO(timestamp);
  return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm:ss') : 'Invalid Date';
};

export default function AuditLogPage() {
  const { selectedCompanyId, isLoadingCompanyContext } = useCompany();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    const fetchLogs = async () => {
      if (isLoadingCompanyContext) return; // Wait for company context to load

      setIsLoading(true);
      try {        // TODO: Implement audit logging in Supabase
        // For now, return empty results since audit logging is not yet implemented
        const logs: AuditLogEntry[] = [];
        const totalCount = 0;
        
        setAuditLogs(logs);
        setTotalLogs(totalCount);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        setAuditLogs([]);
        setTotalLogs(0);
        // Consider adding user feedback for error
      }
      setIsLoading(false);
    };
    fetchLogs();
  }, [selectedCompanyId, searchTerm, currentPage, rowsPerPage, isLoadingCompanyContext]);

  const totalPages = Math.ceil(totalLogs / rowsPerPage) || 1;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  if (isLoadingCompanyContext && !selectedCompanyId) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading company information...
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Audit Log</h1>
        </div>
        <p className="text-muted-foreground">
          Review key activities and changes within the application.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Records</CardTitle>
          <CardDescription>
            Logs are sorted by most recent. Filter by company context or search.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by action, details, user, company..."
                className="w-full pl-10"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" /> Loading logs...
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="sticky top-0 z-10 bg-card">
                        <TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap">Timestamp</TableHead>
                        <TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap">User</TableHead>
                        <TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap">Company</TableHead>
                        <TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap">Action</TableHead>
                        <TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap min-w-[300px]">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length > 0 ? (
                        auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>                            <TableCell>{log.user_id || 'System'}</TableCell>
                            <TableCell>{log.company_id || 'Global'}</TableCell>
                            <TableCell className="font-medium">{log.action}</TableCell>
                            <TableCell className="max-w-md truncate" title={log.details ? JSON.stringify(log.details) : undefined}>
                              {log.details ? JSON.stringify(log.details) : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">
                            No audit logs found matching your criteria.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between py-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({totalLogs} total logs)
                  </div>
                  <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">Rows per page</p>
                      <Select
                        value={`${rowsPerPage}`}
                        onValueChange={(value) => {
                          setRowsPerPage(Number(value));
                          setCurrentPage(1);
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
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
