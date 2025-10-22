import { useState } from 'react';
import { Send, AlertCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCalculator } from '@/contexts/CalculatorContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface NaturalLanguageQueryProps {
  onViewChange?: (view: string) => void;
}

const exampleQueries = [
  "What happens if diesel prices increase by 20%?",
  "Change to 10 light duty and 5 medium duty vehicles",
  "Set CNG price to $1.50 per gallon",
  "Use immediate deployment strategy",
  "Show me a 5 year time horizon",
  "What if gasoline costs $4 per gallon?",
  "Optimize deployment for $2M budget",
  "Compare phased vs aggressive strategies"
];

export function NaturalLanguageQuery({ onViewChange }: NaturalLanguageQueryProps) {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastInsight, setLastInsight] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [showExamples, setShowExamples] = useState(true);
  
  const { 
    vehicleParameters, 
    stationConfig, 
    fuelPrices, 
    deploymentStrategy,
    timeHorizon,
    updateVehicleParameters,
    updateStationConfig,
    updateFuelPrices,
    updateDeploymentStrategy,
    updateTimeHorizon,
    markFieldAsModified
  } = useCalculator();
  
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setLastInsight(null);

    try {
      // Prepare current parameters for the API
      const currentParameters = {
        vehicleParameters,
        stationConfig,
        fuelPrices,
        deploymentStrategy,
        timeHorizon
      };

      // Send query to backend
      const response = await fetch('/api/natural-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          currentParameters
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process query');
      }

      const result = await response.json();
      
      // Apply parameter updates
      if (result.parameterUpdates) {
        const updates = result.parameterUpdates;
        
        // Update vehicle parameters
        const vehicleFields = ['lightDutyCount', 'mediumDutyCount', 'heavyDutyCount', 
          'lightDutyCost', 'mediumDutyCost', 'heavyDutyCost',
          'lightDutyLifespan', 'mediumDutyLifespan', 'heavyDutyLifespan',
          'lightDutyMPG', 'mediumDutyMPG', 'heavyDutyMPG',
          'lightDutyAnnualMiles', 'mediumDutyAnnualMiles', 'heavyDutyAnnualMiles',
          'lightDutyFuelType', 'mediumDutyFuelType', 'heavyDutyFuelType',
          'lightDutyCngEfficiencyLoss', 'mediumDutyCngEfficiencyLoss', 'heavyDutyCngEfficiencyLoss'];
        
        const vehicleUpdates: any = {};
        let hasVehicleUpdates = false;
        
        for (const field of vehicleFields) {
          if (field in updates) {
            vehicleUpdates[field] = updates[field];
            hasVehicleUpdates = true;
            markFieldAsModified(field);
          }
        }
        
        if (hasVehicleUpdates) {
          updateVehicleParameters({ ...vehicleParameters, ...vehicleUpdates });
        }
        
        // Update fuel prices
        const fuelFields = ['gasolinePrice', 'dieselPrice', 'cngPrice', 'cngTaxCredit', 
          'annualIncrease', 'gasolineToCngConversionFactor', 'dieselToCngConversionFactor'];
        
        const fuelUpdates: any = {};
        let hasFuelUpdates = false;
        
        for (const field of fuelFields) {
          if (field in updates) {
            fuelUpdates[field] = updates[field];
            hasFuelUpdates = true;
            markFieldAsModified(field);
          }
        }
        
        if (hasFuelUpdates) {
          updateFuelPrices({ ...fuelPrices, ...fuelUpdates });
        }
        
        // Update station config
        const stationFields = ['stationType', 'businessType', 'turnkey', 'stationMarkup'];
        
        const stationUpdates: any = {};
        let hasStationUpdates = false;
        
        for (const field of stationFields) {
          if (field in updates) {
            stationUpdates[field] = updates[field];
            hasStationUpdates = true;
            markFieldAsModified(field);
          }
        }
        
        if (hasStationUpdates) {
          updateStationConfig({ ...stationConfig, ...stationUpdates });
        }
        
        // Update deployment strategy
        if ('deploymentStrategy' in updates) {
          updateDeploymentStrategy(updates.deploymentStrategy);
          markFieldAsModified('deploymentStrategy');
        }
        
        // Update time horizon
        if ('timeHorizon' in updates) {
          updateTimeHorizon(updates.timeHorizon);
          markFieldAsModified('timeHorizon');
        }
      }
      
      // Show insight
      if (result.insights) {
        setLastInsight(result.insights);
        toast({
          title: "Parameters Updated",
          description: result.insights,
        });
      }
      
      // Switch view if suggested
      if (result.suggestedView && onViewChange) {
        onViewChange(result.suggestedView);
      }
      
      // Add to history
      setQueryHistory(prev => [query, ...prev.slice(0, 4)]);
      setQuery('');
      setShowExamples(false);
      
    } catch (error) {
      console.error('Error processing query:', error);
      toast({
        title: "Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    setShowExamples(false);
  };

  return (
    <div className="w-full space-y-4">
        <div className="space-y-2">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Shaun a question about your CNG conversion analysis..."
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            data-testid="input-natural-query"
          />
          <div className="flex justify-between items-center">
            <Button
              onClick={() => setShowExamples(!showExamples)}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              {showExamples ? 'Hide' : 'Show'} examples
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!query.trim() || isProcessing}
              size="sm"
              data-testid="button-submit-query"
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  Ask
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Example queries */}
        {showExamples && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Try these example questions:</p>
            <div className="flex flex-wrap gap-1">
              {exampleQueries.map((example, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-blue-100"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Last insight */}
        {lastInsight && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {lastInsight}
            </AlertDescription>
          </Alert>
        )}

        {/* Query history */}
        {queryHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Recent queries:</p>
            <div className="space-y-1">
              {queryHistory.map((historyQuery, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-600 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => setQuery(historyQuery)}
                >
                  {historyQuery}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}