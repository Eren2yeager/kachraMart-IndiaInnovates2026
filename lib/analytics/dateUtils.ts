/**
 * Get MongoDB date filter based on period parameter
 * @param period - Time period: 'all', 'monthly', or 'weekly'
 * @returns MongoDB date filter object
 */
export function getDateFilter(period: string): any {
  if (period === 'all') {
    return { $exists: true };
  }
  
  const now = new Date();
  
  if (period === 'monthly') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { $gte: thirtyDaysAgo };
  }
  
  if (period === 'weekly') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { $gte: sevenDaysAgo };
  }
  
  return { $exists: true };
}

/**
 * Validate period parameter
 * @param period - Period string to validate
 * @returns True if period is valid
 */
export function validatePeriod(period: string): period is 'all' | 'monthly' | 'weekly' {
  return ['all', 'monthly', 'weekly'].includes(period);
}

/**
 * Fill missing months in time series data with zero values
 * @param data - Existing data points
 * @param monthCount - Number of months to include
 * @returns Complete time series with all months
 */
export function fillMissingMonths(data: any[], monthCount: number): any[] {
  const months = [];
  const now = new Date();
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const existing = data.find(d => d.month === monthLabel);
    months.push({
      month: monthLabel,
      quantity: existing?.quantity || 0,
      spent: existing?.spent || 0
    });
  }
  
  return months;
}
