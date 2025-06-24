# Cheetah Payroll

Cheetah Payroll is a modern multi-company payroll management application built with Next.js, Supabase, and Tailwind CSS.

## Features

- Multi-company support
- Staff and user management
- Payroll runs and approvals
- Custom payment and deduction types
- Tax and statutory settings
- Import/export staff and payroll data
- Secure authentication (Supabase Auth)

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Configure environment variables:**
   - Copy `.env.example` to `.env.local` and fill in your Supabase credentials.
3. **Run the development server:**
   ```sh
   npm run dev
   ```
4. **Access the app:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture & Utilities

### Code Quality & Error Handling
- **TypeScript Strict Mode**: Enabled for better type safety
- **ESLint**: Enhanced configuration with strict rules for code quality
- **Error Boundary**: Global error handling with `ErrorBoundary` component
- **Error Utilities**: Standardized error handling in `src/lib/error-handling.ts`

### Performance Optimization
- **Performance Utilities**: Memoization and optimization helpers in `src/lib/performance.ts`
- **Loading States**: Standardized loading components in `src/components/ui/loading.tsx`
- **Context Optimization**: Optimized React contexts with proper memoization

### Custom Hooks
- **Common Patterns**: Reusable hooks for forms, queries, and pagination in `src/hooks/use-common.ts`
- **Performance Hooks**: Debouncing, throttling, and expensive computation hooks

### Security & Accessibility
- **Security Utilities**: Environment variable and security helpers in `src/lib/security.ts`
- **Accessibility**: ARIA and accessibility utilities in `src/lib/accessibility.ts`

### Development Best Practices
- Use the standardized loading components for consistent UX
- Leverage custom hooks for common patterns
- Implement proper error boundaries for robust error handling
- Use performance utilities for expensive operations
- Follow TypeScript strict mode and ESLint rules

## Usage

- Sign up or sign in with your credentials.
- Select or create a company profile.
- Add staff, configure payroll, and manage deductions/payments.
- Run payroll, review reports, and export data as needed.

For more details, see the documentation in the `docs/` folder.
