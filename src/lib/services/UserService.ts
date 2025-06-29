/**
 * UserService
 * Service for managing user authentication and profile data following OOP principles
 */
import { BaseService } from './BaseService';

export type UserRole = 'Primary Admin' | 'App Admin' | 'Company Admin' | 'Payroll Preparer' | 'Payroll Approver';

export interface UserProfile {
  id: string; // UUID referencing auth.users(id)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  assignedCompanyIds: string[];
}

export class UserService extends BaseService {
  private readonly userProfileTableName = 'user_profiles';
  private readonly userAvatarTableName = 'user_avatars';

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    try {
      // console.log('🔄 UserService: Getting current user...');
      
      // Ensure Supabase client is initialized first
      await this.ensureInitialized();
      
      // Check if we have a real Supabase client
      const isRealClient = this.supabase && typeof this.supabase.auth?.getUser === 'function';
      // console.log('🔄 UserService: Supabase client status:', { isRealClient, hasAuth: !!this.supabase.auth });
      
      // Get current user from Supabase auth
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        // console.warn('❌ UserService: User not authenticated:', userError?.message);
        return null;
      }

      // console.log('🔄 UserService: Got authenticated user:', { userId: user.id, email: user.email });

      // Get role from user metadata (this is where it's stored during authentication)
      let role = user.user_metadata?.role as UserRole;
      if (!role) {
        // console.warn('❌ UserService: User has no role assigned in metadata, assigning default role');
        
        // For now, assign a default role. In production, you might want to:
        // 1. Check if this is the first user (make them Primary Admin)
        // 2. Have a proper role assignment flow
        // 3. Default to a restricted role like 'Employee'
        
        // Let's check if this is the first user by checking if there are any profiles
        try {
          const { data: existingProfiles, error: profilesError } = await this.supabase
            .from(this.userProfileTableName)
            .select('id')
            .limit(1);
          
          let defaultRole: UserRole;
          if (!existingProfiles || existingProfiles.length === 0) {
            // First user - make them Primary Admin
            defaultRole = 'Primary Admin';
            // console.log('🔄 UserService: First user detected, assigning Primary Admin role');
          } else {
            // Not first user - assign Company Admin as default
            defaultRole = 'Company Admin';
            // console.log('🔄 UserService: Assigning default Company Admin role');
          }
          
          // Update user metadata with the role
          await this.supabase.auth.updateUser({
            data: { 
              ...user.user_metadata,
              role: defaultRole 
            }
          });
          
          // Use the assigned role
          role = defaultRole;
          // console.log('✅ UserService: Assigned role:', role);
        } catch (error) {
          // console.error('❌ UserService: Error assigning default role:', error);
          return null;
        }
      }

      // console.log('🔄 UserService: User role:', role);

      // Fetch user profile for additional details
      const { data: userProfile, error: profileError } = await this.supabase
        .from(this.userProfileTableName)
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        // console.warn('❌ UserService: Error fetching user profile:', profileError?.message);
        this.handleError(profileError, 'fetch user profile');
        return null;
      }

      // console.log('🔄 UserService: Got user profile:', { firstName: userProfile.first_name, lastName: userProfile.last_name });

      // For Primary Admin and App Admin, they have access to all companies
      let assignedCompanyIds: string[] = [];
      if (role === 'Primary Admin' || role === 'App Admin') {
        // Admins can access all companies - get all company IDs
        try {
          const { data: companies } = await this.supabase
            .from('companies')
            .select('id');
          assignedCompanyIds = (companies || []).map(c => c.id);
          
          // If no companies table or it's empty, still allow admin access
          // Primary Admin should always have access regardless
          if (assignedCompanyIds.length === 0 && role === 'Primary Admin') {
            // console.warn('Primary Admin detected but no companies found in database');
            // For Primary Admin, return a special marker to indicate universal access
            assignedCompanyIds = ['*']; // Universal access marker
          }
        } catch (error) {
          // console.warn('Error fetching companies for admin user:', error);
          // For Primary Admin, ensure they still get access even if companies table fails
          if (role === 'Primary Admin') {
            assignedCompanyIds = ['*']; // Universal access marker
          }
        }
      } else {
        // For other roles, get assigned companies from user_metadata first, then fallback to assignments table
        const metadataCompanyIds = user.user_metadata?.assignedCompanyIds || user.user_metadata?.assigned_company_ids;
        
        if (metadataCompanyIds && Array.isArray(metadataCompanyIds)) {
          assignedCompanyIds = metadataCompanyIds;
        } else {
          // Fallback: get assigned companies from user_company_assignments table
          try {
            const { data: assignments } = await this.supabase
              .from('user_company_assignments')
              .select('company_id')
              .eq('user_id', user.id);
            assignedCompanyIds = (assignments || []).map(a => a.company_id);
          } catch (error) {
            // console.warn('Error fetching user company assignments:', error);
            assignedCompanyIds = [];
          }
        }
      }

      // console.log('✅ UserService: Successfully created user object:', {
      //   userId: user.id,
      //   email: user.email || userProfile.email,
      //   firstName: userProfile.first_name,
      //   lastName: userProfile.last_name,
      //   role,
      //   assignedCompanyCount: assignedCompanyIds.length
      // });

      return {
        id: user.id,
        email: user.email || userProfile.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        phone: userProfile.phone || '', 
        role: role,
        assignedCompanyIds: assignedCompanyIds,
      };
    } catch (error) {
      // console.error('❌ UserService: getCurrentUser threw exception:', error);
      this.handleError(error, 'get current user');
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getById(userId: string): Promise<UserProfile | null> {
    try {
      await this.ensureInitialized();
      const { data, error } = await this.supabase
        .from(this.userProfileTableName)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        this.handleError(error, 'fetch user');
        return null;
      }

      return data;
    } catch (error) {
      this.handleError(error, 'fetch user');
      return null;
    }
  }

  /**
   * Update user profile details.
   * Also updates the auth.users metadata.
   */
  async updateProfile(userId: string, profileData: UserProfile): Promise<UserProfile> {
    try {
      await this.ensureInitialized();
      
      // Update the user_profiles table
      const { data: profile, error: profileError } = await this.supabase
        .from(this.userProfileTableName)
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone,
        })
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        this.handleError(profileError, 'update user profile');
      }

      // Update the auth.users metadata
      const { error: authError } = await this.supabase.auth.updateUser({
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
        },
      });

      if (authError) {
        this.handleError(authError, 'update auth user metadata');
      }

      return {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
      };
    } catch (error) {
      this.handleError(error, 'update user profile');
    }
  }

  /**
   * Update the user's password.
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      await this.ensureInitialized();
      const { error } = await this.supabase.auth.updateUser({ password: newPassword });
      if (error) {
        this.handleError(error, 'update password');
      }
    } catch (error) {
      this.handleError(error, 'update password');
    }
  }

  /**
   * Get the user's avatar URL.
   */
  async getAvatar(userId: string): Promise<string | null> {
    try {
      await this.ensureInitialized();
      const { data, error } = await this.supabase
        .from(this.userAvatarTableName)
        .select('avatar_url')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        this.handleError(error, 'fetch user avatar');
      }
      return data?.avatar_url || null;
    } catch (error) {
      this.handleError(error, 'fetch user avatar');
    }
  }

  /**
   * Update or insert the user's avatar URL.
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
    try {
      await this.ensureInitialized();
      const { error } = await this.supabase
        .from(this.userAvatarTableName)
        .upsert({ user_id: userId, avatar_url: avatarUrl });

      if (error) {
        this.handleError(error, 'update user avatar');
      }
    } catch (error) {
      this.handleError(error, 'update user avatar');
    }
  }

  /**
   * Check user permissions for payroll operations
   */
  static canCreatePayrollRun(userRole: UserRole): boolean {
    return ['Primary Admin', 'App Admin', 'Company Admin', 'Payroll Preparer'].includes(userRole);
  }

  /**
   * Check user permissions for deleting payroll runs
   */
  static canDeletePayrollRun(userRole: UserRole, runStatus: string): { allowed: boolean; title: string } {
    if (userRole === 'Primary Admin' || userRole === 'App Admin') {
      return { allowed: true, title: 'Delete Run (Admin)' };
    }
    
    if (userRole === 'Company Admin' || userRole === 'Payroll Preparer') {
      if (runStatus === 'Draft' || runStatus === 'Rejected') {
        return { allowed: true, title: 'Delete Draft/Rejected Run' };
      }
      return { allowed: false, title: 'Cannot delete runs not in Draft or Rejected state' };
    }
    
    if (userRole === 'Payroll Approver') {
      return { allowed: false, title: 'Payroll Approvers cannot delete runs' };
    }
    
    return { allowed: false, title: 'Permission Denied' };
  }

  /**
   * Check if user can access a specific company
   */
  static canAccessCompany(user: AuthenticatedUser, companyId: string): boolean {
    if (user.role === 'Primary Admin' || user.role === 'App Admin') {
      return true; // Admins can access all companies
    }
    
    // Check if user has the universal access marker or the specific company ID
    return user.assignedCompanyIds.includes('*') || user.assignedCompanyIds.includes(companyId);
  }

  /**
   * Check if user has universal admin access
   */
  static hasUniversalAccess(user: AuthenticatedUser): boolean {
    return user.role === 'Primary Admin' || user.role === 'App Admin' || user.assignedCompanyIds.includes('*');
  }

  /**
   * Get user's accessible company IDs
   * For admins, this should return all company IDs in the system
   */
  async getUserAccessibleCompanies(user: AuthenticatedUser): Promise<string[]> {
    if (UserService.hasUniversalAccess(user)) {
      try {
        await this.ensureInitialized();
        const { data: companies } = await this.supabase
          .from('companies')
          .select('id');
        return (companies || []).map(c => c.id);
      } catch (error) {
        console.warn('Error fetching all companies for admin:', error);
        return user.assignedCompanyIds.filter(id => id !== '*');
      }
    }
    
    return user.assignedCompanyIds;
  }
}
