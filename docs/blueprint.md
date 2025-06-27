# **App Name**: Cheetah Payroll

## Core Features & Current Implementation:

### **Authentication & User Management**
- **Login System**: Secure authentication with email/password and 'Forgot Password' functionality
- **Company Selection**: Dynamic company selection based on user role and assignments
- **Role-Based Access Control**: Five-tier user role system (Primary Admin, App Admin, Company Admin, Payroll Approver, Payroll Preparer)
- **User Profiles**: Comprehensive user management with profile pictures, contact information, and role assignments

### **Main Application Layout**
- **Responsive Sidebar Navigation**: Collapsible sidebar with navigation groups (Operations, Utilities)
- **Dashboard**: Overview metrics showing active employees, next payroll run, total payroll cost, and deductions
- **Top Header**: User avatar dropdown, company context, theme toggle, and navigation controls
- **Company Context**: All operations are performed within the context of the selected company

### **Core Operations (Multi-Tabbed Interfaces)**

#### **Staff Management**
- **Staff Tab**: Complete employee records with personal details, employment information, bank details, emergency contacts, and custom fields
- **Custom Fields Tab**: Company-specific custom field definitions with ordering and type management
- **Advanced Features**: Import/export (CSV, Excel, PDF), bulk operations, search/filter, pagination

#### **Payment Management**
- **Payment Types Tab**: Configurable payment categories (Gross/Net) with tax and pension settings
- **Staff Payments Tab**: Individual payment configurations with basic pay and allowances per employee
- **Payment Calculation**: Support for both Gross and Net payment types with automatic grossing-up

#### **Deduction Management**
- **Deduction Types Tab**: Company-specific deduction categories (loans, advances, etc.)
- **Staff Deductions Tab**: Individual deduction assignments with amounts, balances, and active status
- **Deduction Processing**: Automatic balance tracking and application during payroll runs

#### **Payroll Processing**
- **Payroll Runs**: Monthly payroll creation with comprehensive calculation engine
- **Workflow Management**: Status tracking (Draft → To Approve → Rejected/Approved)
- **Calculation Engine**: Advanced tax calculations including PAYE, RSSB (Pension/Maternity), RAMA, and CBHI
- **Payroll Detail View**: Employee-level breakdown with statutory and custom deductions
- **Export Capabilities**: Detailed payroll reports and payslips

### **Settings & Configuration**

#### **User Profile Settings**
- **Profile Picture**: Upload and crop functionality
- **Personal Information**: Name, email, phone management
- **Password Management**: Secure password change functionality

#### **Company Settings (Context-Specific)**
- **Company Profile**: Basic company information, registration details, contact information
- **Tax Exemptions**: Toggle individual tax components (PAYE, Pension, Maternity, RAMA, CBHI)
- **Departments**: Company department management with import/export
- **Company Users**: User management specific to the selected company

#### **Application Settings (Global - Admin Only)**
- **Company Management**: System-wide company management for Primary/App Admins
- **User Management**: Global user management with role assignments and company access
- **Global Tax Settings**: System-wide tax rates and calculation parameters

### **Utilities & Support**
- **Audit Log**: Comprehensive activity tracking with filtering, pagination, and export
- **FAQ**: Interactive FAQ system with expandable sections and PDF export
- **Documentation**: Complete system documentation with detailed usage guides
- **Support**: Contact information and help resources with Primary Admin details
- **Reports**: Professional report generation interface (framework ready)

## Architecture & Technology Stack (2025):

- **Frontend Framework:** Next.js 15+ with App Router
- **Language:** TypeScript (strict mode) with comprehensive type safety
- **UI Framework:** ShadCN UI components built on Radix UI primitives
- **Styling:** Tailwind CSS with custom design system
- **Backend Services:** Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Authentication:** Supabase Auth with Row Level Security (RLS)
- **Database:** PostgreSQL with comprehensive schema and audit trails
- **Real-time Features:** Supabase real-time subscriptions for live data updates
- **File Handling:** Advanced import/export (CSV, Excel, PDF) with validation
- **Deployment:** Vercel-optimized with build safety and memory management

## Database Architecture:

### **Core Tables**
- **companies**: Multi-tenant company management with business information
- **user_profiles**: User account information linked to Supabase Auth
- **user_company_assignments**: Many-to-many relationship with role-based access
- **staff_members**: Comprehensive employee records with custom fields support
- **departments**: Company-specific organizational structure

### **Financial & Payroll Tables**
- **payment_types**: Configurable payment categories per company
- **staff_payment_configs**: Individual employee payment configurations
- **deduction_types**: Company-specific deduction categories
- **staff_deductions**: Individual deduction records with balance tracking
- **tax_settings**: Company-specific tax configuration and exemptions
- **payroll_runs**: Payroll run summaries with status tracking
- **payroll_run_details**: Detailed payroll calculations per employee

### **System Tables**
- **audit_logs**: Comprehensive activity tracking and compliance
- **user_avatars**: Profile picture management
- **custom_field_definitions**: Company-specific custom field schemas

### **Security & Access Control**
- **Row Level Security (RLS)**: Comprehensive data isolation per company
- **Role-Based Permissions**: Granular access control based on user roles
- **Multi-Company Support**: Secure data separation with shared user accounts

## Service Architecture:

### **Object-Oriented Service Layer**
- **ServiceRegistry**: Centralized service management and dependency injection
- **BaseService**: Common functionality for all data services
- **Specialized Services**: StaffService, PayrollService, CompanyService, UserService, TaxService, etc.
- **Type-Safe Operations**: Comprehensive TypeScript interfaces for all data operations

### **Business Logic Services**
- **PayrollCalculationService**: Advanced payroll calculation engine with tax handling
- **PayrollValidationService**: Business rule validation for payroll operations
- **PayrollPermissionService**: Role-based access control for payroll features
- **Import/Export Services**: Data validation and transformation utilities

### **Utility Classes**
- **Case Conversion**: Seamless snake_case ↔ camelCase transformation
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Data Validation**: Input validation and business rule enforcement

## User Interface Design:

### **Design System**
- **Primary Color**: Soft indigo (#667EEA) for professional appearance
- **Background**: Dark indigo (#2D3748) for default dark mode
- **Accent Color**: Pale blue (#A3BFFA) for interactive elements
- **Typography**: Inter font family for clean, modern readability
- **Responsive Design**: Mobile-first approach with adaptive layouts

### **Component Architecture**
- **ShadCN UI**: Professional component library built on Radix UI
- **Consistent Patterns**: Standardized layouts, forms, tables, and dialogs
- **Accessibility**: WCAG compliance with keyboard navigation and screen reader support
- **Dark/Light Mode**: System-aware theme switching with user preference persistence

### **Data Presentation**
- **Advanced Tables**: Sorting, filtering, pagination, and bulk operations
- **Professional Forms**: Validation, error handling, and user feedback
- **Interactive Dashboards**: Real-time metrics and status indicators
- **Export Capabilities**: CSV, Excel, and PDF generation with customizable templates

## Deployment & Build Configuration:

### **Vercel Optimization**
- **Custom Webpack Configuration**: Optimized for Supabase dependencies and WebSocket handling
- **Memory Management**: 4GB allocation for successful builds with large dependency trees
- **Environment Safety**: Build-time validation prevents deployment failures
- **Real-time Support**: Production-optimized real-time client configuration

### **Build Safety Features**
- **Lazy Initialization**: Supabase client created only at runtime
- **Environment Validation**: Comprehensive checks for required environment variables
- **Error Handling**: Graceful degradation and user-friendly error messages
- **Type Safety**: Full TypeScript strict mode compliance

### **Performance Optimization**
- **Code Splitting**: Optimized bundle sizes with dynamic imports
- **Tree Shaking**: Elimination of unused code and dependencies
- **Image Optimization**: Next.js automatic image optimization
- **Caching Strategy**: Efficient caching for static assets and API responses

## Development Workflow:

### **Environment Setup**
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Configure Supabase credentials in .env.local

# Run development server
npm run dev
```

### **Required Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Database Setup**
1. Create Supabase project
2. Run `docs/database-schema.sql` to create tables
3. Apply `docs/rls-policies.sql` for security policies
4. Verify setup with sample data

### **Development Commands**
```bash
npm run dev          # Development server (port 9002)
npm run build        # Production build
npm run typecheck    # TypeScript validation
npm run lint         # Code linting
npm run build:vercel # Vercel deployment build
```

## Production Features:

### **Multi-Company Management**
- **Company Isolation**: Complete data separation between companies
- **Shared User Accounts**: Users can access multiple companies based on assignments
- **Role-Based Access**: Different permission levels per company per user
- **Company-Specific Configuration**: Tax settings, payment types, deduction types per company

### **Advanced Payroll Engine**
- **Tax Calculations**: PAYE (4-tier progressive), RSSB Pension, RSSB Maternity, RAMA, CBHI
- **Payment Types**: Support for both Gross and Net payment categories with automatic grossing-up
- **Deduction Management**: Loan tracking, advance payments, custom deductions with balance management
- **Status Workflow**: Draft → To Approve → Rejected/Approved with role-based transitions

### **Import/Export Capabilities**
- **Multiple Formats**: CSV, Excel (XLSX), and PDF export for all major data types
- **Data Validation**: Comprehensive validation during import with detailed error reporting
- **Template Generation**: Downloadable templates for bulk data import
- **Audit Trail**: Complete tracking of all import/export operations

### **Compliance & Audit**
- **Comprehensive Logging**: All user actions tracked with timestamps, IP addresses, and details
- **Data Integrity**: Database constraints and validation ensure data consistency
- **Role-Based Security**: Granular permissions based on user roles and company assignments
- **Export Controls**: Role-based restrictions on data export capabilities

### **User Experience Features**
- **Real-time Updates**: Live data synchronization across user sessions
- **Progressive Enhancement**: Works with JavaScript disabled (forms still function)
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: WCAG-compliant with keyboard navigation and screen reader support

### **Performance & Scalability**
- **Optimized Queries**: Efficient database queries with proper indexing
- **Pagination**: All large data sets paginated for performance
- **Caching Strategy**: Strategic caching of frequently accessed data
- **Build Optimization**: Tree-shaking, code splitting, and bundle optimization

## Security Implementation:

### **Authentication & Authorization**
- **Supabase Auth**: Industry-standard authentication with JWT tokens
- **Row Level Security**: Database-level access control ensuring data isolation
- **Session Management**: Secure session handling with automatic token refresh
- **Password Security**: Encrypted password storage and secure reset functionality

### **Data Protection**
- **Multi-Tenant Security**: Complete data isolation between companies
- **Input Validation**: Comprehensive validation on both client and server
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **XSS Protection**: Input sanitization and output encoding

### **Privacy & Compliance**
- **Data Minimization**: Only collect and store necessary data
- **Audit Trails**: Complete logging for compliance requirements
- **Data Export**: User-controlled data export for compliance
- **Secure Transmission**: HTTPS encryption for all data transmission

## Support & Documentation:

### **In-Application Help**
- **Interactive Documentation**: Complete system guide accessible within the app
- **FAQ System**: Searchable frequently asked questions with categorization
- **Context-Sensitive Help**: Role-based help content and guidance
- **Support Contact**: Direct contact information for technical support

### **Developer Resources**
- **Code Documentation**: Comprehensive inline documentation and TypeScript types
- **API Reference**: Complete service layer documentation
- **Database Schema**: Detailed table structure and relationship documentation
- **Deployment Guide**: Step-by-step deployment instructions

### **Training & Onboarding**
- **User Guides**: Role-specific user guides and walkthroughs
- **Video Tutorials**: Visual guides for complex operations
- **Best Practices**: Recommended workflows and configurations
- **Troubleshooting**: Common issues and resolution steps

---

**Built with modern web technologies for enterprise-grade payroll management**
