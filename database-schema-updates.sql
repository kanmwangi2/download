-- =====================================================
-- CHEETAH PAYROLL DATABASE SCHEMA UPDATES
-- Required changes to align with current codebase
-- Date: June 23, 2025
-- =====================================================

-- =====================================================
-- 1. CREATE MISSING TABLES
-- =====================================================

-- Table: user_avatars (for profile picture storage)
CREATE TABLE IF NOT EXISTS public.user_avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table: custom_field_definitions (for company-specific custom fields)
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date')),
  order_index INTEGER DEFAULT 0,
  is_deletable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: users (comprehensive user management table)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Payroll Preparer' CHECK (role IN (
    'Primary Admin', 
    'App Admin', 
    'Company Admin', 
    'Payroll Approver', 
    'Payroll Preparer'
  )),
  assigned_company_ids TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE MISSING INDEXES
-- =====================================================

-- Indexes for user_avatars
CREATE INDEX IF NOT EXISTS idx_user_avatars_user_id ON public.user_avatars(user_id);

-- Indexes for custom_field_definitions
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_company_id ON public.custom_field_definitions(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_order ON public.custom_field_definitions(company_id, order_index);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- =====================================================
-- 3. CREATE TABLE ALIASES/VIEWS FOR NAMING CONSISTENCY
-- =====================================================

-- Create a view to alias staff_members as staff (if staff_members exists)
-- This allows code using 'staff' table name to work with 'staff_members'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_members' AND table_schema = 'public') THEN
        -- Create view if staff_members exists but staff doesn't
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff' AND table_schema = 'public') THEN
            EXECUTE 'CREATE VIEW public.staff AS SELECT * FROM public.staff_members';
        END IF;
    ELSE
        -- If staff_members doesn't exist, rename the table reference in schema
        -- (This should be done manually if needed)
        RAISE NOTICE 'staff_members table not found. Please check your schema.';
    END IF;
END $$;

-- =====================================================
-- 4. UPDATE TRIGGERS FOR NEW TABLES
-- =====================================================

-- Updated_at triggers for new tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_user_avatars_updated_at 
    BEFORE UPDATE ON public.user_avatars 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_field_definitions_updated_at 
    BEFORE UPDATE ON public.custom_field_definitions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_avatars (users can only access their own avatar)
CREATE POLICY "Users can view their own avatar" ON public.user_avatars
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatar" ON public.user_avatars
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for custom_field_definitions (company-based access)
CREATE POLICY "Users can view custom fields for their companies" ON public.custom_field_definitions
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_company_assignments 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Company admins can manage custom fields" ON public.custom_field_definitions
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.user_company_assignments 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr')
        )
    );

-- RLS Policies for users table (admin access only)
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_company_assignments 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_company_assignments 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =====================================================
-- 6. INSERT SAMPLE DATA (if needed)
-- =====================================================

-- Insert default custom field definitions for demo companies
INSERT INTO public.custom_field_definitions (company_id, name, type, order_index, is_deletable)
SELECT 
    c.id,
    'T-Shirt Size',
    'text',
    1,
    true
FROM public.companies c
WHERE c.name LIKE '%Umoja Tech%'
ON CONFLICT DO NOTHING;

INSERT INTO public.custom_field_definitions (company_id, name, type, order_index, is_deletable)
SELECT 
    c.id,
    'Transport Route',
    'text',
    1,
    true
FROM public.companies c
WHERE c.name LIKE '%Isoko Trading%'
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify the schema updates
/*
-- Check if all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('companies', 'user_profiles', 'staff_members', 'staff', 'users', 'user_avatars', 'custom_field_definitions');

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_avatars', 'custom_field_definitions', 'users');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('user_avatars', 'custom_field_definitions', 'users');
*/
