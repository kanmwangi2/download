import { type UserProfile, type UserCompanyAssignment, type UserUI } from '@/lib/types/user';

export function userProfileToBackend(profile: UserProfile | Omit<UserProfile, 'id'>): Record<string, unknown> {
    return {
        ...(('id' in profile) && { id: profile.id }),
        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email,
        phone: profile.phone,
    };
}

export function userProfileFromBackend(profile: Record<string, any>): UserProfile {
    return {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
    };
}

export function userCompanyAssignmentToBackend(assignment: UserCompanyAssignment | Omit<UserCompanyAssignment, 'id'>): Record<string, unknown> {
    return {
        ...(('id' in assignment) && { id: assignment.id }),
        user_id: assignment.userId,
        company_id: assignment.companyId,
        role: assignment.role,
    };
}

export function userCompanyAssignmentFromBackend(assignment: Record<string, any>): UserCompanyAssignment {
    return {
        id: assignment.id,
        userId: assignment.user_id,
        companyId: assignment.company_id,
        role: assignment.role,
    };
}

// Legacy compatibility functions for existing components
export function userFromBackend(user: Record<string, any>): UserUI {
    return {
        id: user.id,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone,
        companies: user.companies || [],
    };
}

export function userToBackend(user: UserUI): Record<string, unknown> {
    return {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        phone: user.phone,
    };
}
