import { useCalculator } from "@/contexts/CalculatorContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { calculateStationCost, getStationSizeInfo } from "@/lib/calculator";

export default function StationConfiguration() {
  const { 
    stationConfig, 
    updateStationConfig,
    vehicleParameters,
    vehicleDistribution
  } = useCalculator();

  // Always determine vehicle counts based on peak year usage (maximum vehicles in any single year)
  let vehicleCounts: { lightDutyCount: number, mediumDutyCount: number, heavyDutyCount: number };
  
  if (vehicleDistribution) {
    // Use peak year vehicle counts from deployment strategy
    let maxLight = 0;
    let maxMedium = 0;
    let maxHeavy = 0;

    vehicleDistribution.forEach(year => {
      maxLight = Math.max(maxLight, year.light || 0);
      maxMedium = Math.max(maxMedium, year.medium || 0);
      maxHeavy = Math.max(maxHeavy, year.heavy || 0);
    });

    vehicleCounts = {
      lightDutyCount: maxLight,
      mediumDutyCount: maxMedium,
      heavyDutyCount: maxHeavy
    };
  } else {
    // Fallback to total vehicle counts if no distribution available yet
    vehicleCounts = {
      lightDutyCount: vehicleParameters.lightDutyCount,
      mediumDutyCount: vehicleParameters.mediumDutyCount,
      heavyDutyCount: vehicleParameters.heavyDutyCount
    };
  }

  // Get station size information
  const stationSizeInfo = getStationSizeInfo(stationConfig, vehicleParameters, vehicleDistribution);
  
  // Use centralized station cost calculation
  const getStationCost = () => {
    return calculateStationCost(stationConfig, vehicleParameters, vehicleDistribution);
  };
  
  // Calculate capacity utilization for progress bar
  const capacityPercentage = stationSizeInfo 
    ? Math.min(Math.round((stationSizeInfo.annualGGE / stationSizeInfo.capacity) * 100), 100)
    : 0;

  return (
    <div className="bg-white rounded-md p-3 space-y-3">
      {/* Station Type */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">Station Type</Label>
        <RadioGroup 
          className="grid grid-cols-2 gap-3"
          value={stationConfig.stationType}
          onValueChange={(value) => updateStationConfig({...stationConfig, stationType: value as 'fast' | 'time'})}
        >
          <div className="relative">
            <RadioGroupItem value="fast" id="stationTypeFast" className="absolute opacity-0" />
            <Label 
              htmlFor="stationTypeFast" 
              className="flex flex-col items-center p-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 data-[state=checked]:bg-blue-50 data-[state=checked]:border-blue-500"
            >
              <span className="text-sm font-medium">Fast-Fill</span>
              <span className="text-xs text-gray-500 mt-1">Quick refueling, higher cost</span>
            </Label>
          </div>
          <div className="relative">
            <RadioGroupItem value="time" id="stationTypeTime" className="absolute opacity-0" />
            <Label 
              htmlFor="stationTypeTime" 
              className="flex flex-col items-center p-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 data-[state=checked]:bg-blue-50 data-[state=checked]:border-blue-500"
            >
              <span className="text-sm font-medium">Time-Fill</span>
              <span className="text-xs text-gray-500 mt-1">Overnight refueling, lower cost</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Business Type */}
      <div className="border-t pt-3 mt-3">
        <Label className="block text-sm font-medium text-gray-700 mb-2">GAS LDC</Label>
        <Select 
          value={stationConfig.businessType} 
          onValueChange={(value) => updateStationConfig({...stationConfig, businessType: value as 'aglc' | 'cgc' | 'vng'})}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select GAS LDC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aglc">AGLC (Atlanta Gas Light Company)</SelectItem>
            <SelectItem value="cgc">CGC (Chattanooga Gas Company)</SelectItem>
            <SelectItem value="vng">VNG (Virginia Natural Gas)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Station Capacity */}
      <div className="border-t pt-3 mt-3">
        <div className="flex items-center justify-between">
          <Label className="block text-sm font-medium text-gray-700">Station Capacity</Label>
          <span className="text-sm font-medium text-blue-600">
            {stationSizeInfo ? (
              <>
                Station Size {stationSizeInfo.size} - {stationSizeInfo.annualGGE.toLocaleString()} / {stationSizeInfo.capacity.toLocaleString()} GGE/year
              </>
            ) : (
              'Calculating station size...'
            )}
          </span>
        </div>
        <Progress value={capacityPercentage} className="h-2 mt-2" />
        <p className="text-xs text-gray-500 mt-1">
          Peak year vehicles: {vehicleCounts.lightDutyCount} Light, {vehicleCounts.mediumDutyCount} Medium, {vehicleCounts.heavyDutyCount} Heavy (w/ CNG efficiency: 95%/92.5%/90%)
        </p>
      </div>
      
      
      {/* Turnkey Option */}
      <div className="border-t pt-3 mt-3">
        <Label className="block text-sm font-medium text-gray-700 mb-2">Turnkey Option</Label>
        <RadioGroup 
          className="grid grid-cols-2 gap-3"
          value={stationConfig.turnkey ? "yes" : "no"}
          onValueChange={(value) => updateStationConfig({...stationConfig, turnkey: value === "yes"})}
        >
          <div className="relative">
            <RadioGroupItem value="yes" id="turnkeyYes" className="absolute opacity-0" />
            <Label 
              htmlFor="turnkeyYes" 
              className="flex flex-col items-center p-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 data-[state=checked]:bg-blue-50 data-[state=checked]:border-blue-500"
            >
              <span className="text-sm font-medium">Yes</span>
              <span className="text-xs text-gray-500 mt-1">Pay cost upfront</span>
            </Label>
          </div>
          <div className="relative">
            <RadioGroupItem value="no" id="turnkeyNo" className="absolute opacity-0" />
            <Label 
              htmlFor="turnkeyNo" 
              className="flex flex-col items-center p-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 data-[state=checked]:bg-blue-50 data-[state=checked]:border-blue-500"
            >
              <span className="text-sm font-medium">No</span>
              <span className="text-xs text-gray-500 mt-1">Leveraging LDC investment tariff</span>
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-gray-500 mt-1">
          {stationConfig.turnkey 
            ? "Station cost is paid upfront as a single investment" 
            : `Station uses LDC investment tariff with monthly fee of ${stationConfig.businessType === 'cgc' ? '1.6%' : '1.5%'} over the analysis period`}
        </p>
      </div>

      {/* Cost Estimate */}
      <div className="border-t pt-3 mt-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="block text-sm font-medium text-gray-700">Base Station Cost</Label>
            <span className="text-sm font-medium text-gray-600">
              ${stationSizeInfo?.baseCost.toLocaleString() || 'Calculating...'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <Label className="block text-sm font-medium text-gray-700">Quoted Price</Label>
            <span className="text-sm font-medium text-gray-900">
              ${stationSizeInfo?.finalCost.toLocaleString() || getStationCost().toLocaleString()}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {stationConfig.turnkey 
            ? "Base cost + 20% turnkey markup" 
            : `Base cost ${stationConfig.businessType === 'cgc' ? '- 5% CGC discount' : ''}`}
        </p>
        <p className="text-xs text-gray-500">
          {stationConfig.turnkey 
            ? "Includes installation and equipment (paid upfront)" 
            : "Includes installation and equipment (LDC investment tariff)"}
        </p>
      </div>
    </div>
  );
}
