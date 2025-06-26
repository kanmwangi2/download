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
- **Build Safety:** Build-safe Supabase client with lazy initialization, runtime-only database connections, and comprehensive error handling.

## Deployment & Build Configuration:

- **Vercel Optimized:** Custom webpack configuration handles Supabase dependencies and WebSocket fallbacks
- **Memory Management:** Configured with 4GB memory allocation for successful builds
- **Environment Safety:** Build-time validation prevents deployment failures while maintaining security
- **Real-time Optimization:** Production builds include optimized Supabase real-time client configuration
- **Type Safety:** Full TypeScript strict mode compliance with comprehensive error handling
- **Build-Safe Client:** Supabase client with lazy initialization, async-only operations, and runtime safety checks
- **Error Handling:** Comprehensive error messages for missing environment variables and connection issues

### Environment Variables & Setup

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

#### Setup Instructions

##### 1. Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in or create an account
3. Click "New Project"
4. Fill in your project details and create the project
5. Wait for the project to be set up (usually takes a few minutes)

##### 2. Get Your Environment Variables

1. In your Supabase project dashboard, go to **Settings > General**
2. Copy the **Project URL** (it looks like `https://your-project-id.supabase.co`)
3. Go to **Settings > API**
4. Copy the **anon/public** key from the "Project API keys" section

##### 3. Set Up Your Local Environment

1. Copy the `.env.example` file to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and replace the placeholder values:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

##### 4. Verify the Setup

1. Open your browser's developer console
2. Look for Supabase connection logs that should show successful client creation
3. Try saving a company - it should now work instead of showing "Unknown error"

##### Database Schema

Make sure your Supabase database has the required tables. You can run the SQL scripts in the `docs/` folder:

- `docs/database-schema.sql` - Creates all required tables
- `docs/rls-policies.sql` - Sets up row-level security policies

##### Troubleshooting

###### "Save Failed - Could not save company. Unknown error"

This error typically means:

1. Environment variables are not set correctly
2. Supabase client cannot connect to the database
3. Database tables are missing

Check the browser console for detailed error messages and Supabase connection logs.

###### Environment Variables Not Working

1. Ensure variable names start with `NEXT_PUBLIC_` for client-side access
2. Restart the development server after changing environment variables
3. Check that `.env.local` is in the project root directory
4. Verify the variables are not commented out or malformed

###### Database Connection Issues

1. Verify your Supabase project URL and API key are correct
2. Check that your Supabase project is active and not paused
3. Ensure your database has the required tables and policies
4. Check Supabase project logs for any access issues

##### Security Notes

- Never commit `.env.local` or real environment variables to version control
- The `NEXT_PUBLIC_` prefix makes variables available in the browser
- For server-side operations, use `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)
- Set up proper Row Level Security (RLS) policies in your Supabase database

## Deployment Instructions

### Vercel Deployment

The application is optimized for deployment on Vercel with the following configuration:

#### Prerequisites

- Supabase project with database schema and RLS policies applied
- Environment variables configured
- All dependencies installed and tested locally

#### Deployment Steps

1. **Connect Repository to Vercel**

   - Import your GitHub repository to Vercel
   - Select the appropriate framework preset (Next.js)

2. **Configure Environment Variables**

   - Add all required environment variables in Vercel dashboard
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Add `SUPABASE_SERVICE_ROLE_KEY` for server-side operations

3. **Build Configuration**

   - Memory allocation: 4GB (set in Vercel dashboard)
   - Node.js version: Latest LTS
   - Build command: `npm run build`
   - Install command: `npm install`

4. **Production Verification**
   - Test authentication flow
   - Verify database connectivity
   - Check real-time features
   - Validate company creation and user management

#### Build Optimization Features

- **Webpack Configuration**: Custom configuration handles Supabase dependencies
- **Memory Management**: Optimized for large TypeScript builds
- **Environment Safety**: Build-time validation prevents deployment failures
- **Type Safety**: Full TypeScript strict mode compliance
- **Real-time Support**: Optimized Supabase real-time client configuration

#### Post-Deployment Checklist

- [ ] Authentication works correctly
- [ ] Database operations function properly
- [ ] Company creation and user assignments work
- [ ] Real-time features are active
- [ ] All environment variables are properly configured
- [ ] SSL certificates are valid
- [ ] Performance metrics are acceptable

## Style Guidelines:

- Primary color: Soft indigo (#667EEA) for a calm and professional feel. This hue aligns with feelings of security, intelligence, and order. While dark blue can sometimes feel cold, indigo contains some red to create a balance.
- Background color: Dark, desaturated indigo (#2D3748) for the default dark mode. This works well with the primary indigo for a high-contrast yet professional scheme.
- Accent color: Pale blue (#A3BFFA) for interactive elements. This works because it is 30 degrees to the 'left' of indigo in hue; in addition, it contrasts the background color strongly, due to being lighter and more saturated.
- Body and headline font: 'Inter' (sans-serif) for a clean, modern, and readable interface.
- Use consistent, professional-looking icons for navigation and actions.
- Maintain a consistent three-part layout with left navigation, top header, and central content area for all pages.
- Incorporate subtle transitions and animations for a smooth user experience when navigating and performing actions.
