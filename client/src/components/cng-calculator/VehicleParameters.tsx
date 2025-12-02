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
import { getFieldStyles, DEFAULT_VALUES } from "@/lib/fieldStyling";

export default function VehicleParameters() {
  const { 
    vehicleParameters, 
    updateVehicleParameters,
    markFieldAsModified,
    isFieldModified
  } = useCalculator();

  // Format cost input with dollar sign and commas
  const formatCost = (cost: number): string => {
    return cost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Parse cost input removing non-numeric characters
  const parseCost = (value: string): number => {
    return parseInt(value.replace(/[^0-9]/g, "")) || 0;
  };

  // Parse whole number input (for Annual Miles, Lifespan)
  const parseWholeNumber = (value: string): number => {
    return parseInt(value) || 0;
  };
  
  // Parse decimal number with 1 decimal precision (for MPG) - store as integer * 10
  const parseMPG = (value: string): number => {
    const floatValue = parseFloat(value) || 0;
    return Math.round(floatValue * 10); // Store as integer (125 = 12.5 MPG)
  };
  
  // Display MPG value (convert from integer storage)
  const displayMPG = (value: number): string => {
    return (value / 10).toFixed(1);
  };
  
  // Format number with commas for display
  const formatWithCommas = (value: number): string => {
    if (!value) return "";
    return value.toLocaleString('en-US');
  };
  
  // Parse comma-formatted input back to number
  const parseCommaNumber = (value: string): number => {
    // Remove commas and parse as integer
    const cleanValue = value.replace(/,/g, '');
    return parseInt(cleanValue) || 0;
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
                    style={getFieldStyles(isFieldModified('lightDutyCost'))}
                    value={formatCost(vehicleParameters.lightDutyCost)}
                    onChange={(e) => {
                      const newValue = parseCost(e.target.value);
                      if (newValue !== DEFAULT_VALUES.lightDutyCost) {
                        markFieldAsModified('lightDutyCost');
                      }
                      updateVehicleParameters({ 
                        ...vehicleParameters, 
                        lightDutyCost: newValue
                      });
                    }}
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
                    style={getFieldStyles(isFieldModified('mediumDutyCost'))}
                    value={formatCost(vehicleParameters.mediumDutyCost)}
                    onChange={(e) => {
                      const newValue = parseCost(e.target.value);
                      if (newValue !== DEFAULT_VALUES.mediumDutyCost) {
                        markFieldAsModified('mediumDutyCost');
                      }
                      updateVehicleParameters({ 
                        ...vehicleParameters, 
                        mediumDutyCost: newValue
                      });
                    }}
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
                    style={getFieldStyles(isFieldModified('heavyDutyCost'))}
                    value={formatCost(vehicleParameters.heavyDutyCost)}
                    onChange={(e) => {
                      const newValue = parseCost(e.target.value);
                      if (newValue !== DEFAULT_VALUES.heavyDutyCost) {
                        markFieldAsModified('heavyDutyCost');
                      }
                      updateVehicleParameters({ 
                        ...vehicleParameters, 
                        heavyDutyCost: newValue
                      });
                    }}
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
                        style={getFieldStyles(isFieldModified('lightDutyLifespan'))}
                        value={vehicleParameters.lightDutyLifespan}
                        onChange={(e) => {
                          const newValue = parseWholeNumber(e.target.value);
                          if (newValue !== DEFAULT_VALUES.lightDutyLifespan) {
                            markFieldAsModified('lightDutyLifespan');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            lightDutyLifespan: newValue
                          });
                        }}
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
                        style={getFieldStyles(isFieldModified('mediumDutyLifespan'))}
                        value={vehicleParameters.mediumDutyLifespan}
                        onChange={(e) => {
                          const newValue = parseWholeNumber(e.target.value);
                          if (newValue !== DEFAULT_VALUES.mediumDutyLifespan) {
                            markFieldAsModified('mediumDutyLifespan');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            mediumDutyLifespan: newValue
                          });
                        }}
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
                        style={getFieldStyles(isFieldModified('heavyDutyLifespan'))}
                        value={vehicleParameters.heavyDutyLifespan}
                        onChange={(e) => {
                          const newValue = parseWholeNumber(e.target.value);
                          if (newValue !== DEFAULT_VALUES.heavyDutyLifespan) {
                            markFieldAsModified('heavyDutyLifespan');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            heavyDutyLifespan: newValue
                          });
                        }}
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
                        style={getFieldStyles(isFieldModified('lightDutyMPG'))}
                        value={vehicleParameters.lightDutyMPG}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          if (newValue !== DEFAULT_VALUES.lightDutyMPG) {
                            markFieldAsModified('lightDutyMPG');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            lightDutyMPG: newValue
                          });
                        }}
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
                        style={getFieldStyles(isFieldModified('mediumDutyMPG'))}
                        value={vehicleParameters.mediumDutyMPG}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          if (newValue !== DEFAULT_VALUES.mediumDutyMPG) {
                            markFieldAsModified('mediumDutyMPG');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            mediumDutyMPG: newValue
                          });
                        }}
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
                        style={getFieldStyles(isFieldModified('heavyDutyMPG'))}
                        value={vehicleParameters.heavyDutyMPG}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          if (newValue !== DEFAULT_VALUES.heavyDutyMPG) {
                            markFieldAsModified('heavyDutyMPG');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            heavyDutyMPG: newValue
                          });
                        }}
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
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        style={getFieldStyles(isFieldModified('lightDutyAnnualMiles'))}
                        value={formatWithCommas(vehicleParameters.lightDutyAnnualMiles)}
                        onChange={(e) => {
                          const newValue = parseCommaNumber(e.target.value);
                          if (newValue !== DEFAULT_VALUES.lightDutyAnnualMiles) {
                            markFieldAsModified('lightDutyAnnualMiles');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            lightDutyAnnualMiles: newValue
                          });
                        }}
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
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        style={getFieldStyles(isFieldModified('mediumDutyAnnualMiles'))}
                        value={formatWithCommas(vehicleParameters.mediumDutyAnnualMiles)}
                        onChange={(e) => {
                          const newValue = parseCommaNumber(e.target.value);
                          if (newValue !== DEFAULT_VALUES.mediumDutyAnnualMiles) {
                            markFieldAsModified('mediumDutyAnnualMiles');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            mediumDutyAnnualMiles: newValue
                          });
                        }}
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
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        style={getFieldStyles(isFieldModified('heavyDutyAnnualMiles'))}
                        value={formatWithCommas(vehicleParameters.heavyDutyAnnualMiles)}
                        onChange={(e) => {
                          const newValue = parseCommaNumber(e.target.value);
                          if (newValue !== DEFAULT_VALUES.heavyDutyAnnualMiles) {
                            markFieldAsModified('heavyDutyAnnualMiles');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            heavyDutyAnnualMiles: newValue
                          });
                        }}
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
                    onValueChange={(value: 'gasoline' | 'diesel') => {
                      if (value !== DEFAULT_VALUES.lightDutyFuelType) {
                        markFieldAsModified('lightDutyFuelType');
                      }
                      updateVehicleParameters({
                        ...vehicleParameters,
                        lightDutyFuelType: value
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm" style={getFieldStyles(isFieldModified('lightDutyFuelType'))}>
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
                    onValueChange={(value: 'gasoline' | 'diesel') => {
                      if (value !== DEFAULT_VALUES.mediumDutyFuelType) {
                        markFieldAsModified('mediumDutyFuelType');
                      }
                      updateVehicleParameters({
                        ...vehicleParameters,
                        mediumDutyFuelType: value
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm" style={getFieldStyles(isFieldModified('mediumDutyFuelType'))}>
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
                    onValueChange={(value: 'gasoline' | 'diesel') => {
                      if (value !== DEFAULT_VALUES.heavyDutyFuelType) {
                        markFieldAsModified('heavyDutyFuelType');
                      }
                      updateVehicleParameters({
                        ...vehicleParameters,
                        heavyDutyFuelType: value
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm" style={getFieldStyles(isFieldModified('heavyDutyFuelType'))}>
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
                Fuel type affects pricing calculations (gasoline vs diesel fuel costs)
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
                        style={getFieldStyles(isFieldModified('lightDutyCngEfficiencyLoss'))}
                        value={(vehicleParameters.lightDutyCngEfficiencyLoss / 10).toFixed(1)}
                        onChange={(e) => {
                          const newValue = Math.round(parseFloat(e.target.value) * 10);
                          if (newValue !== DEFAULT_VALUES.lightDutyCngEfficiencyLoss) {
                            markFieldAsModified('lightDutyCngEfficiencyLoss');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            lightDutyCngEfficiencyLoss: newValue
                          });
                        }}
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
                        style={getFieldStyles(isFieldModified('mediumDutyCngEfficiencyLoss'))}
                        value={(vehicleParameters.mediumDutyCngEfficiencyLoss / 10).toFixed(1)}
                        onChange={(e) => {
                          const newValue = Math.round(parseFloat(e.target.value) * 10);
                          if (newValue !== DEFAULT_VALUES.mediumDutyCngEfficiencyLoss) {
                            markFieldAsModified('mediumDutyCngEfficiencyLoss');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            mediumDutyCngEfficiencyLoss: newValue
                          });
                        }}
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
                        style={getFieldStyles(isFieldModified('heavyDutyCngEfficiencyLoss'))}
                        value={(vehicleParameters.heavyDutyCngEfficiencyLoss / 10).toFixed(1)}
                        onChange={(e) => {
                          const newValue = Math.round(parseFloat(e.target.value) * 10);
                          if (newValue !== DEFAULT_VALUES.heavyDutyCngEfficiencyLoss) {
                            markFieldAsModified('heavyDutyCngEfficiencyLoss');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            heavyDutyCngEfficiencyLoss: newValue
                          });
                        }}
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
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maintenance Savings ($/mile)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Light Duty
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        style={getFieldStyles(isFieldModified('lightDutyMaintenanceSavings'))}
                        value={vehicleParameters.lightDutyMaintenanceSavings}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          if (newValue !== DEFAULT_VALUES.lightDutyMaintenanceSavings) {
                            markFieldAsModified('lightDutyMaintenanceSavings');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            lightDutyMaintenanceSavings: newValue
                          });
                        }}
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
                          <p>Per-mile maintenance savings for CNG light duty vehicles (e.g., $0.05)</p>
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
                        <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        style={getFieldStyles(isFieldModified('mediumDutyMaintenanceSavings'))}
                        value={vehicleParameters.mediumDutyMaintenanceSavings}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          if (newValue !== DEFAULT_VALUES.mediumDutyMaintenanceSavings) {
                            markFieldAsModified('mediumDutyMaintenanceSavings');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            mediumDutyMaintenanceSavings: newValue
                          });
                        }}
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
                          <p>Per-mile maintenance savings for CNG medium duty vehicles (e.g., $0.05)</p>
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
                        <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pl-7 py-1"
                        style={getFieldStyles(isFieldModified('heavyDutyMaintenanceSavings'))}
                        value={vehicleParameters.heavyDutyMaintenanceSavings}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          if (newValue !== DEFAULT_VALUES.heavyDutyMaintenanceSavings) {
                            markFieldAsModified('heavyDutyMaintenanceSavings');
                          }
                          updateVehicleParameters({ 
                            ...vehicleParameters, 
                            heavyDutyMaintenanceSavings: newValue
                          });
                        }}
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
                          <p>Per-mile maintenance savings for CNG heavy duty vehicles (e.g., $0.05)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                CNG vehicles typically have lower maintenance costs due to cleaner combustion
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
