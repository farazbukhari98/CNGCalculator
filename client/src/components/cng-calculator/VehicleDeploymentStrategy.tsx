import { useCalculator } from "@/contexts/CalculatorContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function VehicleDeploymentStrategy() {
  const { 
    timeHorizon,
    deploymentStrategy,
    updateManualDistribution,
    vehicleDistribution
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

        {/* Summary information */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
        </div>

        {isManualMode && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Manual Distribution Mode:</span> Enter the number of vehicles to deploy each year. 
              Changes will automatically update your financial calculations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}