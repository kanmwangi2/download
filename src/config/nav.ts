import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Building2,
  FileText,
  BadgeMinus,
  SlidersHorizontal,
  BookOpenText,
  LifeBuoy,
  FileSpreadsheet,
  HelpCircle,
  ClipboardList, // Added for Audit Log
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  description?: string;
}

export interface NavGroup {
  title: string;
  isGroup: true;
  children: NavItem[];
}

export type NavElement = NavItem | NavGroup;

export const mainNavItems: NavElement[] = [
  {
    title: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutGrid,
    description: "Overview of activities.",
  },
  {
    title: "OPERATIONS",
    isGroup: true,
    children: [
      {
        title: "Staff",
        href: "/app/staff",
        icon: Building2,
        description: "Manage employee records and custom fields.",
      },
      {
        title: "Payments",
        href: "/app/payments",
        icon: FileText,
        description: "Define payment types and configure staff payments.",
      },
      {
        title: "Deductions",
        href: "/app/deductions",
        icon: BadgeMinus,
        description: "Define deduction types and manage staff deductions.",
      },
      {
        title: "Payroll",
        href: "/app/payroll",
        icon: SlidersHorizontal,
        description: "Process payroll runs.",
      },
      {
        title: "Reports",
        href: "/app/reports",
        icon: FileSpreadsheet,
        description: "Generate tax reports, deduction histories, and payslips."
      },
    ],
  },
  {
    title: "UTILITIES",
    isGroup: true,
    children: [
      {
        title: "Audit Log",
        href: "/app/utilities/audit-log",
        icon: ClipboardList,
        description: "View application activity logs.",
      },
      {
        title: "FAQ",
        href: "/app/utilities/faq",
        icon: HelpCircle,
        description: "Frequently Asked Questions about the app.",
      },
      {
        title: "Documentation",
        href: "/app/documentation",
        icon: BookOpenText,
        description: "Access system documentation and guides.",
      },
      {
        title: "Support",
        href: "/app/support",
        icon: LifeBuoy,
        description: "Get help and support for the application.",
      },
    ],
  },
];
