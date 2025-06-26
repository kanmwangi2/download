# **App Name**: Cheetah Payroll

## Core Features:

- Login Page: Login page with email and password fields, including a 'Forgot Password' link.
- Company Selection: Company selection page displaying a list of companies the user is assigned to, along with a logout button.
- Main Layout: Main application layout with left navigation (Dashboard, Staff, Payments, Deductions, Payroll, Payslips, Utilities), top header (user avatar, company settings, switch company, logout, light/dark mode toggle), and central content area.
- Dashboard: Dashboard landing page for displaying key metrics and summaries.
- Staff Management: Staff page to manage employee records including first name, last name, email, phone number, department, bank details and status.
- Payment Details: Payments page for editing individual staff payment details, including basic pay, allowances, and payment type (Gross or Net).
- Payroll Processing: Payroll page to create and manage payroll runs for a specific month and year. Workflow includes statuses (Draft, To Approve, Rejected, Approved) and payroll calculation columns (Gross Salary, deductions, Net Pay).

## Architecture & Technology (2025):

- **Frontend:** Next.js (React, TypeScript)
- **UI:** ShadCN UI (Radix UI, Tailwind CSS)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Functions)
- **Cloud-Native:** Fully migrated from IndexedDB to Supabase. All data is securely stored in Supabase PostgreSQL and accessible from any device with proper credentials. No data is stored in the browser or local device storage.
- **Real-time:** Leverages Supabase real-time features for instant data synchronization across all user sessions.
- **Multi-User:** Supports multiple users, companies, and roles with secure authentication and authorization through Supabase Auth.
- **Deployment:** Optimized for Vercel with webpack configuration for Supabase dependencies, memory optimization, and build-time safety checks.
- **Build System:** Enhanced with TypeScript strict mode, environment validation, and production-ready error handling.

## Deployment & Build Configuration:

- **Vercel Optimized:** Custom webpack configuration handles Supabase dependencies and WebSocket fallbacks
- **Memory Management:** Configured with 4GB memory allocation for successful builds
- **Environment Safety:** Build-time validation prevents deployment failures while maintaining security
- **Real-time Optimization:** Production builds include optimized Supabase real-time client configuration
- **Type Safety:** Full TypeScript strict mode compliance with comprehensive error handling

### Environment Variables

#### Required Variables (Vercel Dashboard)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Optional Variables
```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

#### Development (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
PORT=3000
```

### Deployment Process

1. **Connect GitHub Repository** to Vercel
2. **Set Environment Variables** in Vercel dashboard
3. **Auto-deployment** on push to main branch
4. **Build Optimization**: 4GB memory, webpack externals, type checking
5. **Error Prevention**: Build-time safety checks, environment validation

### Build Configuration

- **next.config.ts**: Webpack configuration for Supabase dependencies
- **vercel.json**: Memory allocation and function timeouts
- **Type Checking**: Pre-build TypeScript validation
- **Memory Management**: Optimized for large dependency trees

## Style Guidelines:

- Primary color: Soft indigo (#667EEA) for a calm and professional feel. This hue aligns with feelings of security, intelligence, and order. While dark blue can sometimes feel cold, indigo contains some red to create a balance.
- Background color: Dark, desaturated indigo (#2D3748) for the default dark mode. This works well with the primary indigo for a high-contrast yet professional scheme.
- Accent color: Pale blue (#A3BFFA) for interactive elements. This works because it is 30 degrees to the 'left' of indigo in hue; in addition, it contrasts the background color strongly, due to being lighter and more saturated.
- Body and headline font: 'Inter' (sans-serif) for a clean, modern, and readable interface.
- Use consistent, professional-looking icons for navigation and actions.
- Maintain a consistent three-part layout with left navigation, top header, and central content area for all pages.
- Incorporate subtle transitions and animations for a smooth user experience when navigating and performing actions.
