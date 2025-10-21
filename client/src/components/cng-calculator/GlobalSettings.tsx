import { useState, useEffect } from "react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { Info, BarChart3, Plus, Truck, Eye, EyeOff, Edit3, Check, FolderOpen, Edit2, Trash2, Save } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getFieldStyles, DEFAULT_VALUES } from "@/lib/fieldStyling";

export default function GlobalSettings() {
  const { 
    timeHorizon,
    deploymentStrategy, 
    vehicleParameters,
    stationConfig,
    fuelPrices,
    vehicleDistribution,
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
    markFieldAsModified,
    isFieldModified,
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
  const [editingStrategy, setEditingStrategy] = useState<{ id: string; name: string } | null>(null);
  const [deletingStrategy, setDeletingStrategy] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [strategyName, setStrategyName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  // Function to handle saving strategy
  const handleSaveStrategy = async () => {
    if (!results || !strategyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your strategy",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      const strategyData = {
        name: strategyName.trim(),
        deploymentStrategy,
        vehicleParameters,
        stationConfig,
        fuelPrices,
        timeHorizon,
        vehicleDistribution: vehicleDistribution || [],
        calculatedResults: results
      };
      
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strategyData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save strategy');
      }
      
      const savedStrategy = await response.json();
      
      toast({
        title: "Strategy Saved",
        description: `Your strategy "${strategyName}" has been saved successfully.`,
      });
      
      // Clear form and close dialog
      setStrategyName("");
      setShowSaveDialog(false);
      
      // Trigger global event to refresh strategies list
      window.dispatchEvent(new Event('strategySaved'));
      
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast({
        title: "Error",
        description: "Failed to save strategy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

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
        // Add default value for stationMarkup if it's missing from saved strategy
        updateStationConfig({
          ...strategy.stationConfig,
          stationMarkup: strategy.stationConfig.stationMarkup ?? DEFAULT_VALUES.stationMarkup
        });
        // Add default values for conversion factors if missing from saved strategy
        updateFuelPrices({
          ...strategy.fuelPrices,
          gasolineToCngConversionFactor: strategy.fuelPrices.gasolineToCngConversionFactor ?? DEFAULT_VALUES.gasolineToCngConversionFactor,
          dieselToCngConversionFactor: strategy.fuelPrices.dieselToCngConversionFactor ?? DEFAULT_VALUES.dieselToCngConversionFactor
        });
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

  // Handle edit strategy name
  const handleEditStrategy = async () => {
    if (!editingStrategy || !editName.trim()) return;
    
    try {
      const response = await fetch(`/api/strategies/${editingStrategy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      });
      
      if (response.ok) {
        const updated = await response.json();
        setSavedStrategies(prev => 
          prev.map(s => s.id === updated.id ? updated : s)
        );
        toast({
          title: "Strategy Updated",
          description: `Successfully renamed to "${editName.trim()}"`
        });
        setShowEditDialog(false);
        setEditingStrategy(null);
        setEditName("");
      } else {
        throw new Error('Failed to update strategy');
      }
    } catch (error) {
      console.error('Error updating strategy:', error);
      toast({
        title: "Error",
        description: "Failed to update strategy name",
        variant: "destructive"
      });
    }
  };

  // Handle delete strategy
  const handleDeleteStrategy = async () => {
    if (!deletingStrategy) return;
    
    try {
      const response = await fetch(`/api/strategies/${deletingStrategy}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSavedStrategies(prev => prev.filter(s => s.id !== deletingStrategy));
        if (selectedStrategy === deletingStrategy) {
          setSelectedStrategy("");
        }
        toast({
          title: "Strategy Deleted",
          description: "Successfully deleted the saved strategy"
        });
        setShowDeleteDialog(false);
        setDeletingStrategy(null);
      } else {
        throw new Error('Failed to delete strategy');
      }
    } catch (error) {
      console.error('Error deleting strategy:', error);
      toast({
        title: "Error",
        description: "Failed to delete strategy",
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
                  style={getFieldStyles(isFieldModified('lightDutyCount'))}
                  min="0"
                  value={vehicleParameters.lightDutyCount}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    if (newValue !== DEFAULT_VALUES.lightDutyCount) {
                      markFieldAsModified('lightDutyCount');
                    }
                    updateVehicleParameters({ 
                      ...vehicleParameters, 
                      lightDutyCount: newValue
                    });
                  }}
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
                  style={getFieldStyles(isFieldModified('mediumDutyCount'))}
                  min="0"
                  value={vehicleParameters.mediumDutyCount}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    if (newValue !== DEFAULT_VALUES.mediumDutyCount) {
                      markFieldAsModified('mediumDutyCount');
                    }
                    updateVehicleParameters({ 
                      ...vehicleParameters, 
                      mediumDutyCount: newValue
                    });
                  }}
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
                  style={getFieldStyles(isFieldModified('heavyDutyCount'))}
                  min="0"
                  value={vehicleParameters.heavyDutyCount}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    if (newValue !== DEFAULT_VALUES.heavyDutyCount) {
                      markFieldAsModified('heavyDutyCount');
                    }
                    updateVehicleParameters({ 
                      ...vehicleParameters, 
                      heavyDutyCount: newValue
                    });
                  }}
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
                style={getFieldStyles(isFieldModified('timeHorizon') && timeHorizon === years)}
                onClick={() => {
                  if (years !== DEFAULT_VALUES.timeHorizon) {
                    markFieldAsModified('timeHorizon');
                  }
                  updateTimeHorizon(years);
                }}
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

      {/* Save Strategy */}
      <div className="pt-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Save Strategy
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 inline-block text-gray-500 dark:text-gray-400 cursor-help">
                  <Info size={16} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-60">
                <p className="text-xs">Save your current calculator settings and results as a named strategy for future reference and comparison.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </label>
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setShowSaveDialog(true)}
          disabled={!results}
        >
          <Save className="h-4 w-4" />
          Save Current Strategy
        </Button>
        {!results && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Calculate results first to save strategy
          </p>
        )}
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
                <div key={strategy.id} className="flex items-center justify-between px-2 py-1 hover:bg-gray-50">
                  <SelectItem value={strategy.id} className="flex-1 border-0 p-0">
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
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingStrategy({ id: strategy.id, name: strategy.name });
                        setEditName(strategy.name);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeletingStrategy(strategy.id);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
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

      {/* Edit Strategy Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Strategy Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strategy Name
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter new strategy name"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editName.trim()) {
                    handleEditStrategy();
                  }
                }}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingStrategy(null);
                  setEditName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditStrategy}
                disabled={!editName.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Strategy Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Strategy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this saved strategy? This action cannot be undone.
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium">
                {savedStrategies.find(s => s.id === deletingStrategy)?.name}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingStrategy(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteStrategy}
              >
                Delete Strategy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Strategy Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Strategy</DialogTitle>
            <DialogDescription>
              Save your current strategy configuration for future reference
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="strategyName" className="text-sm font-medium">
                Strategy Name
              </Label>
              <Input
                id="strategyName"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder="Enter a descriptive name..."
                className="mt-2"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-2">
                This name will help you identify this strategy configuration later
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false);
                setStrategyName("");
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveStrategy}
              disabled={isSaving || !strategyName.trim()}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Strategy"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}