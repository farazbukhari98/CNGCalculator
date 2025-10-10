import { useCalculator } from "@/contexts/CalculatorContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function VehicleDeploymentStrategy() {
  const { 
    timeHorizon,
    deploymentStrategy,
    updateManualDistribution,
    vehicleDistribution,
    vehicleParameters
  } = useCalculator();

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  // Generate array of years based on time horizon
  const years = Array.from({ length: timeHorizon }, (_, i) => i + 1);

  // Check if we're in manual mode
  const isManualMode = deploymentStrategy === 'manual';

  // Calculate total distributed vehicles for a specific type across visible years only (respecting timeHorizon)
  const getTotalDistributed = (vehicleType: 'light' | 'medium' | 'heavy'): number => {
    if (!vehicleDistribution) return 0;
    // Only sum across visible years (respecting current timeHorizon)
    const visibleDistribution = vehicleDistribution.slice(0, timeHorizon);
    return visibleDistribution.reduce((total, yearData) => {
      return total + (yearData[vehicleType] || 0);
    }, 0);
  };

  // Get maximum allowed vehicles for a specific type
  const getMaxAllowed = (vehicleType: 'light' | 'medium' | 'heavy'): number => {
    switch (vehicleType) {
      case 'light': return vehicleParameters.lightDutyCount;
      case 'medium': return vehicleParameters.mediumDutyCount;
      case 'heavy': return vehicleParameters.heavyDutyCount;
      default: return 0;
    }
  };

  // Get remaining vehicles that can be assigned for a specific type
  const getRemainingVehicles = (vehicleType: 'light' | 'medium' | 'heavy'): number => {
    const maxAllowed = getMaxAllowed(vehicleType);
    const totalDistributed = getTotalDistributed(vehicleType);
    return Math.max(0, maxAllowed - totalDistributed);
  };

  // Handle input change for manual distribution with validation
  const handleInputChange = (year: number, vehicleType: 'light' | 'medium' | 'heavy', value: string) => {
    // Harden input: prevent negative numbers and ensure valid integer
    const numValue = Math.max(0, Math.floor(+value) || 0);
    const maxAllowed = getMaxAllowed(vehicleType);
    const currentDistributed = getTotalDistributed(vehicleType);
    const currentYearValue = getVehicleCount(year, vehicleType);
    const newTotalDistributed = currentDistributed - currentYearValue + numValue;
    
    // Validate that the new total doesn't exceed the maximum allowed
    if (newTotalDistributed > maxAllowed) {
      // Show popup dialog instead of just validation errors
      const vehicleTypeCapitalized = vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);
      setDialogMessage(
        `Cannot add additional ${vehicleTypeCapitalized} Duty vehicles. ` +
        `You are trying to assign ${numValue} vehicles in Year ${year}, but this would result in ` +
        `${newTotalDistributed} total ${vehicleTypeCapitalized} Duty vehicles, exceeding your fleet limit of ${maxAllowed}. ` +
        `Please increase the fleet size in the Fleet Configuration section within the Global Settings sidebar menu first.`
      );
      setShowDialog(true);
      
      // Also set validation errors for the bottom alert (optional - keeping existing behavior)
      const errors = [`Cannot assign ${numValue} ${vehicleType} duty vehicles in Year ${year}. This would result in ${newTotalDistributed} total ${vehicleType} duty vehicles, exceeding the limit of ${maxAllowed}.`];
      setValidationErrors(errors);
      return; // Don't update the value
    }
    
    // Clear validation errors if the input is valid
    setValidationErrors([]);
    
    updateManualDistribution(year, {
      [vehicleType]: numValue
    });
  };

  // Get vehicle count for a specific year and type
  const getVehicleCount = (year: number, vehicleType: 'light' | 'medium' | 'heavy'): number => {
    if (!vehicleDistribution) return 0;
    const yearData = vehicleDistribution[year - 1];
    if (!yearData) return 0;
    return yearData[vehicleType] || 0;
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Vehicle Deployment Strategy</h2>
          {isManualMode && (
            <div className="mt-2 sm:mt-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Manual Edit Mode
              </span>
            </div>
          )}
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                  Vehicle Type
                </th>
                {years.map((year) => (
                  <th
                    key={year}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]"
                  >
                    Year {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {/* Light Duty Row */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Light Duty
                  </div>
                </td>
                {years.map((year) => (
                  <td key={year} className="px-4 py-4 whitespace-nowrap text-center">
                    {isManualMode ? (
                      <Input
                        type="number"
                        min="0"
                        value={getVehicleCount(year, 'light')}
                        onChange={(e) => handleInputChange(year, 'light', e.target.value)}
                        className="w-20 text-center mx-auto"
                        data-testid={`input-light-year-${year}`}
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-gray-100 font-medium" data-testid={`text-light-year-${year}`}>
                        {getVehicleCount(year, 'light')}
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Medium Duty Row */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Medium Duty
                  </div>
                </td>
                {years.map((year) => (
                  <td key={year} className="px-4 py-4 whitespace-nowrap text-center">
                    {isManualMode ? (
                      <Input
                        type="number"
                        min="0"
                        value={getVehicleCount(year, 'medium')}
                        onChange={(e) => handleInputChange(year, 'medium', e.target.value)}
                        className="w-20 text-center mx-auto"
                        data-testid={`input-medium-year-${year}`}
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-gray-100 font-medium" data-testid={`text-medium-year-${year}`}>
                        {getVehicleCount(year, 'medium')}
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Heavy Duty Row */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    Heavy Duty
                  </div>
                </td>
                {years.map((year) => (
                  <td key={year} className="px-4 py-4 whitespace-nowrap text-center">
                    {isManualMode ? (
                      <Input
                        type="number"
                        min="0"
                        value={getVehicleCount(year, 'heavy')}
                        onChange={(e) => handleInputChange(year, 'heavy', e.target.value)}
                        className="w-20 text-center mx-auto"
                        data-testid={`input-heavy-year-${year}`}
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-gray-100 font-medium" data-testid={`text-heavy-year-${year}`}>
                        {getVehicleCount(year, 'heavy')}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Over-allocation Warning */}
        {isManualMode && (
          (() => {
            const totalLight = getTotalDistributed('light');
            const totalMedium = getTotalDistributed('medium');
            const totalHeavy = getTotalDistributed('heavy');
            const maxLight = getMaxAllowed('light');
            const maxMedium = getMaxAllowed('medium');
            const maxHeavy = getMaxAllowed('heavy');
            
            const isOverAllocated = totalLight > maxLight || totalMedium > maxMedium || totalHeavy > maxHeavy;
            const hasUnallocated = totalLight < maxLight || totalMedium < maxMedium || totalHeavy < maxHeavy;
            
            if (isOverAllocated) {
              const overAllocations = [];
              if (totalLight > maxLight) overAllocations.push(`Light duty: ${totalLight}/${maxLight} (excess: ${totalLight - maxLight})`);
              if (totalMedium > maxMedium) overAllocations.push(`Medium duty: ${totalMedium}/${maxMedium} (excess: ${totalMedium - maxMedium})`);
              if (totalHeavy > maxHeavy) overAllocations.push(`Heavy duty: ${totalHeavy}/${maxHeavy} (excess: ${totalHeavy - maxHeavy})`);
              
              return (
                <div className="mt-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="text-sm font-medium mb-1">Over-allocation detected:</div>
                      {overAllocations.map((allocation, index) => (
                        <div key={index} className="text-sm">{allocation}</div>
                      ))}
                      <div className="text-sm mt-2 opacity-75">Excess vehicles have been automatically removed from the latest years.</div>
                    </AlertDescription>
                  </Alert>
                </div>
              );
            } else if (hasUnallocated) {
              const unallocations = [];
              if (totalLight < maxLight) unallocations.push(`Light duty: ${maxLight - totalLight} remaining`);
              if (totalMedium < maxMedium) unallocations.push(`Medium duty: ${maxMedium - totalMedium} remaining`);
              if (totalHeavy < maxHeavy) unallocations.push(`Heavy duty: ${maxHeavy - totalHeavy} remaining`);
              
              return (
                <div className="mt-4">
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      <div className="text-sm font-medium mb-1">Vehicles not yet allocated:</div>
                      {unallocations.map((unallocation, index) => (
                        <div key={index} className="text-sm">{unallocation}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                </div>
              );
            }
            
            return null;
          })()
        )}
        
        {/* Validation Errors */}
        {isManualMode && validationErrors.length > 0 && (
          <div className="mt-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-sm">{error}</div>
                ))}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Summary information */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {isManualMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">Light Duty</div>
                <div className="text-xs text-blue-600 dark:text-blue-300 mb-1">
                  Distributed: <span className="font-semibold" data-testid="distributed-light">{getTotalDistributed('light')}</span> / <span className="font-semibold">{getMaxAllowed('light')}</span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-300">
                  Remaining: <span className="font-semibold" data-testid="remaining-light">{getRemainingVehicles('light')}</span>
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="font-medium text-green-800 dark:text-green-200 mb-1">Medium Duty</div>
                <div className="text-xs text-green-600 dark:text-green-300 mb-1">
                  Distributed: <span className="font-semibold" data-testid="distributed-medium">{getTotalDistributed('medium')}</span> / <span className="font-semibold">{getMaxAllowed('medium')}</span>
                </div>
                <div className="text-xs text-green-600 dark:text-green-300">
                  Remaining: <span className="font-semibold" data-testid="remaining-medium">{getRemainingVehicles('medium')}</span>
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="font-medium text-red-800 dark:text-red-200 mb-1">Heavy Duty</div>
                <div className="text-xs text-red-600 dark:text-red-300 mb-1">
                  Distributed: <span className="font-semibold" data-testid="distributed-heavy">{getTotalDistributed('heavy')}</span> / <span className="font-semibold">{getMaxAllowed('heavy')}</span>
                </div>
                <div className="text-xs text-red-600 dark:text-red-300">
                  Remaining: <span className="font-semibold" data-testid="remaining-heavy">{getRemainingVehicles('heavy')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <span className="font-medium text-gray-600 dark:text-gray-400">Total Light Duty:</span>
                <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400" data-testid="total-light">
                  {years.reduce((sum, year) => sum + getVehicleCount(year, 'light'), 0)}
                </span>
              </div>
              <div className="text-center">
                <span className="font-medium text-gray-600 dark:text-gray-400">Total Medium Duty:</span>
                <span className="ml-2 font-semibold text-green-600 dark:text-green-400" data-testid="total-medium">
                  {years.reduce((sum, year) => sum + getVehicleCount(year, 'medium'), 0)}
                </span>
              </div>
              <div className="text-center">
                <span className="font-medium text-gray-600 dark:text-gray-400">Total Heavy Duty:</span>
                <span className="ml-2 font-semibold text-red-600 dark:text-red-400" data-testid="total-heavy">
                  {years.reduce((sum, year) => sum + getVehicleCount(year, 'heavy'), 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {isManualMode && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Manual Distribution Mode:</span> The deployment timeline has been cleared. 
              Enter the number of vehicles you want to deploy each year. 
              The maximum totals are set in Fleet Configuration above. You cannot exceed the total number of vehicles for each type.
            </p>
          </div>
        )}

        {/* Fleet Limit Exceeded Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[425px]" data-testid="dialog-fleet-limit">
            <DialogHeader>
              <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Fleet Limit Exceeded
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {dialogMessage}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end mt-4">
              <Button 
                onClick={() => setShowDialog(false)}
                className="px-6"
                data-testid="button-dialog-ok"
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}