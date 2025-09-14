import { useCalculator } from "@/contexts/CalculatorContext";
import { Card, CardContent } from "@/components/ui/card";
import { formatPaybackPeriod } from "@/lib/utils";
import { calculateStationCost } from "@/lib/calculator";
import { MetricInfoTooltip } from "./MetricInfoTooltip";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

type FinancialAnalysisProps = {
  showCashflow: boolean;
  hideNegativeValues: boolean;
};

export default function FinancialAnalysis({ showCashflow, hideNegativeValues }: FinancialAnalysisProps) {
  const { results, timeHorizon, stationConfig, fuelPrices } = useCalculator();

  // If no results yet, don't render anything
  if (!results) return null;

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate total vehicle investment across all years (sum of all distributed investments)
  const totalVehicleInvestment = results.vehicleDistribution.reduce(
    (sum, dist) => sum + dist.investment, 0
  );

  // For non-turnkey option, we need to calculate station cost separately since it's not included in totalInvestment
  // This ensures we have the correct station cost to calculate LDC investment tariff
  const { vehicleParameters, vehicleDistribution } = useCalculator();
  
  // Calculate appropriate station cost based on the current fleet configuration
  const calculatedStationCost = calculateStationCost(stationConfig, vehicleParameters, vehicleDistribution, fuelPrices);
  
  // For turnkey, station cost is included in total investment (the difference between total and vehicle investments)
  // For non-turnkey, use the calculated station cost directly
  const totalStationCost = stationConfig.turnkey 
    ? (results.totalInvestment - totalVehicleInvestment)  // Already included in totalInvestment
    : calculatedStationCost;  // Calculate based on current fleet and station configuration
  
  console.log("Total station cost:", totalStationCost, "Vehicle Investment:", totalVehicleInvestment, "Total Investment:", results.totalInvestment, "TurnKey:", stationConfig.turnkey);

  // Prepare cash flow chart data
  const cashFlowData = Array.from({ length: timeHorizon }, (_, i) => {
    return {
      year: `Year ${i + 1}`,
      cumulativeInvestment: results.cumulativeInvestment[i],
      cumulativeSavings: results.cumulativeSavings[i]
    };
  });
  
  // Prepare cost vs savings chart data
  const costSavingsData = Array.from({ length: timeHorizon }, (_, i) => {
    const vehicleInvestment = results.vehicleDistribution[i]?.investment || 0;
    
    // For turnkey=yes: Show station cost in first year as upfront payment
    // For turnkey=no: Show NO station cost (it's financed via monthly LDC investment tariff)
    const stationCost = (i === 0 && stationConfig.turnkey) ? totalStationCost : 0;
    
    // For non-turnkey: calculate LDC investment tariff rate
    // This is a fixed monthly cost (percentage of station cost) paid throughout the analysis period
    const monthlyTariffRate = stationConfig.businessType === 'aglc' ? 0.015 : 0.016;
    const annualTariffRate = monthlyTariffRate * 12;
    
    // For non-turnkey: calculate annual LDC investment tariff
    // This is applied for ALL years when non-turnkey is selected
    const tariffCost = !stationConfig.turnkey ? totalStationCost * annualTariffRate : 0;
    
    return {
      year: `Year ${i + 1}`,
      vehicleInvestment: vehicleInvestment,
      stationInvestment: stationCost,
      financingCost: tariffCost, // Renamed but keeping key as financingCost for compatibility with the chart
      savings: results.yearlySavings[i]
    };
  });

  // Format for Recharts tooltips
  const currencyFormatter = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  // Calculate Y-axis domain for charts when hiding negative values
  const getYAxisDomain = (data: any[], key: string) => {
    if (!hideNegativeValues) return undefined; // Use default domain
    
    const values = data.map(item => item[key]).filter(val => val >= 0);
    if (values.length === 0) return [0, 100]; // Fallback if no positive values
    
    const min = 0; // Always start from 0 for positive-only view
    const max = Math.max(...values);
    return [min, max * 1.1]; // Add 10% padding to max
  };

  // Get filtered data for charts when hiding negative values
  const getFilteredChartData = (data: any[], valueKeys: string[]) => {
    if (!hideNegativeValues) return data;
    
    return data.map(item => {
      const filteredItem = { ...item };
      valueKeys.forEach(key => {
        if (filteredItem[key] < 0) {
          filteredItem[key] = 0; // Set negative values to 0
        }
      });
      return filteredItem;
    });
  };

  // Prepare data for year-by-year vehicle investment chart (only used when showCashflow is false)
  const vehicleInvestmentData = results.vehicleDistribution
    .map((yearData, index) => {
      // Base data with vehicle counts and investment
      const data = {
        year: `Year ${index + 1}`,
        light: yearData.light,
        medium: yearData.medium,
        heavy: yearData.heavy,
        vehicleInvestment: yearData.investment,
      };
      
      // For Year 1 with Turnkey=Yes, add station cost as a separate value
      if (index === 0 && stationConfig.turnkey) {
        return {
          ...data,
          stationCost: totalStationCost,
          // Total investment for this year is vehicle investment + station cost
          totalInvestment: yearData.investment + totalStationCost
        };
      }
      
      // For all other years or when Turnkey=No, only include vehicle investment
      return {
        ...data,
        stationCost: 0,
        totalInvestment: yearData.investment
      };
    })
    .filter(data => data.totalInvestment > 0); // Only show years with investments

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 financial-analysis">
      {/* Cash Flow Chart - Only show when showCashflow is true */}
      {showCashflow && (
        <Card className="bg-white rounded-lg shadow dark:bg-gray-800">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Cash Flow Analysis
              <MetricInfoTooltip
                title="Cash Flow Analysis"
                description="This chart shows the cumulative investment versus cumulative savings over the selected time horizon. The intersection of these lines represents the payback point."
                calculation="Chart plots Cumulative Investment and Cumulative Savings over time. Payback occurs when the green line (savings) crosses the red line (investment)."
                affectingVariables={[
                  "Vehicle costs and count",
                  "Station configuration and payment method (TurnKey/Non-TurnKey)",
                  "Fuel prices and annual increase rate",
                  "Deployment strategy timing"
                ]}
                simpleDescription="Tracks how your savings accumulate compared to your investment over time."
              />
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={getFilteredChartData(cashFlowData, ['cumulativeInvestment', 'cumulativeSavings'])} 
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis 
                    tickFormatter={currencyFormatter} 
                    domain={hideNegativeValues ? [0, 'dataMax'] : undefined}
                  />
                  <RechartsTooltip formatter={currencyFormatter} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeInvestment" 
                    name="Cumulative Investment"
                    stroke="#ef4444" 
                    fill="rgba(239, 68, 68, 0.1)" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeSavings" 
                    name="Cumulative Savings"
                    stroke="#10b981" 
                    fill="rgba(16, 185, 129, 0.1)" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                <div className="text-sm text-gray-500 mb-1 dark:text-gray-300">Payback Period</div>
                <div className={`text-lg font-bold ${results.paybackPeriod < 0 ? 'text-red-600' : results.paybackPeriod > 15 ? 'text-amber-600' : 'text-blue-600'}`}>
                  {formatPaybackPeriod(results.paybackPeriod)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                <div className="text-sm text-gray-500 mb-1 dark:text-gray-300">Net Cash Flow ({timeHorizon}yr)</div>
                <div className="text-lg font-bold text-green-600">{formatCurrency(results.netCashFlow)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Year-by-year Vehicle Investment Chart (only when showCashflow is false) */}
      {!showCashflow && vehicleInvestmentData.length > 0 && (
        <Card className="bg-white rounded-lg shadow dark:bg-gray-800">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Capital Investment Timeline
              <MetricInfoTooltip
                title="Capital Investment Timeline" 
                description={stationConfig.turnkey ? 
                  "This chart shows your complete capital investment distribution over the analysis period. For Year 1, it displays both vehicle and station investments as a stacked bar. For subsequent years, it shows only vehicle investments." :
                  "This chart shows your vehicle capital investment distribution over the analysis period. Station costs are not included as they are financed through the LDC tariff rather than being a direct capital investment."}
                calculation={stationConfig.turnkey ? 
                  "Stacked bars show vehicle count by type on the left axis. Stacked investment bars on the right axis show vehicle investment and station cost (Year 1 only)." :
                  "Stacked bars show vehicle count by type on the left axis. Red bars on the right axis show vehicle investment amounts."}
                affectingVariables={[
                  "Deployment strategy selection",
                  "Vehicle costs by type",
                  "Station configuration and payment method (TurnKey/Non-TurnKey)",
                  "Fleet composition (light/medium/heavy duty mix)"
                ]}
                simpleDescription={stationConfig.turnkey ? 
                  "Complete timeline showing capital investments across all years, with detailed breakdown by vehicle type and station infrastructure." :
                  "Complete timeline showing vehicle investments across all years, with detailed breakdown by vehicle type (station costs financed separately)."}
              />
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {stationConfig.turnkey ? (
                  // For Turnkey=Yes, show stacked investment bars (vehicle + station)
                  <BarChart data={vehicleInvestmentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="count" orientation="left" label={{ value: 'Vehicle Count', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="investment" orientation="right" tickFormatter={currencyFormatter} />
                    <RechartsTooltip 
                      formatter={(value, name) => {
                        if (name === 'Vehicle Investment') return [formatCurrency(value as number), name];
                        if (name === 'Station Investment') return [formatCurrency(value as number), name];
                        if (name === 'Light-Duty') return [value, name];
                        if (name === 'Medium-Duty') return [value, name]; 
                        if (name === 'Heavy-Duty') return [value, name];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Legend />
                    {/* Vehicle Count Bars */}
                    <Bar 
                      yAxisId="count"
                      dataKey="light" 
                      name="Light-Duty" 
                      fill="rgba(96, 165, 250, 0.7)" 
                      stackId="vehicles" 
                    />
                    <Bar 
                      yAxisId="count"
                      dataKey="medium" 
                      name="Medium-Duty" 
                      fill="rgba(52, 211, 153, 0.7)" 
                      stackId="vehicles" 
                    />
                    <Bar 
                      yAxisId="count"
                      dataKey="heavy" 
                      name="Heavy-Duty" 
                      fill="rgba(251, 146, 60, 0.7)" 
                      stackId="vehicles" 
                    />
                    {/* Investment Bars - Stacked */}
                    <Bar 
                      yAxisId="investment"
                      dataKey="vehicleInvestment" 
                      name="Vehicle Investment" 
                      fill="rgba(239, 68, 68, 0.7)" 
                      stackId="investment" 
                    />
                    <Bar 
                      yAxisId="investment"
                      dataKey="stationCost" 
                      name="Station Investment" 
                      fill="rgba(59, 130, 246, 0.7)" 
                      stackId="investment" 
                    />
                  </BarChart>
                ) : (
                  // For Turnkey=No, show only vehicle investment
                  <BarChart data={vehicleInvestmentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="count" orientation="left" label={{ value: 'Vehicle Count', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="investment" orientation="right" tickFormatter={currencyFormatter} />
                    <RechartsTooltip 
                      formatter={(value, name) => {
                        if (name === 'Vehicle Investment') return [formatCurrency(value as number), name];
                        if (name === 'Light-Duty') return [value, name];
                        if (name === 'Medium-Duty') return [value, name]; 
                        if (name === 'Heavy-Duty') return [value, name];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Legend />
                    {/* Vehicle Count Bars */}
                    <Bar 
                      yAxisId="count"
                      dataKey="light" 
                      name="Light-Duty" 
                      fill="rgba(96, 165, 250, 0.7)" 
                      stackId="vehicles" 
                    />
                    <Bar 
                      yAxisId="count"
                      dataKey="medium" 
                      name="Medium-Duty" 
                      fill="rgba(52, 211, 153, 0.7)" 
                      stackId="vehicles" 
                    />
                    <Bar 
                      yAxisId="count"
                      dataKey="heavy" 
                      name="Heavy-Duty" 
                      fill="rgba(251, 146, 60, 0.7)" 
                      stackId="vehicles" 
                    />
                    {/* Vehicle Investment Bar */}
                    <Bar 
                      yAxisId="investment"
                      dataKey="vehicleInvestment" 
                      name="Vehicle Investment" 
                      fill="rgba(239, 68, 68, 0.7)" 
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Cost vs Savings Analysis */}
      <Card className="bg-white rounded-lg shadow dark:bg-gray-800">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {showCashflow ? (
              <>
                Cost vs. Savings
                <MetricInfoTooltip
                  title="Cost vs. Savings Analysis"
                  description="This chart breaks down yearly costs versus savings for your CNG project. It shows how vehicle investments, station costs or tariffs, and resulting savings are distributed over time."
                  calculation={stationConfig.turnkey 
                    ? "Shows vehicle investments, station investment (year 1 only), and annual savings." 
                    : "Shows vehicle investments, annual LDC tariff payments, and net savings after tariff costs."}
                  affectingVariables={[
                    "Vehicle counts and costs",
                    "Deployment strategy timing",
                    "Station type and payment option (TurnKey/Non-TurnKey)",
                    "Fuel prices and annual increase rate"
                  ]}
                  simpleDescription="Year-by-year comparison of costs and savings from your CNG project."
                />
              </>
            ) : (
              <>
                Investment Analysis
                <MetricInfoTooltip
                  title="Investment Analysis"
                  description={stationConfig.turnkey ? 
                    "A breakdown of your total capital investment between vehicles and station costs. Provides insight into cost allocation and per-vehicle investment metrics." :
                    "An overview of your vehicle capital investment and associated station financing costs through the LDC investment tariff. With non-turnkey, only vehicle costs are direct capital investments."
                  }
                  calculation={stationConfig.turnkey ?
                    "Total Investment = Vehicle Investment + Station Investment. Per-Vehicle Cost = Total Investment / Total Vehicle Count." :
                    "Vehicle Investment = Total upfront vehicle costs. Station is financed via monthly LDC tariff at a rate of 1.5-1.6% of station cost (18-19.2% annually)."
                  }
                  affectingVariables={[
                    "Vehicle counts and costs",
                    "Station type and configuration",
                    "Business type selection",
                    "TurnKey option (Yes/No)"
                  ]}
                  simpleDescription={stationConfig.turnkey ?
                    "Breakdown of your total upfront project investment across vehicles and infrastructure." :
                    "Summary of vehicle investments with station costs financed through monthly tariff payments."
                  }
                />
              </>
            )}
          </h2>
          
          {/* Only show the bar chart when showCashflow is true */}
          {showCashflow ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={getFilteredChartData(costSavingsData, ['vehicleInvestment', 'stationInvestment', 'financingCost', 'savings'])} 
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis 
                    tickFormatter={currencyFormatter} 
                    domain={hideNegativeValues ? [0, 'dataMax'] : undefined}
                  />
                  <RechartsTooltip formatter={currencyFormatter} />
                  <Legend />
                  <Bar 
                    dataKey="vehicleInvestment" 
                    name="Vehicle Investment"
                    fill="rgba(239, 68, 68, 0.7)" 
                    stackId="investment"
                  />
                  {/* For turnkey option, show station investment in year 1 */}
                  {stationConfig.turnkey && (
                    <Bar 
                      dataKey="stationInvestment" 
                      name="Station Investment"
                      fill="rgba(59, 130, 246, 0.7)" 
                      stackId="investment"
                    />
                  )}
                  {/* For non-turnkey, show LDC investment tariff in all years */}
                  {!stationConfig.turnkey && (
                    <Bar 
                      dataKey="financingCost" 
                      name="LDC Investment Tariff"
                      fill="rgba(101, 67, 33, 0.8)" 
                      stackId="expenses"
                    />
                  )}
                  <Bar 
                    dataKey="savings" 
                    name={stationConfig.turnkey ? "Savings" : "Net Savings"}
                    fill="rgba(16, 185, 129, 0.7)" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            // When showCashflow is false, show simplified investment breakdown
            <div className="h-64 flex items-center justify-center">
              <div className="text-center w-full max-w-md">
                {stationConfig.turnkey ? (
                  // For turnkey, show the breakdown of vehicles vs station as a capital investment
                  <>
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {formatCurrency(results.totalInvestment)}
                    </div>
                    <div className="text-base text-gray-500 dark:text-gray-400 mb-5">
                      Total Capital Investment
                    </div>
                    
                    <div className="flex justify-center gap-10 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                          {formatCurrency(totalVehicleInvestment)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          Vehicles ({Math.round((totalVehicleInvestment / results.totalInvestment) * 100)}%)
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                          {formatCurrency(results.totalInvestment - totalVehicleInvestment)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          Station ({Math.round(((results.totalInvestment - totalVehicleInvestment) / results.totalInvestment) * 100)}%)
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full max-w-md mx-auto overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ 
                          width: `${Math.round((totalVehicleInvestment / results.totalInvestment) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </>
                ) : (
                  // For non-turnkey, show vehicle investment and station financing info
                  <>
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {formatCurrency(totalVehicleInvestment)}
                    </div>
                    <div className="text-base text-gray-500 dark:text-gray-400 mb-5">
                      Vehicle Capital Investment
                    </div>
                    
                    <div className="p-3 mt-2 rounded-lg border mb-2 w-full" 
                      style={{ 
                        backgroundColor: 'rgba(101, 67, 33, 0.1)', 
                        borderColor: 'rgba(101, 67, 33, 0.3)'
                      }}>
                      <div className="text-sm font-medium mb-1 dark:text-amber-200" style={{ color: '#654321' }}>
                        LDC Investment Tariff (Non-TurnKey)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs dark:text-amber-300" style={{ color: '#755c3b' }}>Monthly Rate:</span>
                          <span className="text-sm font-semibold ml-1 dark:text-gray-200">
                            {(stationConfig.businessType === 'aglc' || stationConfig.businessType === 'vng' ? 1.5 : 1.6).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-xs dark:text-amber-300" style={{ color: '#755c3b' }}>Station Cost:</span>
                          <span className="text-sm font-semibold ml-1 dark:text-gray-200">
                            {formatCurrency(totalStationCost)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs dark:text-amber-300" style={{ color: '#755c3b' }}>Annual Rate:</span>
                          <span className="text-sm font-semibold ml-1 dark:text-gray-200">
                            {(stationConfig.businessType === 'aglc' || stationConfig.businessType === 'vng' ? 18 : 19.2).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-xs dark:text-amber-300" style={{ color: '#755c3b' }}>Annual Cost:</span>
                          <span className="text-sm font-semibold ml-1 dark:text-gray-200">
                            {formatCurrency(totalStationCost * (stationConfig.businessType === 'aglc' || stationConfig.businessType === 'vng' ? 0.18 : 0.192))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            {/* Always show the payback period regardless of showCashflow value */}
            <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
              <div className="text-sm text-gray-500 mb-1 dark:text-gray-300">Payback Period</div>
              <div className={`text-lg font-bold ${results.paybackPeriod < 0 ? 'text-red-600' : results.paybackPeriod > 15 ? 'text-amber-600' : 'text-blue-600'}`}>
                {formatPaybackPeriod(results.paybackPeriod)}
              </div>
            </div>
            
            {/* Show ROI metrics only when showCashflow is true */}
            {showCashflow ? (
              <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                <div className="text-sm text-gray-500 mb-1 dark:text-gray-300">{timeHorizon}-Year ROI</div>
                <div className="text-lg font-bold text-green-600">{Math.round(results.roi)}%</div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                <div className="text-sm text-gray-500 mb-1 dark:text-gray-300">Total Vehicles</div>
                <div className="text-lg font-bold text-blue-600">
                  {results.vehicleDistribution.reduce((total, year) => 
                    total + year.light + year.medium + year.heavy, 0)}
                </div>
              </div>
            )}
            
            {/* Show Annual Rate of Return only when showCashflow is true */}
            {showCashflow && (
              <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                <div className="text-sm text-gray-500 mb-1 dark:text-gray-300">Annual Rate of Return</div>
                <div className="text-lg font-bold text-blue-600">{results.annualRateOfReturn.toFixed(1)}%</div>
              </div>
            )}
            
            {/* Show financing information for non-turnkey option only when relevant */}
            {!stationConfig.turnkey && showCashflow && (
              <div className={`${showCashflow ? "col-span-2" : ""} p-3 rounded-lg border dark:bg-gray-800/50 dark:border-gray-700`} 
                style={{ 
                  backgroundColor: 'rgba(101, 67, 33, 0.1)', 
                  borderColor: 'rgba(101, 67, 33, 0.3)'
                }}>
                <div className="text-sm font-medium mb-1 dark:text-amber-200" style={{ color: '#654321' }}>
                  LDC Investment Tariff (Non-TurnKey Option)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs dark:text-amber-300" style={{ color: '#755c3b' }}>Monthly Fee:</span>
                    <span className="text-sm font-semibold ml-1 dark:text-gray-200">
                      {(stationConfig.businessType === 'aglc' ? 1.5 : 1.6).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-xs dark:text-amber-300" style={{ color: '#755c3b' }}>Station Cost:</span>
                    <span className="text-sm font-semibold ml-1 dark:text-gray-200">
                      {formatCurrency(totalStationCost)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <span className="text-xs dark:text-amber-300" style={{ color: '#755c3b' }}>Annual Fee:</span>
                    <span className="text-sm font-semibold ml-1 dark:text-gray-200">
                      {(stationConfig.businessType === 'aglc' ? 18 : 19.2).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-xs dark:text-amber-300" style={{ color: '#755c3b' }}>Annual Cost:</span>
                    <span className="text-sm font-semibold ml-1 dark:text-gray-200">
                      {formatCurrency(costSavingsData[0].financingCost)}
                    </span>
                  </div>
                </div>
                <div className="text-xs mt-1 dark:text-amber-200" style={{ color: '#654321' }}>
                  Note: LDC investment tariff applies a monthly fee of {(stationConfig.businessType === 'aglc' ? 1.5 : 1.6).toFixed(1)}% on the station cost throughout the analysis period.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
