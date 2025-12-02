// Get the background color for an input field based on whether it's been modified
export function getFieldBackground(isModified: boolean): string {
  // Only show light blue background for default fields
  // No special highlighting for modified fields
  if (!isModified) {
    // Light blue background for default fields
    return '#f0f5ff';
  } else {
    // No background for modified fields (transparent)
    return 'transparent';
  }
}

// Get Tailwind-compatible inline styles for input fields
export function getFieldStyles(isModified: boolean) {
  return {
    backgroundColor: getFieldBackground(isModified),
    transition: 'background-color 0.2s ease'
  };
}

// Check if a value differs from its default
export function hasValueChanged(currentValue: any, defaultValue: any): boolean {
  // Handle different types of comparisons
  if (typeof currentValue === 'number' && typeof defaultValue === 'number') {
    return currentValue !== defaultValue;
  }
  if (typeof currentValue === 'string' && typeof defaultValue === 'string') {
    return currentValue !== defaultValue;
  }
  if (typeof currentValue === 'boolean' && typeof defaultValue === 'boolean') {
    return currentValue !== defaultValue;
  }
  // For other types, use strict equality
  return currentValue !== defaultValue;
}

// Default values for comparison
export const DEFAULT_VALUES = {
  // Vehicle Parameters
  lightDutyCount: 0,
  mediumDutyCount: 0,
  heavyDutyCount: 0,
  lightDutyCost: 15000,
  mediumDutyCost: 15000,
  heavyDutyCost: 50000,
  lightDutyLifespan: 7,
  mediumDutyLifespan: 7,
  heavyDutyLifespan: 7,
  lightDutyMPG: 12,
  mediumDutyMPG: 10,
  heavyDutyMPG: 5,
  lightDutyAnnualMiles: 20000,
  mediumDutyAnnualMiles: 20000,
  heavyDutyAnnualMiles: 40000,
  lightDutyFuelType: 'gasoline',
  mediumDutyFuelType: 'diesel',
  heavyDutyFuelType: 'diesel',
  lightDutyCngEfficiencyLoss: 50,
  mediumDutyCngEfficiencyLoss: 75,
  heavyDutyCngEfficiencyLoss: 100,
  lightDutyMaintenanceSavings: 0,      // $0.00/mile for light duty
  mediumDutyMaintenanceSavings: 0.05,  // $0.05/mile for medium duty
  heavyDutyMaintenanceSavings: 0.05,   // $0.05/mile for heavy duty
  
  // Station Configuration
  stationType: 'fast',
  businessType: 'aglc',
  turnkey: true,
  stationMarkup: 20,
  
  // Fuel Prices
  gasolinePrice: 3.38,
  dieselPrice: 3.84,
  cngPrice: 0.82,
  cngTaxCredit: 0.00,
  annualIncrease: 0,
  gasolineToCngConversionFactor: 1,
  dieselToCngConversionFactor: 1,
  
  // Global Settings
  timeHorizon: 10,
  deploymentStrategy: 'manual'
};