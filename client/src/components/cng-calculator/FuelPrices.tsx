import { useCalculator } from "@/contexts/CalculatorContext";
import { Info, Leaf } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getFieldStyles, DEFAULT_VALUES } from "@/lib/fieldStyling";
import { RngFeedstockType, RNG_FEEDSTOCK_LABELS, RNG_CI_VALUES } from "@/types/calculator";

export default function FuelPrices() {
  const { 
    fuelPrices, 
    updateFuelPrices,
    markFieldAsModified,
    isFieldModified,
    rngFeedstockType,
    updateRngFeedstockType
  } = useCalculator();

  // Calculate effective CNG price (after tax credit)
  const effectiveCngPrice = Math.max(0, fuelPrices.cngPrice - fuelPrices.cngTaxCredit);
  
  // Calculate fuel savings percentages using effective CNG price
  const cngVsGasolineSavings = Math.round(((fuelPrices.gasolinePrice - effectiveCngPrice) / fuelPrices.gasolinePrice) * 100 * 10) / 10;
  const cngVsDieselSavings = Math.round(((fuelPrices.dieselPrice - effectiveCngPrice) / fuelPrices.dieselPrice) * 100 * 10) / 10;

  return (
    <div className="bg-white dark:bg-gray-700 rounded-md p-3 space-y-3">
      {/* Gasoline Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Gasoline Price ($/gallon)
        </label>
        <div className="flex items-center">
          <input
            type="number"
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            style={getFieldStyles(isFieldModified('gasolinePrice'))}
            min="0"
            step="0.01"
            value={fuelPrices.gasolinePrice}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              if (newValue !== DEFAULT_VALUES.gasolinePrice) {
                markFieldAsModified('gasolinePrice');
              }
              updateFuelPrices({ 
                ...fuelPrices, 
                gasolinePrice: newValue
              });
            }}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 text-gray-500 dark:text-gray-400 cursor-help">
                  <Info size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Current gasoline price per gallon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Diesel Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Diesel Price ($/gallon)
        </label>
        <div className="flex items-center">
          <input
            type="number"
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            style={getFieldStyles(isFieldModified('dieselPrice'))}
            min="0"
            step="0.01"
            value={fuelPrices.dieselPrice}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              if (newValue !== DEFAULT_VALUES.dieselPrice) {
                markFieldAsModified('dieselPrice');
              }
              updateFuelPrices({ 
                ...fuelPrices, 
                dieselPrice: newValue
              });
            }}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 text-gray-500 dark:text-gray-400 cursor-help">
                  <Info size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Current diesel price per gallon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* CNG Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          CNG Price ($/GGE)
        </label>
        <div className="flex items-center">
          <input
            type="number"
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            style={getFieldStyles(isFieldModified('cngPrice'))}
            min="0"
            step="0.01"
            value={fuelPrices.cngPrice}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              if (newValue !== DEFAULT_VALUES.cngPrice) {
                markFieldAsModified('cngPrice');
              }
              updateFuelPrices({ 
                ...fuelPrices, 
                cngPrice: newValue
              });
            }}
            data-testid="input-cng-price"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 text-gray-500 dark:text-gray-400 cursor-help">
                  <Info size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>CNG price per gasoline gallon equivalent (GGE)</p>
                <p className="text-xs text-gray-400 mt-1">Note: Electricity costs are included in this price</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* CNG Tax Credit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          CNG Tax Credit Per Gallon ($/GGE)
        </label>
        <div className="flex items-center">
          <input
            type="number"
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            style={getFieldStyles(isFieldModified('cngTaxCredit'))}
            min="0"
            step="0.01"
            value={fuelPrices.cngTaxCredit}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              if (newValue !== DEFAULT_VALUES.cngTaxCredit) {
                markFieldAsModified('cngTaxCredit');
              }
              updateFuelPrices({ 
                ...fuelPrices, 
                cngTaxCredit: newValue
              });
            }}
            data-testid="input-cng-tax-credit"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 text-gray-500 dark:text-gray-400 cursor-help">
                  <Info size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tax credit or rebate per gallon of CNG used</p>
                <p className="text-xs text-gray-400 mt-1">This amount is subtracted from the CNG price in all calculations</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Annual Fuel Price Increase */}
      <div className="border-t pt-3 mt-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Annual Fuel Price Increase (%)
        </label>
        <div className="flex items-center">
          <input
            type="number"
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            style={getFieldStyles(isFieldModified('annualIncrease'))}
            min="0"
            max="20"
            step="0.1"
            value={fuelPrices.annualIncrease}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              if (newValue !== DEFAULT_VALUES.annualIncrease) {
                markFieldAsModified('annualIncrease');
              }
              updateFuelPrices({ 
                ...fuelPrices, 
                annualIncrease: newValue
              });
            }}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 text-gray-500 dark:text-gray-400 cursor-help">
                  <Info size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated annual percentage increase in fuel prices</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Gasoline-to-CNG Conversion Factor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Gasoline-to-CNG Conversion Factor (per GGE)
        </label>
        <div className="flex items-center">
          <input
            type="number"
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            style={getFieldStyles(isFieldModified('gasolineToCngConversionFactor'))}
            min="0"
            step="0.01"
            value={fuelPrices.gasolineToCngConversionFactor}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              if (newValue !== DEFAULT_VALUES.gasolineToCngConversionFactor) {
                markFieldAsModified('gasolineToCngConversionFactor');
              }
              updateFuelPrices({ 
                ...fuelPrices, 
                gasolineToCngConversionFactor: newValue
              });
            }}
            data-testid="input-gasoline-cng-conversion"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 text-gray-500 dark:text-gray-400 cursor-help">
                  <Info size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Conversion factor for gasoline to CNG equivalency</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Diesel-to-CNG Conversion Factor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Diesel-to-CNG Conversion Factor (per GGE)
        </label>
        <div className="flex items-center">
          <input
            type="number"
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            style={getFieldStyles(isFieldModified('dieselToCngConversionFactor'))}
            min="0"
            step="0.01"
            value={fuelPrices.dieselToCngConversionFactor}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              if (newValue !== DEFAULT_VALUES.dieselToCngConversionFactor) {
                markFieldAsModified('dieselToCngConversionFactor');
              }
              updateFuelPrices({ 
                ...fuelPrices, 
                dieselToCngConversionFactor: newValue
              });
            }}
            data-testid="input-diesel-cng-conversion"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 text-gray-500 dark:text-gray-400 cursor-help">
                  <Info size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Conversion factor for diesel to CNG equivalency</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Fuel Price Comparison */}
      <div className="border-t pt-3 mt-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fuel Price Comparison</h3>
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>CNG Savings vs. Gasoline</span>
            <span className="font-medium text-green-600 dark:text-green-400">{cngVsGasolineSavings}%</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>CNG Savings vs. Diesel</span>
            <span className="font-medium text-green-600 dark:text-green-400">{cngVsDieselSavings}%</span>
          </div>
        </div>
      </div>

      {/* RNG Feedstock Selection */}
      <div className="border-t pt-3 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <Leaf size={16} className="text-green-600 dark:text-green-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Renewable Natural Gas (RNG)</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-gray-500 dark:text-gray-400 cursor-help">
                  <Info size={14} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Select an RNG feedstock type to model additional CO₂ emissions reductions. RNG from certain feedstocks (like dairy/swine manure) can be carbon-negative, significantly increasing your emissions savings.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <select
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
          value={rngFeedstockType}
          onChange={(e) => updateRngFeedstockType(e.target.value as RngFeedstockType)}
          data-testid="select-rng-feedstock"
        >
          {(Object.keys(RNG_FEEDSTOCK_LABELS) as RngFeedstockType[]).map((key) => (
            <option key={key} value={key}>
              {RNG_FEEDSTOCK_LABELS[key]}
            </option>
          ))}
        </select>
        
        {/* RNG Carbon Intensity Display */}
        {rngFeedstockType !== 'none' && (
          <div className="mt-2 bg-green-50 dark:bg-green-900/20 p-2 rounded">
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-700 dark:text-green-300">Carbon Intensity</span>
              <span className={`font-medium ${RNG_CI_VALUES[rngFeedstockType] < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {RNG_CI_VALUES[rngFeedstockType]} g CO₂e/MJ
                {RNG_CI_VALUES[rngFeedstockType] < 0 && ' (Carbon Negative)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-green-700 dark:text-green-300">vs Fossil CNG ({RNG_CI_VALUES.fossil_cng} g)</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {Math.round((1 - RNG_CI_VALUES[rngFeedstockType] / RNG_CI_VALUES.fossil_cng) * 100)}% reduction
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
