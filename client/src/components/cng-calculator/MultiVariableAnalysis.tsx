import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalculator } from "@/contexts/CalculatorContext";
import { formatPaybackPeriod } from "@/lib/utils";
import { MetricInfoTooltip } from "./MetricInfoTooltip";
import { calculateROI, distributeVehicles, applyVehicleLifecycle } from "@/lib/calculator";

// Type for sensitivity variables
type SensitivityVariable = 
  | "gasolinePrice" 
  | "dieselPrice" 
  | "cngPrice" 
  | "lightDutyCost"
  | "mediumDutyCost"
  | "heavyDutyCost"
  | "annualMiles";

// Variable settings and labels
const variableConfig = {
  gasolinePrice: {
    label: "Gasoline Price ($/gallon)",
    min: -50,
    max: 50,
    step: 10,
    defaultValue: 0
  },
  dieselPrice: {
    label: "Diesel Price ($/gallon)",
    min: -50,
    max: 50,
    step: 10,
    defaultValue: 0
  },
  cngPrice: {
    label: "CNG Price ($/GGE)",
    min: -50,
    max: 50,
    step: 10,
    defaultValue: 0
  },
  lightDutyCost: {
    label: "Light Duty Vehicle Cost",
    min: -50,
    max: 50,
    step: 10,
    defaultValue: 0
  },
  mediumDutyCost: {
    label: "Medium Duty Vehicle Cost",
    min: -50,
    max: 50,
    step: 10,
    defaultValue: 0
  },
  heavyDutyCost: {
    label: "Heavy Duty Vehicle Cost",
    min: -50,
    max: 50,
    step: 10,
    defaultValue: 0
  },
  annualMiles: {
    label: "Annual Miles Driven",
    min: -50,
    max: 50,
    step: 10,
    defaultValue: 0
  }
};

// Component for the heat map
const HeatMapVisualization = ({ 
  xVariable, 
  yVariable, 
  heatMapData, 
  xValues, 
  yValues, 
  metric
}: { 
  xVariable: SensitivityVariable; 
  yVariable: SensitivityVariable; 
  heatMapData: number[][]; 
  xValues: number[];
  yValues: number[];
  metric: 'payback' | 'roi' | 'netCashFlow';
}) => {
  const [selectedCell, setSelectedCell] = useState<{x: number, y: number, value: number} | null>(null);
  
  // Color functions for different metrics
  const getPaybackColor = (value: number, min: number, max: number) => {
    // Lower payback period is better (green), higher is worse (red)
    const normalized = (value - min) / (max - min); // 0 to 1
    const inversed = 1 - normalized; // 1 to 0 (best to worst)
    
    // RGB values for the gradient from red to yellow to green
    const r = inversed <= 0.5 ? 255 : Math.floor(255 * (1 - (inversed - 0.5) * 2));
    const g = inversed >= 0.5 ? 255 : Math.floor(255 * inversed * 2);
    const b = 0;
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const getRoiColor = (value: number, min: number, max: number) => {
    // Higher ROI is better (green), lower is worse (red)
    const normalized = (value - min) / (max - min); // 0 to 1
    
    // RGB values for the gradient from red to yellow to green
    const r = normalized <= 0.5 ? 255 : Math.floor(255 * (1 - (normalized - 0.5) * 2));
    const g = normalized >= 0.5 ? 255 : Math.floor(255 * normalized * 2);
    const b = 0;
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const getCashFlowColor = (value: number, min: number, max: number) => {
    // Higher cash flow is better (green), lower is worse (red)
    const normalized = (value - min) / (max - min); // 0 to 1
    
    // RGB values for the gradient from red to yellow to green
    const r = normalized <= 0.5 ? 255 : Math.floor(255 * (1 - (normalized - 0.5) * 2));
    const g = normalized >= 0.5 ? 255 : Math.floor(255 * normalized * 2);
    const b = 0;
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Find min and max values for color scaling
  const allValues = heatMapData.flat().filter(value => !isNaN(value));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  
  // Format values for display
  const formatValue = (value: number): string => {
    if (metric === 'payback') {
      return formatPaybackPeriod(value);
    } else if (metric === 'roi') {
      return `${value.toFixed(1)}%`;
    } else {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };
  
  // Get appropriate color function based on the metric
  const getColorForValue = (value: number) => {
    if (metric === 'payback') {
      return getPaybackColor(value, minValue, maxValue);
    } else if (metric === 'roi') {
      return getRoiColor(value, minValue, maxValue);
    } else {
      return getCashFlowColor(value, minValue, maxValue);
    }
  };
  
  return (
    <div className="mt-4">
      <div className="heat-map-container relative bg-gray-100 rounded-lg p-4">
        {/* Y-axis labels */}
        <div className="absolute top-4 left-0 flex flex-col h-[calc(100%-32px)] justify-between text-xs text-right pr-2">
          {yValues.map((value, idx) => (
            <div key={idx} style={{ top: `${(idx / (yValues.length - 1)) * 100}%` }}>
              {value > 0 ? `+${value}%` : `${value}%`}
            </div>
          ))}
        </div>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-16 flex w-[calc(100%-64px)] justify-between text-xs">
          {xValues.map((value, idx) => (
            <div key={idx} style={{ left: `${(idx / (xValues.length - 1)) * 100}%` }}>
              {value > 0 ? `+${value}%` : `${value}%`}
            </div>
          ))}
        </div>
        
        {/* Heat map grid */}
        <div className="heat-map ml-16 mt-2 mb-8 grid gap-0.5 overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${xValues.length || 1}, minmax(20px, 1fr))`,
            gridTemplateRows: `repeat(${yValues.length || 1}, minmax(20px, 1fr))`,
            width: "calc(100% - 16px)",
            height: "350px",
            aspectRatio: (xValues.length || 1) / (yValues.length || 1) > 0 ? (xValues.length || 1) / (yValues.length || 1) : 1,
            maxWidth: "100%"
          }}>
          {heatMapData.map((row, rowIdx) => (
            row.map((value, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                className="heat-map-cell relative cursor-pointer transition-colors hover:scale-105"
                style={{
                  backgroundColor: getColorForValue(value),
                  width: '100%',
                  height: '100%',
                }}
                onClick={() => setSelectedCell({
                  x: colIdx,
                  y: rowIdx,
                  value: value
                })}
                title={`${xVariable} ${xValues[colIdx]}%, ${yVariable} ${yValues[rowIdx]}%: ${formatValue(value)}`}
              />
            ))
          ))}
        </div>
        
        {/* Axis labels */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-xs text-gray-500">
            <div className="mb-1 font-medium">{variableConfig[yVariable].label} (Y-axis)</div>
          </div>
          <div className="text-xs text-gray-500">
            <div className="mb-1 font-medium">{variableConfig[xVariable].label} (X-axis)</div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-6">
          <div className="text-xs font-medium mb-2">Legend</div>
          <div className="flex items-center">
            <div className="w-full h-4 rounded-md" style={{
              background: metric === 'payback'
                ? 'linear-gradient(to right, #ff0000, #ffff00, #00ff00)'
                : 'linear-gradient(to right, #ff0000, #ffff00, #00ff00)'
            }}></div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>{metric === 'payback' ? 'Longer Payback' : 'Worse'}</span>
            <span>Neutral</span>
            <span>{metric === 'payback' ? 'Shorter Payback' : 'Better'}</span>
          </div>
        </div>
        
        {/* Selected cell info */}
        {selectedCell && (
          <div className="mt-4 p-3 bg-white border rounded-md shadow-sm">
            <div className="text-sm font-medium mb-2">Selected Point Details</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-600">{variableConfig[xVariable].label}</div>
              <div className="font-medium">{xValues[selectedCell.x] > 0 ? `+${xValues[selectedCell.x]}%` : `${xValues[selectedCell.x]}%`}</div>
              
              <div className="text-gray-600">{variableConfig[yVariable].label}</div>
              <div className="font-medium">{yValues[selectedCell.y] > 0 ? `+${yValues[selectedCell.y]}%` : `${yValues[selectedCell.y]}%`}</div>
              
              <div className="text-gray-600 border-t pt-1 mt-1">
                {metric === 'payback' ? 'Payback Period' : metric === 'roi' ? 'ROI' : 'Net Cash Flow'}
              </div>
              <div className="font-medium border-t pt-1 mt-1">{formatValue(selectedCell.value)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MultiVariableAnalysis({ hideNegativeValues = false }: { hideNegativeValues?: boolean }) {
  const {
    vehicleParameters,
    stationConfig,
    fuelPrices,
    timeHorizon,
    deploymentStrategy,
    vehicleDistribution,
    enhancedDistribution,
    rngFeedstockType,
    customCiValue,
    results,
  } = useCalculator();

  // Selected variables for the analysis
  const [primaryVariable, setPrimaryVariable] = useState<SensitivityVariable>("gasolinePrice");
  const [secondaryVariable, setSecondaryVariable] = useState<SensitivityVariable>("cngPrice");

  // Selected metric
  const [activeMetric, setActiveMetric] = useState<"payback" | "roi" | "netCashFlow">("payback");

  // Heat map data
  const [heatMapData, setHeatMapData] = useState<number[][]>([]);
  const [xValues, setXValues] = useState<number[]>([]);
  const [yValues, setYValues] = useState<number[]>([]);

  // Compute a single heat map cell by running calculateROI with modified parameters
  const computeCellResult = useCallback((
    varA: SensitivityVariable, pctA: number,
    varB: SensitivityVariable, pctB: number
  ) => {
    if (!enhancedDistribution || !vehicleDistribution) return null;

    // Build the set of percentage modifications keyed by variable
    const mods: Partial<Record<SensitivityVariable, number>> = {};
    mods[varA] = pctA;
    mods[varB] = pctB;

    // Clone parameters that may be modified
    const modifiedFuelPrices = { ...fuelPrices };
    const modifiedVehicleParams = { ...vehicleParameters };

    // Apply fuel price modifications
    if (mods.gasolinePrice !== undefined) {
      modifiedFuelPrices.gasolinePrice = fuelPrices.gasolinePrice * (1 + mods.gasolinePrice / 100);
    }
    if (mods.dieselPrice !== undefined) {
      modifiedFuelPrices.dieselPrice = fuelPrices.dieselPrice * (1 + mods.dieselPrice / 100);
    }
    if (mods.cngPrice !== undefined) {
      modifiedFuelPrices.cngPrice = fuelPrices.cngPrice * (1 + mods.cngPrice / 100);
    }

    // Apply vehicle cost modifications
    if (mods.lightDutyCost !== undefined) {
      modifiedVehicleParams.lightDutyCost = vehicleParameters.lightDutyCost * (1 + mods.lightDutyCost / 100);
    }
    if (mods.mediumDutyCost !== undefined) {
      modifiedVehicleParams.mediumDutyCost = vehicleParameters.mediumDutyCost * (1 + mods.mediumDutyCost / 100);
    }
    if (mods.heavyDutyCost !== undefined) {
      modifiedVehicleParams.heavyDutyCost = vehicleParameters.heavyDutyCost * (1 + mods.heavyDutyCost / 100);
    }

    // Apply annual miles modification (proportionally to all three)
    if (mods.annualMiles !== undefined) {
      const factor = 1 + mods.annualMiles / 100;
      modifiedVehicleParams.lightDutyAnnualMiles = vehicleParameters.lightDutyAnnualMiles * factor;
      modifiedVehicleParams.mediumDutyAnnualMiles = vehicleParameters.mediumDutyAnnualMiles * factor;
      modifiedVehicleParams.heavyDutyAnnualMiles = vehicleParameters.heavyDutyAnnualMiles * factor;
    }

    // Determine if we need to rebuild the distribution
    const needsDistributionRebuild =
      mods.lightDutyCost !== undefined ||
      mods.mediumDutyCost !== undefined ||
      mods.heavyDutyCost !== undefined ||
      mods.annualMiles !== undefined;

    let distForROI = enhancedDistribution;

    if (needsDistributionRebuild) {
      if (deploymentStrategy === 'manual') {
        // For manual mode: preserve user's vehicle counts, recalculate investment amounts
        const manualBase = vehicleDistribution.map(year => {
          const investment =
            (year.light * modifiedVehicleParams.lightDutyCost) +
            (year.medium * modifiedVehicleParams.mediumDutyCost) +
            (year.heavy * modifiedVehicleParams.heavyDutyCost);
          return { ...year, investment };
        });
        distForROI = applyVehicleLifecycle(manualBase, modifiedVehicleParams, timeHorizon);
      } else {
        const baseDist = distributeVehicles(modifiedVehicleParams, timeHorizon, deploymentStrategy);
        distForROI = applyVehicleLifecycle(baseDist, modifiedVehicleParams, timeHorizon);
      }
    }

    return calculateROI(
      modifiedVehicleParams,
      stationConfig,
      modifiedFuelPrices,
      timeHorizon,
      deploymentStrategy,
      distForROI,
      rngFeedstockType,
      customCiValue
    );
  }, [vehicleParameters, stationConfig, fuelPrices, timeHorizon, deploymentStrategy, enhancedDistribution, vehicleDistribution, rngFeedstockType, customCiValue]);

  // Calculate heat map data when variables or parameters change
  useEffect(() => {
    if (!results || !enhancedDistribution || !vehicleDistribution) return;

    // Generate x and y axis values
    const primarySteps = Math.floor((variableConfig[primaryVariable].max - variableConfig[primaryVariable].min) / variableConfig[primaryVariable].step) + 1;
    const secondarySteps = Math.floor((variableConfig[secondaryVariable].max - variableConfig[secondaryVariable].min) / variableConfig[secondaryVariable].step) + 1;

    const xAxisValues = [];
    for (let i = 0; i < primarySteps; i++) {
      const percentage = variableConfig[primaryVariable].min + (i * variableConfig[primaryVariable].step);
      xAxisValues.push(percentage);
    }

    const yAxisValues = [];
    for (let i = 0; i < secondarySteps; i++) {
      const percentage = variableConfig[secondaryVariable].min + (i * variableConfig[secondaryVariable].step);
      yAxisValues.push(percentage);
    }

    // Store x and y values for reference
    setXValues(xAxisValues);
    setYValues(yAxisValues.slice().reverse()); // Reverse y-values to have min at bottom, max at top

    // Generate heat map data
    const heatData: number[][] = [];

    for (let y = 0; y < secondarySteps; y++) {
      const row: number[] = [];
      const secondaryPercentage = variableConfig[secondaryVariable].min + (y * variableConfig[secondaryVariable].step);

      for (let x = 0; x < primarySteps; x++) {
        const primaryPercentage = variableConfig[primaryVariable].min + (x * variableConfig[primaryVariable].step);

        // Run real calculateROI for this cell
        const cellResult = computeCellResult(
          primaryVariable, primaryPercentage,
          secondaryVariable, secondaryPercentage
        );

        let metricValue: number;
        if (!cellResult) {
          metricValue = 0;
        } else if (activeMetric === 'payback') {
          metricValue = cellResult.paybackPeriod;
        } else if (activeMetric === 'roi') {
          metricValue = cellResult.roi;
        } else {
          metricValue = cellResult.netCashFlow;
        }

        // Apply negative value filtering
        if (hideNegativeValues && metricValue < 0) {
          metricValue = 0;
        }

        row.push(metricValue);
      }

      // Reverse the rows to match the y-axis orientation
      heatData.unshift(row);
    }

    setHeatMapData(heatData);

  }, [primaryVariable, secondaryVariable, activeMetric, vehicleParameters, stationConfig, fuelPrices, timeHorizon, deploymentStrategy, enhancedDistribution, vehicleDistribution, rngFeedstockType, customCiValue, computeCellResult, results, hideNegativeValues]);

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Multi-Variable Analysis
          <MetricInfoTooltip
            title="Multi-Variable Analysis"
            description="This advanced analysis examines how combinations of two variables simultaneously impact your financial metrics. The heat map visualization shows the interaction effects across different percentage changes."
            calculation="Each cell in the heat map runs a full financial calculation with modified parameters, showing accurate results for every combination of X and Y variable changes."
            affectingVariables={[
              "Primary variable (X-axis)",
              "Secondary variable (Y-axis)",
              "Selected financial metric",
              "Baseline project configuration"
            ]}
            simpleDescription="Visualize how combinations of two variables interact to affect your project outcomes."
          />
        </h2>

        {results ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Variable Selection */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Variable Selection</h3>

                {/* Primary Variable (X-axis) */}
                <div className="mb-4">
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Variable (X-axis)
                  </Label>
                  <Select
                    value={primaryVariable}
                    onValueChange={(value) => setPrimaryVariable(value as SensitivityVariable)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select primary variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(variableConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Secondary Variable (Y-axis) */}
                <div className="mb-4">
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Variable (Y-axis)
                  </Label>
                  <Select
                    value={secondaryVariable}
                    onValueChange={(value) => setSecondaryVariable(value as SensitivityVariable)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select secondary variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(variableConfig)
                        .filter(([key]) => key !== primaryVariable)
                        .map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                {/* Current base values */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Base Values</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Payback Period</span>
                      <span className="text-xs font-medium">{formatPaybackPeriod(results.paybackPeriod)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">ROI ({timeHorizon} Years)</span>
                      <span className="text-xs font-medium">{Math.round(results.roi)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Net Cash Flow</span>
                      <span className="text-xs font-medium">{formatCurrency(results.netCashFlow)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Heat Map Visualization */}
              <div className="bg-gray-50 p-4 rounded-lg col-span-1 md:col-span-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Variable Interaction Heat Map</h3>
                  <div className="flex border rounded-md overflow-hidden">
                    <button
                      className={`px-3 py-1 text-xs ${activeMetric === 'payback' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveMetric('payback');
                      }}
                    >
                      Payback
                    </button>
                    <button
                      className={`px-3 py-1 text-xs ${activeMetric === 'roi' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveMetric('roi');
                      }}
                    >
                      ROI
                    </button>
                    <button
                      className={`px-3 py-1 text-xs ${activeMetric === 'netCashFlow' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveMetric('netCashFlow');
                      }}
                    >
                      Cash Flow
                    </button>
                  </div>
                </div>

                <HeatMapVisualization
                  xVariable={primaryVariable}
                  yVariable={secondaryVariable}
                  heatMapData={heatMapData}
                  xValues={xValues}
                  yValues={yValues}
                  metric={activeMetric}
                />

                <div className="mt-4 text-xs text-gray-500 leading-relaxed">
                  <p>This heat map shows how combinations of {variableConfig[primaryVariable].label} (X-axis) and {variableConfig[secondaryVariable].label} (Y-axis) impact your financial outcomes.</p>
                  <p>Click on any cell to see detailed values for that combination.</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">Complete your fleet configuration to view multi-variable analysis.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}