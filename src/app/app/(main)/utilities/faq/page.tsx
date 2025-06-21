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

const faqItems = [
  {
    question: "How do I add a new staff member?",
    answer: "Navigate to the 'Staff' page from the main menu (after selecting a company). Select the 'Staff Members' tab. Click the 'Add Staff' button and fill in the required details in the dialog. This includes standard information and any custom fields defined for the company (e.g., 'T-Shirt Size' for 'Umoja Tech Solutions (Demo)'). The new staff member will be associated with the currently selected company. All data is saved to your browser's IndexedDB, scoped to that company.",
  },
  {
    question: "How do I define a new Payment Type (e.g., Meal Allowance) for my company?",
    answer: "Go to the 'Payments' page (under 'Operations'). Select the 'Payment Types' tab. Click 'Add Payment Type', enter the name (e.g., 'Meal Allowance'), choose if it's 'Gross' or 'Net' for calculation purposes, and save. This new payment type will then be available when configuring individual staff payments. 'Basic Pay' and 'Transport Allowance' are system-defined core types (order 1 and 2), but their Gross/Net status can also be edited here. The order of payment types determines their calculation sequence in payroll.",
  },
  {
    question: "How do I set up payment amounts for a staff member against the defined Payment Types?",
    answer: "On the 'Payments' page, select the 'Staff Payments' tab (this is the default tab). Click 'Add Staff Payment' (for new staff not yet configured) or the edit icon for existing staff to open a dialog. This dialog lists all Payment Types defined for your company. Enter the specific monetary amount for that staff member for each applicable payment type and save. The 'Gross' or 'Net' nature of each payment component for payroll calculation is determined by the setting on the Payment Type itself.",
  },
  {
    question: "Can I delete a Payment Type or Deduction Type I created?",
    answer: "Yes, custom Payment Types (from 'Payments' > 'Payment Types' tab) and custom Deduction Types (from 'Deductions' > 'Deduction Types' tab) can be deleted, provided they are not currently configured for any staff member (for payment types) or used in any staff deduction record (for deduction types). If a type is in use, you must first remove it from all relevant staff configurations/records before it can be deleted. Core types like 'Basic Pay', 'Transport Allowance', 'Advance', 'Charge', and 'Loan' cannot be deleted. These tables support bulk deletion for eligible custom types.",
  },
  {
    question: "How do I define custom data fields for my staff?",
    answer: "On the 'Staff' page, select the 'Custom Fields' tab. Here, you can define company-specific fields (e.g., 'T-Shirt Size', 'Laptop Asset Tag' for Umoja Tech, or 'Transport Route' for Isoko Trading). Click 'Add Custom Field', give it a name, and select its type (Text, Number, or Date). These definitions are specific to the selected company. Once defined, these fields will appear in the 'Add Staff' dialog and the 'Edit Staff' page (in a 'Custom Information' section) for data entry. This is distinct from standard built-in fields like 'Employee Category', which are part of the main staff form. These definitions can also be imported/exported using `custom_fields_template.csv` and `[company-name]_custom_fields_export.[ext]` respectively.",
  },
  {
    question: "Is data shared between companies?",
    answer: "No, all operational data such as staff records (including custom field values), payroll runs, payment types, payment configurations, deductions, deduction types, custom field definitions, and company-specific settings (like departments and company profile) are isolated to the specific company you have selected. The demo includes 'Umoja Tech Solutions (Demo)' (ID: co_001) and 'Isoko Trading Co. (Demo)' (ID: co_002) as examples. Global data includes the list of available companies that can be managed, user accounts, and the system-wide tax configurations which apply to all companies.",
  },
  {
    question: "How is payroll calculated if a Payment Type (e.g., Basic Pay or an allowance) is set to 'Net'?",
    answer: "When a Payment Type's status is set to 'Net' (in 'Payments' > 'Payment Types' tab), the amount entered for an employee against this payment type is treated as the desired <strong>final take-home value for that specific component</strong>. Cheetah Payroll then performs a 'gross-up' calculation for this component. This iterative process determines the necessary additional gross salary required to achieve that component's target net value, considering the tax implications of all previously processed components (in the order defined by Payment Types: Basic Pay, then Transport Allowance, then custom types in their defined order) and the current one. The calculation uses the global tax settings (unless a company-specific exemption is active). On payslips, Basic Pay is listed first. Other non-zero earnings are grouped under an 'Allowances' subheading with a subtotal, which then sums with Basic Pay to form the Total Gross Salary. For a detailed explanation, please see the '<strong>Payment Calculation Logic & Deduction Application</strong>' subsection under 'Payroll Processing' in the main Documentation.",
  },
  {
    question: "How are multiple deductions (loans, advances) applied during payroll?",
    answer: "If an employee has multiple active deductions for the current company, they are applied based on the <strong><code>order</code></strong> defined for each <code>DeductionType</code> in 'Deductions Management' &gt; 'Deduction Types' tab. The system prioritizes core types as follows:<br />&nbsp;&nbsp;&nbsp;&nbsp;1. Advance<br />&nbsp;&nbsp;&nbsp;&nbsp;2. Charge<br />&nbsp;&nbsp;&nbsp;&nbsp;3. Loan<br />Followed by any custom deduction types in their specified order. Within each <code>DeductionType</code> category, if there are multiple deductions of the same type (e.g., two active loans), they are typically processed based on their start date (earliest first). The amount deducted for any single installment is capped by its configured monthly installment or the remaining balance of that deduction, whichever is lower. Refer to the '<strong>Payment Calculation Logic & Deduction Application</strong>' subsection under 'Payroll Processing' in the main Documentation for more details.",
  },
  {
    question: "Where is my data stored? How can I reset the application?",
    answer: "Cheetah Payroll uses your browser's IndexedDB for all data storage. Operational data (staff, payroll, payment types, etc.) is scoped per company. Global data (users, list of companies, tax settings, audit logs) is stored globally. To reset the application to its initial state (including default sample users, the two demo companies 'Umoja Tech Solutions (Demo)' and 'Isoko Trading Co. (Demo)', global tax settings, and sample data like staff, payment types, deduction types, and custom field definitions for the demo companies), you need to clear your browser's site data (cache, cookies, IndexedDB) specifically for the Cheetah Payroll site URL. This will erase all your current data for all companies.",
  },
  {
    question: "How do I change the tax rates (PAYE, Pension, etc.)?",
    answer: "Global tax settings, which apply to all companies, can be configured by users with 'Primary Admin' or 'App Admin' roles. Navigate to 'Application Settings' (from the company selection screen) > 'Global Taxes' tab. Here you can adjust PAYE income bands and percentage rates, as well as contribution rates for Pension, Maternity, RAMA, and CBHI. These settings are saved globally in IndexedDB.",
  },
  {
    question: "How is the RAMA contribution calculated?",
    answer: "RAMA is a medical insurance contribution. In Cheetah Payroll, it is calculated as a percentage of the employee's <strong>Basic Pay</strong>. Both the employer and employee contribute, typically at a rate of 7.5% each, though these rates can be configured in 'Application Settings' > 'Global Taxes'. The employee's contribution is deducted from their salary, while the employer's portion is an additional company cost.",
  },
  {
    question: "Can my company be exempt from certain taxes like PAYE or Pension?",
    answer: "Yes. While global tax rates are set in 'Application Settings', individual companies can be made exempt from specific taxes (PAYE, Pension, Maternity, RAMA, CBHI). In the 'Company Settings' (accessible from the user menu when a company is selected), under the 'Company Details' tab, you'll find 'Tax Exemption Settings'. Here, you can toggle each tax to be 'active' or 'inactive' for the current company. If a tax is set to 'inactive', its rate will be treated as 0% during payroll calculations for that company, effectively overriding the global rate. A confirmation dialog will appear when you change these settings, as it impacts financial calculations.",
  },
  {
    question: "What is the Ishema Report for?",
    answer: "The Ishema Report is a statutory report required by the Rwanda Social Security Board (RSSB). It includes employee details, salary information, and various allowances required for compliance. In Cheetah Payroll, it's the first report generated in the 'Statutory Reports' section and includes details like Employee Category, Basic Salary, and various cash allowances.",
  },
  {
    question: "Can I export reports for tax filing?",
    answer: "Yes. After selecting a company, go to the 'Report Generation' page (under 'Operations' in the navigation menu). Select the 'Statutory Reports' tab. This allows you to generate and download statutory tax compliance and payment reports (Ishema, PAYE, Pension, Maternity, CBHI, Net Salaries) for that specific company. Select an 'Approved' payroll period for the company, generate the reports, and you can preview them or download a ZIP file (`[company-name]_all_statutory_reports_[period-name].zip`) containing all reports in your chosen format (CSV or XLSX). You can also export individual reports directly from the preview dialog (e.g., `[company-name]_PAYE_Report_[period-name].[ext]`).",
  },
  {
    question: "How do I generate employee payslips?",
    answer: "After selecting a company, go to the 'Report Generation' page (under 'Operations' in the navigation menu, path `/app/reports`). Select the 'Payslips' tab. You can generate payslips for employees of that company either by selecting an 'Approved' payroll period (then choosing specific staff or all staff from that run) or by selecting a staff member (then choosing one or more 'Approved' payroll periods they were part of within that company). PDF previews are available in-app, and you can download individual payslips (`[company-name]_payslip_[staff-name]_[period].pdf`) or a ZIP archive (`[company-name]_payslips_export.zip`) of multiple payslips.",
  },
   {
    question: "How are employee deductions (loans, advances) updated after payroll? What if a payroll run is deleted?",
    answer: "When a payroll run that includes an employee's deduction is 'Approved' for the selected company, the system automatically updates the 'Deducted So Far' amount and reduces the 'Balance' for that specific deduction record (visible in 'Deductions' > 'Staff Deductions' tab) for that company. If an 'Approved' payroll run is subsequently deleted, the system will attempt to reverse these deduction updates, increasing the 'Balance' and decreasing the 'Deducted So Far' amount on the original deduction records.",
  },
  {
    question: "What is the basis for generating reports (statutory, payslips, etc.)?",
    answer: "All reports, including statutory compliance documents, employee payslips, and deduction histories, are generated <strong>exclusively</strong> from payroll runs that have been marked as \"Approved\" for the currently selected company.",
  },
  {
    question: "What if I have many items in a list (e.g., staff, deductions)? How can I see them all?",
    answer: "Most data tables in Cheetah Payroll (e.g., Staff, Custom Field Definitions, Deductions, Payroll Runs, Payment Types, Company Lists, User Lists, Departments, Audit Logs) are paginated to improve performance and usability with large datasets. You'll find controls below these tables to navigate between pages, select the number of rows to display per page from a dropdown, and see the total number of items/pages. Most tables also support bulk deletion.",
  },
  {
    question: "I'm importing data via CSV. What are some key things to keep in mind?",
    answer: "For successful CSV imports into the currently selected company: 1. Use the 'Download Template' option (available in the 'Import / Template' dropdown on each relevant page section/tab) to get a CSV file with the exact headers expected. Template names follow a `[feature-name]_import_template.csv` pattern (e.g., `staff_import_template.csv`, `payments_import_template.csv`). 2. Data in the CSV is always assumed to be for the currently selected company. 3. Ensure numeric fields contain only numbers and date fields are in DD/MM/YYYY format. For Staff Payments, column headers must match the *exact names* of your company's defined Payment Types (e.g., `Basic Pay Amount`, `Transport Allowance Amount`). For Staff import, the template will dynamically include columns for any custom fields defined for the company, prefixed with 'Custom: ' (e.g., 'Custom: T-Shirt Size'). If a data field contains commas, enclose the entire field in double quotes.",
  },
  {
    question: "Can I change my login email address or password?",
    answer: "Yes, you can update your email address and password in the 'User Profile' section under 'Settings'. Use the 'Personal Information' tab to change your email and the 'Change Password' tab to update your password. Your email address is used for logging in and must be unique across all users. These changes affect your global user profile.",
  },
  {
    question: "How do I switch between companies?",
    answer: "From the top-right user menu in the main application, select 'Switch Company'. This will take you back to the company selection screen where you can choose a different company profile to work with (e.g., 'Umoja Tech Solutions (Demo)' or 'Isoko Trading Co. (Demo)'). All subsequent operations will then be performed in the context of the newly selected company.",
  },
  {
    question: "Where are the 'Add', 'Import / Template', and 'Export' buttons usually located?",
    answer: "For consistency, these action buttons along with a search bar, are typically located <strong>within the content area of the main card for the active tab</strong> (e.g., 'Staff Members' tab, 'Payment Types' tab, 'Staff Deductions' tab). Look for them at the top of the card's content section, usually just above the table.",
  },
  {
    question: "How can I edit 'Basic Pay' or 'Transport Allowance' to be Gross or Net?",
    answer: "'Basic Pay' and 'Transport Allowance' are core payment types. If they are defined for your company, they will appear in the 'Payment Types' tab on the 'Payments' page. Their Gross/Net status can be edited there by clicking the edit icon. Their names are fixed, and they cannot be deleted. This list is paginated.",
  },
  {
    question: "How do I create a new Payroll Run?",
    answer: "Navigate to the 'Payroll' page. The 'Run New Payroll' button is located within the 'Payroll Runs' card's content area, usually near the search bar. Payroll Run IDs follow the format `PRYYYYMM` (e.g., PR202407). Note: Only one non-Approved run can exist per company at a time.",
  },
  {
    question: "How do I contact support?",
    answer: "Navigate to the 'Support' page (under 'Utilities'). Contact information, including the Primary Admin's email and phone number (if configured in their user profile), are listed there. Working hours are Mon-Fri, 9am-5pm CAT. You can also find links to the Documentation and this FAQ page for self-help.",
  },
  {
    question: "What currency is used in the application?",
    answer: "The application exclusively uses Rwandan Francs (RWF) for all monetary values. This is the default and only operating currency for all companies managed within Cheetah Payroll.",
  },
  {
    question: "Can I save the FAQ or Documentation for offline viewing?",
    answer: "Yes, both the FAQ page and the main Documentation page have an 'Export as PDF' button. This button is located at the top-right of the main card on each page, just above the card's title and description.",
  },
  {
    question: "What is the Audit Log for?",
    answer: "The 'Audit Log' (found under 'Utilities') provides a chronological record of significant actions taken within the application for the selected company, or globally if no company is selected (e.g., user logins, if implemented, or global settings changes). It helps track who did what and when, aiding in accountability and troubleshooting. Examples include payroll run status changes, new staff additions, and modifications to company settings. The log is paginated and searchable.",
  }
];

export default function FaqPage() {
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);
  const allItemValues = faqItems.map((_, index) => `item-${index}`);

  const toggleExpandAll = () => {
    if (allExpanded) {
      setOpenAccordionItems([]);
    } else {
      setOpenAccordionItems(allItemValues);
    }
    setAllExpanded(!allExpanded);
  };


  const handleExportFaqPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let yPos = 72;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 72;
    const maxLineWidth = pageWidth - margin * 2;

    const baseFontSize = 10;
    const questionFontSize = 12;

    const baseFontLineHeight = baseFontSize * 1.5;
    const questionFontLineHeight = questionFontSize * 1.5;

    const questionSpacing = 12;
    const itemSpacing = 15;
    const numberTextGap = 5;
    const contentIndentAfterNumber = 20;

    const checkPageBreak = (currentY: number, neededSpace: number): number => {
      if (currentY + neededSpace > pageHeight - (margin + baseFontLineHeight * 2)) {
        doc.addPage();
        return margin + baseFontLineHeight;
      }
      return currentY;
    };

    const parseHtmlTagsForFaq = (htmlString: string): { text: string; isBold: boolean }[] => {
        const segments: { text: string; isBold: boolean }[] = [];
        let remainingText = htmlString;
        let isCurrentlyBold = false;
        while (remainingText.length > 0) {
            const strongOpenIndex = remainingText.indexOf("<strong>");
            const strongCloseIndex = remainingText.indexOf("</strong>");
            const codeOpenIndex = remainingText.indexOf("<code>");
            const codeCloseIndex = remainingText.indexOf("</code>");
            const brIndex = remainingText.indexOf("<br />");


            let nextTagIndex = Math.min(
                strongOpenIndex !== -1 ? strongOpenIndex : Infinity,
                strongCloseIndex !== -1 ? strongCloseIndex : Infinity,
                codeOpenIndex !== -1 ? codeOpenIndex : Infinity,
                codeCloseIndex !== -1 ? codeCloseIndex : Infinity,
                brIndex !== -1 ? brIndex : Infinity
            );

            if (nextTagIndex === Infinity) {
                if (remainingText) segments.push({ text: remainingText, isBold: isCurrentlyBold });
                break;
            }

            if (nextTagIndex > 0) {
                segments.push({ text: remainingText.substring(0, nextTagIndex), isBold: isCurrentlyBold });
            }

            if (nextTagIndex === strongOpenIndex) {
                remainingText = remainingText.substring(strongOpenIndex + "<strong>".length);
                isCurrentlyBold = true;
            } else if (nextTagIndex === strongCloseIndex) {
                remainingText = remainingText.substring(strongCloseIndex + "</strong>".length);
                isCurrentlyBold = false;
            } else if (nextTagIndex === codeOpenIndex) {
                remainingText = remainingText.substring(codeOpenIndex + "<code>".length);
            } else if (nextTagIndex === codeCloseIndex) {
                 remainingText = remainingText.substring(codeCloseIndex + "</code>".length);
            } else if (nextTagIndex === brIndex) {
                 segments.push({ text: "\n", isBold: false });
                 remainingText = remainingText.substring(brIndex + "<br />".length);
            }
        }
        return segments.filter(s => s.text.trim().length > 0 || s.text === "\n");
    };

    const addStyledTextForFaq = (
        textSegments: { text: string; isBold: boolean }[],
        initialX: number,
        currentY: number,
        fontSize: number,
        lineHeight: number,
        maxWidthOnLine: number,
        isQuestionFormat: boolean = false,
        questionNumberString: string = ""
    ): { y: number; textStartX: number } => {
        let y = currentY;
        let textStartX = initialX;
        let currentWordX = initialX;
        let lineCountForBlock = 0;

        if (isQuestionFormat && questionNumberString) {
            doc.setFontSize(fontSize);
            doc.setFont(undefined, 'bold');
            const numWidth = doc.getTextWidth(questionNumberString);
            doc.text(questionNumberString, initialX, y);
            textStartX = initialX + numWidth + numberTextGap;
            currentWordX = textStartX;
            maxWidthOnLine = Math.max(0, maxWidthOnLine - (numWidth + numberTextGap));
        }

        for (const segment of textSegments) {
            if (segment.text === "\n") {
                y += lineHeight;
                lineCountForBlock++;
                currentWordX = textStartX;
                continue;
            }
            doc.setFontSize(fontSize);
            doc.setFont(undefined, (isQuestionFormat || segment.isBold) ? 'bold' : 'normal');
            const cleanedText = segment.text.replace(/&nbsp;/g, " ");
            const words = cleanedText.split(/\s+/).filter(w => w.length > 0);

            for (let k = 0; k < words.length; k++) {
                const word = words[k];
                const wordWithSpace = word + (k < words.length - 1 ? " " : "");
                const wordWidth = doc.getTextWidth(wordWithSpace);

                if (currentWordX + wordWidth > textStartX + maxWidthOnLine && currentWordX > textStartX) {
                    y += lineHeight;
                    lineCountForBlock++;
                    y = checkPageBreak(y, lineHeight);
                    currentWordX = textStartX;
                }
                doc.text(wordWithSpace, currentWordX, y);
                currentWordX += wordWidth;
                lineCountForBlock = true;
                
            }
        }
        if (textSegments.some(s => s.text.trim().length > 0 && s.text !== "\n")) {
            if (lineCountForBlock === 0) lineCountForBlock = 1;
             y += lineHeight;
        } else if (textSegments.some(s => s.text === "\n")) {
        } else {
             y += lineHeight;
        }
        return { y, textStartX };
    };

    yPos = checkPageBreak(yPos, questionFontLineHeight * 2);
    const { y: titleEndY } = addStyledTextForFaq(parseHtmlTagsForFaq("Frequently Asked Questions (FAQ)"), margin, yPos, 18, 18 * 1.5, maxLineWidth);
    yPos = titleEndY;

    faqItems.forEach((item, index) => {
      const questionTextForParsing = item.question;
      const questionSegments = parseHtmlTagsForFaq(questionTextForParsing);
      const questionNumberPrefix = `${index + 1}. `;

      let estQuestionHeight = questionFontLineHeight;
      let firstAnswerLineHeight = 0;
      if (item.answer) { firstAnswerLineHeight = baseFontLineHeight; }

      yPos = checkPageBreak(yPos, estQuestionHeight + firstAnswerLineHeight + questionSpacing);

      const { y: questionEndY, textStartX: questionActualTextStartX } = addStyledTextForFaq(
          questionSegments,
          margin,
          yPos,
          questionFontSize,
          questionFontLineHeight,
          maxLineWidth,
          true,
          questionNumberPrefix
      );
      yPos = questionEndY;

      if (item.answer) {
        const answerSegments = parseHtmlTagsForFaq(item.answer);
        yPos = checkPageBreak(yPos, baseFontLineHeight);
        const { y: answerEndY } = addStyledTextForFaq(
            answerSegments,
            questionActualTextStartX, 
            yPos,
            baseFontSize,
            baseFontLineHeight,
            maxLineWidth - (questionActualTextStartX - margin) 
        );
        yPos = answerEndY;
      }
      yPos += itemSpacing;
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text("Cheetah Payroll - FAQ", margin, margin / 2, { align: 'left' });
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - margin, margin / 2, { align: 'right' });
      const footerTextY = pageHeight - margin / 2;
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, footerTextY, { align: 'center' });
      doc.text("Powered by Cheetah Payroll", margin, footerTextY, { align: 'left' });
      doc.setTextColor(0);
    }
    doc.save("cheetah_payroll_faq.pdf");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">Frequently Asked Questions</h1>
          </div>
          <p className="text-muted-foreground">
            Find answers to common questions about using Cheetah Payroll.
          </p>
        </div>
      </div>

      <Card>
        <div className="flex justify-end space-x-2 p-4 pt-6 pb-2">
            <Button variant="outline" onClick={toggleExpandAll} size="sm">
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              {allExpanded ? "Collapse All" : "Expand All"}
            </Button>
            <Button variant="outline" onClick={handleExportFaqPdf} size="sm">
              <Download className="mr-2 h-4 w-4" /> Export as PDF
            </Button>
        </div>
        <CardHeader className="pt-2">
          <div>
            <CardTitle className="flex items-center">
              <HelpCircle className="mr-2 h-6 w-6 text-primary" />
              Common Questions
            </CardTitle>
            <CardDescription>
              Browse through these FAQs. If you can&apos;t find your answer, check the Documentation or contact Support.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {faqItems.length > 0 ? (
            <Accordion
                type="multiple"
                className="w-full"
                value={openAccordionItems}
                onValueChange={setOpenAccordionItems}
            >
              {faqItems.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={`faq-${index}`}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-justify">
                    <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground">No FAQs available at the moment. Please check back later.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
