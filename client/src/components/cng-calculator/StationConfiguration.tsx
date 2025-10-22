import { useCalculator } from "@/contexts/CalculatorContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { calculateStationCost, getStationSizeInfo } from "@/lib/calculator";
import { Check } from "lucide-react";
import { getFieldStyles, DEFAULT_VALUES } from "@/lib/fieldStyling";

export default function StationConfiguration() {
  const { 
    stationConfig, 
    updateStationConfig,
    vehicleParameters,
    vehicleDistribution,
    enhancedDistribution,
    fuelPrices,
    markFieldAsModified,
    isFieldModified
  } = useCalculator();

  // Enhanced distribution already includes total active vehicle counts
  // No need to manually calculate peak year counts

  // Get station size information - use enhanced distribution for accurate active vehicle counts
  const stationSizeInfo = getStationSizeInfo(stationConfig, vehicleParameters, enhancedDistribution, fuelPrices);
  
  // Use centralized station cost calculation - use enhanced distribution for accurate active vehicle counts
  const getStationCost = () => {
    return calculateStationCost(stationConfig, vehicleParameters, enhancedDistribution, fuelPrices);
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
        <div className="p-2 rounded-md" style={getFieldStyles(isFieldModified('stationType'))}>
          <RadioGroup 
            className="grid grid-cols-2 gap-3"
            value={stationConfig.stationType}
            onValueChange={(value) => {
              const newValue = value as 'fast' | 'time';
              if (newValue !== DEFAULT_VALUES.stationType) {
                markFieldAsModified('stationType');
              }
              updateStationConfig({...stationConfig, stationType: newValue});
            }}
          >
            <div className="relative">
              <RadioGroupItem value="fast" id="stationTypeFast" className="absolute opacity-0" />
              <Label 
                htmlFor="stationTypeFast" 
                className="flex flex-col items-center p-3 bg-white border rounded-md cursor-pointer hover:bg-blue-50 data-[state=checked]:bg-green-50 data-[state=checked]:border-green-500 data-[state=checked]:border-2"
              >
                {stationConfig.stationType === 'fast' && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium">Fast-Fill</span>
                <span className="text-xs text-gray-500 mt-1">Quick refueling, higher cost</span>
              </Label>
            </div>
            <div className="relative">
              <RadioGroupItem value="time" id="stationTypeTime" className="absolute opacity-0" />
              <Label 
                htmlFor="stationTypeTime" 
                className="flex flex-col items-center p-3 bg-white border rounded-md cursor-pointer hover:bg-blue-50 data-[state=checked]:bg-green-50 data-[state=checked]:border-green-500 data-[state=checked]:border-2"
              >
                {stationConfig.stationType === 'time' && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium">Time-Fill</span>
                <span className="text-xs text-gray-500 mt-1">Overnight refueling, lower cost</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      {/* Business Type */}
      <div className="border-t pt-3 mt-3">
        <Label className="block text-sm font-medium text-gray-700 mb-2">GAS LDC</Label>
        <Select 
          value={stationConfig.businessType} 
          onValueChange={(value) => {
            const newValue = value as 'aglc' | 'cgc' | 'vng';
            if (newValue !== DEFAULT_VALUES.businessType) {
              markFieldAsModified('businessType');
            }
            updateStationConfig({...stationConfig, businessType: newValue});
          }}
        >
          <SelectTrigger className="w-full" style={getFieldStyles(isFieldModified('businessType'))}>
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
                Station Size {stationSizeInfo.size} - {stationSizeInfo.capacity.toLocaleString()} GGE/year
              </>
            ) : (
              'Calculating station size...'
            )}
          </span>
        </div>
        <Progress value={capacityPercentage} className="h-2 mt-2" />
        <p className="text-xs text-gray-500 mt-1">
          {enhancedDistribution && enhancedDistribution.length > 0 ? (
            <>
              Peak year vehicles: {Math.max(...enhancedDistribution.map(y => y.totalActiveLight || 0))} Light, {Math.max(...enhancedDistribution.map(y => y.totalActiveMedium || 0))} Medium, {Math.max(...enhancedDistribution.map(y => y.totalActiveHeavy || 0))} Heavy (w/ CNG efficiency: 95%/92.5%/90%)
            </>
          ) : (
            <>
              Peak year vehicles: {vehicleParameters.lightDutyCount} Light, {vehicleParameters.mediumDutyCount} Medium, {vehicleParameters.heavyDutyCount} Heavy (w/ CNG efficiency: 95%/92.5%/90%)
            </>
          )}
        </p>
      </div>
      
      
      {/* Turnkey Option */}
      <div className="border-t pt-3 mt-3">
        <Label className="block text-sm font-medium text-gray-700 mb-2">Turnkey Option</Label>
        <RadioGroup 
          className="grid grid-cols-2 gap-3"
          value={stationConfig.turnkey ? "yes" : "no"}
          onValueChange={(value) => {
            const newValue = value === "yes";
            if (newValue !== DEFAULT_VALUES.turnkey) {
              markFieldAsModified('turnkey');
            }
            updateStationConfig({...stationConfig, turnkey: newValue});
          }}
        >
          <div className="relative">
            <RadioGroupItem value="yes" id="turnkeyYes" className="absolute opacity-0" />
            <Label 
              htmlFor="turnkeyYes" 
              className="flex flex-col items-center p-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 data-[state=checked]:bg-green-50 data-[state=checked]:border-green-500 data-[state=checked]:border-2"
              style={getFieldStyles(isFieldModified('turnkey') && stationConfig.turnkey)}
            >
              {stationConfig.turnkey === true && (
                <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-sm font-medium">Yes</span>
              <span className="text-xs text-gray-500 mt-1">Pay cost upfront</span>
            </Label>
          </div>
          <div className="relative">
            <RadioGroupItem value="no" id="turnkeyNo" className="absolute opacity-0" />
            <Label 
              htmlFor="turnkeyNo" 
              className="flex flex-col items-center p-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-blue-50 data-[state=checked]:bg-green-50 data-[state=checked]:border-green-500 data-[state=checked]:border-2"
              style={getFieldStyles(isFieldModified('turnkey') && !stationConfig.turnkey)}
            >
              {stationConfig.turnkey === false && (
                <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
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

      {/* Station Markup */}
      <div className="border-t pt-3 mt-3">
        <Label className="block text-sm font-medium text-gray-700 mb-2">Station Markup</Label>
        <Select 
          value={(stationConfig.stationMarkup ?? DEFAULT_VALUES.stationMarkup).toString()} 
          onValueChange={(value) => {
            const newValue = parseInt(value);
            if (newValue !== DEFAULT_VALUES.stationMarkup) {
              markFieldAsModified('stationMarkup');
            }
            updateStationConfig({...stationConfig, stationMarkup: newValue});
          }}
        >
          <SelectTrigger className="w-full" style={getFieldStyles(isFieldModified('stationMarkup'))}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-50">-50%</SelectItem>
            <SelectItem value="-45">-45%</SelectItem>
            <SelectItem value="-40">-40%</SelectItem>
            <SelectItem value="-35">-35%</SelectItem>
            <SelectItem value="-30">-30%</SelectItem>
            <SelectItem value="-25">-25%</SelectItem>
            <SelectItem value="-20">-20%</SelectItem>
            <SelectItem value="-15">-15%</SelectItem>
            <SelectItem value="-10">-10%</SelectItem>
            <SelectItem value="-5">-5%</SelectItem>
            <SelectItem value="0">0%</SelectItem>
            <SelectItem value="5">5%</SelectItem>
            <SelectItem value="10">10%</SelectItem>
            <SelectItem value="15">15%</SelectItem>
            <SelectItem value="20">20%</SelectItem>
            <SelectItem value="25">25%</SelectItem>
            <SelectItem value="30">30%</SelectItem>
            <SelectItem value="35">35%</SelectItem>
            <SelectItem value="40">40%</SelectItem>
            <SelectItem value="45">45%</SelectItem>
            <SelectItem value="50">50%</SelectItem>
            <SelectItem value="55">55%</SelectItem>
            <SelectItem value="60">60%</SelectItem>
            <SelectItem value="65">65%</SelectItem>
            <SelectItem value="70">70%</SelectItem>
            <SelectItem value="75">75%</SelectItem>
            <SelectItem value="80">80%</SelectItem>
            <SelectItem value="85">85%</SelectItem>
            <SelectItem value="90">90%</SelectItem>
            <SelectItem value="95">95%</SelectItem>
            <SelectItem value="100">100%</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Markup percentage applied to the base station cost
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
            ? `Base cost + ${stationConfig.stationMarkup}% markup` 
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
