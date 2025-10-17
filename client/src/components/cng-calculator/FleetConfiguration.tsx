import { useCalculator } from "@/contexts/CalculatorContext";
import { Card, CardContent } from "@/components/ui/card";
import { formatPaybackPeriod } from "@/lib/utils";
import { MetricInfoTooltip } from "./MetricInfoTooltip";
import { calculateStationCost } from "@/lib/calculator";

interface FleetConfigurationProps {
  showCashflow: boolean;
}

export default function FleetConfiguration({ showCashflow }: FleetConfigurationProps) {
  const { 
    vehicleParameters,
    stationConfig,
    results,
    timeHorizon,
    deploymentStrategy,
    vehicleDistribution,
    enhancedDistribution,
    fuelPrices
  } = useCalculator();

  // Calculate vehicle distribution percentages (use manual distribution totals if in manual mode)
  const getActualVehicleCounts = () => {
    if (deploymentStrategy === 'manual' && vehicleDistribution) {
      // Sum up totals from manual distribution
      const totals = vehicleDistribution.reduce(
        (acc, year) => ({
          light: acc.light + (year.light || 0),
          medium: acc.medium + (year.medium || 0),
          heavy: acc.heavy + (year.heavy || 0)
        }),
        { light: 0, medium: 0, heavy: 0 }
      );
      return totals;
    }
    // For non-manual strategies, use original parameters
    return {
      light: vehicleParameters.lightDutyCount,
      medium: vehicleParameters.mediumDutyCount,
      heavy: vehicleParameters.heavyDutyCount
    };
  };

  const actualCounts = getActualVehicleCounts();
  const totalVehicles = actualCounts.light + actualCounts.medium + actualCounts.heavy;
  
  const lightDutyPercentage = totalVehicles > 0 
    ? Math.round((actualCounts.light / totalVehicles) * 100) 
    : 0;
  
  const mediumDutyPercentage = totalVehicles > 0 
    ? Math.round((actualCounts.medium / totalVehicles) * 100) 
    : 0;
  
  const heavyDutyPercentage = totalVehicles > 0 
    ? Math.round((actualCounts.heavy / totalVehicles) * 100) 
    : 0;

  // Vehicle costs (CNG conversion costs)
  const lightDutyCost = 15000;
  const mediumDutyCost = 15000;
  const heavyDutyCost = 50000;

  // Total vehicle investment (use actual counts from manual distribution if applicable)
  const totalVehicleInvestment = 
    (actualCounts.light * lightDutyCost) +
    (actualCounts.medium * mediumDutyCost) +
    (actualCounts.heavy * heavyDutyCost);

  // Calculate annual GGE (Gasoline Gallon Equivalent) consumption for station sizing (use actual counts)
  // Formula: (Annual Miles / (MPG × CNG Efficiency Factor)) × Vehicle Count
  
  // CNG efficiency factors (fuel economy reduction)
  const cngEfficiencyFactors = {
    light: 0.95,    // 95% efficiency (5% reduction)
    medium: 0.925,  // 92.5% efficiency (7.5% reduction)  
    heavy: 0.90     // 90% efficiency (10% reduction)
  };
  
  // Calculate annual GGE per vehicle type
  const lightAnnualGGE = vehicleParameters.lightDutyAnnualMiles / (vehicleParameters.lightDutyMPG * cngEfficiencyFactors.light);
  const mediumAnnualGGE = vehicleParameters.mediumDutyAnnualMiles / (vehicleParameters.mediumDutyMPG * cngEfficiencyFactors.medium);
  const heavyAnnualGGE = vehicleParameters.heavyDutyAnnualMiles / (vehicleParameters.heavyDutyMPG * cngEfficiencyFactors.heavy);
  
  // Total annual GGE consumption for the fleet (use actual counts)
  const annualGGE = 
    (actualCounts.light * lightAnnualGGE) + 
    (actualCounts.medium * mediumAnnualGGE) + 
    (actualCounts.heavy * heavyAnnualGGE);
  
  // Use centralized station cost calculation - use enhanced distribution for accurate active vehicle counts
  const getStationCost = () => {
    return calculateStationCost(stationConfig, vehicleParameters, enhancedDistribution, fuelPrices);
  };

  const stationCost = getStationCost();
  const totalInvestment = totalVehicleInvestment + stationCost;

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="bg-white rounded-lg shadow mb-6 dark:bg-gray-800">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Fleet Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vehicle Distribution */}
          <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
            <h3 className="text-sm font-medium text-gray-700 mb-3 dark:text-gray-200">Vehicle Distribution</h3>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Light Duty ({actualCounts.light})
                </span>
              </div>
              <span className="text-sm font-medium dark:text-gray-200">{lightDutyPercentage}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full mb-3">
              <div 
                className="h-2 bg-blue-500 rounded-full" 
                style={{ width: `${lightDutyPercentage}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Medium Duty ({actualCounts.medium})
                </span>
              </div>
              <span className="text-sm font-medium dark:text-gray-200">{mediumDutyPercentage}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full mb-3">
              <div 
                className="h-2 bg-green-500 rounded-full" 
                style={{ width: `${mediumDutyPercentage}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Heavy Duty ({actualCounts.heavy})
                </span>
              </div>
              <span className="text-sm font-medium dark:text-gray-200">{heavyDutyPercentage}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full">
              <div 
                className="h-2 bg-red-500 rounded-full" 
                style={{ width: `${heavyDutyPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Total Investment */}
          <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
            <h3 className="text-sm font-medium text-gray-700 mb-3 dark:text-gray-200">
              Total Investment
              <MetricInfoTooltip
                title="Total Investment"
                description="The total estimated capital required for the project over the analysis period. Includes vehicle costs and potentially the station cost upfront if TurnKey is selected."
                calculation="Total Vehicle Investment + (Station Cost if TurnKey = Yes)"
                affectingVariables={[
                  "Vehicle counts and costs",
                  "Station type (Fast-Fill/Time-Fill)",
                  "Business type (Gas LDC selection)",
                  "TurnKey option (Yes/No)",
                  "Deployment strategy timing"
                ]}
                simpleDescription="Total upfront capital required for the project."
              />
            </h3>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Vehicles (incremental)</span>
                <span className="text-sm font-medium dark:text-gray-200">{formatCurrency(totalVehicleInvestment)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Station</span>
                <span className="text-sm font-medium dark:text-gray-200">{formatCurrency(stationCost)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t dark:border-gray-600">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Total</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(totalInvestment)}</span>
              </div>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
            <h3 className="text-sm font-medium text-gray-700 mb-3 dark:text-gray-200">Key Metrics</h3>
            {/* Payback Period - always show */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Payback Period
                <MetricInfoTooltip
                  title="Payback Period"
                  description="The estimated time (in years and months) it takes for the cumulative savings generated by the project to equal the total initial investment. Investment basis and savings calculation differ based on the TurnKey option."
                  calculation="Time t where Cumulative Savings(t) >= Cumulative Investment(t). If TurnKey=Yes: Investment includes vehicles + station upfront. If TurnKey=No: Investment includes only vehicles upfront."
                  affectingVariables={[
                    "Vehicle parameters (counts, costs, MPG, lifespan)",
                    "Station configuration (type, business type, TurnKey option)",
                    "Fuel prices and annual increase rate",
                    "Deployment strategy timing"
                  ]}
                  simpleDescription="Time until your investment is fully recovered from savings."
                />
              </span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {results ? formatPaybackPeriod(results.paybackPeriod) : '-'}
              </span>
            </div>
            
            {/* ROI - only show when showCashflow is true */}
            {showCashflow && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {timeHorizon}-Year ROI
                  <MetricInfoTooltip
                    title="Return on Investment"
                    description="The total net profit (or loss) over the selected Time Horizon, expressed as a percentage of the total investment. Investment basis and savings calculation differ based on the TurnKey option."
                    calculation="ROI = (Cumulative Savings at Horizon - Total Investment) / Total Investment * 100"
                    affectingVariables={[
                      "All factors affecting payback period",
                      "Time horizon length"
                    ]}
                    simpleDescription="Percentage return on your total investment over the analysis period."
                  />
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {results ? `${Math.round(results.roi)}%` : '-'}
                </span>
              </div>
            )}
            
            {/* Annual Fuel Savings - only show when showCashflow is true */}
            {showCashflow && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Annual Fuel Savings
                  <MetricInfoTooltip
                    title="Annual Fuel Savings"
                    description="The average net savings generated per year over the entire time horizon. Includes fuel and maintenance savings, minus the LDC tariff if applicable."
                    calculation="Average Annual Net Savings = Cumulative Savings at Horizon / Time Horizon"
                    affectingVariables={[
                      "Fuel prices and annual increase",
                      "Vehicle MPG and annual mileage",
                      "Vehicle counts by type",
                      "Deployment strategy timing",
                      "LDC tariff (if TurnKey = No)"
                    ]}
                    simpleDescription="Average yearly savings from lower fuel and maintenance costs."
                  />
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {results ? formatCurrency(results.annualFuelSavings) : '-'}
                </span>
              </div>
            )}
            
            {/* CO2 Reduction - always show */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                CO₂ Reduction
                <MetricInfoTooltip
                  title="CO₂ Reduction"
                  description="The estimated percentage reduction in CO₂ emissions over the time horizon compared to running the same fleet on conventional fuels."
                  calculation="CO2 Reduction % = ((Total Baseline Emissions - Total CNG Emissions) / Total Baseline Emissions) * 100"
                  affectingVariables={[
                    "Vehicle counts by type",
                    "Vehicle MPG values",
                    "Annual mileage assumptions",
                    "Emission factors for each fuel type",
                    "Deployment strategy timing"
                  ]}
                  simpleDescription="Percentage reduction in carbon dioxide emissions compared to conventional fuels."
                />
              </span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {results ? `${results.co2Reduction.toFixed(1)}%` : '-'}
              </span>
            </div>
            
            {/* Total Vehicles - show when showCashflow is false */}
            {!showCashflow && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Vehicles</span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {totalVehicles}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
