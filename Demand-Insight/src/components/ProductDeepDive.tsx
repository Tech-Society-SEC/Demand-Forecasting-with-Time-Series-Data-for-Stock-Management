import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProductMetrics, InventoryRecord, ForecastDataPoint } from '@/types/inventory';
import { useMemo } from 'react';

interface ProductDeepDiveProps {
  products: string[];
  selectedProduct: string | null;
  onProductChange: (product: string) => void;
  metrics: ProductMetrics[];
  data: InventoryRecord[];
  forecastHorizon: number;
}

export const ProductDeepDive = ({ 
  products, 
  selectedProduct, 
  onProductChange, 
  metrics,
  data,
  forecastHorizon 
}: ProductDeepDiveProps) => {
  const currentMetric = useMemo(() => 
    metrics.find(m => m.product_id === selectedProduct),
    [metrics, selectedProduct]
  );

  const chartData = useMemo<ForecastDataPoint[]>(() => {
    if (!selectedProduct || !data.length) return [];
    
    // Get historical data for this product (aggregate across stores)
    const productData = data
      .filter(r => r.Product_ID === selectedProduct)
      .reduce((acc, r) => {
        const existing = acc.find(d => d.date === r.Date);
        if (existing) {
          existing.historical! += r.Units_Sold;
        } else {
          acc.push({ date: r.Date, historical: r.Units_Sold });
        }
        return acc;
      }, [] as ForecastDataPoint[])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
    
    // Generate forecast points
    if (currentMetric && productData.length > 0) {
      const lastDate = new Date(productData[productData.length - 1].date);
      const avgHistorical = currentMetric.predicted_demand / forecastHorizon;
      
      for (let i = 1; i <= forecastHorizon; i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(lastDate.getDate() + i);
        
        // Add some variability to forecast
        const variance = 0.9 + Math.random() * 0.2;
        productData.push({
          date: forecastDate.toISOString().split('T')[0],
          forecast: Math.round(avgHistorical * variance)
        });
      }
    }
    
    return productData;
  }, [selectedProduct, data, currentMetric, forecastHorizon]);

  if (!selectedProduct || !currentMetric) {
    return (
      <Card className="p-6 border-border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Product-Level Deep Dive</h2>
        <p className="text-muted-foreground text-center py-12">
          Train models and select a product to view detailed forecasts
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Product-Level Deep Dive</h2>
        <div className="w-64">
          <Label htmlFor="product-select" className="text-sm mb-1 block">Select Product</Label>
          <Select value={selectedProduct} onValueChange={onProductChange}>
            <SelectTrigger id="product-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {products.map(p => (
                // FIX: Ensure key and value are valid strings to prevent warnings
                <SelectItem key={p || 'unknown'} value={p || 'unknown'}>{p || 'Unknown Product'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="historical" 
                stroke="hsl(var(--chart-historical))" 
                strokeWidth={2}
                dot={false}
                name="Historical Sales"
              />
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="hsl(var(--chart-forecast))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Forecast"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Demand Drivers</p>
            <div className="flex flex-wrap gap-2">
              {currentMetric.drivers.length > 0 ? (
                currentMetric.drivers.map((driver, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {driver}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-xs">No drivers identified</Badge>
              )}
            </div>
          </div>

          {currentMetric.guardrail_triggered && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Price Elasticity Ignored – Model guardrail triggered due to illogical coefficients
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-xs font-semibold text-primary mb-2">Strategic Recommendation</p>
            <p className="text-sm">{currentMetric.recommendation}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Predicted Demand</p>
              <p className="text-lg font-bold">{currentMetric.predicted_demand.toLocaleString()}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Confidence</p>
              <p className="text-lg font-bold success-text">{(currentMetric.confidence * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};