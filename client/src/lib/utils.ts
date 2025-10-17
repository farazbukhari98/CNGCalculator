import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a decimal payback period (in years) into "X Years, X Months" format
 * @param paybackPeriod The payback period in years (can be decimal, or -1 for "Never")
 * @returns Formatted string in "X Years, X Months" format with projection indicator if beyond time horizon
 */
export function formatPaybackPeriod(paybackPeriod: number): string {
  // Handle invalid cases
  if (isNaN(paybackPeriod) || paybackPeriod < 0) return "Never";
  
  const years = Math.floor(paybackPeriod);
  const months = Math.round((paybackPeriod - years) * 12);
  
  // Handle case where months rounds up to 12
  if (months === 12) {
    return formatPaybackYearsMonths(years + 1, 0, years >= 15);
  }
  
  return formatPaybackYearsMonths(years, months, years >= 15);
}

/**
 * Helper function to format years and months with projection indicator
 */
function formatPaybackYearsMonths(years: number, months: number, isProjection: boolean): string {
  const yearText = years === 1 ? 'Year' : 'Years';
  const monthText = months === 1 ? 'Month' : 'Months';
  
  // Base formatting
  const formattedPeriod = `${years} ${yearText}, ${months} ${monthText}`;
  
  // Add projection indicator if beyond typical analysis period
  return isProjection ? `${formattedPeriod} (projected)` : formattedPeriod;
}

/**
 * Formats a number with comma separators for thousands
 * @param num The number to format
 * @returns Formatted string with commas (e.g., "1,234,567")
 */
export function formatNumberWithCommas(num: number | string): string {
  // Convert to number if it's a string
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  // Handle invalid numbers
  if (isNaN(numValue)) return '0';
  
  // Convert to string and add commas
  return numValue.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
