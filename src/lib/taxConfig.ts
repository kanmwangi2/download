
// Rwanda-specific tax and contribution rates (example values)
// These would ideally be fetched from a database or a more dynamic configuration source in a real app.

// PAYE Tiers based on typical Rwandan structure
// (0-60k @0%, next 40k [60k-100k] @10%, next 100k [100k-200k] @20%, above 200k @30%)
export const PAYE_BANDS = {
    BAND1_LIMIT: 60000,    // Income up to this limit
    BAND2_LIMIT: 100000,   // Income up to this limit (cumulative from BAND1_LIMIT)
    BAND3_LIMIT: 200000,   // Income up to this limit (cumulative from BAND2_LIMIT)
    // Rates applicable to the income *within* each band segment
    RATE1: 0.00,          // For income portion <= BAND1_LIMIT
    RATE2: 0.10,          // For income portion > BAND1_LIMIT and <= BAND2_LIMIT
    RATE3: 0.20,          // For income portion > BAND2_LIMIT and <= BAND3_LIMIT
    RATE4: 0.30,          // For income portion > BAND3_LIMIT
};

// RSSB Pension Contribution Rates
export const PENSION_EMPLOYER_RATE = 0.08; // 8%
export const PENSION_EMPLOYEE_RATE = 0.06; // 6%

// RSSB Maternity Contribution Rates
export const MATERNITY_EMPLOYER_RATE = 0.003; // 0.3%
export const MATERNITY_EMPLOYEE_RATE = 0.003; // 0.3%

// RAMA Contribution Rates (on Basic Salary)
export const RAMA_EMPLOYER_RATE = 0.075; // 7.5%
export const RAMA_EMPLOYEE_RATE = 0.075; // 7.5%

// Community-Based Health Insurance (CBHI) Rate
// Applied on (Gross Salary - Employee RSSB Total - PAYE)
export const CBHI_RATE = 0.005; // 0.5%
    