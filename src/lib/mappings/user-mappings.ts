import { type User, type UserUI } from '@/lib/types/user';

export function userFromBackend(user: User): UserUI {
    return {
        id: user.id,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: user.status,
        assignedCompanyIds: user.assigned_company_ids || [],
    };
}

export function userToBackend(user: UserUI): Omit<User, 'created_at' | 'updated_at' | 'id'> & { id?: string, password?: string} {
    const backendUser: Omit<User, 'created_at' | 'updated_at' | 'id'> & { id?: string, password?: string} = {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        assigned_company_ids: user.assignedCompanyIds,
    };
    if (user.id) {
        backendUser.id = user.id;
    }
    if (user.password) {
        backendUser.password = user.password;
    }
    return backendUser;
}
