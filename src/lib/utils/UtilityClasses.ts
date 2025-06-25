/**
 * Utility Classes
 * Provides static utility methods for common operations like formatting, validation, and data processing
 */

/**
 * Currency Formatter Utility
 * Handles all currency formatting and conversion operations
 */
export class CurrencyFormatter {
  private static readonly DEFAULT_CURRENCY = 'USD';
  private static readonly DEFAULT_LOCALE = 'en-US';

  /**
   * Format a number as currency
   */
  static format(
    amount: number, 
    currency: string = CurrencyFormatter.DEFAULT_CURRENCY, 
    locale: string = CurrencyFormatter.DEFAULT_LOCALE
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Format currency without symbol
   */
  static formatNumber(
    amount: number, 
    locale: string = CurrencyFormatter.DEFAULT_LOCALE
  ): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Parse currency string to number
   */
  static parse(currencyString: string): number {
    const cleaned = currencyString.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Validate currency amount
   */
  static isValidAmount(amount: any): boolean {
    return typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount >= 0;
  }
}

/**
 * Date Formatter Utility
 * Handles all date formatting and validation operations
 */
export class DateFormatter {
  private static readonly DEFAULT_LOCALE = 'en-US';

  /**
   * Format date for display
   */
  static format(
    date: string | Date, 
    locale: string = DateFormatter.DEFAULT_LOCALE,
    options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  ): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  }

  /**
   * Format date for input fields (YYYY-MM-DD)
   */
  static formatForInput(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0] || '';
  }

  /**
   * Get current date in YYYY-MM-DD format
   */
  static getCurrentDate(): string {
    return DateFormatter.formatForInput(new Date());
  }

  /**
   * Validate date string
   */
  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Check if date is in the future
   */
  static isFutureDate(dateString: string): boolean {
    if (!DateFormatter.isValidDate(dateString)) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }

  /**
   * Check if date is in the past
   */
  static isPastDate(dateString: string): boolean {
    if (!DateFormatter.isValidDate(dateString)) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }
}

/**
 * Validation Utility
 * Provides common validation methods
 */
export class Validator {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (basic format)
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Validate required string field
   */
  static isValidString(value: any, minLength: number = 1): boolean {
    return typeof value === 'string' && value.trim().length >= minLength;
  }

  /**
   * Validate numeric field
   */
  static isValidNumber(value: any, min?: number, max?: number): boolean {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return false;
    }
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    return true;
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }
}

/**
 * File Export Utility
 * Handles data export operations
 */
export class FileExporter {
  /**
   * Convert array of objects to CSV
   */
  static arrayToCSV(data: any[], headers?: string[]): string {
    if (data.length === 0) return '';

    // Use provided headers or extract from first object
    const csvHeaders = headers || Object.keys(data[0]);
    
    // Create header row
    const headerRow = csvHeaders.map(header => this.escapeCSVField(header)).join(',');
    
    // Create data rows
    const dataRows = data.map(row => 
      csvHeaders.map(header => this.escapeCSVField(row[header] || '')).join(',')
    );

    return [headerRow, ...dataRows].join('\n');
  }

  /**
   * Escape CSV field (handle commas, quotes, newlines)
   */
  private static escapeCSVField(field: any): string {
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  }

  /**
   * Download data as CSV file
   */
  static downloadCSV(data: any[], filename: string, headers?: string[]): void {
    const csv = this.arrayToCSV(data, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Download data as JSON file
   */
  static downloadJSON(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * CSV Parser Utility
 * Handles CSV file parsing operations
 */
export class CSVParser {
  /**
   * Generate CSV string from array of data
   */
  static generateCSV(data: any[][], headers?: string[]): string {
    const allRows = headers ? [headers, ...data] : data;
    
    return allRows.map(row => {
      return row.map((cell: any) => {
        const cellStr = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',');
    }).join('\n') + '\n';
  }

  /**
   * Parse CSV string to array of objects
   */
  static parse(csvString: string, hasHeaders: boolean = true): any[] {
    const lines = csvString.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = hasHeaders && lines[0] ? this.parseCSVLine(lines[0]) : null;
    const dataStartIndex = hasHeaders ? 1 : 0;
    
    return lines.slice(dataStartIndex).map((line, index) => {
      const values = this.parseCSVLine(line);
      
      if (headers) {
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        return obj;
      } else {
        return values;
      }
    }).filter(row => {
      // Filter out empty rows
      return Array.isArray(row) ? row.some(val => val.trim()) : Object.values(row).some(val => String(val).trim());
    });
  }

  /**
   * Parse a single CSV line handling quotes and commas
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }

  /**
   * Validate CSV structure
   */
  static validate(csvString: string, expectedHeaders?: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const data = this.parse(csvString, true);
      
      if (data.length === 0) {
        errors.push('CSV file is empty');
        return { isValid: false, errors };
      }

      if (expectedHeaders && data.length > 0) {
        const actualHeaders = Object.keys(data[0]);
        const missingHeaders = expectedHeaders.filter(header => !actualHeaders.includes(header));
        
        if (missingHeaders.length > 0) {
          errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
        }
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors };
    }
  }
}
