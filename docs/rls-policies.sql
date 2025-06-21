-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- Multi-tenant data isolation for Cheetah Payroll
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deduction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_run_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- UTILITY FUNCTION: Get user companies
-- Returns company IDs that the current user has access to
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_companies()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT company_id 
    FROM user_company_assignments 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USER PROFILES POLICIES
-- Users can only see/edit their own profile
-- =====================================================
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- COMPANIES POLICIES
-- Users can only access companies they're assigned to
-- =====================================================
CREATE POLICY "Users can view assigned companies" ON companies
  FOR SELECT USING (id = ANY(get_user_companies()));

CREATE POLICY "Admins can update companies" ON companies
  FOR UPDATE USING (
    id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = companies.id 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert companies" ON companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- USER COMPANY ASSIGNMENTS POLICIES
-- =====================================================
CREATE POLICY "Users can view own assignments" ON user_company_assignments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage assignments" ON user_company_assignments
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments uca
      WHERE uca.user_id = auth.uid() 
      AND uca.company_id = user_company_assignments.company_id 
      AND uca.role = 'admin'
    )
  );

-- =====================================================
-- STAFF MEMBERS POLICIES
-- =====================================================
CREATE POLICY "Users can view company staff" ON staff_members
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "HR/Admins can manage staff" ON staff_members
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = staff_members.company_id 
      AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- PAYROLL DATA POLICIES
-- =====================================================
CREATE POLICY "Users can view company payroll runs" ON payroll_runs
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "HR/Admins can manage payroll runs" ON payroll_runs
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = payroll_runs.company_id 
      AND role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Users can view company payroll details" ON payroll_run_details
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "HR/Admins can manage payroll details" ON payroll_run_details
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = payroll_run_details.company_id 
      AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- CONFIGURATION POLICIES (Similar pattern)
-- =====================================================
CREATE POLICY "Users can view company configs" ON staff_payment_configs
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "HR/Admins can manage payment configs" ON staff_payment_configs
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = staff_payment_configs.company_id 
      AND role IN ('admin', 'hr')
    )
  );

-- Apply similar policies for other tables
CREATE POLICY "Users can view company deductions" ON staff_deductions
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "HR/Admins can manage deductions" ON staff_deductions
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = staff_deductions.company_id 
      AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- AUDIT LOGS POLICIES
-- =====================================================
CREATE POLICY "Users can view company audit logs" ON audit_logs
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for key tables
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_members;
ALTER PUBLICATION supabase_realtime ADD TABLE payroll_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs; 