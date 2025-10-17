import { useState, useEffect } from "react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { Info, BarChart3, Plus, Truck, Eye, EyeOff, Edit3, Check, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function GlobalSettings() {
  const { 
    timeHorizon,
    deploymentStrategy, 
    vehicleParameters,
    updateTimeHorizon,
    updateDeploymentStrategy,
    updateVehicleParameters,
    updateStationConfig,
    updateFuelPrices,
    updateManualDistribution,
    setManualDistributionBulk,
    results,
    hideNegativeValues,
    toggleHideNegativeValues,
    setDistributionStrategy,
    calculateResults
  } = useCalculator();

  const { 
    addComparisonItem, 
    isInComparison,
    comparisonItems,
    canAddMoreComparisons
  } = useComparison();

  const { toast } = useToast();
  const [showCustomNameDialog, setShowCustomNameDialog] = useState(false);
  const [customName, setCustomName] = useState("");
  const [savedStrategies, setSavedStrategies] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);

  // Strategy descriptions
  const strategyDescriptions = {
    immediate: "All vehicles are purchased at the beginning of Year 1.",
    phased: "Evenly distributes vehicle purchases across the selected time horizon.",
    aggressive: "Front-loads the majority of purchases in the first few years.",
    deferred: "Back-loads the majority of purchases in the later years.",
    manual: "Manually distribute vehicles across the timeline."
  };

  const handleAddToComparison = () => {
    if (results && canAddMoreComparisons()) {
      addComparisonItem(deploymentStrategy, results);
    }
  };

  const handleAddWithCustomName = () => {
    if (results && canAddMoreComparisons() && customName.trim()) {
      addComparisonItem(deploymentStrategy, results, customName.trim());
      setCustomName("");
      setShowCustomNameDialog(false);
    }
  };

  // Count how many of the current strategy type are already in comparison
  const currentStrategyCount = comparisonItems.filter(item => item.strategy === deploymentStrategy).length;
  const canAddCurrentStrategy = canAddMoreComparisons() && (deploymentStrategy === 'manual' || !isInComparison(deploymentStrategy));

  // Check if manual deployment is selected
  const isManualMode = deploymentStrategy === 'manual';

  // Fetch saved strategies on component mount and when a new strategy is saved
  useEffect(() => {
    fetchSavedStrategies();
    
    // Listen for strategy saved events
    const handleStrategySaved = () => {
      fetchSavedStrategies();
    };
    
    window.addEventListener('strategySaved', handleStrategySaved);
    
    return () => {
      window.removeEventListener('strategySaved', handleStrategySaved);
    };
  }, []);

  const fetchSavedStrategies = async () => {
    try {
      setIsLoadingStrategies(true);
      const response = await fetch('/api/strategies');
      if (response.ok) {
        const strategies = await response.json();
        setSavedStrategies(strategies);
      }
    } catch (error) {
      console.error('Error fetching strategies:', error);
    } finally {
      setIsLoadingStrategies(false);
    }
  };

  const handleLoadStrategy = async (strategyId: string) => {
    if (!strategyId) return;
    
    try {
      const response = await fetch(`/api/strategies/${strategyId}`);
      if (response.ok) {
        const strategy = await response.json();
        
        // Load all the strategy parameters first
        updateVehicleParameters(strategy.vehicleParameters);
        updateStationConfig(strategy.stationConfig);
        updateFuelPrices(strategy.fuelPrices);
        updateTimeHorizon(strategy.timeHorizon);
        
        // Handle deployment strategy and vehicle distribution
        if (strategy.deploymentStrategy === 'manual' && strategy.vehicleDistribution) {
          // For manual strategies, update the deployment strategy and load distribution
          updateDeploymentStrategy('manual');
          
          // Use the bulk update method to set all distributions at once
          // This avoids race conditions and ensures all values are set atomically
          setManualDistributionBulk(strategy.vehicleDistribution);
        } else {
          // For non-manual strategies, use setDistributionStrategy
          // which properly updates both the deployment strategy and recalculates distribution
          setDistributionStrategy(strategy.deploymentStrategy);
        }
        
        toast({
          title: "Strategy Loaded",
          description: `Successfully loaded "${strategy.name}" strategy`
        });
      }
    } catch (error) {
      console.error('Error loading strategy:', error);
      toast({
        title: "Error",
        description: "Failed to load strategy",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-white rounded-md p-3 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Calculation Settings</h3>
        
        <div className="flex flex-col gap-1 min-w-0">
          {/* Add to comparison button */}
          {results && canAddCurrentStrategy && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddToComparison}
                className="w-full flex items-center justify-center gap-1 text-xs h-7 px-2"
              >
                <Plus className="h-3 w-3" />
                <span>Add to Comparison</span>
              </Button>
              
              {/* Add with custom name for manual strategies or when multiple allowed */}
              {(deploymentStrategy === 'manual' || currentStrategyCount > 0) && (
                <Dialog open={showCustomNameDialog} onOpenChange={setShowCustomNameDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full flex items-center justify-center gap-1 text-xs h-7 px-2"
                      title="Add with custom name"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Add with Name</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add to Comparison with Custom Name</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Name for this Strategy
                        </label>
                        <Input
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder={`Enter name for ${deploymentStrategy} strategy...`}
                          maxLength={50}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This helps identify different variations when comparing multiple {deploymentStrategy} strategies.
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCustomNameDialog(false)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddWithCustomName}
                          disabled={!customName.trim()}
                          size="sm"
                        >
                          Add to Comparison
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
          
          {/* Status indicators */}
          {results && currentStrategyCount > 0 && (
            <Badge variant="outline" className="text-xs h-6 flex items-center justify-center gap-1 border-blue-500 text-blue-500 w-full">
              <BarChart3 className="h-3 w-3" />
              <span>
                {currentStrategyCount === 1 ? 'In comparison' : `${currentStrategyCount} added`}
              </span>
            </Badge>
          )}
          
          {/* Max comparisons reached indicator */}
          {!canAddMoreComparisons() && (
            <Badge variant="outline" className="text-xs h-6 flex items-center justify-center gap-1 border-gray-400 text-gray-600 w-full">
              <Info className="h-3 w-3" />
              <span>Max comparisons (6)</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Vehicle Counts Section */}
      <div className="border-b border-gray-200 pb-3">
        <div className="flex items-center mb-2">
          <Truck className="h-4 w-4 mr-1 text-gray-600" />
          <h4 className="text-sm font-medium text-gray-700">Fleet Configuration</h4>
        </div>
        
        {/* Notice for manual mode */}
        {isManualMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-3">
            <p className="text-xs text-blue-700">
              Set total fleet size here, then distribute these vehicles across years in the Vehicle Deployment Strategy section.
            </p>
          </div>
        )}

        {/* Vehicle Counts - Always show */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Light Duty
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  min="0"
                  value={vehicleParameters.lightDutyCount}
                  onChange={(e) => updateVehicleParameters({ 
                    ...vehicleParameters, 
                    lightDutyCount: parseInt(e.target.value) || 0 
                  })}
                  data-testid="input-light-duty-count"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Medium Duty
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  min="0"
                  value={vehicleParameters.mediumDutyCount}
                  onChange={(e) => updateVehicleParameters({ 
                    ...vehicleParameters, 
                    mediumDutyCount: parseInt(e.target.value) || 0 
                  })}
                  data-testid="input-medium-duty-count"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Heavy Duty
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  min="0"
                  value={vehicleParameters.heavyDutyCount}
                  onChange={(e) => updateVehicleParameters({ 
                    ...vehicleParameters, 
                    heavyDutyCount: parseInt(e.target.value) || 0 
                  })}
                  data-testid="input-heavy-duty-count"
                />
              </div>
            </div>
          </div>
      </div>

      {/* Distribution Scenarios Section */}
      <div className="border-b border-gray-200 pb-3">
        <div className="flex items-center mb-2">
          <BarChart3 className="h-4 w-4 mr-1 text-gray-600" />
          <h4 className="text-sm font-medium text-gray-700">Deployment Strategy</h4>
        </div>
        
        {/* Deployment strategy buttons - Show all strategies */}
        <div className="flex flex-wrap gap-2">
          {/* Immediate */}
          <div className="relative">
            <div
              className={`flex items-center justify-center px-5 py-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 ${
                deploymentStrategy === 'immediate' 
                  ? "bg-green-50 border-green-500 border-2 dark:bg-green-900/20 dark:border-green-500" 
                  : "border-gray-200 dark:border-gray-600"
              }`}
              onClick={() => setDistributionStrategy('immediate')}
              data-testid="button-immediate-distribution"
            >
              {deploymentStrategy === 'immediate' && (
                <div className="absolute top-2 left-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <span className="text-xs font-medium dark:text-gray-300">Immediate</span>
            </div>
          </div>

          {/* Phased */}
          <div className="relative">
            <div
              className={`flex items-center justify-center px-5 py-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 ${
                deploymentStrategy === 'phased' 
                  ? "bg-green-50 border-green-500 border-2 dark:bg-green-900/20 dark:border-green-500" 
                  : "border-gray-200 dark:border-gray-600"
              }`}
              onClick={() => setDistributionStrategy('phased')}
              data-testid="button-phased-distribution"
            >
              {deploymentStrategy === 'phased' && (
                <div className="absolute top-2 left-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <span className="text-xs font-medium dark:text-gray-300">Phased</span>
            </div>
          </div>

          {/* Aggressive */}
          <div className="relative">
            <div
              className={`flex items-center justify-center px-5 py-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 ${
                deploymentStrategy === 'aggressive' 
                  ? "bg-green-50 border-green-500 border-2 dark:bg-green-900/20 dark:border-green-500" 
                  : "border-gray-200 dark:border-gray-600"
              }`}
              onClick={() => setDistributionStrategy('aggressive')}
              data-testid="button-aggressive-distribution"
            >
              {deploymentStrategy === 'aggressive' && (
                <div className="absolute top-2 left-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <span className="text-xs font-medium dark:text-gray-300">Aggressive</span>
            </div>
          </div>

          {/* Deferred */}
          <div className="relative">
            <div
              className={`flex items-center justify-center px-5 py-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 ${
                deploymentStrategy === 'deferred' 
                  ? "bg-green-50 border-green-500 border-2 dark:bg-green-900/20 dark:border-green-500" 
                  : "border-gray-200 dark:border-gray-600"
              }`}
              onClick={() => setDistributionStrategy('deferred')}
              data-testid="button-deferred-distribution"
            >
              {deploymentStrategy === 'deferred' && (
                <div className="absolute top-2 left-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <span className="text-xs font-medium dark:text-gray-300">Deferred</span>
            </div>
          </div>

          {/* Manual */}
          <div className="relative">
            <div
              className={`flex items-center justify-center px-5 py-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 ${
                deploymentStrategy === 'manual' 
                  ? "bg-green-50 border-green-500 border-2 dark:bg-green-900/20 dark:border-green-500" 
                  : "border-gray-200 dark:border-gray-600"
              }`}
              onClick={() => updateDeploymentStrategy('manual')}
              data-testid="button-manual-distribution"
            >
              {deploymentStrategy === 'manual' && (
                <div className="absolute top-2 left-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <span className="text-xs font-medium dark:text-gray-300">Manual</span>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Choose how to distribute vehicle purchases over time. These options provide different deployment patterns for your fleet conversion strategy.
        </p>
      </div>

      {/* Time Horizon */}
      <div className="pt-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Time Horizon
        </label>
        <div className="flex space-x-2">
          {[10, 15].map((years) => (
            <div key={years} className="relative flex-1">
              <div
                className={`flex items-center justify-center p-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 ${
                  timeHorizon === years 
                    ? "bg-green-50 border-green-500 border-2 dark:bg-green-900/20 dark:border-green-500" 
                    : "border-gray-200 dark:border-gray-600"
                }`}
                onClick={() => updateTimeHorizon(years)}
              >
                {timeHorizon === years && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium dark:text-gray-300">{years} Years</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Load Saved Strategy */}
      <div className="pt-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Load Saved Strategy
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 inline-block text-gray-500 dark:text-gray-400 cursor-help">
                  <Info size={16} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-60">
                <p className="text-xs">Load a previously saved strategy configuration to quickly restore all your settings and parameters.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </label>
        <Select value={selectedStrategy} onValueChange={handleLoadStrategy} disabled={isLoadingStrategies}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoadingStrategies ? "Loading..." : "Select a saved strategy"}>
              {selectedStrategy && savedStrategies.find(s => s.id === selectedStrategy)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {savedStrategies.length === 0 ? (
              <SelectItem value="no-strategies" disabled>
                <span className="text-gray-500">No saved strategies</span>
              </SelectItem>
            ) : (
              savedStrategies.map((strategy) => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-3 w-3" />
                    <span>{strategy.name}</span>
                    {strategy.deploymentStrategy && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {strategy.deploymentStrategy}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {savedStrategies.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {savedStrategies.length} saved {savedStrategies.length === 1 ? 'strategy' : 'strategies'} available
          </p>
        )}
      </div>

      {/* Chart Display Options */}
      <div className="pt-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chart Display Options
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 inline-block text-gray-500 dark:text-gray-400 cursor-help">
                  <Info size={16} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-60">
                <p className="text-xs">Toggle to hide negative values from all charts. This adjusts the Y-axis scale to focus only on positive ROI periods.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </label>
        <Button
          variant={hideNegativeValues ? "default" : "outline"}
          size="sm"
          onClick={toggleHideNegativeValues}
          className={`w-full flex items-center justify-center gap-2 text-sm ${
            hideNegativeValues 
              ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-blue-500"
          }`}
        >
          {hideNegativeValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {hideNegativeValues ? "Show All Values" : "Hide Negative Values"}
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {hideNegativeValues 
            ? "Charts show only positive values with adjusted scale"
            : "Charts show complete data including negative values"
          }
        </p>
      </div>

      {/* Tip for comparison */}
      {comparisonItems.length > 0 && (
        <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
          <p className="italic">
            Tip: You can compare up to 6 different strategies to analyze ROI and environmental benefits.
          </p>
        </div>
      )}
    </div>
  );
}