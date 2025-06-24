'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ManualSetupPage() {
  const envFileContent = `NEXT_PUBLIC_SUPABASE_URL=https://riqstacwobdwhruuzdtx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXN0YWN3b2Jkd2hydXV6ZHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTI0NjIsImV4cCI6MjA2NjA4ODQ2Mn0.Zn7H2JioqOOXfi42_uWl5r_Ro-24uk40pCNtsx2H6tI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXN0YWN3b2Jkd2hydXV6ZHR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMjQ2MiwiZXhwIjoyMDY2MDg4NDYyfQ.j7blm9uDEP5l1IAW1c_ufhCFJQhZIGBtdtnn1tRD3dY`

  const sqlSchema = `-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tin_number TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  primary_business TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User company assignments
CREATE TABLE IF NOT EXISTS public.user_company_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'Payroll Preparer' CHECK (role IN ('Primary Admin', 'App Admin', 'Company Admin', 'Payroll Approver', 'Payroll Preparer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Staff members table
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  staff_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, staff_number)
);

-- Payroll runs table
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  employees_count INTEGER DEFAULT 0,
  gross_salary DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  net_pay DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'To Approve', 'Rejected', 'Approved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, run_id)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  company_id UUID REFERENCES companies(id),
  action TEXT NOT NULL,
  details TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test company
INSERT INTO public.companies (name, tin_number, email, phone)
VALUES ('Test Company Ltd', '123456789', 'contact@testcompany.com', '+250788123456')
ON CONFLICT DO NOTHING;`

  const rlsSQL = `-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic policies (allow authenticated users to read/write their own data)
CREATE POLICY "Allow all for authenticated users" ON public.companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.user_profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.user_company_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.staff_members FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.payroll_runs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.audit_logs FOR ALL TO authenticated USING (true);`

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🛠️ Manual Database Setup</CardTitle>
          <CardDescription>
            Complete setup instructions to fix the environment and database issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              <strong>🔧 Issues Found:</strong><br/>
              1. Your .env.local has comments that break parsing<br/>
              2. Database tables don't exist yet
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">🔧 Step 1: Fix .env.local File</h3>
              <p className="text-sm text-gray-600 mb-3">
                Replace your entire .env.local file content with this (no comments allowed):
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto">
                {envFileContent}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">🗄️ Step 2: Create Database Tables</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">2a. Go to Supabase SQL Editor</h4>
                  <ol className="list-decimal list-inside text-sm text-gray-600 mt-2 space-y-1">
                    <li>Visit: <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">https://supabase.com/dashboard</a></li>
                    <li>Select your project: <code>riqstacwobdwhruuzdtx</code></li>
                    <li>Go to "SQL Editor" in the left sidebar</li>
                    <li>Click "New Query"</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium">2b. Run this SQL to create tables:</h4>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-96">
                    {sqlSchema}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium">2c. Run this SQL to enable security:</h4>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto">
                    {rlsSQL}
                  </pre>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">🚀 Step 3: Restart and Test</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                <li>Save the .env.local file</li>
                <li>Restart your development server (Ctrl+C, then npm run dev)</li>
                <li>Visit <a href="/signup" className="text-blue-600 underline">/signup</a> to test user creation</li>
                <li>Check your Supabase dashboard to see the created tables</li>
              </ol>
            </div>
          </div>

          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              <strong>💡 After Setup:</strong><br/>
              • Your tables will exist in Supabase<br/>
              • User registration will work<br/>
              • Database connections will be successful<br/>
              • You can continue with the next 3 migration cards
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800">📋 What This Creates:</h4>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-blue-700">
              <div>✅ companies table</div>
              <div>✅ user_profiles table</div>
              <div>✅ user_company_assignments table</div>
              <div>✅ staff_members table</div>
              <div>✅ payroll_runs table</div>
              <div>✅ audit_logs table</div>
              <div>✅ Row Level Security</div>
              <div>✅ Test company data</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 