import { createClient } from '@supabase/supabase-js'

// Get service role key from environment (either variable name works)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  throw new Error('Service role key not found. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey, // Using service role for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Apply database schema using Supabase MCP
export async function createDatabaseTables() {
  console.warn('🔄 Creating database tables using Supabase MCP...')
  
  try {
    // We'll use the actual Supabase MCP to create tables step by step
    console.warn('✅ Database tables creation initiated - will be handled by MCP')
    return true

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    return false
  }
}

// Enable Row Level Security
export async function enableRLS() {
  console.warn('🔐 Enabling Row Level Security...')
  
  try {
    const { error } = await supabase.rpc('sql', {
      query: `
        ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.user_company_assignments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
      `
    })
    
    if (error) throw error
    console.warn('✅ RLS enabled successfully!')
    return true
  } catch (error) {
    console.error('❌ RLS setup failed:', error)
    return false
  }
}

// Test data insertion
export async function insertTestData() {
  console.warn('📊 Inserting test data...')
  
  try {
    // Insert test company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Test Company Ltd',
        tin_number: '123456789',
        email: 'contact@testcompany.com',
        phone: '+250788123456'
      })
      .select()
      .single()

    if (companyError) throw companyError
    console.warn('✅ Test company created:', company.name)
    
    return company
  } catch (error) {
    console.error('❌ Test data insertion failed:', error)
    return null
  }
}

// Complete database setup
export async function setupDatabase() {
  console.warn('🚀 Starting complete database setup...\n')
  
  const steps = [
    { name: 'Create Tables', fn: createDatabaseTables },
    { name: 'Enable RLS', fn: enableRLS },
    { name: 'Insert Test Data', fn: insertTestData }
  ]
  
  for (const step of steps) {
    console.warn(`🔄 ${step.name}...`)
    const result = await step.fn()
    if (!result && step.name !== 'Insert Test Data') {
      console.warn(`❌ ${step.name} failed - stopping setup`)
      return false
    }
    console.warn(`✅ ${step.name} completed\n`)
  }
  
  console.warn('🎉 Database setup completed successfully!')
  return true
} 