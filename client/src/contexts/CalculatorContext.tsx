import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  VehicleParameters, 
  StationConfig, 
  FuelPrices,
  DeploymentStrategy,
  CalculationResults,
  VehicleDistribution 
} from "@/types/calculator";
import { calculateROI, distributeVehicles, applyVehicleLifecycle } from "@/lib/calculator";

// Context type
interface CalculatorContextType {
  vehicleParameters: VehicleParameters;
  stationConfig: StationConfig;
  fuelPrices: FuelPrices;
  timeHorizon: number;
  deploymentStrategy: DeploymentStrategy;
  vehicleDistribution: VehicleDistribution[] | null;
  results: CalculationResults | null;
  sidebarCollapsed: boolean;
  hideNegativeValues: boolean;
  
  updateVehicleParameters: (params: VehicleParameters) => void;
  updateStationConfig: (config: StationConfig) => void;
  updateFuelPrices: (prices: FuelPrices) => void;
  updateTimeHorizon: (years: number) => void;
  updateDeploymentStrategy: (strategy: DeploymentStrategy) => void;
  setDistributionStrategy: (strategy: DeploymentStrategy) => void;
  updateManualDistribution: (year: number, vehicle: Partial<VehicleDistribution>) => void;
  calculateResults: () => void;
  toggleSidebar: () => void;
  toggleHideNegativeValues: () => void;
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
    heavyDutyFuelType: 'diesel'
  });

  const [stationConfig, setStationConfig] = useState<StationConfig>({
    stationType: "fast",
    businessType: "aglc",
    turnkey: true, // Default to Yes (upfront cost)
    sizingMethod: "peak" // Always use peak year sizing (maximum vehicles in any single year)
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
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [hideNegativeValues, setHideNegativeValues] = useState<boolean>(false);

  // Automatically recalculate when any parameter changes
  useEffect(() => {
    // First, distribute vehicles based on strategy
    const baseDistribution = distributeVehicles(
      vehicleParameters,
      timeHorizon,
      deploymentStrategy
    );
    
    // Apply vehicle lifecycle management
    const enhancedDistribution = applyVehicleLifecycle(
      baseDistribution,
      vehicleParameters,
      timeHorizon
    );
    
    setVehicleDistribution(enhancedDistribution);
    
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
    
    // Apply vehicle lifecycle management
    const enhancedDistribution = applyVehicleLifecycle(
      baseDistribution,
      vehicleParameters,
      timeHorizon
    );
    
    setVehicleDistribution(enhancedDistribution);
    
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
      const enhancedDistribution = applyVehicleLifecycle(
        baseDistribution,
        vehicleParameters,
        timeHorizon
      );
      
      setVehicleDistribution(enhancedDistribution);
      
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
      
      // Recalculate results with the new distribution
      const calculationResults = calculateROI(
        vehicleParameters,
        stationConfig,
        fuelPrices,
        timeHorizon,
        deploymentStrategy,
        newDistribution
      );
      setResults(calculationResults);
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

  // Context value
  const value = {
    vehicleParameters,
    stationConfig,
    fuelPrices,
    timeHorizon,
    deploymentStrategy,
    vehicleDistribution,
    results,
    sidebarCollapsed,
    hideNegativeValues,
    
    updateVehicleParameters,
    updateStationConfig,
    updateFuelPrices,
    updateTimeHorizon,
    updateDeploymentStrategy,
    setDistributionStrategy,
    updateManualDistribution,
    calculateResults,
    toggleSidebar,
    toggleHideNegativeValues
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
