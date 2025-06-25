/**
 * Payroll Service
 * Handles all payroll run-related operations.
 */
import { BaseService } from './BaseService';
import { PayrollRunDetail, PayrollRunSummary } from '../types/payroll';
import { objectToCamelCase, objectToSnakeCase } from '../case-conversion';

export class PayrollService extends BaseService {
  private readonly payrollRunDetailsTable = 'payroll_run_details';
  private readonly payrollRunsTable = 'payroll_runs';

  /**
   * Get a single payroll run's detailed data.
   */
  async getPayrollRunDetail(id: string, companyId: string): Promise<PayrollRunDetail | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.payrollRunDetailsTable)
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found is not an error
        this.handleError(error, 'fetch payroll run detail');
        return null;
      }
      
      return data ? objectToCamelCase<PayrollRunDetail>(data) : null;
    } catch (error) {
      this.handleError(error, 'fetch payroll run detail');
      return null;
    }
  }

  /**
   * Get a single payroll run's summary data.
   */
  async getPayrollRunSummary(id: string, companyId: string): Promise<PayrollRunSummary | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.payrollRunsTable)
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        this.handleError(error, 'fetch payroll run summary');
        return null;
      }

      return data ? objectToCamelCase<PayrollRunSummary>(data) : null;
    } catch (error) {
      this.handleError(error, 'fetch payroll run summary');
      return null;
    }
  }

  /**
   * Get all payroll run summaries for a company.
   */
  async getPayrollRunSummaries(companyId: string): Promise<PayrollRunSummary[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.payrollRunsTable)
        .select('*')
        .eq('company_id', companyId)
        .order('run_date', { ascending: false });

      if (error) {
        this.handleError(error, 'fetch payroll run summaries');
        return [];
      }

      return (data || []).map(d => objectToCamelCase<PayrollRunSummary>(d));
    } catch (error) {
      this.handleError(error, 'fetch payroll run summaries');
      return [];
    }
  }

  /**
   * Update or create payroll run details.
   */
  async updatePayrollRunDetail(detail: PayrollRunDetail): Promise<void> {
    try {
      const detailSnake = objectToSnakeCase(detail);
      const { error } = await this.supabase
        .from(this.payrollRunDetailsTable)
        .upsert(detailSnake);

      if (error) {
        this.handleError(error, 'upsert payroll run detail');
      }
    } catch (error) {
      this.handleError(error, 'update payroll run detail');
    }
  }

  /**
   * Update or create a payroll run summary.
   */
  async updatePayrollRunSummary(summary: PayrollRunSummary): Promise<void> {
    try {
      const summarySnake = objectToSnakeCase(summary);
      const { error } = await this.supabase
        .from(this.payrollRunsTable)
        .upsert(summarySnake);

      if (error) {
        this.handleError(error, 'upsert payroll run summary');
      }
    } catch (error) {
      this.handleError(error, 'update payroll run summary');
    }
  }

  /**
   * Update or create both payroll run details and summary.
   */
  async updatePayrollRun(detail: PayrollRunDetail, summary: PayrollRunSummary): Promise<void> {
    try {
      await this.updatePayrollRunDetail(detail);
      await this.updatePayrollRunSummary(summary);
    } catch (error) {
      this.handleError(error, 'update payroll run');
    }
  }
}
