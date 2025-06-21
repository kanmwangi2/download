// Simple database setup for Cheetah Payroll
export async function setupDatabaseTables() {
  console.log('🔄 Setting up database tables...')
  
  // Manual instructions for now since MCP requires additional setup
  const instructions = `
## 🗄️ Manual Database Setup Instructions

Since the automated setup requires additional MCP configuration, please follow these steps:

### Step 1: Go to your Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project: riqstacwobdwhruuzdtx
3. Go to "SQL Editor"

### Step 2: Run this SQL to create all tables:

\`\`\`sql
-- Enable extensions
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'hr', 'user')),
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
ON CONFLICT DO NOTHING;
\`\`\`

### Step 3: Enable Row Level Security (RLS)
Run this SQL to enable security:

\`\`\`sql
-- Enable RLS
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
CREATE POLICY "Allow all for authenticated users" ON public.audit_logs FOR ALL TO authenticated USING (true);
\`\`\`

### Step 4: Test your setup
After running the SQL, go to /signup and test user creation!
`

  console.log(instructions)
  return instructions
} 