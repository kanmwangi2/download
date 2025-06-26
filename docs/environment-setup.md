# Environment Setup for Cheetah Payroll

This document explains how to set up the required environment variables for the Cheetah Payroll application.

## Required Environment Variables

The application requires the following environment variables to connect to Supabase:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in or create an account
3. Click "New Project"
4. Fill in your project details and create the project
5. Wait for the project to be set up (usually takes a few minutes)

### 2. Get Your Environment Variables

1. In your Supabase project dashboard, go to **Settings > General**
2. Copy the **Project URL** (it looks like `https://your-project-id.supabase.co`)
3. Go to **Settings > API**
4. Copy the **anon/public** key from the "Project API keys" section

### 3. Set Up Your Local Environment

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

### 4. Verify the Setup

1. Open your browser's developer console
2. Look for Supabase connection logs that should show successful client creation
3. Try saving a company - it should now work instead of showing "Unknown error"

## Database Schema

Make sure your Supabase database has the required tables. You can run the SQL scripts in the `docs/` folder:

- `docs/database-schema.sql` - Creates all required tables
- `docs/rls-policies.sql` - Sets up row-level security policies

## Troubleshooting

### "Save Failed - Could not save company. Unknown error"

This error typically means:
1. Environment variables are not set correctly
2. Supabase client cannot connect to the database
3. Database tables are missing

Check the browser console for detailed error messages and Supabase connection logs.

### Environment Variables Not Working

1. Ensure variable names start with `NEXT_PUBLIC_` for client-side access
2. Restart the development server after changing environment variables
3. Check that `.env.local` is in the project root directory
4. Verify the variables are not commented out or malformed

### Database Connection Issues

1. Verify your Supabase project URL and API key are correct
2. Check that your Supabase project is active and not paused
3. Ensure your database has the required tables and policies
4. Check Supabase project logs for any access issues

## Security Notes

- Never commit `.env.local` or real environment variables to version control
- The `NEXT_PUBLIC_` prefix makes variables available in the browser
- For server-side operations, use `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)
- Set up proper Row Level Security (RLS) policies in your Supabase database
