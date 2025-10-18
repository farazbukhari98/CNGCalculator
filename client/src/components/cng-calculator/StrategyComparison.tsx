import { useState } from "react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPaybackPeriod } from "@/lib/utils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function StrategyComparison() {
  const { results, deploymentStrategy, calculateResults } = useCalculator();
  const { 
    comparisonItems, 
    addComparisonItem, 
    removeComparisonItem, 
    clearComparisonItems, 
    isInComparison 
  } = useComparison();
  
  const [showSavings, setShowSavings] = useState(true);
  const [showEmissions, setShowEmissions] = useState(true);

  // If there are no items to compare, don't render
  if (comparisonItems.length === 0) {
    return null;
  }

  // Prepare comparison data for savings
  const prepareSavingsData = () => {
    const data = [];

    // Find the max time horizon among all strategies
    const maxTimeHorizon = Math.max(
      ...comparisonItems.map(item => item.results.cumulativeSavings.length)
    );

    for (let i = 0; i < maxTimeHorizon; i++) {
      const yearData: any = { year: `Year ${i + 1}` };
      
      comparisonItems.forEach(item => {
        // Add cumulative savings data for each strategy
        if (i < item.results.cumulativeSavings.length) {
          yearData[item.strategyName] = item.results.cumulativeSavings[i];
        } else {
          yearData[item.strategyName] = null; // Use null for missing data points
        }
      });
      
      data.push(yearData);
    }

    return data;
  };

  // Prepare comparison data for CO2 emissions
  const prepareEmissionsData = () => {
    const data = [];

    // Find the max time horizon among all strategies
    const maxTimeHorizon = Math.max(
      ...comparisonItems.map(item => item.results.cumulativeEmissionsSaved.length)
    );

    for (let i = 0; i < maxTimeHorizon; i++) {
      const yearData: any = { year: `Year ${i + 1}` };
      
      comparisonItems.forEach(item => {
        // Add emissions data for each strategy (convert to metric tons)
        if (i < item.results.cumulativeEmissionsSaved.length) {
          yearData[item.strategyName] = item.results.cumulativeEmissionsSaved[i] / 1000;
        } else {
          yearData[item.strategyName] = null; // Use null for missing data points
        }
      });
      
      data.push(yearData);
    }

    return data;
  };

  // Generate color for each strategy
  const getStrategyColor = (index: number) => {
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6'];
    return colors[index % colors.length];
  };

  // Custom tooltip for the charts
  const CustomTooltip = ({ active, payload, label, isEmissions }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border shadow-sm rounded-md">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <p className="text-xs">
                <span className="font-medium">{entry.name}: </span>
                {isEmissions
                  ? `${entry.value?.toFixed(1)} metric tons CO₂` 
                  : `$${entry.value?.toLocaleString()}`
                }
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format Y axis labels
  const formatYAxisSavings = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const formatYAxisEmissions = (value: number) => {
    return `${value} tons`;
  };

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Strategy Comparison</h2>
          <div className="flex space-x-2">
            {/* Add current strategy button - updated logic */}
            {results && (deploymentStrategy === 'manual' || !isInComparison(deploymentStrategy)) && comparisonItems.length < 6 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => addComparisonItem(deploymentStrategy, results)}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Current</span>
              </Button>
            )}
            
            {/* Clear all button */}
            {comparisonItems.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearComparisonItems}
                className="text-gray-500"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Strategy badges with improved organization */}
        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap gap-2">
            {comparisonItems.map((item, index) => (
              <Badge 
                key={item.id} 
                variant="outline" 
                className="pl-2 flex items-center gap-1 border-2 relative"
                style={{ borderColor: getStrategyColor(index) }}
              >
                <span 
                  style={{ color: getStrategyColor(index) }}
                  className="text-sm font-medium"
                >
                  {item.strategyName}
                </span>
                {item.customName && (
                  <span className="text-xs text-gray-500">
                    ({item.customName})
                  </span>
                )}
                <button
                  onClick={() => removeComparisonItem(item.id)}
                  className="ml-1 p-0.5 hover:bg-gray-200 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          {comparisonItems.length >= 2 && (
            <p className="text-xs text-gray-500">
              Comparing {comparisonItems.length} strateg{comparisonItems.length === 1 ? 'y' : 'ies'}
              {comparisonItems.length === 6 && ' (maximum reached)'}
            </p>
          )}
        </div>

        {/* Chart selection checkboxes */}
        <div className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showSavingsChart"
              checked={showSavings}
              onCheckedChange={(checked) => setShowSavings(checked as boolean)}
            />
            <Label
              htmlFor="showSavingsChart"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Savings Chart
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showEmissionsChart"
              checked={showEmissions}
              onCheckedChange={(checked) => setShowEmissions(checked as boolean)}
            />
            <Label
              htmlFor="showEmissionsChart"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Emissions Chart
            </Label>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Cumulative Savings Chart */}
          {showSavings && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Cumulative Savings Over Time</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={prepareSavingsData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={formatYAxisSavings} />
                  <Tooltip content={<CustomTooltip isEmissions={false} />} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" />
                  
                  {comparisonItems.map((item, index) => (
                    <Area
                      key={item.id}
                      type="monotone"
                      dataKey={item.strategyName}
                      stroke={getStrategyColor(index)}
                      fill={getStrategyColor(index)}
                      fillOpacity={0.3}
                      strokeWidth={2}
                      connectNulls={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
              
              {/* Summary statistics for savings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                {comparisonItems.map((item, index) => {
                  const finalSavings = item.results.cumulativeSavings[item.results.cumulativeSavings.length - 1];
                  const totalInvestment = item.results.totalInvestment;
                  const netBenefit = finalSavings - totalInvestment;
                  
                  return (
                    <div key={item.id} className="text-center">
                      <div 
                        className="text-xs font-medium mb-1"
                        style={{ color: getStrategyColor(index) }}
                      >
                        {item.strategyName}
                      </div>
                      <div className="text-sm font-semibold">
                        ${finalSavings.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Total Savings
                      </div>
                      <div className={`text-xs mt-1 ${netBenefit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Net: ${netBenefit.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CO2 Emissions Saved Chart */}
          {showEmissions && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Cumulative CO₂ Emissions Saved</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={prepareEmissionsData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={formatYAxisEmissions} />
                  <Tooltip content={<CustomTooltip isEmissions={true} />} />
                  <Legend />
                  
                  {comparisonItems.map((item, index) => (
                    <Area
                      key={item.id}
                      type="monotone"
                      dataKey={item.strategyName}
                      stroke={getStrategyColor(index)}
                      fill={getStrategyColor(index)}
                      fillOpacity={0.3}
                      strokeWidth={2}
                      connectNulls={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
              
              {/* Summary statistics for emissions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                {comparisonItems.map((item, index) => {
                  const totalEmissions = item.results.totalEmissionsSaved / 1000; // Convert to metric tons
                  const annualEmissions = totalEmissions / item.results.cumulativeEmissionsSaved.length;
                  
                  return (
                    <div key={item.id} className="text-center">
                      <div 
                        className="text-xs font-medium mb-1"
                        style={{ color: getStrategyColor(index) }}
                      >
                        {item.strategyName}
                      </div>
                      <div className="text-sm font-semibold">
                        {totalEmissions.toFixed(1)} tons
                      </div>
                      <div className="text-xs text-gray-500">
                        Total CO₂ Saved
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        ~{annualEmissions.toFixed(1)} tons/year
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Instructions if no charts are shown */}
        {!showSavings && !showEmissions && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Select at least one chart to display using the checkboxes above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}