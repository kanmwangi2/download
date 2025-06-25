import { BaseService } from './BaseService';
import { CompanyProfileData } from '../types/company';
import { objectToCamelCase, objectToSnakeCase } from '../case-conversion';

export class CompanyService extends BaseService {
  private readonly tableName = 'companies';

  async getCompanyProfile(companyId: string): Promise<CompanyProfileData | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        this.handleError(error, 'fetch company profile');
        return null;
      }
      return objectToCamelCase<CompanyProfileData>(data);
    } catch (error) {
      this.handleError(error, 'fetch company profile');
      return null;
    }
  }

  async updateCompanyProfile(profile: CompanyProfileData): Promise<CompanyProfileData | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(objectToSnakeCase(profile))
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'update company profile');
        return null;
      }
      return objectToCamelCase<CompanyProfileData>(data);
    } catch (error) {
      this.handleError(error, 'update company profile');
      return null;
    }
  }
}
