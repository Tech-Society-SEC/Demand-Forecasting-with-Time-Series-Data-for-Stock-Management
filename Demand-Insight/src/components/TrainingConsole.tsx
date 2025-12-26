import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DashboardState, ProductMetrics } from '@/types/inventory';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TrainingConsoleProps {
  state: DashboardState;
  logs: string[];
  onTrain: () => void;
  metrics: ProductMetrics[];
}

export const TrainingConsole = ({ state, logs, onTrain, metrics }: TrainingConsoleProps) => {
  const canTrain = state === "idle" || state === "trained";
  const isTraining = state === "training";
  
  const avgSuccessRate = metrics.length > 0 
    ? (metrics.reduce((sum, m) => sum + m.success_rate, 0) / metrics.length) * 100
    : 0;
    
  const avgWMAPE = metrics.length > 0
    ? (metrics.reduce((sum, m) => sum + m.wmape, 0) / metrics.length) * 100
    : 0;
    
  const guardrailCount = metrics.filter(m => m.guardrail_triggered).length;

  return (
    <Card className="p-6 border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Model Training Control Center</h2>
        <Button 
          onClick={onTrain} 
          disabled={!canTrain}
          className="gap-2"
        >
          {isTraining ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Training...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Train Product Models
            </>
          )}
        </Button>
      </div>
      
      {(isTraining || logs.length > 0) && (
        <ScrollArea className="h-48 console-window rounded-md p-4 mb-4">
          {logs.map((log, i) => (
            <div key={i} className="text-xs mb-1 font-mono">
              {log}
            </div>
          ))}
        </ScrollArea>
      )}
      
      {metrics.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
            <p className="text-2xl font-bold success-text">{avgSuccessRate.toFixed(1)}%</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Average WMAPE</p>
            <p className="text-2xl font-bold">{avgWMAPE.toFixed(2)}%</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Guardrails Triggered</p>
            <p className="text-2xl font-bold text-destructive">{guardrailCount}</p>
          </div>
        </div>
      )}
    </Card>
  );
};
