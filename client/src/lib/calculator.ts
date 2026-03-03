import { 
  VehicleParameters, 
  StationConfig, 
  FuelPrices, 
  DeploymentStrategy, 
  VehicleDistribution, 
  CalculationResults,
  RngFeedstockType,
  RNG_CI_VALUES
} from "@/types/calculator";

// Get vehicle costs from vehicleParameters (for compatibility with old code we'll create a helper function)
export const getVehicleCosts = (vehicleParams: VehicleParameters) => {
  return {
    light: vehicleParams.lightDutyCost, // CNG conversion cost for light duty vehicles
    medium: vehicleParams.mediumDutyCost, // CNG conversion cost for medium duty vehicles
    heavy: vehicleParams.heavyDutyCost   // CNG conversion cost for heavy duty vehicles
  };
};

type VehicleClass = "light" | "medium" | "heavy";

export interface FleetTotals {
  light: number;
  medium: number;
  heavy: number;
  total: number;
}

const DEFAULT_CONVERSION_FACTORS = {
  gasolineToCngConversionFactor: 1.0,
  dieselToCngConversionFactor: 1.136
};

const MIN_CNG_EFFICIENCY_FACTOR = 0.01;

const STATION_SIZES = {
  fast: [
    { size: 1, capacity: 100, cost: 1828172 },
    { size: 2, capacity: 72001, cost: 2150219 },
    { size: 3, capacity: 192001, cost: 2694453 },
    { size: 4, capacity: 384001, cost: 2869245 },
    { size: 5, capacity: 576001, cost: 3080351 }
  ],
  time: [
    { size: 1, capacity: 100, cost: 491333 },
    { size: 2, capacity: 12961, cost: 1831219 },
    { size: 3, capacity: 108001, cost: 2218147 },
    { size: 4, capacity: 288001, cost: 2907603 },
    { size: 5, capacity: 576001, cost: 3200857 },
    { size: 6, capacity: 864001, cost: 3506651 }
  ]
} as const;

const VEHICLE_CLASSES: VehicleClass[] = ["light", "medium", "heavy"];

function toFiniteNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function toNonNegativeNumber(value: number, fallback = 0): number {
  return Math.max(0, toFiniteNumber(value, fallback));
}

function safeDivide(numerator: number, denominator: number): number {
  const safeNumerator = toFiniteNumber(numerator, 0);
  const safeDenominator = toFiniteNumber(denominator, 0);
  if (safeDenominator <= 0) {
    return 0;
  }

  return safeNumerator / safeDenominator;
}

function getLifespanYears(value: number): number {
  return Math.max(1, Math.floor(toFiniteNumber(value, 1)));
}

export function getCngEfficiencyFactor(lossInTenths: number): number {
  const normalizedLoss = toNonNegativeNumber(lossInTenths) / 1000;
  return Math.max(MIN_CNG_EFFICIENCY_FACTOR, 1 - normalizedLoss);
}

function getVehicleField<T>(
  vehicleParams: VehicleParameters,
  vehicleType: VehicleClass,
  field: "AnnualMiles" | "MPG" | "FuelType" | "CngEfficiencyLoss"
): T {
  const prefix =
    vehicleType === "light"
      ? "lightDuty"
      : vehicleType === "medium"
        ? "mediumDuty"
        : "heavyDuty";

  return vehicleParams[`${prefix}${field}` as keyof VehicleParameters] as T;
}

function getFuelToCngConversionFactor(
  fuelType: "gasoline" | "diesel",
  fuelPrices?: FuelPrices
): number {
  const conversionFactors = fuelPrices ?? DEFAULT_CONVERSION_FACTORS;
  const rawFactor =
    fuelType === "gasoline"
      ? conversionFactors.gasolineToCngConversionFactor
      : conversionFactors.dieselToCngConversionFactor;

  return rawFactor > 0 ? rawFactor : 0;
}

export function getAnnualConventionalGallonsPerVehicle(
  vehicleParams: VehicleParameters,
  vehicleType: VehicleClass
): number {
  const annualMiles = toNonNegativeNumber(getVehicleField<number>(vehicleParams, vehicleType, "AnnualMiles"));
  const conventionalMpg = toNonNegativeNumber(getVehicleField<number>(vehicleParams, vehicleType, "MPG"));
  return safeDivide(annualMiles, conventionalMpg);
}

export function getAnnualCngGgePerVehicle(
  vehicleParams: VehicleParameters,
  fuelPrices?: FuelPrices
): Record<VehicleClass, number> {
  return {
    light: getAnnualCngGgeForVehicleType(vehicleParams, "light", fuelPrices),
    medium: getAnnualCngGgeForVehicleType(vehicleParams, "medium", fuelPrices),
    heavy: getAnnualCngGgeForVehicleType(vehicleParams, "heavy", fuelPrices)
  };
}

export function getAnnualCngGgeForVehicleType(
  vehicleParams: VehicleParameters,
  vehicleType: VehicleClass,
  fuelPrices?: FuelPrices
): number {
  const conventionalGallons = getAnnualConventionalGallonsPerVehicle(vehicleParams, vehicleType);
  if (conventionalGallons <= 0) {
    return 0;
  }

  const fuelType = getVehicleField<"gasoline" | "diesel">(vehicleParams, vehicleType, "FuelType");
  const efficiencyFactor = getCngEfficiencyFactor(
    getVehicleField<number>(vehicleParams, vehicleType, "CngEfficiencyLoss")
  );
  const conversionFactor = getFuelToCngConversionFactor(fuelType, fuelPrices);

  return safeDivide(conventionalGallons * conversionFactor, efficiencyFactor);
}

export function calculateAnnualFleetGGE(
  vehicleParams: VehicleParameters,
  counts: Pick<FleetTotals, "light" | "medium" | "heavy">,
  fuelPrices?: FuelPrices
): number {
  const annualCngGge = getAnnualCngGgePerVehicle(vehicleParams, fuelPrices);

  return (
    toNonNegativeNumber(counts.light) * annualCngGge.light +
    toNonNegativeNumber(counts.medium) * annualCngGge.medium +
    toNonNegativeNumber(counts.heavy) * annualCngGge.heavy
  );
}

export function getPlannedFleetTotals(
  vehicleDistribution?: VehicleDistribution[] | null
): FleetTotals {
  const totals = (vehicleDistribution ?? []).reduce(
    (sum, year) => ({
      light: sum.light + toNonNegativeNumber(year.light || 0),
      medium: sum.medium + toNonNegativeNumber(year.medium || 0),
      heavy: sum.heavy + toNonNegativeNumber(year.heavy || 0)
    }),
    { light: 0, medium: 0, heavy: 0 }
  );

  return {
    ...totals,
    total: totals.light + totals.medium + totals.heavy
  };
}

export function getVehicleInvestmentTotals(
  vehicleDistribution?: VehicleDistribution[] | null
): { initial: number; replacement: number; total: number } {
  const totals = (vehicleDistribution ?? []).reduce(
    (sum, year) => ({
      initial: sum.initial + toNonNegativeNumber(year.investment || 0),
      replacement: sum.replacement + toNonNegativeNumber(year.replacementInvestment || 0)
    }),
    { initial: 0, replacement: 0 }
  );

  return {
    ...totals,
    total: totals.initial + totals.replacement
  };
}

export function getAppliedStationMarkup(config: StationConfig): number {
  return config.turnkey ? config.stationMarkup : 0;
}

export function getMonthlyTariffRate(config: StationConfig): number {
  if (config.turnkey) {
    return 0;
  }

  return config.businessType === "cgc" ? 0.016 : 0.015;
}

function getStationSelection(stationType: StationConfig["stationType"], annualGGE: number) {
  const sizes = STATION_SIZES[stationType];
  const sortedSizes = [...sizes].sort((a, b) => a.capacity - b.capacity);

  for (const sizeOption of sortedSizes) {
    if (annualGGE <= sizeOption.capacity) {
      return sizeOption;
    }
  }

  return sortedSizes[sortedSizes.length - 1];
}

// Helper function to find peak year vehicle count from vehicle distribution
// Uses total active vehicles when available, otherwise falls back to new purchases
function getPeakYearVehicleCount(vehicleDistribution: VehicleDistribution[] | null): { lightDutyCount: number, mediumDutyCount: number, heavyDutyCount: number } {
  if (!vehicleDistribution || vehicleDistribution.length === 0) {
    return { lightDutyCount: 0, mediumDutyCount: 0, heavyDutyCount: 0 };
  }

  let maxLight = 0;
  let maxMedium = 0;
  let maxHeavy = 0;

  // Find the maximum vehicle count across all years for each type
  // Prefer total active vehicles over new purchases for accurate station sizing
  vehicleDistribution.forEach(year => {
    // Use total active vehicles if available (for station sizing based on peak operations)
    const lightCount = year.totalActiveLight !== undefined ? year.totalActiveLight : (year.light || 0);
    const mediumCount = year.totalActiveMedium !== undefined ? year.totalActiveMedium : (year.medium || 0);
    const heavyCount = year.totalActiveHeavy !== undefined ? year.totalActiveHeavy : (year.heavy || 0);
    
    maxLight = Math.max(maxLight, lightCount);
    maxMedium = Math.max(maxMedium, mediumCount);
    maxHeavy = Math.max(maxHeavy, heavyCount);
  });

  return {
    lightDutyCount: maxLight,
    mediumDutyCount: maxMedium,
    heavyDutyCount: maxHeavy
  };
}

// Station cost calculation
export function calculateStationCost(config: StationConfig, vehicleParams?: VehicleParameters, vehicleDistribution?: VehicleDistribution[] | null, fuelPrices?: FuelPrices): number {
  // If no vehicle params provided, return 0 (no station needed without vehicles)
  if (!vehicleParams) {
    return 0;
  }
  
  // Always determine vehicle counts based on peak year usage (maximum vehicles in any single year)
  let vehicleCounts: { lightDutyCount: number, mediumDutyCount: number, heavyDutyCount: number };
  
  if (vehicleDistribution) {
    // Use peak year vehicle counts from deployment strategy
    vehicleCounts = getPeakYearVehicleCount(vehicleDistribution);
  } else {
    // Fallback to total vehicle counts if no distribution available yet
    vehicleCounts = {
      lightDutyCount: vehicleParams.lightDutyCount,
      mediumDutyCount: vehicleParams.mediumDutyCount,
      heavyDutyCount: vehicleParams.heavyDutyCount
    };
  }
  
  // Check if there are any vehicles - if not, no station is needed
  const totalVehicles = vehicleCounts.lightDutyCount + vehicleCounts.mediumDutyCount + vehicleCounts.heavyDutyCount;
  if (totalVehicles === 0) {
    return 0;
  }

  const annualGGE = calculateAnnualFleetGGE(
    vehicleParams,
    {
      light: vehicleCounts.lightDutyCount,
      medium: vehicleCounts.mediumDutyCount,
      heavy: vehicleCounts.heavyDutyCount
    },
    fuelPrices
  );

  if (annualGGE <= 0) {
    return 0;
  }

  const selectedStation = getStationSelection(config.stationType, annualGGE);
  const baseCost = selectedStation.cost;
  
  // Apply business type adjustment
  const businessMultiplier = config.businessType === 'cgc' ? 0.95 : 1.0; // CGC is 0.95, AGLC and VNG are 1.0
  
  // Apply station markup (user-configurable percentage)
  // Non-turnkey deals default to 0% premium; tariff is based on the underlying station cost.
  const markupMultiplier = 1 + (getAppliedStationMarkup(config) / 100); // Convert percentage to multiplier
  
  return Math.round(baseCost * businessMultiplier * markupMultiplier);
}

// Apply vehicle lifecycle management to deployment distribution
export function applyVehicleLifecycle(
  baseDistribution: VehicleDistribution[],
  vehicleParams: VehicleParameters,
  timeHorizon: number
): VehicleDistribution[] {
  const vehicleCosts = getVehicleCosts(vehicleParams);
  const vehicleLifespans = {
    light: getLifespanYears(vehicleParams.lightDutyLifespan),
    medium: getLifespanYears(vehicleParams.mediumDutyLifespan),
    heavy: getLifespanYears(vehicleParams.heavyDutyLifespan)
  };
  // Create enhanced distribution array
  const enhancedDistribution: VehicleDistribution[] = [];
  const serviceEntries = {
    light: Array<number>(timeHorizon).fill(0),
    medium: Array<number>(timeHorizon).fill(0),
    heavy: Array<number>(timeHorizon).fill(0)
  };
  const activeCounts = {
    light: 0,
    medium: 0,
    heavy: 0
  };

  for (let yearIndex = 0; yearIndex < timeHorizon; yearIndex++) {
    // Get the base distribution for this year (new purchases only)
    const currentYear = baseDistribution[yearIndex] || { light: 0, medium: 0, heavy: 0, investment: 0 };
    const replacements = { light: 0, medium: 0, heavy: 0 };

    VEHICLE_CLASSES.forEach((vehicleType) => {
      const lifespan = vehicleLifespans[vehicleType];
      const replacementYear = yearIndex - lifespan;
      const replacementCount = replacementYear >= 0 ? serviceEntries[vehicleType][replacementYear] : 0;
      const newPurchases = toNonNegativeNumber(currentYear[vehicleType] || 0);

      replacements[vehicleType] = replacementCount;
      serviceEntries[vehicleType][yearIndex] = newPurchases + replacementCount;
      activeCounts[vehicleType] += newPurchases;
    });

    // Calculate replacement investment
    const replacementInvestment = 
      (replacements.light * vehicleCosts.light) + 
      (replacements.medium * vehicleCosts.medium) + 
      (replacements.heavy * vehicleCosts.heavy);

    // Create enhanced year entry with all vehicle tracking data
    enhancedDistribution.push({
      // New purchases this year (from base distribution)
      light: toNonNegativeNumber(currentYear.light || 0),
      medium: toNonNegativeNumber(currentYear.medium || 0),
      heavy: toNonNegativeNumber(currentYear.heavy || 0),
      investment: toNonNegativeNumber(currentYear.investment || 0),
      // Replacement data
      lightReplacements: replacements.light,
      mediumReplacements: replacements.medium,
      heavyReplacements: replacements.heavy,
      replacementInvestment: replacementInvestment,

      // Total active vehicles (including all vehicles within their lifespan)
      totalActiveLight: activeCounts.light,
      totalActiveMedium: activeCounts.medium,
      totalActiveHeavy: activeCounts.heavy
    });
  }
  
  return enhancedDistribution;
}

// Get station size information
export function getStationSizeInfo(config: StationConfig, vehicleParams?: VehicleParameters, vehicleDistribution?: VehicleDistribution[] | null, fuelPrices?: FuelPrices): { size: number; capacity: number; annualGGE: number; baseCost: number; finalCost: number } | null {
  if (!vehicleParams) return null;
  
  // Always determine vehicle counts based on peak year usage (maximum vehicles in any single year)
  let vehicleCounts: { lightDutyCount: number, mediumDutyCount: number, heavyDutyCount: number };
  
  if (vehicleDistribution) {
    vehicleCounts = getPeakYearVehicleCount(vehicleDistribution);
  } else {
    // Fallback to total vehicle counts if no distribution available yet
    vehicleCounts = {
      lightDutyCount: vehicleParams.lightDutyCount,
      mediumDutyCount: vehicleParams.mediumDutyCount,
      heavyDutyCount: vehicleParams.heavyDutyCount
    };
  }
  
  // Check if there are any vehicles - if not, no station info is needed
  const totalVehicles = vehicleCounts.lightDutyCount + vehicleCounts.mediumDutyCount + vehicleCounts.heavyDutyCount;
  if (totalVehicles === 0) {
    return null;
  }

  const annualGGE = calculateAnnualFleetGGE(
    vehicleParams,
    {
      light: vehicleCounts.lightDutyCount,
      medium: vehicleCounts.mediumDutyCount,
      heavy: vehicleCounts.heavyDutyCount
    },
    fuelPrices
  );

  if (annualGGE <= 0) {
    return null;
  }

  const selectedStation = getStationSelection(config.stationType, annualGGE);
  
  // Calculate final cost with business adjustments and markup
  const businessMultiplier = config.businessType === 'cgc' ? 0.95 : 1.0;
  const markupMultiplier = 1 + (getAppliedStationMarkup(config) / 100); // Convert percentage to multiplier
  const finalCost = Math.round(selectedStation.cost * businessMultiplier * markupMultiplier);
  
  return {
    size: selectedStation.size,
    capacity: selectedStation.capacity,
    annualGGE: Math.round(annualGGE),
    baseCost: selectedStation.cost,
    finalCost: finalCost
  };
}

// Distribute vehicles across years based on strategy
export function distributeVehicles(
  vehicleParams: VehicleParameters,
  timeHorizon: number,
  strategy: DeploymentStrategy
): VehicleDistribution[] {
  const { lightDutyCount, mediumDutyCount, heavyDutyCount } = vehicleParams;
  const vehicleCosts = getVehicleCosts(vehicleParams);
  const distribution: VehicleDistribution[] = [];
  
  // Ensure distribution has elements for the full time horizon
  const ensureFullTimeHorizon = (dist: VehicleDistribution[]): VehicleDistribution[] => {
    while (dist.length < timeHorizon) {
      dist.push({
        light: 0,
        medium: 0,
        heavy: 0,
        investment: 0
      });
    }
    return dist;
  };
  
  if (strategy === 'immediate') {
    // All vehicles in first year, none in subsequent years
    const firstYearInvestment = 
      (lightDutyCount * vehicleCosts.light) + 
      (mediumDutyCount * vehicleCosts.medium) + 
      (heavyDutyCount * vehicleCosts.heavy);
    
    distribution.push({
      light: lightDutyCount,
      medium: mediumDutyCount,
      heavy: heavyDutyCount,
      investment: firstYearInvestment
    });
    
    // Add empty years for the rest of the timeline
    for (let i = 1; i < timeHorizon; i++) {
      distribution.push({
        light: 0,
        medium: 0,
        heavy: 0,
        investment: 0
      });
    }
  } else if (strategy === 'phased') {
    // Evenly distribute vehicles across years
    // Calculate how many vehicles to purchase each year
    const lightPerYear = Math.floor(lightDutyCount / timeHorizon);
    const mediumPerYear = Math.floor(mediumDutyCount / timeHorizon);
    const heavyPerYear = Math.floor(heavyDutyCount / timeHorizon);
    
    // Calculate remainder vehicles to distribute in early years
    const lightRemainder = lightDutyCount % timeHorizon;
    const mediumRemainder = mediumDutyCount % timeHorizon;
    const heavyRemainder = heavyDutyCount % timeHorizon;
    
    // Debug logging
    console.log('Phased Distribution Debug:', {
      lightDutyCount,
      timeHorizon,
      lightPerYear,
      lightRemainder,
      expectedPerYear: lightDutyCount / timeHorizon
    });
    
    for (let i = 0; i < timeHorizon; i++) {
      // Add one extra vehicle in early years if there's a remainder
      const lightThisYear = lightPerYear + (i < lightRemainder ? 1 : 0);
      const mediumThisYear = mediumPerYear + (i < mediumRemainder ? 1 : 0);
      const heavyThisYear = heavyPerYear + (i < heavyRemainder ? 1 : 0);
      
      const yearInvestment = 
        (lightThisYear * vehicleCosts.light) + 
        (mediumThisYear * vehicleCosts.medium) + 
        (heavyThisYear * vehicleCosts.heavy);
      
      console.log(`Year ${i + 1} distribution:`, { light: lightThisYear, medium: mediumThisYear, heavy: heavyThisYear });
      
      distribution.push({
        light: lightThisYear,
        medium: mediumThisYear,
        heavy: heavyThisYear,
        investment: yearInvestment
      });
    }
  } else if (strategy === 'aggressive') {
    // Front-load: 50% in first year, then distribute the rest
    const firstYearLight = Math.ceil(lightDutyCount * 0.5);
    const firstYearMedium = Math.ceil(mediumDutyCount * 0.5);
    const firstYearHeavy = Math.ceil(heavyDutyCount * 0.5);
    
    const firstYearInvestment = 
      (firstYearLight * vehicleCosts.light) + 
      (firstYearMedium * vehicleCosts.medium) + 
      (firstYearHeavy * vehicleCosts.heavy);
    
    distribution.push({
      light: firstYearLight,
      medium: firstYearMedium,
      heavy: firstYearHeavy,
      investment: firstYearInvestment
    });
    
    // Distribute remaining vehicles across remaining years
    const remainingLight = lightDutyCount - firstYearLight;
    const remainingMedium = mediumDutyCount - firstYearMedium;
    const remainingHeavy = heavyDutyCount - firstYearHeavy;
    
    const remainingYears = timeHorizon - 1;
    
    if (remainingYears > 0) {
      const lightPerYear = Math.ceil(remainingLight / remainingYears);
      const mediumPerYear = Math.ceil(remainingMedium / remainingYears);
      const heavyPerYear = Math.ceil(remainingHeavy / remainingYears);
      
      let rLight = remainingLight;
      let rMedium = remainingMedium;
      let rHeavy = remainingHeavy;
      
      for (let i = 0; i < remainingYears; i++) {
        const lightThisYear = Math.min(lightPerYear, rLight);
        const mediumThisYear = Math.min(mediumPerYear, rMedium);
        const heavyThisYear = Math.min(heavyPerYear, rHeavy);
        
        rLight -= lightThisYear;
        rMedium -= mediumThisYear;
        rHeavy -= heavyThisYear;
        
        const yearInvestment = 
          (lightThisYear * vehicleCosts.light) + 
          (mediumThisYear * vehicleCosts.medium) + 
          (heavyThisYear * vehicleCosts.heavy);
        
        distribution.push({
          light: lightThisYear,
          medium: mediumThisYear,
          heavy: heavyThisYear,
          investment: yearInvestment
        });
      }
    }
    
    // Ensure we have distribution entries for all years
    ensureFullTimeHorizon(distribution);
  } else if (strategy === 'deferred') {
    // Back-load: Minimal in early years, 50% in final year
    const finalYearLight = Math.ceil(lightDutyCount * 0.5);
    const finalYearMedium = Math.ceil(mediumDutyCount * 0.5);
    const finalYearHeavy = Math.ceil(heavyDutyCount * 0.5);
    
    const remainingLight = lightDutyCount - finalYearLight;
    const remainingMedium = mediumDutyCount - finalYearMedium;
    const remainingHeavy = heavyDutyCount - finalYearHeavy;
    
    const earlierYears = timeHorizon - 1;
    
    if (earlierYears > 0) {
      const lightPerYear = Math.ceil(remainingLight / earlierYears);
      const mediumPerYear = Math.ceil(remainingMedium / earlierYears);
      const heavyPerYear = Math.ceil(remainingHeavy / earlierYears);
      
      let rLight = remainingLight;
      let rMedium = remainingMedium;
      let rHeavy = remainingHeavy;
      
      for (let i = 0; i < earlierYears; i++) {
        const lightThisYear = Math.min(lightPerYear, rLight);
        const mediumThisYear = Math.min(mediumPerYear, rMedium);
        const heavyThisYear = Math.min(heavyPerYear, rHeavy);
        
        rLight -= lightThisYear;
        rMedium -= mediumThisYear;
        rHeavy -= heavyThisYear;
        
        const yearInvestment = 
          (lightThisYear * vehicleCosts.light) + 
          (mediumThisYear * vehicleCosts.medium) + 
          (heavyThisYear * vehicleCosts.heavy);
        
        distribution.push({
          light: lightThisYear,
          medium: mediumThisYear,
          heavy: heavyThisYear,
          investment: yearInvestment
        });
      }
    }
    
    // Add the final year with the heavy investment
    const finalYearInvestment = 
      (finalYearLight * vehicleCosts.light) + 
      (finalYearMedium * vehicleCosts.medium) + 
      (finalYearHeavy * vehicleCosts.heavy);
    
    distribution.push({
      light: finalYearLight,
      medium: finalYearMedium,
      heavy: finalYearHeavy,
      investment: finalYearInvestment
    });
    
    // Ensure we have distribution entries for all years
    ensureFullTimeHorizon(distribution);
  } else if (strategy === 'manual') {
    // For manual distribution, start with an empty distribution (all zeros)
    // Users will fill in their desired distribution manually
    for (let i = 0; i < timeHorizon; i++) {
      distribution.push({
        light: 0,
        medium: 0,
        heavy: 0,
        investment: 0
      });
    }
  } else {
    // Default to phased strategy if the strategy is unknown
    return distributeVehicles(vehicleParams, timeHorizon, 'phased');
  }
  
  return distribution;
}

// Calculate ROI and other financial metrics
export function calculateROI(
  vehicleParams: VehicleParameters,
  stationConfig: StationConfig,
  fuelPrices: FuelPrices,
  timeHorizon: number,
  strategy: DeploymentStrategy,
  vehicleDistribution: VehicleDistribution[],
  rngFeedstockType: RngFeedstockType = 'none',
  customCiValue: number = 50
): CalculationResults {
  const conventionalGallonsPerVehicle = {
    light: getAnnualConventionalGallonsPerVehicle(vehicleParams, "light"),
    medium: getAnnualConventionalGallonsPerVehicle(vehicleParams, "medium"),
    heavy: getAnnualConventionalGallonsPerVehicle(vehicleParams, "heavy")
  };
  const cngGgePerVehicle = getAnnualCngGgePerVehicle(vehicleParams, fuelPrices);
  const annualMiles = {
    light: toNonNegativeNumber(vehicleParams.lightDutyAnnualMiles),
    medium: toNonNegativeNumber(vehicleParams.mediumDutyAnnualMiles),
    heavy: toNonNegativeNumber(vehicleParams.heavyDutyAnnualMiles)
  };
  const conventionalMpg = {
    light: toNonNegativeNumber(vehicleParams.lightDutyMPG),
    medium: toNonNegativeNumber(vehicleParams.mediumDutyMPG),
    heavy: toNonNegativeNumber(vehicleParams.heavyDutyMPG)
  };
  const cngMpg = {
    light: conventionalMpg.light * getCngEfficiencyFactor(vehicleParams.lightDutyCngEfficiencyLoss),
    medium: conventionalMpg.medium * getCngEfficiencyFactor(vehicleParams.mediumDutyCngEfficiencyLoss),
    heavy: conventionalMpg.heavy * getCngEfficiencyFactor(vehicleParams.heavyDutyCngEfficiencyLoss)
  };
  const vehicleInvestmentTotals = getVehicleInvestmentTotals(vehicleDistribution);
  const totalVehicleInvestment = vehicleInvestmentTotals.total;
  const stationCost = calculateStationCost(stationConfig, vehicleParams, vehicleDistribution, fuelPrices);
  const totalProjectCost = totalVehicleInvestment + stationCost;
  // ROI is based on lifecycle vehicle capex (including replacements).
  // For turnkey projects, add the upfront station capex; for non-turnkey,
  // the station is financed through tariff fees and remains in yearly savings.
  const totalInvestment = totalVehicleInvestment + (stationConfig.turnkey ? stationCost : 0);
  
  // Ensure the vehicleDistribution array is long enough
  // (this should be handled already by distributeVehicles, but ensuring it here too)
  const ensuredDistribution = [...vehicleDistribution];
  while (ensuredDistribution.length < timeHorizon) {
    ensuredDistribution.push({
      light: 0,
      medium: 0,
      heavy: 0,
      investment: 0
    });
  }
  
  // Helper to get lifecycle-aware active vehicle counts for a given year
  const getActiveVehicles = (year: number) => {
    if (ensuredDistribution[year]?.totalActiveLight !== undefined) {
      return {
        light: ensuredDistribution[year].totalActiveLight!,
        medium: ensuredDistribution[year].totalActiveMedium ?? 0,
        heavy: ensuredDistribution[year].totalActiveHeavy ?? 0,
      };
    }
    // Fallback for non-enhanced distributions
    let light = 0, medium = 0, heavy = 0;
    for (let i = 0; i <= year && i < ensuredDistribution.length; i++) {
      light += ensuredDistribution[i].light || 0;
      medium += ensuredDistribution[i].medium || 0;
      heavy += ensuredDistribution[i].heavy || 0;
    }
    return { light, medium, heavy };
  };

  // Calculate yearly savings
  const yearlySavings: number[] = [];
  const yearlyFuelSavings: number[] = [];
  const yearlyMaintenanceSavings: number[] = [];
  const yearlyTariffFees: number[] = [];
  const cumulativeSavings: number[] = [];
  const cumulativeInvestment: number[] = [];
  
  // Track only the initial project investment for payback purposes.
  // This includes the original deployment schedule and upfront turnkey station cost,
  // but excludes lifecycle replacement purchases.
  let cumulativeInvestmentToDate = stationConfig.turnkey ? stationCost : 0;
  
  // Monthly LDC investment tariff rate (as a decimal).
  // For non-TurnKey, this is a fixed monthly percentage of the station cost.
  const monthlyTariffRate = getMonthlyTariffRate(stationConfig);
  // Annual tariff amount (monthly rate * 12 months)
  const annualTariffRate = monthlyTariffRate * 12;
  
  for (let year = 0; year < timeHorizon; year++) {
    // Get lifecycle-aware active vehicle counts for this year
    const active = getActiveVehicles(year);
    let lightInOperation = active.light;
    let mediumInOperation = active.medium;
    let heavyInOperation = active.heavy;

    // Factor in annual fuel price increase
    const annualIncrease = toFiniteNumber(fuelPrices.annualIncrease, 0);
    const yearMultiplier = Math.pow(1 + (annualIncrease / 100), year);
    const adjustedGasolinePrice = toNonNegativeNumber(fuelPrices.gasolinePrice) * yearMultiplier;
    const adjustedDieselPrice = toNonNegativeNumber(fuelPrices.dieselPrice) * yearMultiplier;
    
    // Calculate effective CNG price (base price minus tax credit)
    const effectiveCngPrice = Math.max(
      0,
      toNonNegativeNumber(fuelPrices.cngPrice) - toNonNegativeNumber(fuelPrices.cngTaxCredit)
    );
    const adjustedCngPrice = effectiveCngPrice * yearMultiplier;

    const lightConventionalPrice = vehicleParams.lightDutyFuelType === 'gasoline' ? adjustedGasolinePrice : adjustedDieselPrice;
    const lightFuelSavings =
      lightInOperation *
      (
        (conventionalGallonsPerVehicle.light * lightConventionalPrice) -
        (cngGgePerVehicle.light * adjustedCngPrice)
      );
    
    const mediumConventionalPrice = vehicleParams.mediumDutyFuelType === 'gasoline' ? adjustedGasolinePrice : adjustedDieselPrice;
    const mediumFuelSavings =
      mediumInOperation *
      (
        (conventionalGallonsPerVehicle.medium * mediumConventionalPrice) -
        (cngGgePerVehicle.medium * adjustedCngPrice)
      );
    
    const heavyConventionalPrice = vehicleParams.heavyDutyFuelType === 'gasoline' ? adjustedGasolinePrice : adjustedDieselPrice;
    const heavyFuelSavings =
      heavyInOperation *
      (
        (conventionalGallonsPerVehicle.heavy * heavyConventionalPrice) -
        (cngGgePerVehicle.heavy * adjustedCngPrice)
      );
    
    // Calculate maintenance savings based on miles driven using vehicle-specific annual miles
    const lightMilesDriven = lightInOperation * annualMiles.light;
    const mediumMilesDriven = mediumInOperation * annualMiles.medium;
    const heavyMilesDriven = heavyInOperation * annualMiles.heavy;
    
    // Maintenance savings based on user-configurable per-mile savings
    // Values are stored as dollars (e.g., 0.05 = $0.05/mile)
    const lightMaintenanceSavings = lightMilesDriven * toFiniteNumber(vehicleParams.lightDutyMaintenanceSavings, 0);
    const mediumMaintenanceSavings = mediumMilesDriven * toFiniteNumber(vehicleParams.mediumDutyMaintenanceSavings, 0);
    const heavyMaintenanceSavings = heavyMilesDriven * toFiniteNumber(vehicleParams.heavyDutyMaintenanceSavings, 0);
    
    const maintenanceSavings = lightMaintenanceSavings + mediumMaintenanceSavings + heavyMaintenanceSavings;
    
    // Calculate annual LDC investment tariff for non-turnkey option
    // This is a fixed monthly cost that continues for the entire period
    let annualTariffFee = 0;
    if (!stationConfig.turnkey) {
      annualTariffFee = stationCost * annualTariffRate;
    }
    
    // Separate fuel and maintenance savings (before tariff fees)
    const totalFuelSavings = lightFuelSavings + mediumFuelSavings + heavyFuelSavings;
    
    // Total savings for the year (subtract tariff fee if applicable)
    const yearSavings = totalFuelSavings + maintenanceSavings - annualTariffFee;
    
    yearlySavings.push(Math.round(toFiniteNumber(yearSavings, 0)));
    yearlyFuelSavings.push(Math.round(toFiniteNumber(totalFuelSavings, 0)));
    yearlyMaintenanceSavings.push(Math.round(toFiniteNumber(maintenanceSavings, 0)));
    yearlyTariffFees.push(Math.round(toFiniteNumber(annualTariffFee, 0)));
    
    // Update cumulative savings
    const prevCumulativeSavings = year > 0 ? cumulativeSavings[year - 1] : 0;
    cumulativeSavings.push(Math.round(prevCumulativeSavings + yearSavings));
    
    // Update cumulative initial project investment (exclude replacement capex).
    const yearInvestment = year < ensuredDistribution.length
      ? toNonNegativeNumber(ensuredDistribution[year].investment || 0)
      : 0;
    cumulativeInvestmentToDate += yearInvestment;
    cumulativeInvestment.push(Math.round(cumulativeInvestmentToDate));
  }
  
  // Calculate payback period - find when cumulative savings exceeds investment
  let paybackPeriod = -1; // Default to -1 which will indicate no payback is possible
  
  // Check if it ever pays back within the analysis period
  for (let i = 0; i < timeHorizon; i++) {
    if (cumulativeSavings[i] >= cumulativeInvestment[i]) {
      // Simple linear interpolation for partial year
      if (i > 0) {
        const previousGap = cumulativeInvestment[i-1] - cumulativeSavings[i-1];
        const currentOverage = cumulativeSavings[i] - cumulativeInvestment[i];
        const interpolationBase = previousGap + currentOverage;
        const fractionalYear = interpolationBase > 0
          ? i + (previousGap / interpolationBase)
          : i + 1;
        paybackPeriod = Math.max(0, fractionalYear);
      } else {
        const firstYearSavings = cumulativeSavings[0];
        const firstYearInvestment = cumulativeInvestment[0];
        paybackPeriod = firstYearSavings > 0
          ? Math.max(0, firstYearInvestment / firstYearSavings)
          : 0;
      }
      break;
    }
  }
  
  // If no payback within time horizon, calculate projected payback
  // by extrapolating from the final years' trend
  if (paybackPeriod === -1 && timeHorizon > 1) {
    // Check if savings are still growing in the final years
    const finalYearSavingsGrowth = cumulativeSavings[timeHorizon-1] - cumulativeSavings[timeHorizon-2];
    
    if (finalYearSavingsGrowth > 0) {
      // Get final gap between investment and savings
      const gap = cumulativeInvestment[timeHorizon-1] - cumulativeSavings[timeHorizon-1];
      
      // Calculate additional years needed to reach payback based on final year's growth rate
      const additionalYearsToPayback = gap / finalYearSavingsGrowth;
      
      // Only return a projected payback if it's reasonably achievable (within 50 years total)
      if (timeHorizon + additionalYearsToPayback <= 50) {
        paybackPeriod = timeHorizon + additionalYearsToPayback;
      }
    }
  }
  
  // Calculate ROI at the end of the analysis period
  const finalSavings = timeHorizon > 0 ? (cumulativeSavings[timeHorizon - 1] ?? 0) : 0;
  const roi = totalInvestment > 0
    ? ((finalSavings - totalInvestment) / totalInvestment) * 100
    : 0;
  
  // Annual rate of return
  const annualReturnBase = totalInvestment > 0 ? (finalSavings / totalInvestment) + 1 : 0;
  const annualRateOfReturn =
    totalInvestment > 0 && timeHorizon > 0 && annualReturnBase > 0
      ? (Math.pow(annualReturnBase, 1 / timeHorizon) - 1) * 100
      : 0;
  
  // Calculate net cash flow at the end of the analysis period
  const netCashFlow = finalSavings - totalInvestment;
  
  // Calculate annual fuel savings (average)
  const annualFuelSavings = timeHorizon > 0 ? finalSavings / timeHorizon : 0;
  
  // Calculate CO2 emissions and reduction
  // Use the defined emission factors at the top of the file
  
  // Emission factors for vehicles (g CO2 per mile) - more precise calculation
  const VEHICLE_EMISSION_FACTORS = {
    conventional: {
      gasoline: 404,
      diesel: 690
    },
    cng: {
      light: 303,
      medium: 520,
      heavy: 520
    }
  };

  // Calculate RNG reduction factor based on carbon intensity
  // If RNG is selected, CNG emissions are reduced based on the ratio of RNG CI to fossil CNG CI
  // For carbon-negative RNG (like dairy manure), this will result in negative emissions (carbon capture)
  let rngEmissionsFactor = 1; // Default: no RNG, use fossil CNG emissions as-is
  if (rngFeedstockType !== 'none') {
    const rngCi = rngFeedstockType === 'custom' ? customCiValue : RNG_CI_VALUES[rngFeedstockType as keyof typeof RNG_CI_VALUES];
    const fossilCngCi = RNG_CI_VALUES.fossil_cng;
    rngEmissionsFactor = rngCi / fossilCngCi;
  }

  // Calculate total emissions for conventional fuels vs CNG
  let totalConventionalEmissions = 0;
  let totalCngEmissions = 0;
  let yearlyEmissionsSaved: number[] = [];
  let cumulativeEmissionsSaved: number[] = [];
  let cumulativeEmissionsSavedToDate = 0;

  for (let year = 0; year < timeHorizon; year++) {
    // Get lifecycle-aware active vehicle counts for this year
    const activeEmissions = getActiveVehicles(year);
    let lightInOperation = activeEmissions.light;
    let mediumInOperation = activeEmissions.medium;
    let heavyInOperation = activeEmissions.heavy;

    // Calculate conventional emissions using g/mile emission factors (more accurate)
    const lightConventionalEmissions = lightInOperation * annualMiles.light * VEHICLE_EMISSION_FACTORS.conventional[vehicleParams.lightDutyFuelType] / 1000;
    const mediumConventionalEmissions = mediumInOperation * annualMiles.medium * VEHICLE_EMISSION_FACTORS.conventional[vehicleParams.mediumDutyFuelType] / 1000;
    const heavyConventionalEmissions = heavyInOperation * annualMiles.heavy * VEHICLE_EMISSION_FACTORS.conventional[vehicleParams.heavyDutyFuelType] / 1000;

    const yearConventionalEmissions = lightConventionalEmissions + mediumConventionalEmissions + heavyConventionalEmissions;
    
    // Calculate CNG emissions using g/mile emission factors
    // Apply RNG reduction factor to CNG emissions
    const baseLightCngEmissions = lightInOperation * annualMiles.light * VEHICLE_EMISSION_FACTORS.cng.light / 1000;
    const baseMediumCngEmissions = mediumInOperation * annualMiles.medium * VEHICLE_EMISSION_FACTORS.cng.medium / 1000;
    const baseHeavyCngEmissions = heavyInOperation * annualMiles.heavy * VEHICLE_EMISSION_FACTORS.cng.heavy / 1000;
    
    // Apply RNG factor (can be negative for carbon-negative RNG feedstocks)
    const lightCngEmissions = baseLightCngEmissions * rngEmissionsFactor;
    const mediumCngEmissions = baseMediumCngEmissions * rngEmissionsFactor;
    const heavyCngEmissions = baseHeavyCngEmissions * rngEmissionsFactor;
    
    const yearCngEmissions = lightCngEmissions + mediumCngEmissions + heavyCngEmissions;
    
    // Calculate emissions savings for this year
    const yearEmissionsSaved = yearConventionalEmissions - yearCngEmissions;
    
    // Update totals
    totalConventionalEmissions += yearConventionalEmissions;
    totalCngEmissions += yearCngEmissions;
    
    // Track yearly and cumulative emissions saved
    yearlyEmissionsSaved.push(Math.round(yearEmissionsSaved));
    cumulativeEmissionsSavedToDate += yearEmissionsSaved;
    cumulativeEmissionsSaved.push(Math.round(cumulativeEmissionsSavedToDate));
  }
  
  // Calculate total CO2 reduction percentage
  const co2Reduction = totalConventionalEmissions > 0 
    ? ((totalConventionalEmissions - totalCngEmissions) / totalConventionalEmissions) * 100 
    : 0;
  
  // Calculate cost per mile metrics
  const costPerMileGasoline = safeDivide(toNonNegativeNumber(fuelPrices.gasolinePrice), conventionalMpg.light);
  
  // Calculate effective CNG price (base price minus tax credit) for cost per mile
  const effectiveCngPrice = Math.max(
    0,
    toNonNegativeNumber(fuelPrices.cngPrice) - toNonNegativeNumber(fuelPrices.cngTaxCredit)
  );
  const costPerMileCNG = safeDivide(effectiveCngPrice, cngMpg.light);
  
  const costReduction = costPerMileGasoline > 0
    ? ((costPerMileGasoline - costPerMileCNG) / costPerMileGasoline) * 100
    : 0;
  
  // Total emissions saved in kg (convert to metric tons for display)
  const totalEmissionsSaved = cumulativeEmissionsSaved.length > 0 
    ? cumulativeEmissionsSaved[cumulativeEmissionsSaved.length - 1] 
    : 0;

  const totalTariffFees = yearlyTariffFees.reduce((sum, fee) => sum + fee, 0);

  return {
    totalInvestment,
    totalVehicleInvestment,
    stationCost,
    totalProjectCost,
    totalTariffFees,
    annualFuelSavings,
    yearlySavings,
    yearlyFuelSavings,
    yearlyMaintenanceSavings,
    yearlyTariffFees,
    cumulativeSavings,
    cumulativeInvestment,
    paybackPeriod,
    roi,
    annualRateOfReturn,
    netCashFlow,
    co2Reduction,
    yearlyEmissionsSaved,
    cumulativeEmissionsSaved,
    totalEmissionsSaved,
    costPerMileGasoline,
    costPerMileCNG,
    costReduction,
    vehicleDistribution: ensuredDistribution
  };
}
