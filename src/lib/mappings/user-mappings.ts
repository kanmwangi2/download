import { type UserProfile, type UserCompanyAssignment, type User } from '@/lib/types/user';

// Main user mappings (snake_case ↔ camelCase)
export function userToBackend(user: User | Omit<User, 'id'>): Record<string, unknown> {
    return {
        ...(('id' in user) && { id: user.id! }),
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status || 'Active',
    };
}

export function userFromBackend(user: Record<string, any>): User {
    return {
        id: user.id,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone,
        role: user.role,
        status: user.status || 'Active',
    };
}

// User profile mappings
export function userProfileToBackend(profile: UserProfile): Record<string, unknown> {
    return {
        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email,
        phone: profile.phone,
    };
}

export function userProfileFromBackend(profile: Record<string, any>): UserProfile {
    return {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
    };
}

// User company assignment mappings
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
