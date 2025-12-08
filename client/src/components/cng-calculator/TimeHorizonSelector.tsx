import { useCalculator } from "@/contexts/CalculatorContext";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TimeHorizonSelector() {
  const { timeHorizon, updateTimeHorizon } = useCalculator();
  
  return (
    <div className="bg-white dark:bg-gray-700 rounded-md p-3">
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <Label className="text-sm font-medium text-gray-700">Time Horizon</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-gray-500 cursor-help">
                  <Info size={16} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select the analysis period (10 or 15 years) for your fleet conversion</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select 
          value={timeHorizon.toString()} 
          onValueChange={(value) => updateTimeHorizon(parseInt(value))}
        >
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="Select time horizon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 Years</SelectItem>
            <SelectItem value="15">15 Years</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}