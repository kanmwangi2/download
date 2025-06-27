# Cheetah Payroll System

A comprehensive, cloud-native payroll management application built with Next.js 15, TypeScript, and Supabase, designed for multi-company operations with advanced role-based access control.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server (port 9002)
npm run dev
```

Visit [http://localhost:9002](http://localhost:9002) to access the application.

> **Important**: You must configure your Supabase credentials in `.env.local` before the application will function. See the Environment Setup section below for detailed instructions.

## 📚 Documentation

Complete documentation is available in the `docs/` directory:

- **[Application Blueprint](docs/blueprint.md)** - Complete system architecture and feature overview
- **[Database Schema](docs/database-schema.sql)** - Comprehensive database structure with relationships
- **[RLS Policies](docs/rls-policies.sql)** - Row Level Security policies for data protection
- **[Change Log](docs/change-log.md)** - Detailed project evolution and updates

## 🏗️ Architecture & Technology Stack

### **Modern Web Technologies**
- **Frontend**: Next.js 15+ with App Router and TypeScript strict mode
- **UI Framework**: ShadCN UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system and dark/light mode
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Authentication**: Supabase Auth with comprehensive Row Level Security

### **Advanced Features**
- ✅ **Multi-Company Management** with complete data isolation
- ✅ **Role-Based Access Control** (5-tier permission system)
- ✅ **Advanced Payroll Engine** with Rwanda tax calculations
- ✅ **Real-Time Collaboration** with live data synchronization
- ✅ **Comprehensive Audit Trail** for compliance and tracking
- ✅ **Advanced Import/Export** (CSV, Excel, PDF) with validation
- ✅ **Professional UI/UX** with responsive design and accessibility
- ✅ **Production-Ready Deployment** optimized for Vercel

### **Business Logic Implementation**
- **Payment Processing**: Gross/Net payment types with automatic grossing-up
- **Tax Calculations**: PAYE, RSSB (Pension/Maternity), RAMA, CBHI
- **Deduction Management**: Loan tracking, advance payments, balance management
- **Workflow Management**: Draft → Approval → Processing workflow with role gates
- **Custom Fields**: Company-specific data fields with type validation

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 18+ LTS
- Supabase account
- Modern web browser (Chrome, Firefox, Safari, Edge)

### **Environment Configuration**

#### 1. Create Supabase Project
1. Visit [supabase.com](https://supabase.com) and create a new project
2. Wait for project initialization (2-3 minutes)
3. Note your project URL and API keys from the dashboard

#### 2. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 3. Database Setup
```sql
-- Run in your Supabase SQL editor
-- 1. Create tables and schema
\i docs/database-schema.sql

-- 2. Apply security policies
\i docs/rls-policies.sql
```

#### 4. Start Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:9002
```

### **Available Commands**
```bash
npm run dev          # Development server (port 9002, Turbopack)
npm run build        # Production build with optimization
npm run start        # Start production server
npm run lint         # ESLint code linting
npm run typecheck    # TypeScript type checking
npm run build:vercel # Build with type checking for deployment
```

## 🌟 Core Application Features

### **User Management & Authentication**
- **Secure Authentication**: Email/password with forgot password functionality
- **Five-Tier Role System**: Primary Admin, App Admin, Company Admin, Payroll Approver, Payroll Preparer
- **Profile Management**: Profile pictures, contact information, password management
- **Company Assignments**: Users can access multiple companies based on role assignments

### **Multi-Company Operations**
- **Company Selection**: Dynamic company switching with context preservation
- **Data Isolation**: Complete separation of company data with Row Level Security
- **Company Settings**: Individual tax exemptions, departments, user management per company
- **Global Administration**: System-wide company and user management for administrators

### **Staff Management**
- **Comprehensive Records**: Personal details, employment info, bank details, emergency contacts
- **Custom Fields**: Company-specific fields with type validation (text, number, date)
- **Advanced Operations**: Bulk import/export, search/filter, pagination
- **Status Management**: Active/Inactive status with workflow controls

### **Payment & Deduction Systems**
- **Payment Types**: Configurable Gross/Net payment categories with tax settings
- **Staff Payments**: Individual payment configurations with basic pay and allowances
- **Deduction Types**: Company-specific deduction categories (loans, advances, etc.)
- **Deduction Tracking**: Balance management with automatic application during payroll

### **Advanced Payroll Engine**
- **Monthly Payroll Runs**: Comprehensive calculation engine with status workflow
- **Rwanda Tax Compliance**: PAYE (4-tier), RSSB Pension/Maternity, RAMA, CBHI calculations
- **Grossing-Up Support**: Automatic gross salary calculation for Net payment types
- **Approval Workflow**: Draft → To Approve → Rejected/Approved with role-based permissions
- **Detailed Reporting**: Employee-level breakdowns with statutory and custom deductions

### **Reports & Analytics**
- **Dashboard Metrics**: Active employees, next payroll run, cost summaries
- **Export Capabilities**: CSV, Excel, PDF formats for all major data types
- **Audit Trail**: Comprehensive activity logging with timestamps and user tracking
- **Compliance Reports**: Ready framework for statutory reporting requirements

### **Utilities & Support**
- **Interactive Documentation**: Complete system guide accessible within the application
- **FAQ System**: Searchable knowledge base with expandable sections
- **Audit Log**: Activity tracking with advanced filtering and export capabilities
- **Support Integration**: Contact information and help resources

## � Deployment & Production

### **Vercel Deployment (Recommended)**

#### Prerequisites
- Supabase project with schema and RLS policies applied
- Environment variables configured and tested locally
- All features tested in development mode

#### Deployment Steps
1. **Repository Setup**
   - Connect your GitHub repository to Vercel
   - Select Next.js framework preset

2. **Environment Configuration**
   ```env
   # Required in Vercel dashboard
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Build Configuration**
   - Memory allocation: 4GB (configured in `vercel.json`)
   - Node.js version: Latest LTS
   - Build command: `npm run build:vercel`
   - Install command: `npm install`

4. **Post-Deployment Verification**
   - ✅ Authentication flow works correctly
   - ✅ Database operations function properly
   - ✅ Company creation and user management
   - ✅ Real-time features are active
   - ✅ All environment variables configured
   - ✅ Performance metrics acceptable

### **Build Optimization Features**
- **Custom Webpack Configuration**: Handles Supabase dependencies and WebSocket fallbacks
- **Memory Management**: Optimized for large TypeScript builds with 4GB allocation
- **Environment Safety**: Build-time validation prevents deployment failures
- **Type Safety**: Full TypeScript strict mode compliance
- **Real-time Support**: Production-optimized real-time client configuration
- **Bundle Optimization**: Tree-shaking, code splitting, and dynamic imports

## 🔧 Technical Configuration

### **Database Schema Highlights**
- **Multi-Tenant Architecture**: Complete data isolation between companies
- **Comprehensive User Management**: Role-based access with company assignments
- **Advanced Payroll Tables**: Support for complex payroll calculations and history
- **Audit & Compliance**: Complete activity tracking and data integrity
- **Custom Fields Support**: Extensible schema for company-specific requirements

### **Security Implementation**
- **Row Level Security (RLS)**: Database-level access control for multi-tenancy
- **Role-Based Permissions**: Granular access control based on user roles
- **Input Validation**: Comprehensive validation on client and server
- **Session Management**: Secure JWT token handling with automatic refresh
- **Data Protection**: HTTPS encryption, input sanitization, and XSS prevention

### **Performance Optimization**
- **Database Indexing**: Optimized queries with proper indexing strategy
- **Pagination**: All large datasets paginated for performance
- **Real-time Updates**: Efficient Supabase real-time subscriptions
- **Caching Strategy**: Strategic caching of frequently accessed data
- **Bundle Size**: Optimized JavaScript bundles with code splitting

## � In-Application Resources

### **User Documentation**
- **Interactive Documentation** (`/app/documentation`): Complete system guide with role-specific content
- **FAQ System** (`/app/utilities/faq`): Searchable knowledge base with categorized questions
- **Support Page** (`/app/support`): Contact information and help resources with admin details

### **Administrative Tools**
- **Audit Log** (`/app/utilities/audit-log`): Comprehensive activity tracking with filtering and export
- **Global Settings**: System-wide configuration for Primary/App Admins
- **Company Management**: Multi-company administration with user assignment
- **User Management**: Global user management with role assignments

### **Data Management**
- **Import/Export**: Advanced data import with validation and error reporting
- **Bulk Operations**: Efficient bulk data operations with progress tracking
- **Template Generation**: Downloadable templates for data import
- **Format Support**: CSV, Excel (XLSX), and PDF export for all major data types

## 🤝 Support & Maintenance

### **Technical Support**
1. **In-App Documentation**: Start with the comprehensive documentation system
2. **FAQ Review**: Check the frequently asked questions for common issues
3. **Audit Log**: Review system activity for troubleshooting
4. **Administrator Contact**: Contact your Primary Admin for system-specific support

### **System Administration**
- **User Management**: Role assignments and company access control
- **Company Setup**: New company creation and configuration
- **Tax Configuration**: Global and company-specific tax settings
- **Data Backup**: Regular database backups through Supabase

### **Development & Customization**
- **Type-Safe Development**: Comprehensive TypeScript interfaces for all operations
- **Service Architecture**: Object-oriented service layer for business logic
- **Component Library**: ShadCN UI components for consistent interface
- **Extensible Design**: Custom fields and configurable business rules

## 📄 License & Compliance

This project is part of the Cheetah Payroll system. The application includes:

- **Data Privacy**: GDPR-compliant data handling and user controls
- **Audit Compliance**: Comprehensive logging for regulatory requirements
- **Security Standards**: Industry-standard security practices and encryption
- **Accessibility**: WCAG 2.1 compliance for inclusive design

---

**🔗 Key Links:**
- [Application Blueprint](docs/blueprint.md) - Complete technical overview
- [Database Schema](docs/database-schema.sql) - Database structure and relationships
- [Change Log](docs/change-log.md) - Project history and updates
- [Supabase Dashboard](https://supabase.com/dashboard) - Backend management

**Built with ❤️ using Next.js 15, TypeScript, Supabase, and modern web technologies**
