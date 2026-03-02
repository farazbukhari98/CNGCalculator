import { useCalculator } from "@/contexts/CalculatorContext";
import { Card, CardContent } from "@/components/ui/card";
import { formatPaybackPeriod, formatNumberWithCommas } from "@/lib/utils";
import { MetricInfoTooltip } from "./MetricInfoTooltip";
import { calculateAnnualFleetGGE, getPlannedFleetTotals } from "@/lib/calculator";

interface FleetConfigurationProps {
  showCashflow: boolean;
}

export default function FleetConfiguration({ showCashflow }: FleetConfigurationProps) {
  const { 
    vehicleParameters,
    results,
    timeHorizon,
    fuelPrices
  } = useCalculator();

  const fallbackCounts = {
    light: vehicleParameters.lightDutyCount,
    medium: vehicleParameters.mediumDutyCount,
    heavy: vehicleParameters.heavyDutyCount,
    total:
      vehicleParameters.lightDutyCount +
      vehicleParameters.mediumDutyCount +
      vehicleParameters.heavyDutyCount
  };
  const actualCounts = results ? getPlannedFleetTotals(results.vehicleDistribution) : fallbackCounts;
  const totalVehicles = actualCounts.total;
  
  const lightDutyPercentage = totalVehicles > 0 
    ? Math.round((actualCounts.light / totalVehicles) * 100) 
    : 0;
  
  const mediumDutyPercentage = totalVehicles > 0 
    ? Math.round((actualCounts.medium / totalVehicles) * 100) 
    : 0;
  
  const heavyDutyPercentage = totalVehicles > 0 
    ? Math.round((actualCounts.heavy / totalVehicles) * 100) 
    : 0;

  const totalVehicleInvestment = results?.totalVehicleInvestment ?? 0;
  const stationCost = results?.stationCost ?? 0;
  const totalInvestment = results?.totalProjectCost ?? 0;
  const totalAnnualFleetGGE = calculateAnnualFleetGGE(vehicleParameters, actualCounts, fuelPrices);

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
                  Light Duty ({formatNumberWithCommas(actualCounts.light)})
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
                  Medium Duty ({formatNumberWithCommas(actualCounts.medium)})
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
                  Heavy Duty ({formatNumberWithCommas(actualCounts.heavy)})
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
                <span className="text-sm text-gray-600 dark:text-gray-300">Vehicles (lifecycle)</span>
                <span className="text-sm font-medium dark:text-gray-200">{formatCurrency(totalVehicleInvestment)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Station (quoted)</span>
                <span className="text-sm font-medium dark:text-gray-200">{formatCurrency(stationCost)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t dark:border-gray-600">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Modeled Total</span>
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
            
            {/* Annual GGE Required - always show */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Annual GGE Required
                <MetricInfoTooltip
                  title="Annual GGE Required"
                  description="Total Gasoline Gallon Equivalent (GGE) fuel consumption per year for the entire CNG fleet when fully deployed."
                  calculation="Sum of (Vehicle Count × Annual Miles ÷ MPG × Fuel Conversion Factor ÷ CNG Efficiency) for each vehicle type"
                  affectingVariables={[
                    "Vehicle counts by type",
                    "Annual miles driven per vehicle type",
                    "MPG values for each vehicle type",
                    "CNG efficiency loss percentages",
                    "Fuel type conversion factors (gasoline/diesel)"
                  ]}
                  simpleDescription="Annual CNG fuel consumption for your entire fleet."
                />
              </span>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {totalAnnualFleetGGE.toLocaleString(undefined, { maximumFractionDigits: 0 })} GGE
              </span>
            </div>
            
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
