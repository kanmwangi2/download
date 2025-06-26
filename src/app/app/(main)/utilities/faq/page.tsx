"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Download, ChevronsUpDown } from "lucide-react";
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface FaqItem {
  question: string;
  answer: string;
}

const faqData: FaqItem[] = [
  {
    question: "How do I get started with Cheetah Payroll?",
    answer: "First, sign up for an account and create or select a company profile. Then add your staff members, configure payment types and amounts, set up any deductions, and you'll be ready to run payroll calculations."
  },
  {
    question: "What currency does Cheetah Payroll use?",
    answer: "Cheetah Payroll operates exclusively in Rwandan Francs (RWF). All monetary values throughout the system are in this currency."
  },
  {
    question: "How do I add new staff members?",
    answer: "Navigate to the Staff section from the main menu. Click 'Add Staff' to create individual records, or use 'Import' to bulk upload staff data via CSV file. Make sure to fill in all required fields like names, employment details, and contact information."
  },
  {
    question: "Can I manage multiple companies?",
    answer: "Yes! Cheetah Payroll supports multi-company management. Use the company selector in the top navigation to switch between different company profiles. All data (staff, payroll, settings) is isolated per company."
  },
  {
    question: "How do payment types work?",
    answer: "Payment types define different categories of compensation like Basic Salary, Transport Allowance, Housing Allowance, etc. You can create custom payment types and assign specific amounts to each staff member for these types."
  },
  {
    question: "What are deductions and how do I set them up?",
    answer: "Deductions are amounts subtracted from staff salaries, such as loans, advances, or other deductions. Create deduction types first, then assign specific deductions to staff members with amounts and payment schedules."
  },
  {
    question: "How do I run payroll?",
    answer: "Go to the Payroll section and click 'New Payroll Run'. Select the pay period, review the calculations, and submit for approval if required by your role. Approved payrolls can generate payslips and reports."
  },
  {
    question: "Can I export data from the system?",
    answer: "Yes! Most data tables support export to CSV, Excel (XLSX), and PDF formats. Look for the 'Export' dropdown button above data tables. You can also download import templates for bulk data upload."
  },
  {
    question: "What user roles are available?",
    answer: "Cheetah Payroll has 5 roles: Primary Admin (highest access), App Admin, Company Admin (manages specific companies), Payroll Approver (reviews payroll), and Payroll Preparer (creates payroll drafts)."
  },
  {
    question: "How do I reset my password?",
    answer: "Use the 'Forgot Password' link on the sign-in page. You'll receive an email with instructions to reset your password. If you don't receive the email, check your spam folder or contact your system administrator."
  },
  {
    question: "Where is my data stored?",
    answer: "All data is securely stored in the cloud using Supabase (PostgreSQL database). Nothing is stored locally in your browser. This ensures your data is accessible from any device and automatically backed up."
  },
  {
    question: "Can I customize fields for staff records?",
    answer: "Yes! Company Admins and above can create custom field definitions in the Company Settings. These custom fields will appear in staff management forms and can store additional information specific to your organization."
  },
  {
    question: "How do I import staff data?",
    answer: "Download the staff import template from the Staff page, fill it with your data following the format, then use the 'Import' function. The system will validate the data and show any errors before importing."
  },
  {
    question: "What happens if I make a mistake in payroll?",
    answer: "Draft payrolls can be edited or deleted. Once submitted for approval, contact a Payroll Approver to reject it if changes are needed. Approved payrolls should be handled carefully - contact your administrator for guidance."
  },
  {
    question: "How do I generate reports?",
    answer: "Visit the Reports section to access various payroll reports. You can filter by date range, staff members, or other criteria, then export the results in your preferred format (PDF, Excel, CSV)."
  },
  {
    question: "Can I set up automatic deductions?",
    answer: "Yes! When creating deductions, you can specify monthly deduction amounts and the system will track the balance automatically. Set up recurring deductions like loan repayments with start dates and monthly amounts."
  },
  {
    question: "How do I contact support?",
    answer: "Check the Support page for contact information. Primary Admin contact details are available there. You can also refer to the comprehensive Documentation section for detailed guidance."
  },
  {
    question: "What browsers are supported?",
    answer: "Cheetah Payroll works best with modern browsers like Chrome, Firefox, Safari, and Edge. Make sure JavaScript is enabled and you're using a recent browser version for the best experience."
  },
  {
    question: "What is the Audit Log and how do I use it?",
    answer: "The Audit Log tracks all system activities and user actions. Access it via Utilities > Audit Log. You can filter by action type, severity, date range, and search through activities. This helps with compliance and troubleshooting."
  },
  {
    question: "How is my data secured in the cloud?",
    answer: "Cheetah Payroll uses Supabase's enterprise-grade security with PostgreSQL. All data is encrypted in transit and at rest, with Row Level Security (RLS) ensuring company data isolation. Regular backups are automatic."
  },
  {
    question: "Can I access the system offline?",
    answer: "No, Cheetah Payroll is a cloud-native application requiring internet connectivity. This ensures real-time data synchronization, security, and that you always have the latest features and updates."
  },
  {
    question: "What's the difference between the old and new architecture?",
    answer: "The application has migrated from browser-based storage (IndexedDB) to a modern cloud-native architecture using Supabase. This provides better security, real-time collaboration, automatic backups, and multi-device access."
  },
  {
    question: "How do I know what version of the system I'm using?",
    answer: "Check the Documentation page for the latest feature information, or review the Change Log in the documentation. The system automatically updates with new features as they're deployed."
  }
];

export default function FAQPage() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleAll = () => {
    if (expandedItems.length === faqData.length) {
      setExpandedItems([]);
    } else {
      setExpandedItems(faqData.map((_, index) => index.toString()));
    }
  };

  const handleAccordionChange = (value: string) => {
    setExpandedItems(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Cheetah Payroll - Frequently Asked Questions", margin, yPosition);
    yPosition += 15;

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, margin, yPosition);
    yPosition += 20;

    // FAQ Content
    faqData.forEach((faq, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin;
      }

      // Question
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const questionLines = doc.splitTextToSize(`Q${index + 1}: ${faq.question}`, pageWidth - 2 * margin);
      doc.text(questionLines, margin, yPosition);
      yPosition += questionLines.length * 6 + 5;

      // Answer
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const answerLines = doc.splitTextToSize(`A: ${faq.answer}`, pageWidth - 2 * margin);
      doc.text(answerLines, margin, yPosition);
      yPosition += answerLines.length * 5 + 10;
    });

    doc.save(`Cheetah_Payroll_FAQ_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const allExpanded = expandedItems.length === faqData.length;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">FAQ</h2>
      </div>

      <Card>
        <CardHeader className="pt-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <HelpCircle className="mr-2 h-4 w-4" />
              Frequently Asked Questions
            </CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleAll}
                className="flex items-center"
              >
                <ChevronsUpDown className="mr-2 h-4 w-4" />
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToPDF}
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Export as PDF
              </Button>
            </div>
          </div>
          <CardDescription>
            Find answers to common questions about using Cheetah Payroll
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion 
            type="multiple" 
            value={expandedItems}
            onValueChange={setExpandedItems}
            className="w-full"
          >
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={index.toString()}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
