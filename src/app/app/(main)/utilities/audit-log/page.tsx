"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, Download, Search, RefreshCw, ClipboardList } from "lucide-react";
import { format } from "date-fns";

// Force dynamic rendering to avoid build-time prerendering issues
export const dynamic = 'force-dynamic';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  companyId: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: new Date('2024-01-15T10:30:00'),
    userId: 'user-123',
    userEmail: 'admin@company.com',
    action: 'LOGIN',
    resource: 'AUTH',
    companyId: 'comp-456',
    details: 'User successfully logged in',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    severity: 'info'
  },
  {
    id: '2',
    timestamp: new Date('2024-01-15T10:35:00'),
    userId: 'user-123',
    userEmail: 'admin@company.com',
    action: 'CREATE',
    resource: 'STAFF',
    resourceId: 'staff-789',
    companyId: 'comp-456',
    details: 'Created new staff member: John Doe',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    severity: 'info'
  },
  {
    id: '3',
    timestamp: new Date('2024-01-15T11:00:00'),
    userId: 'user-123',
    userEmail: 'admin@company.com',
    action: 'UPDATE',
    resource: 'PAYMENT',
    resourceId: 'payment-101',
    companyId: 'comp-456',
    details: 'Updated payment configuration for staff member',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    severity: 'info'
  },
  {
    id: '4',
    timestamp: new Date('2024-01-15T11:15:00'),
    userId: 'user-456',
    userEmail: 'user@company.com',
    action: 'FAILED_LOGIN',
    resource: 'AUTH',
    companyId: 'comp-456',
    details: 'Failed login attempt - invalid credentials',
    ipAddress: '203.0.113.45',
    userAgent: 'Mozilla/5.0...',
    severity: 'warning'
  },
  {
    id: '5',
    timestamp: new Date('2024-01-15T12:00:00'),
    userId: 'user-123',
    userEmail: 'admin@company.com',
    action: 'RUN_PAYROLL',
    resource: 'PAYROLL',
    resourceId: 'payroll-202',
    companyId: 'comp-456',
    details: 'Executed payroll run for January 2024',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    severity: 'info'
  }
];

export default function AuditLogPage() {
  const [_auditLogs, _setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Unique actions and severities for filter dropdowns
  const uniqueActions = Array.from(new Set(_auditLogs.map(log => log.action)));
  const uniqueSeverities = Array.from(new Set(_auditLogs.map(log => log.severity)));

  useEffect(() => {
    let filtered = _auditLogs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(log => log.timestamp >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(log => log.timestamp >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(log => log.timestamp >= filterDate);
          break;
      }
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setFilteredLogs(filtered);
  }, [_auditLogs, searchTerm, actionFilter, severityFilter, dateFilter]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // TODO: Implement actual audit log fetching from backend
    // For now, simulating refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    // console.log('Exporting audit logs...');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setSeverityFilter('all');
    setDateFilter('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Audit Log
          </h1>
          <p className="text-muted-foreground">
            Track and monitor all system activities and user actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {uniqueSeverities.map(severity => (
                  <SelectItem key={severity} value={severity}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || actionFilter !== 'all' || severityFilter !== 'all' || dateFilter !== 'all') && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {_auditLogs.length} entries
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No audit log entries found matching the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(log.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.userEmail}</div>
                            <div className="text-xs text-muted-foreground">{log.userId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.resource}</div>
                            {log.resourceId && (
                              <div className="text-xs text-muted-foreground">{log.resourceId}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.details}
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note about implementation */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <ClipboardList className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Implementation Note</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This audit log currently displays mock data. In a production environment, 
                this would integrate with your backend audit logging system to display 
                real user activities, system events, and security-related actions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
