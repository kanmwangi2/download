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
import { BookOpenText, Download, ChevronsUpDown } from "lucide-react";
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface DocContentItem {
  type: 'paragraph' | 'list' | 'subsection';
  text?: string;
  items?: string[];
  subTitle?: string;
  subContent?: (string | { type: 'list'; items: string[] })[];
}

interface DocSectionData {
  id: string;
  title: string;
  content: DocContentItem[];
}

const documentationContent: DocSectionData[] = [
  {
    id: "intro-overview",
    title: "1. Introduction & System Overview",
    content: [
      { type: 'paragraph', text: "Cheetah Payroll is a web-based application designed to simplify and manage company payroll and HR-related tasks. It provides a user-friendly interface with consistent page title icons for easy navigation. Key functions include managing staff and their custom fields, defining payment types, configuring payments, handling deductions, processing payroll, generating payslips and reports. The application operates <strong>exclusively</strong> in Rwandan Francs (RWF), and all monetary values throughout the system are in this currency. Error and success messages are displayed directly within the relevant component or page section, using in-component alert banners rather than system-wide toast notifications. Many pages with multiple sections (e.g., Staff, Payments, Deductions, Reports, User Profile, Company Settings) utilize a tabbed interface for better organization and user experience." },
      {
        type: 'subsection',
        subTitle: "Multi-Company Support",
        subContent: [
          "Cheetah Payroll supports managing multiple distinct company profiles within a single application instance. All operational data (staff records, payroll runs, payment types, payment configurations, deductions, company-specific settings like departments, custom field definitions, and company profile) is isolated to the currently selected company. Global data includes the list of available companies, user accounts, and system-wide tax configurations. Users create their own companies during the initial setup process.",
        ],
      },
      {
        type: 'subsection',
        subTitle: "Technology Stack & Architecture",
        subContent: [
          { type: 'list', items: [
            "Frontend: Next.js 14+ (React framework), TypeScript with strict mode",
            "UI Components: ShadCN UI (customizable components built with Radix UI and Tailwind CSS)",
            "Styling: Tailwind CSS with custom design system",
            "Backend: Supabase (PostgreSQL, Auth, Storage, Real-time)",
            "Database: PostgreSQL with proper foreign keys and constraints",
            "Authentication: Supabase Auth with role-based access control",
            "State Management: React Context with optimized re-rendering",
            "Service Layer: Object-Oriented service architecture with Service Registry pattern",
            "Type Safety: Comprehensive TypeScript types with database schema alignment",
            "Data Mapping: Automated camelCase ↔ snake_case conversion at data boundaries"
          ]}
        ]
      },
      {
        type: 'subsection',
        subTitle: "Service Architecture",
        subContent: [
          "The application uses a modern Object-Oriented service architecture for data management:",
          { type: 'list', items: [
            "<strong>Service Registry:</strong> Centralized service management using singleton pattern",
            "<strong>Base Service:</strong> Common database operations and error handling shared across all services",
            "<strong>Specialized Services:</strong> Domain-specific services (StaffService, PaymentTypeService, DeductionService, etc.)",
            "<strong>Type Safety:</strong> All database operations are fully type-safe with proper validation",
            "<strong>Mapping Layer:</strong> Automatic conversion between database (snake_case) and application (camelCase) formats",
            "<strong>Error Handling:</strong> Centralized error management with user-friendly feedback"
          ]}
        ]
      },
      {
        type: 'subsection',
        subTitle: "Data Persistence & Management",
        subContent: [
          "Cheetah Payroll uses Supabase as its exclusive backend with a modern Object-Oriented service architecture. All application data (staff records, payroll runs, company settings including payment types, deduction types, custom field definitions, tax configurations, user profiles, audit logs, etc.) is securely stored in the cloud and accessible from any device.",
          { type: 'list', items: [
            "<strong>Data Location:</strong> All data resides in Supabase PostgreSQL; nothing is stored locally in the browser.",
            "<strong>Data Scoping:</strong> Operational data is scoped per company. Global data includes the overall list of companies, user accounts, and tax settings.",
            "<strong>Cloud-Native:</strong> Complete migration from IndexedDB to Supabase has been completed. The application is now fully cloud-native with enterprise-grade security.",
            "<strong>Real-time Sync:</strong> Data synchronizes in real-time across all user sessions through Supabase with automatic conflict resolution.",
            "<strong>Service Architecture:</strong> Modern OOP-based services (StaffService, PayrollService, etc.) handle all data operations with comprehensive type safety.",
            "<strong>Audit Trail:</strong> Complete activity logging tracks all user actions and system changes for compliance and troubleshooting.",
            "<strong>Data Security:</strong> Row Level Security (RLS) ensures complete data isolation between companies with encrypted storage.",
            "<strong>Resetting the Application:</strong> To reset your company or user data, contact your system administrator or use the admin tools in the application settings (if available).",
            "<strong>Suitability:</strong> This cloud-native setup is suitable for production, multi-user, and collaborative scenarios with automatic backups.",
            "<strong>Initial Data:</strong> The application starts with a clean state. Users create their companies and populate data as needed for their specific business requirements.",
          ]}
        ]
      },
      {
        type: 'subsection',
        subTitle: "Data Tables and User Interface",
        subContent: [
          "Most tables displaying lists of data (e.g., Staff, Custom Field Definitions, Deductions, Payroll Runs, Payment Types, Company Lists, User Lists, Department Lists, Audit Logs) are paginated. This helps manage large datasets efficiently. Below these tables, you will find controls to:",
           { type: 'list', items: [
            "Navigate between pages (First, Previous, Next, Last).",
            "Select the number of rows to display per page from a dropdown menu.",
            "View the current page number and total number of pages.",
            "See the count of selected items if the table supports bulk actions.",
          ]},
          "For consistency, action buttons (like 'Add', 'Import / Template' dropdown, 'Export' dropdown) and search bars are typically located within the content area of the main card that displays the data list (or within the relevant tab's card), usually above the table itself. Bulk delete options are also available for most tables, appearing when items are selected.",
        ]
      }
    ]
  },
  {
    id: "user-roles",
    title: "2. User Roles & Access Control",
    content: [
      { type: 'paragraph', text: "Cheetah Payroll implements a role-based access control system to manage user permissions. The primary roles include:" },
      { type: 'list', items: [
        "<strong>Primary Admin:</strong> Highest level of access. Manages all application settings (companies, users, global taxes), and can perform all operations for any company by selecting it. There can only be one Primary Admin, and this role <em>cannot be deleted or easily changed</em>. Their contact details (email/phone) are used for the Support page.",
        "<strong>App Admin:</strong> Similar to Primary Admin, can manage global settings and all company data by selecting the relevant company. Useful for additional super-users.",
        "<strong>Company Admin:</strong> Manages specific assigned companies. Can configure company details, departments, payment types, deduction types, custom field definitions, and perform all payroll operations for their assigned companies. Can also manage users (Payroll Preparer/Approver roles) within their assigned companies via the 'Company Settings' page. Data access is restricted to assigned companies.",
        "<strong>Payroll Approver:</strong> Can review payroll runs submitted for approval and either approve or reject them for assigned companies. Data access is restricted to assigned companies.",
        "<strong>Payroll Preparer:</strong> Can create and manage draft payroll runs, configure staff payments against defined payment types, and manage deductions for assigned companies. Submits payrolls for approval. Data access is restricted to assigned companies.",
      ]},
      { type: 'paragraph', text: "User roles and their company assignments are managed in the global \"Application Settings\" by Primary or App Admins. User lists in this section are paginated." }
    ]
  },
  {
    id: "getting-started",
    title: "3. Getting Started",
    content: [
      {
        type: 'subsection',
        subTitle: "Login",
        subContent: [
          "Access the application by navigating to the root URL. You will be presented with a login form.",
          { type: 'list', items: [
            "Enter your registered email and password.",
            "For first-time users, start by signing up to create an account. The first user to sign up will automatically become the Primary Admin.",
          ]}
        ]
      },
      {
        type: 'subsection',
        subTitle: "Company Selection",
        subContent: [
          "After successful login, you'll be directed to the \"Select Your Company\" screen.",
          { type: 'list', items: [
            "Choose the company profile you wish to manage from the dropdown list. The list displays all companies that you have access to. Your user role will determine what actions you can perform within the selected company.",
            "Click \"Go to Company\" to load the main application dashboard for the selected company. All subsequent operations (Staff, Payroll, etc.) will be within the context of this chosen company.",
          ]}
        ]
      },
      {
        type: 'subsection',
        subTitle: "Accessing Global Application Settings",
        subContent: [
          "If you are a Primary Admin or App Admin, you will see an \"Application Settings\" button on the Company Selection screen. Clicking this will take you to a separate area with tabs for managing:",
          { type: 'list', items: [
            "<strong>Company Management Tab:</strong> Add/edit/delete company records available in the app. Export format: `global_companies_export.[ext]`, Template: `global_companies_import_template.csv`.",
            "<strong>User Management Tab:</strong> Create users, assign roles and company access. Export format: `global_users_export.[ext]`, Template: `users_import_template.csv`.",
            "<strong>Global Taxes Tab:</strong> Configure PAYE, RSSB (Pension & Maternity), RAMA, and CBHI rates applicable to all companies.",
          ]}
        ]
      }
    ]
  },
  {
    id: "dashboard",
    title: "4. Dashboard",
    content: [
      { type: 'paragraph', text: "The Dashboard is your central hub for an overview of the selected company's payroll status." },
      { type: 'list', items: [
        "<strong>Key Metrics Cards:</strong> Displays total active employees, next payroll run date & status, and total gross pay of the last approved run, all specific to the selected company. All monetary values are in Rwandan Francs (RWF).",
      ]}
    ]
  },
  {
    id: "core-operations",
    title: "5. Core Operations",
    content: [
      { type: 'paragraph', text: "All core operations are performed within the context of the currently selected company. Many operational pages (Staff, Payments, Deductions, Reports) use a tabbed interface." },
      {
        type: 'subsection',
        subTitle: "Staff Management (Tabbed Interface)",
        subContent: [
          "Accessible via 'Staff' in the navigation. This page has two tabs:",
          { type: 'list', items: [
            "<strong>Staff Members Tab:</strong> Displays a table of all staff for the selected company. Includes search, 'Add Staff', import/export (Template: `staff_import_template.csv`, Export: `[company-name]_staff_export.[ext]`), pagination, and bulk deletion. Standard fields include the 'Employee Category' (Permanent, Casual, etc.). Custom fields defined for the company will appear in the Add/Edit dialogs and export/import templates (prefixed like \"Custom: T-Shirt Size\").",
            "<strong>Custom Fields Tab:</strong> Manage company-specific custom field definitions (e.g., 'T-Shirt Size', 'Asset Tag'). Includes search, add, import/export (Template: `custom_fields_template.csv`, Export: `[company-name]_custom_fields_export.[ext]`), pagination, and bulk deletion. Supported types: Text, Number, Date. A custom field definition cannot be deleted if in use.",
          ]}
        ]
      },
      {
        type: 'subsection',
        subTitle: "Payments Configuration (Tabbed Interface)",
        subContent: [
          "Accessible via 'Payments' in the navigation. This page has two tabs:",
          { type: 'list', items: [
            "<strong>Payments Tab (Default):</strong> List staff to configure their individual payment amounts per defined Payment Type. Includes search, add/edit payment configuration features, pagination, and bulk deletion. The configuration dialog dynamically lists all company Payment Types. Export format: `[company-name]_payments_export.[ext]`, Template: `payments_import_template.csv` (headers: `StaffID`, `StaffName`, then columns for each company Payment Type like `Basic Pay`).",
            "<strong>Payment Types Tab:</strong> Define company pay components (e.g., Basic Pay, Allowances). Includes search, add, import/export (Template: `payment_types_import_template.csv`, Export: `[company-name]_payment_types_export.[ext]`), pagination, and bulk deletion (core types cannot be deleted). 'Basic Pay' and 'Transport Allowance' are core, non-deletable types, but their Gross/Net status is editable. Order dictates payroll calculation sequence.",
          ]}
        ]
      },
      {
        type: 'subsection',
        subTitle: "Deductions Management (Tabbed Interface)",
        subContent: [
          "Accessible via 'Deductions' in the navigation. This page has two tabs:",
           { type: 'list', items: [
            "<strong>Deductions Tab (Default):</strong> Lists individual staff deductions. Includes search, 'Add Deduction', import/export (Template: `deductions_import_template.csv`, Export: `[company-name]_deductions_export.[ext]`), pagination, and bulk deletion. When adding/editing, select a `DeductionType` from those defined for the company. Approved payroll runs update relevant deduction records.",
            "<strong>Deduction Types Tab:</strong> Define categories for deductions (e.g., Loan, Advance). Includes search, add, import/export (Template: `deduction_types_import_template.csv`, Export: `[company-name]_deduction_types_export.[ext]`), pagination, and bulk deletion (core types 'Advance', 'Charge', and 'Loan' are non-deletable and have fixed order 1, 2, 3). Custom types can be added, and their order determines application sequence after core types.",
          ]}
        ]
      },
      {
        type: 'subsection',
        subTitle: "Payroll Processing",
        subContent: [
          "Payroll runs are created, calculated, and managed per selected company.",
          { type: 'list', items: [
            "<strong>Payroll List:</strong> View payroll runs for the selected company. The 'Run New Payroll' button (ID format: `PRYYYYMM`) and a search bar are located within the Payroll Runs card's content area. This list is paginated and supports bulk deletion of eligible runs (e.g., Draft, Rejected). Deleting a payroll run also reverses any applied deductions from that run.",
            "<strong>Payroll Run Detail Page:</strong> Calculations and workflow actions are for the specific run within the selected company. To approve or reject a payroll run that is in 'To Approve' status, you must navigate to its detail page (by clicking the 'View Details' icon on the payroll list). Approve/Reject buttons are located on this detail page. Export format for run details: `[company-name]_payroll_run_[run-id]_details_export.[ext]`.",
          ]}
        ]
      },
      {
        type: 'subsection',
        subTitle: "<strong>Payment Calculation Logic & Deduction Application</strong>",
        subContent: [
           "Cheetah Payroll processes employee payments by evaluating each Payment Type (as defined in 'Payments Configuration' > 'Payment Types' tab) sequentially according to its specified order. 'Basic Pay' is always processed first, followed by 'Transport Allowance', then any user-defined payment types in their set order.",
           "For each Payment Type:",
           { type: 'list', items: [
                "If the payment type's status (set in 'Payment Types' tab) is '<strong>Gross</strong>', the amount specified for the employee (in the 'Payments' tab) is directly considered as a gross earning for that component.",
                "If the payment type's status (set in 'Payment Types' tab) is '<strong>Net</strong>', the amount specified for the employee is treated as the desired <strong>final take-home value for that specific component</strong>. The system performs a 'gross-up' calculation for this component. This iterative process determines the necessary additional gross salary required to achieve that component's target net value, considering the tax implications of all previously processed components and the current one. This calculation uses the global tax settings (unless a company-specific exemption is active) and the cumulative effect of each grossed-up component on taxes and contributions. On payslips, Basic Pay is listed first. Other non-zero earnings are grouped under an 'Allowances' subheading with a subtotal, which then sums with Basic Pay to form the Total Gross Salary."
           ]},
           "The sum of the calculated gross amounts for all payment types constitutes the employee's total Gross Salary for the payroll period. Statutory deductions (RSSB Pension, RSSB Maternity, RAMA, PAYE, and CBHI) are then calculated based on this total Gross Salary, the specific calculated gross Transport Allowance (for maternity contributions), and the specific calculated Basic Pay (for RAMA contributions).",
           "<strong>Deduction Application Order:</strong> When an employee has multiple active deductions, they are applied during payroll processing based on the `order` defined for each `DeductionType` in 'Deductions Management' > 'Deduction Types' tab. Core types 'Advance', 'Charge', and 'Loan' have orders 1, 2, and 3 respectively, followed by custom types in their defined order. Within each `DeductionType` category, if there are multiple deductions of the same type (e.g., two active loans), they are typically processed based on their start date (earliest first). The amount applied for any single deduction installment is capped by its configured monthly installment or the remaining balance of that deduction, whichever is lower. Crucially, deductions are only applied if sufficient net pay remains after all statutory deductions (PAYE, RSSB, RAMA, CBHI); the system will not allow the final net pay to go below zero due to these discretionary deductions. If available net pay is insufficient for a full installment, only the available amount is taken. If no net pay is available, the installment is skipped for that payroll run. Payroll and payslip displays will only show columns for deduction types that have a non-zero amount deducted for at least one staff member in that specific run or payslip.",
        ]
      },
      {
        type: 'subsection',
        subTitle: "Report Generation (Tabbed Interface)",
        subContent: [
          "Accessible via 'Reports' in the navigation menu (path `/app/reports`). This page has three tabs:",
          { type: 'list', items: [
            "<strong>Statutory Reports Tab:</strong> Generate statutory reports for the selected company from 'Approved' payroll runs. The Ishema Report, a key statutory document for RSSB, is generated first. Export a ZIP file (`[company-name]_all_statutory_reports_[period-name].zip`) with individual CSV/XLSX files (e.g., `[company-name]_PAYE_Report_[period-name].[ext]`). Individual reports can also be exported from the preview dialog.",
            "<strong>Payslips Tab:</strong> Generate payslips for individual employees or all employees in an approved run. Preview and download individual PDFs (`[company-name]_payslip_[staff-name]_[period].pdf`) or a ZIP archive (`[company-name]_payslips_export.zip`). Emailing (simulated) is available.",
            "<strong>Deduction History Tab:</strong> View and export a PDF report (`[company-name]_deduction_history_[staff-name]_[deduction-description].pdf`) of deduction payments for a specific staff member and deduction item.",
            "<strong>House Allowance & RAMA Note:</strong> For 'House Allowance' to map to its dedicated column in PAYE/CBHI reports, the Payment Type (in 'Payments' > 'Payment Types' tab) must be named <strong>exactly</strong> 'House Allowance' (case-insensitive). RAMA contributions are calculated based on 'Basic Pay'. Other custom allowances are typically aggregated under 'Other Cash Allowance'.",
          ]}
        ]
      }
    ]
  },
  {
    id: "settings",
    title: "6. Settings",
    content: [
      {
        type: 'subsection',
        subTitle: "User Profile (Tabbed Interface)",
        subContent: [
          "Manage your personal user settings (global to your account). Accessible from the user menu. This page has three tabs:",
          { type: 'list', items: [
            "<strong>Profile Picture Tab:</strong> Upload, crop, and save a profile picture.",
            "<strong>Personal Information Tab:</strong> Update first name, last name, email, phone.",
            "<strong>Change Password Tab:</strong> Update your login password. Saves to Supabase.",
          ]}
        ]
      },
      {
        type: 'subsection',
        subTitle: "Company Settings (Tabbed Interface)",
        subContent: [
          "Manage settings for the currently active company. Accessible from the user menu. This page has four tabs:",
          { type: 'list', items: [
            "<strong>Company Profile Tab:</strong> Update name, registration, address, TIN, contact, and business type.",
            "<strong>Tax Exemptions Tab:</strong> Enable or disable specific taxes (PAYE, Pension, Maternity, RAMA, CBHI) for this company.",
            "<strong>Departments Tab:</strong> Add, edit, or delete departments. Paginated with bulk delete. Export format: `[company-name]_departments_data.[ext]`, Template: `departments_import_template.csv`.",
            "<strong>Company Users Tab:</strong> Manage users (Payroll Preparer/Approver) for this company. Paginated with bulk delete. Export format: `[company-name]_company_users_data.[ext]`, Template: `company_users_import_template.csv`.",
          ]}
        ]
      },
      {
        type: 'subsection',
        subTitle: "Application Settings (Global - Admin Access)",
        subContent: [
          "Global settings for the entire application. Accessible from the \"Company Selection\" screen by Primary Admins and App Admins. Uses a tabbed interface:",
          { type: 'list', items: [
            "<strong>Company Management Tab:</strong> Manage all company records in the system. Paginated with bulk delete. Export: `global_companies_export.[ext]`, Template: `global_companies_import_template.csv`.",
            "<strong>User Management Tab:</strong> Manage all user accounts, roles, and company assignments. Paginated with bulk delete. Export: `global_users_export.[ext]`, Template: `users_import_template.csv`.",
            "<strong>Global Taxes Tab:</strong> Configure global PAYE bands/rates, Pension, Maternity, RAMA, and CBHI rates.",
          ]}
        ]
      }
    ]
  },
  {
    id: "utilities-support",
    title: "7. Utilities & Support (Navigation)",
    content: [
      { type: 'paragraph', text: "These utilities are grouped under 'Utilities' in the main navigation menu and provide information or help related to the application." },
      {
        type: 'subsection',
        subTitle: "Audit Log",
        subContent: ["Accessible via 'Utilities' > 'Audit Log'. View a chronological record of key activities performed within the application, such as payroll status changes, staff additions, or settings updates. Features advanced filtering by action type, severity level, and date range. Logs can be searched by user, action, or description and are paginated for efficient browsing. Export functionality available for compliance reporting."]
      },
      {
        type: 'subsection',
        subTitle: "FAQ",
        subContent: ["Accessible via 'Utilities' > 'FAQ'. Find answers to Frequently Asked Questions. Uses an accordion format. You can expand/collapse all items or export the FAQ to PDF using the 'Export as PDF' button (top-right of FAQ card)."]
      },
      {
        type: 'subsection',
        subTitle: "Documentation",
        subContent: ["Accessible via 'Utilities' > 'Documentation'. This page. Provides a comprehensive guide. You can expand/collapse all items or export to PDF using the 'Export as PDF' button (top-right of this page's card)."]
      },
      {
        type: 'subsection',
        subTitle: "Support",
        subContent: ["Accessible via 'Utilities' > 'Support'. Contact information (Primary Admin's email/phone) and working hours (Mon-Fri, 9am-5pm CAT) are available. Links to self-help resources."]
      }
    ]
  },
  {
    id: "theme-appearance",
    title: "8. Theme & Appearance",
    content: [
      { type: 'paragraph', text: "Cheetah Payroll supports light and dark themes. Switch using the sun/moon icon in the main header. Default theme is dark. Page titles feature consistent icons."}
    ]
  }
];

const SubSectionDisplay = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="ml-4 mt-3" data-subsection-title={title}>
    <h4
      className="font-semibold text-md mb-1 text-foreground/90 flex items-center"
      dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4 mr-1 text-primary"><polyline points="9 18 15 12 9 6"></polyline></svg> ${title}` }}
    />
    <div className="text-sm space-y-2 text-muted-foreground/90 ml-5 text-justify">
      {children}
    </div>
  </div>
);

export default function DocumentationPage() {
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);
  const allItemValues = documentationContent.map(section => section.id);

  const toggleExpandAll = () => {
    if (allExpanded) {
      setOpenAccordionItems([]);
    } else {
      setOpenAccordionItems(allItemValues);
    }
    setAllExpanded(!allExpanded);
  };

  const handleExportDocumentationPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let yPos = 72;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 72;
    const maxLineWidth = pageWidth - margin * 2;

    const mainTitleFontSize = 18;
    const sectionTitleFontSize = 14;
    const subSectionTitleFontSize = 12;
    const baseFontSize = 10;

    const mainTitleLineHeight = mainTitleFontSize * 1.5;
    const sectionTitleLineHeight = sectionTitleFontSize * 1.5;
    const subSectionTitleLineHeight = subSectionTitleFontSize * 1.5;
    const baseFontLineHeight = baseFontSize * 1.5;

    const spaceAfterMainTitle = baseFontLineHeight * 1.5;
    const sectionTitleSpacingAfter = 10;
    const paragraphSpacing = baseFontLineHeight * 0.5;
    const subsectionTitleSpacingAfter = 5;
    const listBottomMargin = baseFontLineHeight * 0.7;
    const listItemSpacing = baseFontLineHeight * 0.3;
    const numberTextGap = 5;
    const listBulletIndent = 15;


    const checkPageBreak = (currentY: number, neededSpace: number): number => {
      if (currentY + neededSpace > pageHeight - (margin + baseFontLineHeight * 2)) {
        doc.addPage();
        return margin + mainTitleLineHeight;
      }
      return currentY;
    };

    const parseHtmlLikeTags = (htmlString: string): { text: string; isBold: boolean }[] => {
        const segments: { text: string; isBold: boolean }[] = [];
        let remainingText = htmlString;
        let isCurrentlyBold = false;
        while (remainingText.length > 0) {
            const strongOpenIndex = remainingText.indexOf("<strong>");
            const strongCloseIndex = remainingText.indexOf("</strong>");

            if (strongOpenIndex === -1 && strongCloseIndex === -1) {
                if (remainingText) segments.push({ text: remainingText, isBold: isCurrentlyBold });
                break;
            }

            if (strongOpenIndex !== -1 && (strongCloseIndex === -1 || strongOpenIndex < strongCloseIndex)) {
                if (strongOpenIndex > 0) segments.push({ text: remainingText.substring(0, strongOpenIndex), isBold: isCurrentlyBold });
                remainingText = remainingText.substring(strongOpenIndex + "<strong>".length);
                isCurrentlyBold = true;
            } else if (strongCloseIndex !== -1 && (strongOpenIndex === -1 || strongCloseIndex < strongOpenIndex)) {
                 if (strongCloseIndex > 0) segments.push({ text: remainingText.substring(0, strongCloseIndex), isBold: isCurrentlyBold });
                remainingText = remainingText.substring(strongCloseIndex + "</strong>".length);
                isCurrentlyBold = false;
            } else {
                if (remainingText) segments.push({ text: remainingText, isBold: isCurrentlyBold });
                break;
            }
        }
        return segments.filter(s => s.text.trim().length > 0);
    };


    const addStyledText = (
        textSegments: { text: string; isBold: boolean }[],
        initialX: number,
        currentY: number,
        fontSize: number,
        lineHeight: number,
        maxWidthOnLine: number,
        isListItem: boolean = false,
        isMainSectionTitle: boolean = false,
        isSubSectionTitle: boolean = false,
        numberPrefix: string = ""
    ): { y: number; textStartX: number } => {
        let y = currentY;
        let textStartX = initialX;
        let currentWordX = initialX;
        let lineHasContentOnCurrentLine = false;
        let isFirstWordOnLine = true;

        doc.setFontSize(fontSize);
        doc.setFont('helvetica', (isMainSectionTitle || isSubSectionTitle) ? 'bold' : 'normal');


        if (isListItem) {
            const bullet = "•  ";
            doc.text(bullet, initialX, y);
            textStartX = initialX + listBulletIndent;
            currentWordX = textStartX;
            maxWidthOnLine = Math.max(0, maxWidthOnLine - listBulletIndent);
            lineHasContentOnCurrentLine = true;
            isFirstWordOnLine = true;
        } else if ((isMainSectionTitle || isSubSectionTitle) && numberPrefix) {
            doc.setFont('helvetica', 'bold');
            const numWidth = doc.getTextWidth(numberPrefix);
            doc.text(numberPrefix, initialX, y);
            textStartX = initialX + numWidth + numberTextGap;
            currentWordX = textStartX;
            maxWidthOnLine = Math.max(0, maxWidthOnLine - (numWidth + numberTextGap));
            lineHasContentOnCurrentLine = true;
            isFirstWordOnLine = true;
        } else {
           textStartX = initialX;
           currentWordX = textStartX;
           isFirstWordOnLine = true;
        }

        for (const segment of textSegments) {
            doc.setFont('helvetica', (segment.isBold || isMainSectionTitle || isSubSectionTitle) ? 'bold' : 'normal');
            const words = segment.text.split(/\s+/).filter(w => w.length > 0);

            for (let k = 0; k < words.length; k++) {
                const word = words[k];
                const wordWithSpace = word + (k < words.length - 1 || segment.text.endsWith(" ") ? " " : "");
                const wordWidth = doc.getTextWidth(wordWithSpace);

                if (currentWordX + wordWidth > textStartX + maxWidthOnLine && lineHasContentOnCurrentLine && !isFirstWordOnLine) {
                    y += lineHeight;
                    y = checkPageBreak(y, lineHeight);
                    currentWordX = textStartX;
                    isFirstWordOnLine = true;
                }
                doc.text(wordWithSpace, currentWordX, y);
                currentWordX += wordWidth;
                lineHasContentOnCurrentLine = true;
                isFirstWordOnLine = false;
            }
        }

        if (lineHasContentOnCurrentLine) {
             y += lineHeight;
        } else if (textSegments.length === 0 && !isListItem && !isMainSectionTitle && !isSubSectionTitle) {
             y += lineHeight;
        }
        return { y , textStartX };
    };

    yPos = checkPageBreak(yPos, mainTitleLineHeight);
    const { y: titleActualEndY } = addStyledText(parseHtmlLikeTags("Cheetah Payroll Documentation"), margin, yPos, mainTitleFontSize, mainTitleLineHeight, maxLineWidth, false, true);
    yPos = titleActualEndY + spaceAfterMainTitle;

    documentationContent.forEach(section => {
      const sectionTitleTextOnly = section.title.replace(/^(\d+\.\s*)/, '');
      const sectionTitleSegments = parseHtmlLikeTags(sectionTitleTextOnly);
      const sectionTitleNumberMatch = section.title.match(/^(\d+\.\s*)/);
      const sectionTitleNumber = sectionTitleNumberMatch ? sectionTitleNumberMatch[0] : "";

      const estSectionTitleHeight = sectionTitleLineHeight;
      let firstContentEstimatedHeight = 0;
      if (section.content.length > 0) {
          const firstContentItem = section.content[0];
          if (firstContentItem?.type === 'paragraph' && typeof firstContentItem.text === 'string') firstContentEstimatedHeight = baseFontLineHeight;
          else if (firstContentItem?.type === 'list' && firstContentItem.items && firstContentItem.items.length > 0) firstContentEstimatedHeight = baseFontLineHeight;
          else if (firstContentItem?.type === 'subsection' && firstContentItem.subTitle) firstContentEstimatedHeight = subSectionTitleLineHeight;
      }
      yPos = checkPageBreak(yPos, estSectionTitleHeight + firstContentEstimatedHeight + sectionTitleSpacingAfter);

      doc.setFont('helvetica', 'bold');
      const { y: sectionEndY, textStartX: sectionTextActualStartX } = addStyledText(
          sectionTitleSegments,
          margin,
          yPos,
          sectionTitleFontSize,
          sectionTitleLineHeight,
          maxLineWidth,
          false, true, false, sectionTitleNumber
      );
      yPos = sectionEndY;

      section.content.forEach(item => {
        const contentStartX = sectionTextActualStartX;
        if (item.type === 'paragraph' && item.text) {
          const segments = parseHtmlLikeTags(item.text);
          yPos = checkPageBreak(yPos, baseFontLineHeight);
          const { y: paraEndY } = addStyledText(segments, contentStartX, yPos, baseFontSize, baseFontLineHeight, maxLineWidth - (contentStartX - margin));
          yPos = paraEndY + paragraphSpacing;
        } else if (item.type === 'list' && item.items) {
          item.items.forEach(listItemText => {
            const segments = parseHtmlLikeTags(listItemText);
            yPos = checkPageBreak(yPos, baseFontLineHeight);
            const { y: listItemEndY } = addStyledText(segments, contentStartX, yPos, baseFontSize, baseFontLineHeight, maxLineWidth - (contentStartX - margin), true);
            yPos = listItemEndY + listItemSpacing;
          });
          yPos += (listBottomMargin - listItemSpacing);
        } else if (item.type === 'subsection' && item.subTitle && item.subContent) {
          const subTitleSegments = parseHtmlLikeTags(item.subTitle);
          const estSubTitleHeight = subSectionTitleLineHeight;
          let firstSubContentEstHeight = 0;
           if (item.subContent.length > 0) {
              const firstSubContent = item.subContent[0];
              if (typeof firstSubContent === 'string') firstSubContentEstHeight = baseFontLineHeight;
              else if (typeof firstSubContent === 'object' && firstSubContent.type === 'list' && firstSubContent.items && firstSubContent.items.length > 0) firstSubContentEstHeight = baseFontLineHeight;
          }
          yPos = checkPageBreak(yPos, estSubTitleHeight + firstSubContentEstHeight + subsectionTitleSpacingAfter);

          doc.setFont('helvetica', 'bold');
          const { y: subTitleEndY, textStartX: subSectionTextActualStartX } = addStyledText(
              subTitleSegments,
              contentStartX,
              yPos,
              subSectionTitleFontSize,
              subSectionTitleLineHeight,
              maxLineWidth - (contentStartX - margin),
              false, false, true
          );
          yPos = subTitleEndY;

          item.subContent.forEach(subItem => {
            const subContentActualStartX = subSectionTextActualStartX;
            if (typeof subItem === 'string') {
              const segments = parseHtmlLikeTags(subItem);
              yPos = checkPageBreak(yPos, baseFontLineHeight);
              const { y: subParaEndY } = addStyledText(segments, subContentActualStartX, yPos, baseFontSize, baseFontLineHeight, maxLineWidth - (subContentActualStartX - margin));
              yPos = subParaEndY + paragraphSpacing;
            } else if (typeof subItem === 'object' && subItem.type === 'list' && subItem.items) {
              subItem.items.forEach(subListItemText => {
                const segments = parseHtmlLikeTags(subListItemText);
                yPos = checkPageBreak(yPos, baseFontLineHeight);
                const { y: subListItemEndY } = addStyledText(segments, subContentActualStartX, yPos, baseFontSize, baseFontLineHeight, maxLineWidth - (subContentActualStartX - margin), true);
                yPos = subListItemEndY + listItemSpacing;
              });
              yPos += (listBottomMargin - listItemSpacing);
            }
          });
        }
      });
      yPos += sectionTitleSpacingAfter;
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text("Cheetah Payroll - Documentation", margin, margin / 2, { align: 'left' });
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - margin, margin / 2, { align: 'right' });
      const footerTextY = pageHeight - margin / 2;
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, footerTextY, { align: 'center' });
      doc.text("Powered by Cheetah Payroll", margin, footerTextY, { align: 'left' });
      doc.setTextColor(0);
    }
    doc.save("cheetah_payroll_documentation.pdf");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpenText className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">Documentation</h1>
          </div>
          <p className="text-muted-foreground">
            Explore guides and information about Cheetah Payroll&apos;s features.
          </p>
        </div>
      </div>
      <Card>
        <div className="flex justify-end space-x-2 p-4 pt-6 pb-2">
            <Button variant="outline" onClick={toggleExpandAll} size="sm">
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              {allExpanded ? "Collapse All" : "Expand All"}
            </Button>
            <Button variant="outline" onClick={handleExportDocumentationPdf} size="sm">
            <Download className="mr-2 h-4 w-4" /> Export as PDF
            </Button>
        </div>
        <CardHeader className="pt-2">
          <div>
            <CardTitle className="flex items-center">
              <BookOpenText className="mr-2 h-6 w-6 text-primary" />
              Cheetah Payroll System Overview
            </CardTitle>
            <CardDescription>
              Comprehensive information to help you use Cheetah Payroll effectively.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion
            type="multiple"
            className="w-full space-y-1"
            value={openAccordionItems}
            onValueChange={setOpenAccordionItems}
          >
            {documentationContent.map((section) => (
              <AccordionItem value={section.id} key={section.id} data-section-title={section.title}>
                <AccordionTrigger className="text-lg hover:no-underline">{section.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {section.content.map((item, itemIndex) => {
                      if (item.type === 'paragraph' && item.text) {
                        return <p key={itemIndex} dangerouslySetInnerHTML={{ __html: item.text }} className="text-justify"/>;
                      } else if (item.type === 'list' && item.items) {
                        return (
                          <ul key={itemIndex} className="list-disc space-y-1 pl-6 text-justify">
                            {item.items.map((listItem, listItemIndex) => (
                              <li key={listItemIndex} dangerouslySetInnerHTML={{ __html: listItem }}/>
                            ))}
                          </ul>
                        );
                      } else if (item.type === 'subsection' && item.subTitle && item.subContent) {
                        return (
                          <SubSectionDisplay title={item.subTitle} key={itemIndex}>
                            {item.subContent.map((subItem, subItemIndex) => {
                              if (typeof subItem === 'string') {
                                return <p key={subItemIndex} dangerouslySetInnerHTML={{ __html: subItem }} className="text-justify"/>;
                              } else if (typeof subItem === 'object' && subItem.type === 'list' && subItem.items) {
                                return (
                                  <ul key={subItemIndex} className="list-disc space-y-1 pl-6 text-justify">
                                    {subItem.items.map((listItem, listItemIndex) => (
                                      <li key={listItemIndex} dangerouslySetInnerHTML={{ __html: listItem }} />
                                    ))}
                                  </ul>
                                );
                              }
                              return null;
                            })}
                          </SubSectionDisplay>
                        );
                      }
                      return null;
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
           <p className="mt-6 text-sm text-muted-foreground text-justify">
                This documentation provides an overview of Cheetah Payroll&apos;s current capabilities. As the application evolves, this guide will be updated.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
