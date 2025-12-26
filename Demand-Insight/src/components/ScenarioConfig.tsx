import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardState, ScenarioType, ProductMetrics } from '@/types/inventory';

interface ScenarioConfigProps {
  state: DashboardState;
  forecastHorizon: number;
  selectedScenario: ScenarioType;
  onHorizonChange: (value: number) => void;
  onScenarioChange: (value: ScenarioType) => void;
  onGenerate: () => void;
  metrics: ProductMetrics[];
}

export const ScenarioConfig = ({ 
  state, 
  forecastHorizon, 
  selectedScenario,
  onHorizonChange,
  onScenarioChange,
  onGenerate,
  metrics
}: ScenarioConfigProps) => {
  const canGenerate = state === "trained" || state === "results";
  const isGenerating = state === "forecasting";
  
  const totalDemand = metrics.reduce((sum, m) => sum + m.predicted_demand, 0);
  const avgConfidence = metrics.length > 0
    ? (metrics.reduce((sum, m) => sum + m.confidence, 0) / metrics.length) * 100
    : 0;

  return (
    <Card className="p-6 border-border shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Forecasting & Scenario Configuration</h2>
      
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <Label htmlFor="horizon" className="text-sm">Forecast Horizon (Days)</Label>
          <Input
            id="horizon"
            type="number"
            value={forecastHorizon}
            onChange={(e) => onHorizonChange(parseInt(e.target.value) || 20)}
            min={1}
            max={90}
            className="mt-1"
          />
        </div>
        
        <div className="col-span-2">
          <Label htmlFor="scenario" className="text-sm">Scenario</Label>
          <Select value={selectedScenario} onValueChange={(v) => onScenarioChange(v as ScenarioType)}>
            <SelectTrigger id="scenario" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baseline">Baseline (Business as usual)</SelectItem>
              <SelectItem value="discount">Discount Boost (+10%)</SelectItem>
              <SelectItem value="price_cut">Price Cut (-5%)</SelectItem>
              <SelectItem value="holiday">Holiday Promo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <Button 
            onClick={onGenerate} 
            disabled={!canGenerate}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Generate Forecast
              </>
            )}
          </Button>
        </div>
      </div>
      
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Predicted Demand</p>
            <p className="text-2xl font-bold">{totalDemand.toLocaleString()} units</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Average Model Confidence</p>
            <p className="text-2xl font-bold success-text">{avgConfidence.toFixed(1)}%</p>
          </div>
        </div>
      )}
    </Card>
  );
};
