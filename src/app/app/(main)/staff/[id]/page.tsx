"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, User, Home, Landmark, Users2, Briefcase, Loader2, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeedbackMessage } from '@/components/ui/feedback-alert';
import { StaffMember, StaffStatus, EmployeeCategory } from "@/lib/types/staff";
import { CustomFieldDefinition } from '@/lib/types/custom-fields';
import { countries } from "@/lib/countries";
import { useCompany } from '@/context/CompanyContext';
import { cn } from '@/lib/utils';
import { ServiceRegistry } from '@/lib/services/ServiceRegistry';


const defaultStaffFormData: Omit<StaffMember, 'id' | 'companyId' | 'customFields'> = {
  firstName: "",
  lastName: "",
  staffNumber: "",
  email: "",
  phone: "",
  staffRssbNumber: "",
  employeeCategory: "P",
  department: "",
  designation: "",
  employmentDate: "",
  nationality: "",
  idPassportNumber: "",
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
  bankName: "",
  bankCode: "",
  bankAccountNumber: "",
  bankBranch: "",
  keyContactName: "",
  keyContactRelationship: "",
  keyContactPhone: "",
  status: "Active",
};

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { selectedCompanyId, isLoadingCompanyContext } = useCompany();
  const staffId = typeof params.id === 'string' ? params.id : '';

  const serviceRegistry = ServiceRegistry.getInstance();
  const staffService = useMemo(() => serviceRegistry.staffService, [serviceRegistry]);
  const customFieldDefinitionService = useMemo(() => serviceRegistry.customFieldDefinitionService, [serviceRegistry]);

  const [staffData, setStaffData] = useState<Omit<StaffMember, 'id' | 'companyId' | 'customFields'>>(defaultStaffFormData);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, string>>({});
  const [originalStaffDataForDisplay, setOriginalStaffDataForDisplay] = useState<StaffMember | null>(null);
  const [companyCustomFields, setCompanyCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    const loadStaffDetail = async () => {
      if (isLoadingCompanyContext || !selectedCompanyId || !staffId) {
        if (!isLoadingCompanyContext && !selectedCompanyId && staffId) {
            // Handled by global redirect if no companyId
        }
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setFeedback(null);
      try {
        const [staffMember, customFieldDefinitions] = await Promise.all([
          staffService.getById(staffId, selectedCompanyId),
          customFieldDefinitionService.getByCompanyId(selectedCompanyId)
        ]);

        setCompanyCustomFields(customFieldDefinitions.sort((a,b) => a.orderNumber - b.orderNumber));
        
        if (staffMember) {
          const { customFields, ...formData } = staffMember;
          setStaffData(formData);
          setCustomFieldsData(customFields || {});
          setOriginalStaffDataForDisplay(staffMember);
        } else {
          setFeedback({ type: "error", message: "Error", details: `Staff ID ${staffId} not found.` });
          router.push("/app/staff");
        }
      } catch (error) {
        console.error("Error loading staff detail:", error);
        setFeedback({ type: "error", message: "Error", details: "Could not load staff details." });
        router.push("/app/staff");
      }
      setIsLoading(false);
    };
    loadStaffDetail();
  }, [staffId, router, selectedCompanyId, isLoadingCompanyContext, staffService, customFieldDefinitionService]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFeedback(null);
    const { name, value } = e.target;
    setStaffData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomFieldChange = (cfdId: string, value: string) => {
    setFeedback(null);
    setCustomFieldsData(prev => ({ ...prev, [cfdId]: value }));
  };
  const handleSelectChange = (name: keyof Omit<StaffMember, 'id' | 'companyId' | 'customFields'>, value: string) => {
    setFeedback(null);
    setStaffData(prev => ({ ...prev, [name]: value }));
  };
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    if (!selectedCompanyId) { setFeedback({ type: 'error', message: "Error", details: "No company selected." }); return; }

    if (originalStaffDataForDisplay) {
        const updatedStaffMember: StaffMember = {
            ...originalStaffDataForDisplay, 
            ...staffData,
            customFields: customFieldsData,
            companyId: selectedCompanyId 
        };
        try {
            await staffService.update(originalStaffDataForDisplay.id, updatedStaffMember);
            
            setOriginalStaffDataForDisplay(updatedStaffMember); 
            setFeedback({ type: 'success', message: "Staff Details Saved", details: "Information has been updated." });
        } catch (error) { 
            console.error("Error saving staff details:", error);
            setFeedback({ type: 'error', message: "Error", details: "Could not save staff details." }); 
        }
    } else { setFeedback({ type: 'error', message: "Error", details: "Could not save. Original data missing." }); }
  };

  const renderFeedbackMessage = () => {
    if (!feedback) return null;
    let IconComponent;
    let variant: "default" | "destructive" = "default";
    let additionalAlertClasses = "";

    switch (feedback.type) {
      case 'success':
        IconComponent = CheckCircle2;
        variant = "default";
        additionalAlertClasses = "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600 [&>svg]:text-green-600 dark:[&>svg]:text-green-400";
        break;
      case 'error':
        IconComponent = AlertTriangle;
        variant = "destructive";
        break;
      case 'info':
        IconComponent = Info;
        variant = "default";
        break;
      default:
        return null;
    }
    return (
      <Alert variant={variant} className={cn("mb-4", additionalAlertClasses)}>
        <IconComponent className="h-4 w-4" />
        <AlertTitle>{feedback.message}</AlertTitle>
        {feedback.details && <AlertDescription>{feedback.details}</AlertDescription>}
      </Alert>
    );
  };

  if (isLoadingCompanyContext || isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading staff details...</div>;
  if (!selectedCompanyId) return (<div className="text-center py-10"><p>No company selected.</p><Button variant="outline" asChild className="mt-4"><Link href="/select-company"><ArrowLeft className="mr-2 h-4 w-4" />Go to Company Selection</Link></Button></div>);
  if (!originalStaffDataForDisplay) return (<div className="text-center py-10"><p>Staff member not found.</p><Button variant="outline" asChild className="mt-4"><Link href="/app/staff"><ArrowLeft className="mr-2 h-4 w-4" />Back to Staff List</Link></Button></div>);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight font-headline">Edit Staff: {originalStaffDataForDisplay.firstName} {originalStaffDataForDisplay.lastName}</h1><p className="text-muted-foreground">Update details for staff ID: {staffId}.</p></div>
        <Button variant="outline" asChild><Link href="/app/staff"><ArrowLeft className="mr-2 h-4 w-4" />Back to Staff List</Link></Button>
      </div>
      {renderFeedbackMessage()}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Personal & Employment Card */}
          <Card><CardHeader><CardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-primary" />Personal & Employment</CardTitle></CardHeader>            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="firstName">First Name *</Label><Input id="firstName" name="firstName" value={staffData.firstName} onChange={handleInputChange} required /></div>
                <div className="space-y-2"><Label htmlFor="lastName">Last Name *</Label><Input id="lastName" name="lastName" value={staffData.lastName} onChange={handleInputChange} required /></div>
                <div className="space-y-2"><Label htmlFor="staffNumber">Staff Number</Label><Input id="staffNumber" name="staffNumber" value={staffData.staffNumber || ""} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" name="email" type="email" value={staffData.email} onChange={handleInputChange} required /></div>
                <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" value={staffData.phone} onChange={handleInputChange}/></div>
                <div className="space-y-2"><Label htmlFor="staffRssbNumber">RSSB Number</Label><Input id="staffRssbNumber" name="staffRssbNumber" value={staffData.staffRssbNumber || ""} onChange={handleInputChange}/></div>
                <div className="space-y-2">
                    <Label htmlFor="employeeCategory">Employee Category</Label>
                    <Select name="employeeCategory" value={staffData.employeeCategory || ""} onValueChange={(v) => handleSelectChange('employeeCategory', v as EmployeeCategory)}>
                      <SelectTrigger id="employeeCategory"><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P">P (Permanent)</SelectItem>
                        <SelectItem value="C">C (Casual)</SelectItem>
                        <SelectItem value="E">E (Exempted)</SelectItem>
                        <SelectItem value="S">S (Second Employer)</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="gender">Gender</Label><Select name="gender" value={staffData.gender || ""} onValueChange={(v) => handleSelectChange('gender', v as 'Male'|'Female'|'Other')}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="birthDate">Birth Date</Label><Input id="birthDate" name="birthDate" type="date" value={staffData.birthDate || ""} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="department">Department *</Label><Select name="department" value={staffData.department || ""} onValueChange={(v) => handleSelectChange('department', v)} required><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Engineering">Engineering</SelectItem><SelectItem value="Marketing">Marketing</SelectItem><SelectItem value="Sales">Sales</SelectItem><SelectItem value="Human Resources">HR</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Operations">Operations</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="designation">Designation</Label><Input id="designation" name="designation" value={staffData.designation || ""} onChange={handleInputChange}/></div>
                <div className="space-y-2"><Label htmlFor="employmentDate">Employment Date</Label><Input id="employmentDate" name="employmentDate" type="date" value={staffData.employmentDate || ""} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="nationality">Nationality</Label><Select name="nationality" value={staffData.nationality || ""} onValueChange={(v) => handleSelectChange('nationality', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent className="max-h-60">{countries.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="idPassportNumber">ID/Passport No.</Label><Input id="idPassportNumber" name="idPassportNumber" value={staffData.idPassportNumber || ""} onChange={handleInputChange} /></div>
            </CardContent>
          </Card>
          {/* Address Card */}
          <Card><CardHeader><CardTitle className="flex items-center"><Home className="mr-2 h-5 w-5 text-primary" />Address Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="province">Province</Label><Select name="province" value={staffData.province || ""} onValueChange={(v) => handleSelectChange('province', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="kigali_city">Kigali City</SelectItem><SelectItem value="eastern">Eastern</SelectItem><SelectItem value="northern">Northern</SelectItem><SelectItem value="southern">Southern</SelectItem><SelectItem value="western">Western</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="district">District</Label><Input id="district" name="district" value={staffData.district || ""} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="sector">Sector</Label><Input id="sector" name="sector" value={staffData.sector || ""} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="cell">Cell</Label><Input id="cell" name="cell" value={staffData.cell || ""} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="village">Village</Label><Input id="village" name="village" value={staffData.village || ""} onChange={handleInputChange} /></div>
            </CardContent>
          </Card>
          {/* Bank Details Card */}
          <Card><CardHeader><CardTitle className="flex items-center"><Landmark className="mr-2 h-5 w-5 text-primary" />Bank Details</CardTitle></CardHeader>            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="bankName">Bank Name</Label><Input id="bankName" name="bankName" value={staffData.bankName || ""} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="bankCode">Bank Code</Label><Input id="bankCode" name="bankCode" value={staffData.bankCode || ""} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="bankAccountNumber">Account No.</Label><Input id="bankAccountNumber" name="bankAccountNumber" value={staffData.bankAccountNumber || ""} onChange={handleInputChange}/></div>
                <div className="space-y-2"><Label htmlFor="bankBranch">Branch</Label><Input id="bankBranch" name="bankBranch" value={staffData.bankBranch || ""} onChange={handleInputChange}/></div>
            </CardContent>
          </Card>
          {/* Emergency Contact Card */}
          <Card><CardHeader><CardTitle className="flex items-center"><Users2 className="mr-2 h-5 w-5 text-primary" />Emergency Contact</CardTitle></CardHeader>            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="keyContactName">Name</Label><Input id="keyContactName" name="keyContactName" value={staffData.keyContactName || ""} onChange={handleInputChange}/></div>
                <div className="space-y-2"><Label htmlFor="keyContactRelationship">Relationship</Label><Select name="keyContactRelationship" value={staffData.keyContactRelationship || ""} onValueChange={(v) => handleSelectChange('keyContactRelationship', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="spouse">Spouse</SelectItem><SelectItem value="parent">Parent</SelectItem><SelectItem value="sibling">Sibling</SelectItem><SelectItem value="child">Child</SelectItem><SelectItem value="friend">Friend</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="keyContactPhone">Phone</Label><Input id="keyContactPhone" name="keyContactPhone" type="tel" value={staffData.keyContactPhone || ""} onChange={handleInputChange}/></div>
            </CardContent>
          </Card>
          
          {companyCustomFields.length > 0 && (
            <Card>
                <CardHeader><CardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-primary" />Custom Information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companyCustomFields.map(cfd => (
                        <div key={cfd.id} className="space-y-2">
                            <Label htmlFor={`customField_${cfd.id}`}>{cfd.name}</Label>
                            <Input 
                                id={`customField_${cfd.id}`} 
                                name={`customField_${cfd.id}`} 
                                type={cfd.type === "Number" ? "number" : cfd.type === "Date" ? "date" : "text"} 
                                value={customFieldsData[cfd.id] || ""} 
                                onChange={(e) => handleCustomFieldChange(cfd.id, e.target.value)} 
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
          )}

          {/* Employment Status Card */}
          <Card><CardHeader><CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" />Employment Status</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="status">Status *</Label><Select name="status" value={staffData.status} onValueChange={(v) => handleSelectChange('status', v as StaffStatus)} required><SelectTrigger id="status"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select></div>
            </CardContent>
          </Card>
          <CardFooter className="border-t pt-6"><Button type="submit" disabled={isLoading || isLoadingCompanyContext || !selectedCompanyId}><Save className="mr-2 h-4 w-4" /> Save Changes</Button></CardFooter>
        </div>
      </form>
    </div>
  );
}
