-- =====================================================
-- CHEETAH PAYROLL DATABASE SCHEMA
-- Migration from IndexedDB to Supabase PostgreSQL
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLE: companies
-- Core company information for multi-tenancy
-- =====================================================
CREATE TABLE public.companies (
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

-- =====================================================
-- TABLE: user_profiles
-- User profiles linked to Supabase Auth
-- =====================================================
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: user_company_assignments
-- Many-to-many relationship between users and companies
-- =====================================================
CREATE TABLE public.user_company_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'hr', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- =====================================================
-- TABLE: departments
-- Company departments for staff organization
-- =====================================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- =====================================================
-- TABLE: staff_members
-- Core employee records with comprehensive details
-- =====================================================
CREATE TABLE public.staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  staff_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  staff_rssb_number TEXT,
  employee_category TEXT CHECK (employee_category IN ('P', 'C', 'E', 'S')),
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  birth_date DATE,
  department TEXT,
  designation TEXT,
  employment_date DATE,
  nationality TEXT,
  id_passport_number TEXT,
  province TEXT,
  district TEXT,
  sector TEXT,
  cell TEXT,
  village TEXT,
  bank_name TEXT,
  bank_code TEXT,
  bank_account_number TEXT,
  bank_branch TEXT,
  key_contact_name TEXT,
  key_contact_relationship TEXT,
  key_contact_phone TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, staff_number)
);

-- =====================================================
-- TABLE: payment_types
-- Configurable payment types per company
-- =====================================================
CREATE TABLE public.payment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Added for type (Gross/Net)
  order_number INTEGER NOT NULL DEFAULT 0, -- Added for ordering
  is_fixed_name BOOLEAN DEFAULT false, -- Added for mapping
  is_deletable BOOLEAN DEFAULT true, -- Added for mapping
  is_taxable BOOLEAN DEFAULT true,
  is_pensionable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- =====================================================
-- TABLE: deduction_types
-- Configurable deduction types per company
-- =====================================================
CREATE TABLE public.deduction_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_number INTEGER NOT NULL DEFAULT 0, -- Added for ordering
  is_fixed_name BOOLEAN DEFAULT false, -- Added for mapping
  is_deletable BOOLEAN DEFAULT true, -- Added for mapping
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- =====================================================
-- TABLE: staff_payment_configs
-- Payment configuration for each staff member
-- =====================================================
CREATE TABLE public.staff_payment_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  basic_pay DECIMAL(15,2) DEFAULT 0,
  payment_type TEXT DEFAULT 'Gross' CHECK (payment_type IN ('Gross', 'Net')),
  allowances JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, staff_id)
);

-- =====================================================
-- TABLE: staff_deductions
-- Deduction records for staff members
-- =====================================================
CREATE TABLE public.staff_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  deduction_type TEXT NOT NULL,
  amount DECIMAL(15,2) DEFAULT 0,
  is_percentage BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: tax_settings
-- Tax configuration per company (global settings)
-- =====================================================
CREATE TABLE public.tax_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  paye_band1_limit DECIMAL(15,2),
  paye_band2_limit DECIMAL(15,2),
  paye_band3_limit DECIMAL(15,2),
  paye_rate1 DECIMAL(5,2),
  paye_rate2 DECIMAL(5,2),
  paye_rate3 DECIMAL(5,2),
  paye_rate4 DECIMAL(5,2),
  pension_employer_rate DECIMAL(5,2),
  pension_employee_rate DECIMAL(5,2),
  maternity_employer_rate DECIMAL(5,2),
  maternity_employee_rate DECIMAL(5,2),
  cbhi_rate DECIMAL(5,2),
  rama_employer_rate DECIMAL(5,2),
  rama_employee_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id)
);

-- =====================================================
-- TABLE: payroll_runs
-- Payroll run summaries and status tracking
-- =====================================================
CREATE TABLE public.payroll_runs (
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

-- =====================================================
-- TABLE: payroll_run_details
-- Detailed payroll calculations per staff member
-- =====================================================
CREATE TABLE public.payroll_run_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  basic_pay DECIMAL(15,2) DEFAULT 0,
  allowances JSONB DEFAULT '{}',
  gross_salary DECIMAL(15,2) DEFAULT 0,
  deductions JSONB DEFAULT '{}',
  total_deductions DECIMAL(15,2) DEFAULT 0,
  net_pay DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(payroll_run_id, staff_id)
);

-- =====================================================
-- TABLE: audit_logs
-- Activity tracking and audit trail
-- =====================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  company_id UUID REFERENCES companies(id),
  action TEXT NOT NULL,
  details TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Companies
CREATE INDEX idx_companies_name ON companies(name);

-- Staff members
CREATE INDEX idx_staff_company_id ON staff_members(company_id);
CREATE INDEX idx_staff_email ON staff_members(email);
CREATE INDEX idx_staff_status ON staff_members(status);
CREATE INDEX idx_staff_department ON staff_members(department);

-- User company assignments
CREATE INDEX idx_user_company_user_id ON user_company_assignments(user_id);
CREATE INDEX idx_user_company_company_id ON user_company_assignments(company_id);

-- Payment configs
CREATE INDEX idx_payment_configs_staff_id ON staff_payment_configs(staff_id);
CREATE INDEX idx_payment_configs_company_id ON staff_payment_configs(company_id);

-- Deductions
CREATE INDEX idx_deductions_staff_id ON staff_deductions(staff_id);
CREATE INDEX idx_deductions_company_id ON staff_deductions(company_id);

-- Payroll runs
CREATE INDEX idx_payroll_runs_company_id ON payroll_runs(company_id);
CREATE INDEX idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX idx_payroll_runs_year_month ON payroll_runs(year, month);

-- Payroll run details
CREATE INDEX idx_payroll_details_run_id ON payroll_run_details(payroll_run_id);
CREATE INDEX idx_payroll_details_staff_id ON payroll_run_details(staff_id);

-- Audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_payment_configs_updated_at BEFORE UPDATE ON staff_payment_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_deductions_updated_at BEFORE UPDATE ON staff_deductions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_settings_updated_at BEFORE UPDATE ON tax_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_runs_updated_at BEFORE UPDATE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();