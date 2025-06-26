import { Department } from "@/lib/types/department";

export function departmentToBackend(department: Department | Omit<Department, 'id'>): Record<string, unknown> {
  return {
    ...(('id' in department) && { id: department.id }),
    company_id: department.companyId,
    name: department.name,
    description: department.description,
  };
}

export function departmentFromBackend(department: Record<string, any>): Department {
  return {
    id: department.id,
    companyId: department.company_id,
    name: department.name,
    description: department.description,
  };
}
