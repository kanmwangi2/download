-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- Multi-tenant data isolation for Cheetah Payroll
-- =====================================================

-- =====================================================
-- TROUBLESHOOTING SECTION
-- =====================================================
-- If you're experiencing 500/400 errors with company/user creation,
-- you may need to apply one of these fixes:
--
-- OPTION 1: EMERGENCY FIX (Very permissive - for testing only)
-- Uncomment the following lines to disable RLS temporarily:
-- ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_company_assignments DISABLE ROW LEVEL SECURITY;
--
-- OPTION 2: PERMISSIVE POLICIES (for debugging)
-- Replace the policies below with these very permissive ones:
-- DROP POLICY IF EXISTS "Users can insert companies" ON companies;
-- CREATE POLICY "Allow all authenticated for companies" ON companies
--   FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
-- DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
-- CREATE POLICY "Allow all authenticated for profiles" ON user_profiles
--   FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
-- DROP POLICY IF EXISTS "Users can create assignments" ON user_company_assignments;
-- CREATE POLICY "Allow all authenticated for assignments" ON user_company_assignments
--   FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
--
-- Remember to restore proper restrictive policies after testing!
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
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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
-- Users can manage their own profile (allows new user creation)
-- =====================================================
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- COMPANIES POLICIES
-- Users can only access companies they're assigned to
-- IMPORTANT: Allows new users to create their first company
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
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin')
    )
  );

CREATE POLICY "Users can insert companies" ON companies
  FOR INSERT WITH CHECK (
    -- Allow if user is already an admin in any company
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin')
    )
    OR
    -- Allow if user is authenticated but has no company assignments (first company)
    (
      auth.uid() IS NOT NULL 
      AND NOT EXISTS (
        SELECT 1 FROM user_company_assignments 
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- USER COMPANY ASSIGNMENTS POLICIES
-- IMPORTANT: Allows users to assign themselves when creating first company
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
      AND uca.role IN ('Primary Admin', 'App Admin', 'Company Admin')
    )
  );

CREATE POLICY "Users can create own first assignment" ON user_company_assignments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    (
      -- Allow if user is already an admin (can assign others)
      EXISTS (
        SELECT 1 FROM user_company_assignments uca
        WHERE uca.user_id = auth.uid() 
        AND uca.role IN ('Primary Admin', 'App Admin', 'Company Admin')
      )
      OR
      -- Allow users to assign themselves to companies they just created
      -- (when they have no existing assignments)
      NOT EXISTS (
        SELECT 1 FROM user_company_assignments 
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- STAFF MEMBERS POLICIES
-- =====================================================
CREATE POLICY "Users can view company staff" ON staff_members
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "Authorized users can manage staff" ON staff_members
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = staff_members.company_id 
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin', 'Payroll Approver', 'Payroll Preparer')
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
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin', 'Payroll Approver', 'Payroll Preparer')
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
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin', 'Payroll Approver', 'Payroll Preparer')
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
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin', 'Payroll Approver', 'Payroll Preparer')
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
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin', 'Payroll Approver', 'Payroll Preparer')
    )
  );

-- =====================================================
-- DEPARTMENTS POLICIES
-- =====================================================
CREATE POLICY "Users can view company departments" ON departments
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = departments.company_id 
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin')
    )
  );

-- =====================================================
-- PAYMENT TYPES POLICIES
-- =====================================================
CREATE POLICY "Users can view company payment types" ON payment_types
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "Admins can manage payment types" ON payment_types
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = payment_types.company_id 
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin')
    )
  );

-- =====================================================
-- DEDUCTION TYPES POLICIES
-- =====================================================
CREATE POLICY "Users can view company deduction types" ON deduction_types
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "Admins can manage deduction types" ON deduction_types
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = deduction_types.company_id 
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin')
    )
  );

-- =====================================================
-- TAX SETTINGS POLICIES
-- =====================================================
CREATE POLICY "Users can view company tax settings" ON tax_settings
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "Admins can manage tax settings" ON tax_settings
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = tax_settings.company_id 
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin')
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
-- USER AVATARS POLICIES
-- Users can only access their own avatar
-- =====================================================
CREATE POLICY "Users can view their own avatar" ON user_avatars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own avatar" ON user_avatars
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- CUSTOM FIELD DEFINITIONS POLICIES
-- Company-based access control
-- =====================================================
CREATE POLICY "Users can view custom fields for their companies" ON custom_field_definitions
  FOR SELECT USING (company_id = ANY(get_user_companies()));

CREATE POLICY "Company admins can manage custom fields" ON custom_field_definitions
  FOR ALL USING (
    company_id = ANY(get_user_companies()) AND
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND company_id = custom_field_definitions.company_id 
      AND role IN ('Primary Admin', 'App Admin', 'Company Admin', 'Payroll Approver', 'Payroll Preparer')
    )
  );

-- =====================================================
-- USERS TABLE POLICIES
-- Admin access only for user management
-- =====================================================
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND role IN ('Primary Admin', 'App Admin')
    )
  );

CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_company_assignments 
      WHERE user_id = auth.uid() 
      AND role IN ('Primary Admin', 'App Admin')
    )
  );

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for key tables
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_members;
ALTER PUBLICATION supabase_realtime ADD TABLE payroll_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE user_avatars;
ALTER PUBLICATION supabase_realtime ADD TABLE custom_field_definitions;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- =====================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- Ensures users have the necessary permissions to access tables
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_company_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deduction_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_payment_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_deductions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_run_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_avatars TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_field_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;

-- =====================================================
-- FINAL TROUBLESHOOTING NOTES
-- =====================================================
-- If you're still experiencing issues after applying these policies:
--
-- 1. Check that your service role key is properly configured
-- 2. Verify the Supabase URL and anon key are correct
-- 3. Ensure the application is using the real Supabase client (not mock)
-- 4. Check browser console for specific error messages
-- 5. Monitor the Supabase logs for detailed error information
--
-- For immediate testing, you can temporarily disable RLS:
-- ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_company_assignments DISABLE ROW LEVEL SECURITY;
--
-- Remember to re-enable RLS and restore proper policies for production:
-- ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_company_assignments ENABLE ROW LEVEL SECURITY;
-- =====================================================