# Cheetah Payroll System

A modern, cloud-native payroll management application built with Next.js, TypeScript, and Supabase.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## 📚 Documentation

Complete documentation is available in the `docs/` directory:

- **[Full Documentation](docs/README.md)** - Comprehensive setup and usage guide
- **[Change Log](docs/change-log.md)** - Detailed project history and updates
- **[Database Schema](docs/database-schema.sql)** - Complete database structure
- **[Migration Files](docs/migrations/)** - Database migration scripts

## 🏗️ Architecture

### Modern Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Database**: Supabase (PostgreSQL)
- **UI**: ShadCN UI components with Tailwind CSS
- **Architecture**: Object-Oriented service layer with centralized type management

### Key Features

- ✅ Multi-company payroll management
- ✅ Real-time data synchronization
- ✅ Comprehensive audit logging
- ✅ Advanced import/export capabilities
- ✅ Role-based access control
- ✅ Modern responsive design

## 🛠️ Development

### Requirements

- Node.js 18+
- Supabase account
- Modern web browser

### Environment Setup

1. Create a Supabase project
2. Run the database schema from `docs/database-schema.sql`
3. Configure environment variables in `.env.local`
4. Apply any pending migrations from `docs/migrations/`

### Build Configuration

The application includes optimizations for Vercel deployments:

- Webpack configuration for Supabase dependencies
- Build-time environment validation
- Memory optimization for large builds
- Realtime client optimization for production

### Commands

```bash
npm run dev          # Start development server (port 9002)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run build:vercel # Build with type checking for Vercel
```

### Deployment

#### Vercel

1. Connect your GitHub repository to Vercel
2. Set the following environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for API routes)
3. Deploy automatically via GitHub integration

The build configuration (`vercel.json`) includes memory optimization for successful deployments.

## 🌟 Features

- **Staff Management**: Comprehensive employee records with custom fields
- **Payroll Processing**: Advanced calculations with tax handling
- **Payment Types**: Flexible compensation structure configuration
- **Deductions**: Loan and advance management
- **Reports**: Statutory reports and payslip generation
- **Audit Trail**: Complete activity monitoring
- **Multi-format Export**: CSV, Excel, and PDF support

## 📖 In-App Help

The application includes comprehensive help resources:

- **Documentation** (`/app/documentation`) - Complete system guide
- **FAQ** (`/app/utilities/faq`) - Common questions and answers
- **Support** (`/app/support`) - Contact information and help resources
- **Audit Log** (`/app/utilities/audit-log`) - System activity tracking

## 🔧 Configuration

### Database Setup

Run the SQL schema and migrations in your Supabase project:

```sql
-- Run docs/database-schema.sql first
-- Then apply migrations from docs/migrations/
```

### Authentication

The system uses Supabase Auth with role-based permissions:

- Primary Admin (system-wide access)
- App Admin (multi-company management)
- Company Admin (company-specific management)
- Payroll Approver (payroll review)
- Payroll Preparer (payroll creation)

## 📄 License

This project is part of the Cheetah Payroll system. See the full documentation for terms and conditions.

## 🤝 Support

For technical support:

1. Check the in-app Documentation section
2. Review the FAQ page
3. Contact your system administrator
4. Check the audit log for system activity

---

**Built with ❤️ using modern web technologies**
