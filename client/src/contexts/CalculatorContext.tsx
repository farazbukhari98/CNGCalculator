import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  VehicleParameters, 
  StationConfig, 
  FuelPrices,
  DeploymentStrategy,
  CalculationResults,
  VehicleDistribution 
} from "@/types/calculator";
import { calculateROI, distributeVehicles, applyVehicleLifecycle, getVehicleCosts } from "@/lib/calculator";

// Track which fields have been modified from defaults
interface ModifiedFields {
  [key: string]: boolean;
}

// Context type
interface CalculatorContextType {
  vehicleParameters: VehicleParameters;
  stationConfig: StationConfig;
  fuelPrices: FuelPrices;
  timeHorizon: number;
  deploymentStrategy: DeploymentStrategy;
  vehicleDistribution: VehicleDistribution[] | null;
  enhancedDistribution: VehicleDistribution[] | null;
  results: CalculationResults | null;
  sidebarCollapsed: boolean;
  hideNegativeValues: boolean;
  modifiedFields: ModifiedFields;
  
  updateVehicleParameters: (params: VehicleParameters) => void;
  updateStationConfig: (config: StationConfig) => void;
  updateFuelPrices: (prices: FuelPrices) => void;
  updateTimeHorizon: (years: number) => void;
  updateDeploymentStrategy: (strategy: DeploymentStrategy) => void;
  setDistributionStrategy: (strategy: DeploymentStrategy) => void;
  updateManualDistribution: (year: number, vehicle: Partial<VehicleDistribution>) => void;
  setManualDistributionBulk: (distributions: VehicleDistribution[]) => void;
  calculateResults: () => void;
  toggleSidebar: () => void;
  toggleHideNegativeValues: () => void;
  markFieldAsModified: (fieldName: string) => void;
  isFieldModified: (fieldName: string) => boolean;
  resetFieldModifications: () => void;
}

// Create the context
const CalculatorContext = createContext<CalculatorContextType | null>(null);

// Provider component
export function CalculatorProvider({ children }: { children: ReactNode }) {
  // Initial state values
  const [vehicleParameters, setVehicleParameters] = useState<VehicleParameters>({
    lightDutyCount: 10,
    mediumDutyCount: 5,
    heavyDutyCount: 2,
    lightDutyCost: 15000,
    mediumDutyCost: 15000,
    heavyDutyCost: 50000,
    // Default values for vehicle lifespan
    lightDutyLifespan: 7,
    mediumDutyLifespan: 7,
    heavyDutyLifespan: 7,
    // Default values for MPG (Miles Per Gallon)
    lightDutyMPG: 12,
    mediumDutyMPG: 10,
    heavyDutyMPG: 5,
    // Default values for Annual Miles
    lightDutyAnnualMiles: 20000,
    mediumDutyAnnualMiles: 20000,
    heavyDutyAnnualMiles: 40000,
    // Default fuel types: light duty gasoline, medium/heavy duty diesel
    lightDutyFuelType: 'gasoline',
    mediumDutyFuelType: 'diesel',
    heavyDutyFuelType: 'diesel',
    // Default CNG efficiency loss as integer percentages (multiplied by 10 for precision)
    lightDutyCngEfficiencyLoss: 50,   // 5.0% loss (stored as 50)
    mediumDutyCngEfficiencyLoss: 75,  // 7.5% loss (stored as 75)
    heavyDutyCngEfficiencyLoss: 100   // 10.0% loss (stored as 100)
  });

  const [stationConfig, setStationConfig] = useState<StationConfig>({
    stationType: "fast",
    businessType: "aglc",
    turnkey: true, // Default to Yes (upfront cost)
    sizingMethod: "peak", // Always use peak year sizing (maximum vehicles in any single year)
    stationMarkup: 20 // Default to 20% markup on station cost
  });

  const [fuelPrices, setFuelPrices] = useState<FuelPrices>({
    gasolinePrice: 3.38,
    dieselPrice: 3.84,
    cngPrice: 0.82, // Base CNG rate before business rate and electricity cost
    cngTaxCredit: 0.00, // Default to $0.00 tax credit per gallon
    annualIncrease: 0,
    gasolineToCngConversionFactor: 1,
    dieselToCngConversionFactor: 1
  });

  const [timeHorizon, setTimeHorizon] = useState<number>(15); // Default to 15 years
  const [deploymentStrategy, setDeploymentStrategy] = useState<DeploymentStrategy>("manual"); // Default to manual distribution
  const [vehicleDistribution, setVehicleDistribution] = useState<VehicleDistribution[] | null>(null);
  const [enhancedDistribution, setEnhancedDistribution] = useState<VehicleDistribution[] | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [hideNegativeValues, setHideNegativeValues] = useState<boolean>(false);
  const [modifiedFields, setModifiedFields] = useState<ModifiedFields>({});

  // Helper function to detect if current distribution is over-allocated
  const isOverAllocated = (distribution: VehicleDistribution[] | null, params: VehicleParameters, horizon: number) => {
    if (!distribution || deploymentStrategy !== 'manual') return false;
    
    const visibleDistribution = distribution.slice(0, horizon);
    
    const totalLight = visibleDistribution.reduce((sum, year) => sum + (year.light || 0), 0);
    const totalMedium = visibleDistribution.reduce((sum, year) => sum + (year.medium || 0), 0);
    const totalHeavy = visibleDistribution.reduce((sum, year) => sum + (year.heavy || 0), 0);
    
    return totalLight > params.lightDutyCount || 
           totalMedium > params.mediumDutyCount || 
           totalHeavy > params.heavyDutyCount;
  };
  
  // Helper function to scale manual distribution to match new vehicle counts
  const scaleManualDistribution = (
    distribution: VehicleDistribution[],
    params: VehicleParameters,
    horizon: number
  ): VehicleDistribution[] => {
    const vehicleCosts = getVehicleCosts(params);
    
    // Get current totals from distribution
    const currentTotals = distribution.reduce(
      (acc, year) => ({
        light: acc.light + (year.light || 0),
        medium: acc.medium + (year.medium || 0),
        heavy: acc.heavy + (year.heavy || 0)
      }),
      { light: 0, medium: 0, heavy: 0 }
    );
    
    // If all vehicles were in year 1, keep them in year 1 when scaling
    const firstYearOnly = distribution.length > 0 && 
      distribution[0].heavy === currentTotals.heavy &&
      distribution[0].light === currentTotals.light &&
      distribution[0].medium === currentTotals.medium;
    
    const scaledDistribution: VehicleDistribution[] = [];
    
    if (firstYearOnly) {
      // Keep all vehicles in year 1
      const yearInvestment = 
        (params.lightDutyCount * vehicleCosts.light) + 
        (params.mediumDutyCount * vehicleCosts.medium) + 
        (params.heavyDutyCount * vehicleCosts.heavy);
      
      scaledDistribution.push({
        light: params.lightDutyCount,
        medium: params.mediumDutyCount,
        heavy: params.heavyDutyCount,
        investment: yearInvestment
      });
      
      // Add empty years for the rest
      for (let i = 1; i < horizon; i++) {
        scaledDistribution.push({
          light: 0,
          medium: 0,
          heavy: 0,
          investment: 0
        });
      }
    } else {
      // Scale proportionally across years
      const lightScale = currentTotals.light > 0 ? params.lightDutyCount / currentTotals.light : 0;
      const mediumScale = currentTotals.medium > 0 ? params.mediumDutyCount / currentTotals.medium : 0;
      const heavyScale = currentTotals.heavy > 0 ? params.heavyDutyCount / currentTotals.heavy : 0;
      
      let remainingLight = params.lightDutyCount;
      let remainingMedium = params.mediumDutyCount;
      let remainingHeavy = params.heavyDutyCount;
      
      for (let i = 0; i < horizon; i++) {
        if (i < distribution.length) {
          const year = distribution[i];
          const scaledLight = Math.min(Math.round((year.light || 0) * lightScale), remainingLight);
          const scaledMedium = Math.min(Math.round((year.medium || 0) * mediumScale), remainingMedium);
          const scaledHeavy = Math.min(Math.round((year.heavy || 0) * heavyScale), remainingHeavy);
          
          remainingLight -= scaledLight;
          remainingMedium -= scaledMedium;
          remainingHeavy -= scaledHeavy;
          
          const yearInvestment = 
            (scaledLight * vehicleCosts.light) + 
            (scaledMedium * vehicleCosts.medium) + 
            (scaledHeavy * vehicleCosts.heavy);
          
          scaledDistribution.push({
            light: scaledLight,
            medium: scaledMedium,
            heavy: scaledHeavy,
            investment: yearInvestment
          });
        } else {
          scaledDistribution.push({
            light: 0,
            medium: 0,
            heavy: 0,
            investment: 0
          });
        }
      }
    }
    
    return scaledDistribution;
  };
  
  // Helper function to clamp distribution to valid ranges
  const clampDistribution = (distribution: VehicleDistribution[], params: VehicleParameters, horizon: number): VehicleDistribution[] => {
    if (deploymentStrategy !== 'manual') return distribution;
    
    const clampedDistribution = [...distribution];
    const vehicleCosts = {
      light: params.lightDutyCost,
      medium: params.mediumDutyCost,
      heavy: params.heavyDutyCost
    };
    
    // Only work with visible years (respecting timeHorizon)
    const visibleYears = Math.min(horizon, clampedDistribution.length);
    
    // Calculate current totals across visible years
    let totalLight = 0;
    let totalMedium = 0;
    let totalHeavy = 0;
    
    for (let i = 0; i < visibleYears; i++) {
      totalLight += clampedDistribution[i].light || 0;
      totalMedium += clampedDistribution[i].medium || 0;
      totalHeavy += clampedDistribution[i].heavy || 0;
    }
    
    // Calculate excess for each vehicle type
    const excessLight = Math.max(0, totalLight - params.lightDutyCount);
    const excessMedium = Math.max(0, totalMedium - params.mediumDutyCount);
    const excessHeavy = Math.max(0, totalHeavy - params.heavyDutyCount);
    
    // Remove excess starting from the last visible year
    if (excessLight > 0 || excessMedium > 0 || excessHeavy > 0) {
      let remainingExcessLight = excessLight;
      let remainingExcessMedium = excessMedium;
      let remainingExcessHeavy = excessHeavy;
      
      for (let i = visibleYears - 1; i >= 0 && (remainingExcessLight > 0 || remainingExcessMedium > 0 || remainingExcessHeavy > 0); i--) {
        const yearData = clampedDistribution[i];
        
        // Reduce light duty vehicles
        if (remainingExcessLight > 0) {
          const reduction = Math.min(remainingExcessLight, yearData.light || 0);
          yearData.light = (yearData.light || 0) - reduction;
          remainingExcessLight -= reduction;
        }
        
        // Reduce medium duty vehicles
        if (remainingExcessMedium > 0) {
          const reduction = Math.min(remainingExcessMedium, yearData.medium || 0);
          yearData.medium = (yearData.medium || 0) - reduction;
          remainingExcessMedium -= reduction;
        }
        
        // Reduce heavy duty vehicles
        if (remainingExcessHeavy > 0) {
          const reduction = Math.min(remainingExcessHeavy, yearData.heavy || 0);
          yearData.heavy = (yearData.heavy || 0) - reduction;
          remainingExcessHeavy -= reduction;
        }
        
        // Recalculate investment for this year
        yearData.investment = 
          ((yearData.light || 0) * vehicleCosts.light) + 
          ((yearData.medium || 0) * vehicleCosts.medium) + 
          ((yearData.heavy || 0) * vehicleCosts.heavy);
      }
    }
    
    return clampedDistribution;
  };

  // Automatically recalculate when any parameter changes
  useEffect(() => {
    if (deploymentStrategy === 'manual' && vehicleDistribution) {
      
      // Check if the total vehicle counts in the parameters have changed
      // If so, we need to regenerate the distribution to reflect new totals
      const currentDistributionTotals = vehicleDistribution.reduce(
        (acc, year) => ({
          light: acc.light + (year.light || 0),
          medium: acc.medium + (year.medium || 0),
          heavy: acc.heavy + (year.heavy || 0)
        }),
        { light: 0, medium: 0, heavy: 0 }
      );
      
      const parametersChanged = 
        currentDistributionTotals.light !== vehicleParameters.lightDutyCount ||
        currentDistributionTotals.medium !== vehicleParameters.mediumDutyCount ||
        currentDistributionTotals.heavy !== vehicleParameters.heavyDutyCount;
        
      
      if (parametersChanged) {
        // Vehicle parameters changed, preserve existing manual distribution pattern
        // Scale the existing distribution to match new vehicle counts
        const scaledDistribution = scaleManualDistribution(
          vehicleDistribution,
          vehicleParameters,
          timeHorizon
        );
        
        // Store scaled distribution (without lifecycle enhancements)
        setVehicleDistribution(scaledDistribution);
        
        // Apply vehicle lifecycle management for calculations only
        const enhancedDistribution = applyVehicleLifecycle(
          scaledDistribution,
          vehicleParameters,
          timeHorizon
        );
        setEnhancedDistribution(enhancedDistribution);
        
        // Calculate ROI and other metrics
        if (enhancedDistribution) {
          const calculationResults = calculateROI(
            vehicleParameters,
            stationConfig,
            fuelPrices,
            timeHorizon,
            deploymentStrategy,
            enhancedDistribution
          );
          setResults(calculationResults);
        }
        return;
      }
      
      // For manual mode, check if current distribution is still valid
      // If over-allocated or timeHorizon reduced, clamp the distribution
      if (isOverAllocated(vehicleDistribution, vehicleParameters, timeHorizon)) {
        const clampedDistribution = clampDistribution(vehicleDistribution, vehicleParameters, timeHorizon);
        
        // Store clamped distribution (without lifecycle enhancements)
        setVehicleDistribution(clampedDistribution);
        
        // Apply vehicle lifecycle management for calculations only
        const enhancedDistribution = applyVehicleLifecycle(
          clampedDistribution,
          vehicleParameters,
          timeHorizon
        );
        setEnhancedDistribution(enhancedDistribution);
        
        // Recalculate results with the clamped distribution
        if (enhancedDistribution) {
          const calculationResults = calculateROI(
            vehicleParameters,
            stationConfig,
            fuelPrices,
            timeHorizon,
            deploymentStrategy,
            enhancedDistribution
          );
          setResults(calculationResults);
        }
        return;
      }
      
      // If no clamping needed, still apply lifecycle management
      const enhancedDistribution = applyVehicleLifecycle(
        vehicleDistribution,
        vehicleParameters,
        timeHorizon
      );
      setEnhancedDistribution(enhancedDistribution);
      
      // Then recalculate results with the enhanced distribution
      if (enhancedDistribution) {
        const calculationResults = calculateROI(
          vehicleParameters,
          stationConfig,
          fuelPrices,
          timeHorizon,
          deploymentStrategy,
          enhancedDistribution
        );
        setResults(calculationResults);
      }
    } else {
      // For non-manual modes or when no existing distribution, generate new distribution
      const baseDistribution = distributeVehicles(
        vehicleParameters,
        timeHorizon,
        deploymentStrategy
      );
      
      // Apply vehicle lifecycle management
      // Store base distribution (without lifecycle enhancements)
      setVehicleDistribution(baseDistribution);
      
      // Apply vehicle lifecycle management for calculations only
      const enhancedDistribution = applyVehicleLifecycle(
        baseDistribution,
        vehicleParameters,
        timeHorizon
      );
      setEnhancedDistribution(enhancedDistribution);
      
      // Then calculate ROI and other metrics
      if (enhancedDistribution) {
        const calculationResults = calculateROI(
          vehicleParameters,
          stationConfig,
          fuelPrices,
          timeHorizon,
          deploymentStrategy,
          enhancedDistribution
        );
        setResults(calculationResults);
      }
    }
  }, [vehicleParameters, stationConfig, fuelPrices, timeHorizon, deploymentStrategy]);

  // Method to update vehicle parameters
  const updateVehicleParameters = (params: VehicleParameters) => {
    setVehicleParameters(params);
  };

  // Method to update station configuration
  const updateStationConfig = (config: StationConfig) => {
    setStationConfig(config);
  };

  // Method to update fuel prices
  const updateFuelPrices = (prices: FuelPrices) => {
    setFuelPrices(prices);
  };

  // Method to update time horizon
  const updateTimeHorizon = (years: number) => {
    setTimeHorizon(years);
  };

  // Method to update deployment strategy
  const updateDeploymentStrategy = (strategy: DeploymentStrategy) => {
    // Previous strategy
    const previousStrategy = deploymentStrategy;
    
    // Update the strategy state
    setDeploymentStrategy(strategy);
    
    // Always recalculate distribution when strategy changes
    const baseDistribution = distributeVehicles(
      vehicleParameters,
      timeHorizon,
      strategy
    );
    
    // Debug logging
    console.log('Base Distribution from distributeVehicles:', baseDistribution);
    
    // Store base distribution (without lifecycle enhancements)
    setVehicleDistribution(baseDistribution);
    
    // Apply vehicle lifecycle management for calculations only
    const enhancedDistribution = applyVehicleLifecycle(
      baseDistribution,
      vehicleParameters,
      timeHorizon
    );
    
    console.log('Enhanced Distribution after lifecycle:', enhancedDistribution);
    setEnhancedDistribution(enhancedDistribution);
    
    // Recalculate results with the new distribution
    if (enhancedDistribution) {
      const calculationResults = calculateROI(
        vehicleParameters,
        stationConfig,
        fuelPrices,
        timeHorizon,
        strategy,
        enhancedDistribution
      );
      setResults(calculationResults);
    }
  };

  // Method to change distribution strategy without changing overall deployment strategy
  const setDistributionStrategy = (strategy: DeploymentStrategy) => {
    if (strategy !== 'manual') {
      setDeploymentStrategy(strategy);
      const baseDistribution = distributeVehicles(
        vehicleParameters,
        timeHorizon,
        strategy
      );
      
      // Apply vehicle lifecycle management
      // Store base distribution (without lifecycle enhancements)
      setVehicleDistribution(baseDistribution);
      
      // Apply vehicle lifecycle management for calculations only
      const enhancedDistribution = applyVehicleLifecycle(
        baseDistribution,
        vehicleParameters,
        timeHorizon
      );
      setEnhancedDistribution(enhancedDistribution);
      
      // Recalculate with new distribution
      if (enhancedDistribution) {
        const calculationResults = calculateROI(
          vehicleParameters,
          stationConfig,
          fuelPrices,
          timeHorizon,
          strategy,
          enhancedDistribution
        );
        setResults(calculationResults);
      }
    }
  };

  // Method to update manual distribution
  const updateManualDistribution = (year: number, vehicle: Partial<VehicleDistribution>) => {
    if (vehicleDistribution && deploymentStrategy === 'manual') {
      // Create a copy of the current distribution
      const newDistribution = [...vehicleDistribution];
      
      // Update the specified year with the new values
      const updatedYearData = {
        ...newDistribution[year - 1],
        ...vehicle
      };
      
      console.log(`Updating manual distribution for Year ${year}:`, vehicle);
      console.log('Updated year data:', updatedYearData);
      
      // Recalculate the investment for this year based on the updated vehicle counts
      if (vehicle.light !== undefined || vehicle.medium !== undefined || vehicle.heavy !== undefined) {
        // Get current vehicle counts
        const light = updatedYearData.light || 0;
        const medium = updatedYearData.medium || 0;
        const heavy = updatedYearData.heavy || 0;
        
        // Calculate new investment using vehicle costs from parameters
        const investment = 
          (light * vehicleParameters.lightDutyCost) + 
          (medium * vehicleParameters.mediumDutyCost) + 
          (heavy * vehicleParameters.heavyDutyCost);
        
        updatedYearData.investment = investment;
      }
      
      // Update the distribution
      newDistribution[year - 1] = updatedYearData;
      
      // Update the distribution state
      setVehicleDistribution(newDistribution);
      
      // Apply lifecycle management to the updated distribution
      const enhancedDist = applyVehicleLifecycle(
        newDistribution,
        vehicleParameters,
        timeHorizon
      );
      setEnhancedDistribution(enhancedDist);
      
      // Recalculate results with the enhanced distribution
      if (enhancedDist) {
        const calculationResults = calculateROI(
          vehicleParameters,
          stationConfig,
          fuelPrices,
          timeHorizon,
          deploymentStrategy,
          enhancedDist
        );
        setResults(calculationResults);
      }
    }
  };

  // Method to update all manual distributions at once (bulk update)
  const setManualDistributionBulk = (distributions: VehicleDistribution[]) => {
    if (deploymentStrategy === 'manual') {
      console.log('Setting manual distribution bulk:', distributions);
      
      // Create new distribution array with proper investments calculated
      const newDistribution = distributions.map((yearData, index) => {
        const light = yearData.light || 0;
        const medium = yearData.medium || 0;
        const heavy = yearData.heavy || 0;
        
        const investment = 
          (light * vehicleParameters.lightDutyCost) + 
          (medium * vehicleParameters.mediumDutyCost) + 
          (heavy * vehicleParameters.heavyDutyCost);
        
        return {
          light,
          medium,
          heavy,
          investment
        };
      });
      
      // Update the distribution state
      setVehicleDistribution(newDistribution);
      
      // Apply lifecycle management to the updated distribution
      const enhancedDist = applyVehicleLifecycle(
        newDistribution,
        vehicleParameters,
        timeHorizon
      );
      setEnhancedDistribution(enhancedDist);
      
      // Recalculate results with the enhanced distribution
      if (enhancedDist) {
        const calculationResults = calculateROI(
          vehicleParameters,
          stationConfig,
          fuelPrices,
          timeHorizon,
          deploymentStrategy,
          enhancedDist
        );
        setResults(calculationResults);
      }
    }
  };

  // Method to calculate ROI and other metrics
  const calculateResults = () => {
    // First, distribute vehicles based on strategy
    const distribution = distributeVehicles(
      vehicleParameters,
      timeHorizon,
      deploymentStrategy
    );
    setVehicleDistribution(distribution);
    
    // Then calculate ROI and other metrics
    if (distribution) {
      const calculationResults = calculateROI(
        vehicleParameters,
        stationConfig,
        fuelPrices,
        timeHorizon,
        deploymentStrategy,
        distribution
      );
      setResults(calculationResults);
    }
  };
  
  // Method to toggle the sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Method to toggle hide negative values
  const toggleHideNegativeValues = () => {
    setHideNegativeValues(prev => !prev);
  };

  // Field modification tracking methods
  const markFieldAsModified = (fieldName: string) => {
    setModifiedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const isFieldModified = (fieldName: string) => {
    return modifiedFields[fieldName] || false;
  };

  const resetFieldModifications = () => {
    setModifiedFields({});
  };

  // Context value
  const value = {
    vehicleParameters,
    stationConfig,
    fuelPrices,
    timeHorizon,
    deploymentStrategy,
    vehicleDistribution,
    enhancedDistribution,
    results,
    sidebarCollapsed,
    hideNegativeValues,
    modifiedFields,
    
    updateVehicleParameters,
    updateStationConfig,
    updateFuelPrices,
    updateTimeHorizon,
    updateDeploymentStrategy,
    setDistributionStrategy,
    updateManualDistribution,
    setManualDistributionBulk,
    calculateResults,
    toggleSidebar,
    toggleHideNegativeValues,
    markFieldAsModified,
    isFieldModified,
    resetFieldModifications
  };

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
}

// Custom hook for using the calculator context
export function useCalculator() {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error("useCalculator must be used within a CalculatorProvider");
  }
  return context;
}
