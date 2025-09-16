import { useCalculator } from "@/contexts/CalculatorContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function VehicleDeploymentStrategy() {
  const { 
    timeHorizon,
    deploymentStrategy,
    updateManualDistribution,
    vehicleDistribution,
    targetVehicleCounts
  } = useCalculator();

  // Generate array of years based on time horizon
  const years = Array.from({ length: timeHorizon }, (_, i) => i + 1);

  // Check if we're in manual mode
  const isManualMode = deploymentStrategy === 'manual';

  // Handle input change for manual distribution
  const handleInputChange = (year: number, vehicleType: 'light' | 'medium' | 'heavy', value: string) => {
    const numValue = parseInt(value) || 0;
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

  // Calculate total vehicle counts across all years
  const getTotalVehicleCount = (vehicleType: 'light' | 'medium' | 'heavy'): number => {
    return years.reduce((sum, year) => sum + getVehicleCount(year, vehicleType), 0);
  };

  // Get target count for vehicle type
  const getTargetCount = (vehicleType: 'light' | 'medium' | 'heavy'): number => {
    switch (vehicleType) {
      case 'light': return targetVehicleCounts.lightDutyTarget;
      case 'medium': return targetVehicleCounts.mediumDutyTarget;
      case 'heavy': return targetVehicleCounts.heavyDutyTarget;
      default: return 0;
    }
  };

  // Check if a vehicle type exceeds its target
  const isExceedingTarget = (vehicleType: 'light' | 'medium' | 'heavy'): boolean => {
    return getTotalVehicleCount(vehicleType) > getTargetCount(vehicleType);
  };

  // Check if adding a vehicle to a specific year would exceed the target
  const wouldExceedTarget = (year: number, vehicleType: 'light' | 'medium' | 'heavy', newValue: number): boolean => {
    const currentCount = getVehicleCount(year, vehicleType);
    const totalOtherYears = getTotalVehicleCount(vehicleType) - currentCount;
    return (totalOtherYears + newValue) > getTargetCount(vehicleType);
  };

  // Enhanced input change handler with validation
  const handleInputChangeWithValidation = (year: number, vehicleType: 'light' | 'medium' | 'heavy', value: string) => {
    const numValue = parseInt(value) || 0;
    
    // Allow the change regardless of validation (users can exceed targets but get visual feedback)
    updateManualDistribution(year, {
      [vehicleType]: numValue
    });
  };

  // Get input styling based on validation
  const getInputStyling = (year: number, vehicleType: 'light' | 'medium' | 'heavy'): string => {
    const baseClasses = "w-20 text-center mx-auto";
    const currentValue = getVehicleCount(year, vehicleType);
    
    if (wouldExceedTarget(year, vehicleType, currentValue)) {
      return `${baseClasses} border-red-500 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-500`;
    }
    
    return baseClasses;
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
                        onChange={(e) => handleInputChangeWithValidation(year, 'light', e.target.value)}
                        className={getInputStyling(year, 'light')}
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
                        onChange={(e) => handleInputChangeWithValidation(year, 'medium', e.target.value)}
                        className={getInputStyling(year, 'medium')}
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
                        onChange={(e) => handleInputChangeWithValidation(year, 'heavy', e.target.value)}
                        className={getInputStyling(year, 'heavy')}
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

        {/* Summary information with target validation */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <span className="font-medium text-gray-600 dark:text-gray-400">Light Duty:</span>
              <div className="mt-1">
                <span className={`font-semibold ${isExceedingTarget('light') ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} data-testid="total-light">
                  {getTotalVehicleCount('light')}
                </span>
                <span className="text-gray-500 dark:text-gray-400"> / {getTargetCount('light')} target</span>
              </div>
              {isExceedingTarget('light') && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1" data-testid="warning-light">
                  Exceeds target by {getTotalVehicleCount('light') - getTargetCount('light')}
                </div>
              )}
            </div>
            <div className="text-center">
              <span className="font-medium text-gray-600 dark:text-gray-400">Medium Duty:</span>
              <div className="mt-1">
                <span className={`font-semibold ${isExceedingTarget('medium') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} data-testid="total-medium">
                  {getTotalVehicleCount('medium')}
                </span>
                <span className="text-gray-500 dark:text-gray-400"> / {getTargetCount('medium')} target</span>
              </div>
              {isExceedingTarget('medium') && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1" data-testid="warning-medium">
                  Exceeds target by {getTotalVehicleCount('medium') - getTargetCount('medium')}
                </div>
              )}
            </div>
            <div className="text-center">
              <span className="font-medium text-gray-600 dark:text-gray-400">Heavy Duty:</span>
              <div className="mt-1">
                <span className={`font-semibold ${isExceedingTarget('heavy') ? 'text-red-600 dark:text-red-400' : 'text-red-600 dark:text-red-400'}`} data-testid="total-heavy">
                  {getTotalVehicleCount('heavy')}
                </span>
                <span className="text-gray-500 dark:text-gray-400"> / {getTargetCount('heavy')} target</span>
              </div>
              {isExceedingTarget('heavy') && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1" data-testid="warning-heavy">
                  Exceeds target by {getTotalVehicleCount('heavy') - getTargetCount('heavy')}
                </div>
              )}
            </div>
          </div>
        </div>

        {isManualMode && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <span className="font-medium">Manual Distribution Mode:</span> Enter the number of vehicles to deploy each year. 
                Changes will automatically update your financial calculations.
              </p>
            </div>
            
            {/* Show validation warnings if any targets are exceeded */}
            {(isExceedingTarget('light') || isExceedingTarget('medium') || isExceedingTarget('heavy')) && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800" data-testid="validation-warning">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-medium">⚠️ Target Exceeded:</span> Some vehicle counts exceed the targets set in Fleet Configuration. 
                  Adjust the targets or reduce deployment numbers to stay within limits.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}