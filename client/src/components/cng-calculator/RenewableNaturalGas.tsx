import { useCalculator } from "@/contexts/CalculatorContext";
import { Info, Leaf } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RngFeedstockType, RNG_FEEDSTOCK_LABELS, RNG_CI_VALUES } from "@/types/calculator";

export default function RenewableNaturalGas() {
  const { 
    rngFeedstockType,
    updateRngFeedstockType,
    customCiValue,
    updateCustomCiValue
  } = useCalculator();

  const getCiValue = () => {
    if (rngFeedstockType === 'custom') return customCiValue;
    if (rngFeedstockType === 'none') return RNG_CI_VALUES.fossil_cng;
    return RNG_CI_VALUES[rngFeedstockType as keyof typeof RNG_CI_VALUES];
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-md p-3 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Leaf size={16} className="text-green-600 dark:text-green-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">RNG Feedstock Type</span>
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
      
      {rngFeedstockType === 'custom' && (
        <div className="mt-2">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom CI Value (g CO₂e/MJ)
          </label>
          <input
            type="number"
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
            value={customCiValue}
            onChange={(e) => updateCustomCiValue(parseFloat(e.target.value) || 0)}
            step="1"
            data-testid="input-custom-ci-value"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Fossil CNG: {RNG_CI_VALUES.fossil_cng} g. Use negative values for carbon-negative fuels.
          </p>
        </div>
      )}
      
      {rngFeedstockType !== 'none' && (
        <div className="mt-2 bg-green-50 dark:bg-green-900/20 p-2 rounded">
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-700 dark:text-green-300">Carbon Intensity</span>
            <span className={`font-medium ${getCiValue() < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {getCiValue()} g CO₂e/MJ
              {getCiValue() < 0 && ' (Carbon Negative)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-green-700 dark:text-green-300">vs Fossil CNG ({RNG_CI_VALUES.fossil_cng} g)</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {Math.round((1 - getCiValue() / RNG_CI_VALUES.fossil_cng) * 100)}% reduction
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
