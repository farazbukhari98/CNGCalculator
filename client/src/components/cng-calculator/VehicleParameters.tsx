import { useCalculator } from "@/contexts/CalculatorContext";
import { Info, DollarSign, Clock, Gauge, Navigation, Percent } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VehicleParameters() {
  const { 
    vehicleParameters, 
    updateVehicleParameters
  } = useCalculator();

  // Format cost input with dollar sign and commas
  const formatCost = (cost: number): string => {
    return cost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Parse cost input removing non-numeric characters
  const parseCost = (value: string): number => {
    return parseInt(value.replace(/[^0-9]/g, "")) || 0;
  };

  // Parse number input (for MPG and Lifespan)
  const parseNumber = (value: string): number => {
    return parseFloat(value) || 0;
  };

  return (
    <div className="bg-white rounded-md p-3 space-y-3">
      <Tabs defaultValue="costs">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="costs" className="flex-1">Vehicle Costs</TabsTrigger>
          <TabsTrigger value="specs" className="flex-1">Vehicle Specs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="costs">
          <div className="space-y-3">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700">Vehicle Costs</h3>
              <p className="text-xs text-gray-500 mt-1">
                Adjust the default cost for converting each type of vehicle to CNG
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Incremental Light Duty Vehicle Cost
              </label>
              <div className="flex items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-8"
                    value={formatCost(vehicleParameters.lightDutyCost)}
                    onChange={(e) => updateVehicleParameters({ 
                      ...vehicleParameters, 
                      lightDutyCost: parseCost(e.target.value)
                    })}
                  />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="ml-2 text-gray-500 cursor-help">
                        <Info size={18} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the incremental cost to convert each light duty vehicle to CNG</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Incremental Medium Duty Vehicle Cost
              </label>
              <div className="flex items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-8"
                    value={formatCost(vehicleParameters.mediumDutyCost)}
                    onChange={(e) => updateVehicleParameters({ 
                      ...vehicleParameters, 
                      mediumDutyCost: parseCost(e.target.value) 
                    })}
                  />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="ml-2 text-gray-500 cursor-help">
                        <Info size={18} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the incremental cost to convert each medium duty vehicle to CNG</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Incremental Heavy Duty Vehicle Cost
              </label>
              <div className="flex items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-8"
                    value={formatCost(vehicleParameters.heavyDutyCost)}
                    onChange={(e) => updateVehicleParameters({ 
                      ...vehicleParameters, 
                      heavyDutyCost: parseCost(e.target.value) 
                    })}
                  />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="ml-2 text-gray-500 cursor-help">
                        <Info size={18} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the incremental cost to convert each heavy duty vehicle to CNG</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="specs">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle Lifespan (Years)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Light Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={vehicleParameters.lightDutyLifespan}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          lightDutyLifespan: parseNumber(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Medium Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="30" 
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={vehicleParameters.mediumDutyLifespan}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          mediumDutyLifespan: parseNumber(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Heavy Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={vehicleParameters.heavyDutyLifespan}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          heavyDutyLifespan: parseNumber(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Average lifespan affects replacement timing and payback period considerations
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fuel Efficiency (Miles Per Gallon)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Light Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Gauge className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        step="0.1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={vehicleParameters.lightDutyMPG}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          lightDutyMPG: parseNumber(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Medium Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Gauge className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        step="0.1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={vehicleParameters.mediumDutyMPG}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          mediumDutyMPG: parseNumber(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Heavy Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Gauge className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        step="0.1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={vehicleParameters.heavyDutyMPG}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          heavyDutyMPG: parseNumber(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fuel efficiency directly impacts cost savings and emissions reductions
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Annual Miles Driven</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Light Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Navigation className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="1000"
                        max="100000"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={vehicleParameters.lightDutyAnnualMiles}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          lightDutyAnnualMiles: parseNumber(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Medium Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Navigation className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="1000"
                        max="150000"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={vehicleParameters.mediumDutyAnnualMiles}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          mediumDutyAnnualMiles: parseNumber(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Heavy Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Navigation className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="1000"
                        max="200000"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={vehicleParameters.heavyDutyAnnualMiles}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          heavyDutyAnnualMiles: parseNumber(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Annual mileage directly affects fuel savings and emissions calculations
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fuel Type</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Light Duty
                  </label>
                  <Select
                    value={vehicleParameters.lightDutyFuelType}
                    onValueChange={(value: 'gasoline' | 'diesel') => updateVehicleParameters({
                      ...vehicleParameters,
                      lightDutyFuelType: value
                    })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Gasoline</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Medium Duty
                  </label>
                  <Select
                    value={vehicleParameters.mediumDutyFuelType}
                    onValueChange={(value: 'gasoline' | 'diesel') => updateVehicleParameters({
                      ...vehicleParameters,
                      mediumDutyFuelType: value
                    })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Gasoline</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Heavy Duty
                  </label>
                  <Select
                    value={vehicleParameters.heavyDutyFuelType}
                    onValueChange={(value: 'gasoline' | 'diesel') => updateVehicleParameters({
                      ...vehicleParameters,
                      heavyDutyFuelType: value
                    })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Gasoline</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fuel type affects pricing calculations and maintenance savings (diesel vehicles receive additional maintenance savings)
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CNG Efficiency Loss (%)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Light Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Percent className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={(vehicleParameters.lightDutyCngEfficiencyLoss / 10).toFixed(1)}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          lightDutyCngEfficiencyLoss: Math.round(parseNumber(e.target.value) * 10)
                        })}
                      />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="ml-2 text-gray-500 cursor-help">
                            <Info size={16} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>CNG vehicles typically have 5% lower fuel economy due to energy density differences</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Medium Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Percent className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={(vehicleParameters.mediumDutyCngEfficiencyLoss / 10).toFixed(1)}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          mediumDutyCngEfficiencyLoss: Math.round(parseNumber(e.target.value) * 10)
                        })}
                      />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="ml-2 text-gray-500 cursor-help">
                            <Info size={16} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>CNG vehicles typically have 7.5% lower fuel economy due to energy density differences</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Heavy Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <Percent className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        value={(vehicleParameters.heavyDutyCngEfficiencyLoss / 10).toFixed(1)}
                        onChange={(e) => updateVehicleParameters({ 
                          ...vehicleParameters, 
                          heavyDutyCngEfficiencyLoss: Math.round(parseNumber(e.target.value) * 10)
                        })}
                      />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="ml-2 text-gray-500 cursor-help">
                            <Info size={16} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>CNG vehicles typically have 10% lower fuel economy due to energy density differences</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                CNG vehicles have lower energy density than gasoline/diesel, requiring more fuel for the same distance
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
