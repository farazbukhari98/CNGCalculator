import { useCalculator } from "@/contexts/CalculatorContext";
import { Card, CardContent } from "@/components/ui/card";
import { formatPaybackPeriod } from "@/lib/utils";
import { MetricInfoTooltip } from "./MetricInfoTooltip";
import { calculateStationCost } from "@/lib/calculator";

export default function DeploymentTimeline() {
  const { 
    timeHorizon,
    deploymentStrategy,
    vehicleDistribution,
    enhancedDistribution,
    results,
    stationConfig,
    vehicleParameters,
    fuelPrices
  } = useCalculator();

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Only show years up to the selected time horizon
  const years = Array.from({ length: timeHorizon }, (_, i) => i + 1);


  return (
    <Card className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 deployment-timeline">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Deployment Timeline</h2>
        </div>
        
        {/* Timeline Visualization - Only show if we have results */}
        {results && enhancedDistribution && (
          <div className="timeline-scroll overflow-x-auto">
            <div className="min-w-max grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {years.map((year) => {
                // Use enhanced distribution for display (includes lifecycle data)
                const yearData = enhancedDistribution[year - 1] || { light: 0, medium: 0, heavy: 0, investment: 0 };
                console.log(`Deployment Timeline Year ${year}:`, yearData);
                // Extract the values we need for display
                const light = yearData.light || 0;
                const medium = yearData.medium || 0;
                const heavy = yearData.heavy || 0;
                const totalActiveLight = yearData.totalActiveLight || 0;
                const totalActiveMedium = yearData.totalActiveMedium || 0;
                const totalActiveHeavy = yearData.totalActiveHeavy || 0;
                
                let borderClass = "vehicle-type-light";
                
                if (medium >= light && medium >= heavy) {
                  borderClass = "vehicle-type-medium";
                } else if (heavy >= light && heavy >= medium) {
                  borderClass = "vehicle-type-heavy";
                }
                
                // Calculate year's financial data (include replacement investment)
                const vehicleInvestment = (yearData.investment || 0) + (yearData.replacementInvestment || 0);
                
                // For year 1, also show station cost separately
                const isFirstYear = year === 1;
                // Calculate station cost properly using the calculator function
                const calculatedStationCost = calculateStationCost(stationConfig, vehicleParameters, vehicleDistribution, fuelPrices);
                // Station cost logic for INVESTMENT calculation (not operational costs):
                // - Turnkey: Include full station cost in Year 1 only (actual investment)
                // - Non-turnkey: No station investment (tariff fees are operational, already in yearlySavings)
                let stationCostInvestment = 0;
                let stationCostDisplay = 0;
                
                if (stationConfig.turnkey) {
                  stationCostInvestment = isFirstYear ? calculatedStationCost : 0;
                  stationCostDisplay = stationCostInvestment;
                } else {
                  // For non-turnkey, show $0 for station investment (tariff fees are operational, not investment)
                  stationCostDisplay = 0;
                  stationCostInvestment = 0; // Not an investment, it's operational cost
                }
                const totalYearInvestment = vehicleInvestment + stationCostInvestment;
                
                // Calculate totals for new requirements format
                const totalNewVehicles = light + medium + heavy;
                const totalReplacements = (yearData.lightReplacements || 0) + (yearData.mediumReplacements || 0) + (yearData.heavyReplacements || 0);
                const totalVehiclesInOperation = (yearData.totalActiveLight || 0) + (yearData.totalActiveMedium || 0) + (yearData.totalActiveHeavy || 0);
                
                // Get annual savings for this year (not cumulative)
                const annualFuelSavings = results.yearlyFuelSavings[year - 1] || 0;
                const annualMaintenanceSavings = results.yearlyMaintenanceSavings[year - 1] || 0;
                const annualTariffFees = results.yearlyTariffFees[year - 1] || 0;
                
                // Calculate Annual Net Savings/Cost per user requirements:
                // (Fuel Savings + Maintenance Savings) - (Vehicle Investment + Station Investment + Tariff Fees)
                const totalAnnualSavings = annualFuelSavings + annualMaintenanceSavings;
                const annualNetSavings = totalAnnualSavings - totalYearInvestment - annualTariffFees;
                
                // Calculate Cumulative Net Savings/Cost per user requirements:
                // For Year 2 onwards: Previous Year's Cumulative + Current Year's Annual Net
                let cumulativeNetSavings = 0;
                
                if (year === 1) {
                  // Year 1: Cumulative = Annual Net
                  cumulativeNetSavings = annualNetSavings;
                } else {
                  // Year 2+: Previous Cumulative + Current Annual Net
                  // Calculate all previous years' annual net savings
                  let runningCumulative = 0;
                  for (let i = 0; i < year; i++) {
                    const pastYearData = enhancedDistribution[i] || { investment: 0, replacementInvestment: 0 };
                    const pastVehicleInvestment = (pastYearData.investment || 0) + (pastYearData.replacementInvestment || 0);
                    const pastIsFirstYear = (i + 1) === 1;
                    let pastStationInvestment = 0;
                    if (stationConfig.turnkey) {
                      pastStationInvestment = pastIsFirstYear ? calculatedStationCost : 0;
                    }
                    const pastTotalInvestment = pastVehicleInvestment + pastStationInvestment;
                    
                    const pastFuelSavings = results.yearlyFuelSavings[i] || 0;
                    const pastMaintenanceSavings = results.yearlyMaintenanceSavings[i] || 0;
                    const pastTariffFees = results.yearlyTariffFees[i] || 0;
                    const pastTotalSavings = pastFuelSavings + pastMaintenanceSavings;
                    const pastAnnualNet = pastTotalSavings - pastTotalInvestment - pastTariffFees;
                    
                    runningCumulative += pastAnnualNet;
                  }
                  cumulativeNetSavings = runningCumulative;
                }

                return (
                  <div key={year} className={`year-block bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-3 ${borderClass}`}>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Year {year}</div>
                    
                    <div className="space-y-2">
                      {/* # of new vehicles purchased */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400"># of new vehicles purchased</span>
                        <span className="text-xs font-medium" data-testid={`total-new-vehicles-year-${year}`}>{totalNewVehicles}</span>
                      </div>

                      {/* # of replacement vehicles purchased - always show */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400"># of replacement vehicles purchased</span>
                        <span className="text-xs font-medium" data-testid={`total-replacements-year-${year}`}>{totalReplacements}</span>
                      </div>

                      {/* # total vehicles in operation */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400"># total vehicles in operation</span>
                        <span className="text-xs font-medium" data-testid={`total-vehicles-operation-year-${year}`}>{totalVehiclesInOperation}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      {/* Investment Section */}
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Investment</div>
                        <div className="ml-4 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Vehicles (Incr.)</span>
                            <span className="text-xs font-medium" data-testid={`vehicle-investment-year-${year}`}>{formatCurrency(vehicleInvestment)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Station</span>
                            <span className="text-xs font-medium" data-testid={`station-investment-year-${year}`}>{formatCurrency(stationCostDisplay)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Savings Section */}
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Savings</div>
                        <div className="ml-4 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Fuel</span>
                            <span className="text-xs font-medium text-green-600 dark:text-green-400" data-testid={`fuel-savings-year-${year}`}>{formatCurrency(annualFuelSavings)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Maintenance</span>
                            <span className="text-xs font-medium text-green-600 dark:text-green-400" data-testid={`maintenance-savings-year-${year}`}>{formatCurrency(annualMaintenanceSavings)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Annual Net Savings/Cost */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Net Savings/Cost</span>
                        <span className={`text-sm font-semibold ${annualNetSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} data-testid={`annual-net-savings-year-${year}`}>
                          {formatCurrency(annualNetSavings)}
                        </span>
                      </div>

                      {/* Cumulative Net Savings/Cost */}
                      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cumulative Net Savings/Cost</span>
                        <span className={`text-sm font-semibold ${cumulativeNetSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} data-testid={`cumulative-net-savings-year-${year}`}>
                          {formatCurrency(cumulativeNetSavings)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
