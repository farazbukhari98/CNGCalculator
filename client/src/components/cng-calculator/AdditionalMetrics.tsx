import { useCalculator } from "@/contexts/CalculatorContext";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { MetricInfoTooltip } from "./MetricInfoTooltip";
import { formatPaybackPeriod } from "@/lib/utils";
import { calculateStationCost } from "@/lib/calculator";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';

interface AdditionalMetricsProps {
  showCashflow: boolean;
}

export default function AdditionalMetrics({ showCashflow }: AdditionalMetricsProps) {
  const { 
    results, 
    deploymentStrategy, 
    timeHorizon, 
    vehicleParameters, 
    stationConfig,
    fuelPrices,
    vehicleDistribution
  } = useCalculator();

  // If no results yet, don't render anything
  if (!results) return null;

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format emissions value (convert kg to metric tons)
  const formatEmissions = (value: number) => {
    const tons = value / 1000; // Convert kg to metric tons
    return `${tons.toLocaleString(undefined, { maximumFractionDigits: 1 })} tons`;
  };

  // Calculate operational cost per mile for conventional vs CNG by vehicle type
  const calculateCostPerMile = () => {
    // Base fuel prices with annual increases applied for year 1
    const yearMultiplier = Math.pow(1 + (fuelPrices.annualIncrease / 100), 0); // First year
    const adjustedGasolinePrice = fuelPrices.gasolinePrice * yearMultiplier;
    const adjustedDieselPrice = fuelPrices.dieselPrice * yearMultiplier;
    
    // CNG price calculation with electricity and business rate
    const ELECTRICITY_COST_PER_GGE = 0.08;
    const businessRate = stationConfig.businessType === 'cgc' ? 0.192 : 0.18;
    // Calculate effective CNG price (base price minus tax credit)
    const effectiveCngPrice = Math.max(0, fuelPrices.cngPrice - fuelPrices.cngTaxCredit);
    const cngWithElectricity = effectiveCngPrice + ELECTRICITY_COST_PER_GGE;
    const cngWithBusinessRate = cngWithElectricity * (1 + businessRate);
    const adjustedCngPrice = cngWithBusinessRate * yearMultiplier;
    
    // CNG efficiency loss
    const CNG_LOSS = { light: 0.05, medium: 0.075, heavy: 0.10 };
    
    // Calculate cost per mile for each vehicle type
    const lightGasCostPerMile = adjustedGasolinePrice / vehicleParameters.lightDutyMPG;
    const lightCngCostPerMile = adjustedCngPrice / (vehicleParameters.lightDutyMPG * (1 - CNG_LOSS.light));
    
    const mediumDieselCostPerMile = adjustedDieselPrice / vehicleParameters.mediumDutyMPG;
    const mediumCngCostPerMile = adjustedCngPrice / (vehicleParameters.mediumDutyMPG * (1 - CNG_LOSS.medium));
    
    const heavyDieselCostPerMile = adjustedDieselPrice / vehicleParameters.heavyDutyMPG;
    const heavyCngCostPerMile = adjustedCngPrice / (vehicleParameters.heavyDutyMPG * (1 - CNG_LOSS.heavy));
    
    // Maintenance costs
    const MAINTENANCE_COST = { gasoline: 0.47, diesel: 0.52, cng: 0.47 };
    const DIESEL_DEDUCTION_PER_MILE = 0.05;
    
    return [
      {
        vehicleType: 'Light Duty',
        conventionalFuel: lightGasCostPerMile + MAINTENANCE_COST.gasoline,
        cngFuel: lightCngCostPerMile + MAINTENANCE_COST.cng,
        fuelSavings: (lightGasCostPerMile - lightCngCostPerMile) + (MAINTENANCE_COST.gasoline - MAINTENANCE_COST.cng),
        annualMiles: vehicleParameters.lightDutyAnnualMiles,
        fuelType: 'Gasoline'
      },
      {
        vehicleType: 'Medium Duty',
        conventionalFuel: mediumDieselCostPerMile + MAINTENANCE_COST.diesel,
        cngFuel: mediumCngCostPerMile + MAINTENANCE_COST.cng,
        fuelSavings: (mediumDieselCostPerMile - mediumCngCostPerMile) + (MAINTENANCE_COST.diesel - MAINTENANCE_COST.cng) + DIESEL_DEDUCTION_PER_MILE,
        annualMiles: vehicleParameters.mediumDutyAnnualMiles,
        fuelType: 'Diesel'
      },
      {
        vehicleType: 'Heavy Duty',
        conventionalFuel: heavyDieselCostPerMile + MAINTENANCE_COST.diesel,
        cngFuel: heavyCngCostPerMile + MAINTENANCE_COST.cng,
        fuelSavings: (heavyDieselCostPerMile - heavyCngCostPerMile) + (MAINTENANCE_COST.diesel - MAINTENANCE_COST.cng) + DIESEL_DEDUCTION_PER_MILE,
        annualMiles: vehicleParameters.heavyDutyAnnualMiles,
        fuelType: 'Diesel'
      }
    ];
  };

  const operationalMetrics = calculateCostPerMile();

  // Prepare data for emissions chart
  const emissionsChartData = Array.from({ length: timeHorizon }, (_, i) => {
    return {
      year: `Year ${i + 1}`,
      emissionsSaved: results.yearlyEmissionsSaved[i] / 1000 || 0, // Convert to metric tons
      cumulative: results.cumulativeEmissionsSaved[i] / 1000 || 0 // Convert to metric tons
    };
  });

  // Prepare data for operational metrics chart
  const operationalChartData = operationalMetrics.map(metric => ({
    ...metric,
    annualConventionalCost: metric.conventionalFuel * metric.annualMiles,
    annualCngCost: metric.cngFuel * metric.annualMiles,
    annualSavings: metric.fuelSavings * metric.annualMiles
  }));

  // Strategy advantages and considerations
  const strategyInsights = {
    immediate: {
      advantages: [
        "Maximizes immediate fuel savings",
        "Simplifies implementation timeline",
        "Lowest total project cost overall",
        "Faster breakeven and higher ROI"
      ],
      considerations: [
        "Requires significant upfront capital",
        "May strain operational resources",
        "Less flexibility to adjust based on results",
        "Higher financial risk if benefits not realized"
      ]
    },
    phased: {
      advantages: [
        "Reduces initial capital requirements",
        "Allows for operational adjustments",
        "Creates predictable annual budgeting",
        "Spreads maintenance and training needs"
      ],
      considerations: [
        "Delays maximum fuel savings potential",
        "May extend total project timeline",
        "Requires sustained organizational commitment"
      ]
    },
    aggressive: {
      advantages: [
        "Captures savings potential earlier",
        "Accelerates ROI timeline compared to phased",
        "Demonstrates organizational commitment",
        "Reduces long-term exposure to fuel price increases"
      ],
      considerations: [
        "Higher initial capital requirements",
        "Potential operational challenges during rapid transition",
        "Less flexibility compared to phased approach"
      ]
    },
    deferred: {
      advantages: [
        "Minimal initial capital outlay",
        "Allows time for technology maturation",
        "Provides learning opportunities with initial vehicles",
        "Better suited for organizations with limited immediate funds"
      ],
      considerations: [
        "Significantly delays fuel cost savings",
        "May miss near-term fuel price advantages",
        "Extends total project timeline",
        "Lower overall ROI in early years"
      ]
    },
    manual: {
      advantages: [
        "Fully customized to organizational needs",
        "Can align with other capital planning cycles",
        "Flexibility to address specific operational constraints",
        "Accommodates detailed vehicle replacement schedules"
      ],
      considerations: [
        "Requires detailed planning and expertise",
        "May be less optimal than algorithmically-determined strategies",
        "Requires rigorous timeline management"
      ]
    }
  };

  // Calculate total emissions saved in tons
  const totalEmissionsTons = results.totalEmissionsSaved / 1000;
  
  // Custom tooltip for the emissions chart
  const EmissionsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border shadow-sm rounded-md">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-green-700">
            <span className="font-medium">Annual: </span> 
            {payload[0].value.toFixed(1)} metric tons CO₂
          </p>
          <p className="text-xs text-blue-700">
            <span className="font-medium">Cumulative: </span> 
            {payload[1].value.toFixed(1)} metric tons CO₂
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="additional-metrics">
      {/* Emissions Chart */}
      <Card className="bg-white rounded-lg shadow mb-6 dark:bg-gray-800">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2">
            CO₂ Emissions Reduction
            <MetricInfoTooltip
              title="CO₂ Emissions Reduction"
              description="This chart visualizes the estimated reduction in carbon dioxide emissions over the analysis period. It shows both annual savings and the cumulative impact of your CNG fleet transition."
              calculation="Based on EPA emission factors: gasoline (8.887 kg CO₂/gallon), diesel (10.180 kg CO₂/gallon), CNG (5.511 kg CO₂/GGE). Annual emissions are calculated by multiplying fuel consumption by the appropriate emission factor."
              affectingVariables={[
                "Vehicle count by type",
                "Annual mileage assumptions",
                "Vehicle MPG values",
                "Deployment strategy timing"
              ]}
              simpleDescription="Visual representation of annual and cumulative CO₂ emission reductions from your CNG fleet."
            />
          </h2>
          <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
            Estimated reduction in carbon dioxide emissions over time
          </p>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Total CO₂ Emissions Saved</span>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{formatEmissions(results.totalEmissionsSaved)}</div>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500 dark:text-gray-400">CO₂ Reduction Percentage</span>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{results.co2Reduction.toFixed(1)}%</div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={emissionsChartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis 
                  tickFormatter={(value) => `${value.toFixed(0)}`}
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Metric Tons CO₂', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fontSize: '12px' }
                  }}
                />
                <Tooltip content={<EmissionsTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="emissionsSaved" 
                  stackId="1"
                  name="Annual Emissions Saved"
                  stroke="#22c55e" 
                  fill="rgba(34, 197, 94, 0.2)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative"
                  name="Cumulative Emissions Saved" 
                  stroke="#3b82f6" 
                  fill="rgba(59, 130, 246, 0.2)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
              <div className="text-sm text-gray-500 mb-1 dark:text-gray-300">Equivalent Trees Planted</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                ~{Math.round(totalEmissionsTons * 16.5).toLocaleString()} trees
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
              <div className="text-sm text-gray-500 mb-1 dark:text-gray-300">Equivalent Forest Area</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                ~{Math.round(totalEmissionsTons / 7.5).toLocaleString()} acres
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Operational Metrics */}
        <Card className="bg-white rounded-lg shadow dark:bg-gray-800">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold mb-3">
              Operational Metrics
              <MetricInfoTooltip
                title="Operational Metrics"
                description="These metrics provide a detailed breakdown of your operational costs and savings on a per-mile basis. They show the direct financial impact of switching from conventional fuels to CNG for your fleet."
                calculation="Cost per Mile = Fuel Price ÷ Vehicle MPG. Cost Reduction = ((Gasoline Cost - CNG Cost) ÷ Gasoline Cost) × 100%. Annual Fuel Savings = Total fuel cost savings across all vehicles."
                affectingVariables={[
                  "Fuel prices (gasoline, diesel, CNG)",
                  "Vehicle MPG values by type",
                  "Annual mileage assumptions",
                  "Vehicle count by type"
                ]}
                simpleDescription="Key metrics showing how CNG reduces your cost per mile compared to conventional fuels."
              />
            </h3>
            {/* Operational Metrics Chart */}
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={operationalChartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="vehicleType" 
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    tick={{ fontSize: 11 }}
                    label={{ 
                      value: 'Annual Cost', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fontSize: '11px' }
                    }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `$${value.toLocaleString()}`, 
                      name === 'annualConventionalCost' ? 'Conventional Fuel' : 
                      name === 'annualCngCost' ? 'CNG Cost' : 'Annual Savings'
                    ]}
                    labelFormatter={(label) => `${label} Vehicles`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="annualConventionalCost" 
                    name="Conventional Fuel Cost" 
                    fill="#ef4444" 
                    opacity={0.8}
                  />
                  <Bar 
                    dataKey="annualCngCost" 
                    name="CNG Cost" 
                    fill="#3b82f6" 
                    opacity={0.8}
                  />
                  <Bar 
                    dataKey="annualSavings" 
                    name="Annual Savings" 
                    fill="#22c55e" 
                    opacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                <div className="text-xs text-gray-500 mb-1 dark:text-gray-300">Total Annual Savings</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${operationalChartData.reduce((sum, item) => sum + item.annualSavings, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                <div className="text-xs text-gray-500 mb-1 dark:text-gray-300">Best Performing Type</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {operationalChartData.reduce((best, current) => 
                    current.fuelSavings > best.fuelSavings ? current : best
                  ).vehicleType}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Key Performance Summary */}
        <Card className="bg-white rounded-lg shadow dark:bg-gray-800">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold mb-3">
              Key Performance Summary
              <MetricInfoTooltip
                title="Key Performance Summary"
                description="Summary of key financial and operational metrics for your CNG conversion project."
                calculation="Based on calculated payback period, ROI, total investment, and operational cost savings."
                affectingVariables={[
                  "Total fleet size and composition",
                  "Fuel price differentials", 
                  "Annual mileage by vehicle type",
                  "Deployment strategy timing"
                ]}
                simpleDescription="High-level overview of your CNG conversion project performance."
              />
            </h3>
            
            {/* Key Performance Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                <div className="text-xs text-gray-500 mb-1 dark:text-gray-300">Payback Period</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatPaybackPeriod(results.paybackPeriod)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                <div className="text-xs text-gray-500 mb-1 dark:text-gray-300">ROI</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {results.roi.toFixed(1)}%
                </div>
              </div>
            </div>
            
            {/* Investment Breakdown */}
            <div className="mb-4">
              <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900/20">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">
                  Investment
                  <MetricInfoTooltip
                    title="Investment Breakdown"
                    description="Detailed breakdown of capital investment required for your CNG conversion project."
                    calculation="Vehicle Investment + Station Cost (with applicable tariffs for Time-fill AGL stations)"
                    affectingVariables={[
                      "Vehicle counts and conversion costs",
                      "Station type (Fast-Fill/Time-Fill)",
                      "Business type selection",
                      "TurnKey vs Non-TurnKey option"
                    ]}
                    simpleDescription="Total upfront capital required broken down by component."
                  />
                </div>
                {(() => {
                  const totalVehicleInvestment = results.vehicleDistribution.reduce((sum, dist) => sum + dist.investment, 0);
                  const stationCost = calculateStationCost(stationConfig, vehicleParameters);
                  const isTimeFillAgl = stationConfig.stationType === 'time' && (stationConfig.businessType === 'aglc' || stationConfig.businessType === 'vng');
                  const monthlyTariffRate = 1.5 / 100; // 1.5% monthly for AGL Time-fill
                  const annualTariffCost = isTimeFillAgl ? stationCost * monthlyTariffRate * 12 : 0;
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600 dark:text-blue-400">Vehicles (Inc)</span>
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">{formatCurrency(totalVehicleInvestment)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                          Station{isTimeFillAgl ? ' + Tariff' : ''}
                          {isTimeFillAgl && (
                            <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                              ({formatCurrency(annualTariffCost)}/year tariff)
                            </div>
                          )}
                        </span>
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                          {formatCurrency(stationConfig.turnkey ? stationCost : (isTimeFillAgl ? annualTariffCost : stationCost))}
                        </span>
                      </div>
                      <div className="border-t pt-2 border-blue-200 dark:border-blue-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Investment</span>
                          <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                            {formatCurrency(results.totalInvestment)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Savings Summary */}
            <div className="mb-4">
              <div className="bg-green-50 p-4 rounded-lg dark:bg-green-900/20">
                <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-3">
                  Savings
                  <MetricInfoTooltip
                    title="Savings Summary"
                    description="Total savings generated from CNG conversion over the analysis period."
                    calculation="Cumulative fuel and maintenance savings minus total investment"
                    affectingVariables={[
                      "Fuel price differentials",
                      "Annual mileage by vehicle type",
                      "Maintenance cost differences",
                      "Deployment timeline"
                    ]}
                    simpleDescription="Net financial benefit after accounting for all costs."
                  />
                </div>
                {(() => {
                  const totalSavingsOverHorizon = results.cumulativeSavings[results.cumulativeSavings.length - 1];
                  const netSavings = totalSavingsOverHorizon - results.totalInvestment;
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600 dark:text-green-400">Total Savings ({timeHorizon}-Year)</span>
                        <span className="text-sm font-semibold text-green-800 dark:text-green-200">{formatCurrency(totalSavingsOverHorizon)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600 dark:text-green-400">Less: Total Investment</span>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">({formatCurrency(results.totalInvestment)})</span>
                      </div>
                      <div className="border-t pt-2 border-green-200 dark:border-green-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Net Benefit</span>
                          <span className={`text-lg font-bold ${netSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(netSavings)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                <div className="text-xs text-gray-500 mb-1 dark:text-gray-300">Fleet Size</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {(() => {
                    // Use same logic as FleetConfiguration to get actual vehicle counts
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
                      return totals.light + totals.medium + totals.heavy;
                    }
                    // For non-manual strategies, use original parameters
                    return vehicleParameters.lightDutyCount + vehicleParameters.mediumDutyCount + vehicleParameters.heavyDutyCount;
                  })()} vehicles
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                <div className="text-xs text-gray-500 mb-1 dark:text-gray-300">Annual Savings</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(results.yearlySavings[results.yearlySavings.length - 1] || 0)}
                </div>
              </div>
            </div>

            {/* Deployment Strategy Summary */}
            <div className="bg-blue-50 p-3 rounded-lg dark:bg-blue-900/20">
              <div className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                {deploymentStrategy.charAt(0).toUpperCase() + deploymentStrategy.slice(1)} Deployment Strategy
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                {(() => {
                  // Use same logic as FleetConfiguration to get actual vehicle counts
                  const totalVehicles = (() => {
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
                      return totals.light + totals.medium + totals.heavy;
                    }
                    // For non-manual strategies, use original parameters
                    return vehicleParameters.lightDutyCount + vehicleParameters.mediumDutyCount + vehicleParameters.heavyDutyCount;
                  })();
                  
                  if (deploymentStrategy === 'immediate') {
                    return `All ${totalVehicles} vehicles converted immediately for maximum savings.`;
                  } else if (deploymentStrategy === 'phased') {
                    return `${Math.ceil(totalVehicles / timeHorizon)} vehicles converted annually over ${timeHorizon} years.`;
                  } else if (deploymentStrategy === 'aggressive') {
                    return `Front-loaded deployment to accelerate savings and reduce long-term fuel costs.`;
                  } else if (deploymentStrategy === 'deferred') {
                    return `Gradual conversion prioritizing later years to minimize upfront capital.`;
                  } else {
                    return `Custom deployment schedule tailored to operational requirements.`;
                  }
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
