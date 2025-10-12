import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { generateAggregatedForecast, mockRecommendations, mockSKUs } from "@/lib/mockData";

export default function Dashboard() {
  const forecastData = generateAggregatedForecast();
  const recentData = forecastData.slice(-30);

  const criticalSKUs = mockSKUs.filter((sku) => sku.status === "critical").length;
  const warningSKUs = mockSKUs.filter((sku) => sku.status === "warning").length;
  const totalInventoryValue = mockSKUs.reduce((acc, sku) => acc + sku.currentStock, 0);
  const avgForecastAccuracy = (
    mockSKUs.reduce((acc, sku) => acc + sku.forecastAccuracy, 0) / mockSKUs.length
  ).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your demand forecasting and inventory status</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Forecast Accuracy (MAPE)"
          value={`${avgForecastAccuracy}%`}
          change="+2.3% from last month"
          changeType="positive"
          icon={TrendingUp}
        />
        <KPICard
          title="Total Inventory Units"
          value={totalInventoryValue.toLocaleString()}
          change="-5% from last week"
          changeType="negative"
          icon={Package}
        />
        <KPICard
          title="Critical Stockouts"
          value={criticalSKUs.toString()}
          description={`${warningSKUs} items in warning zone`}
          icon={AlertTriangle}
          changeType="negative"
        />
        <KPICard
          title="Reorder Actions Needed"
          value={mockRecommendations.length.toString()}
          description="Recommended actions pending"
          icon={CheckCircle}
        />
      </div>

      {/* Forecast vs Actuals Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast vs Actual Demand (Last 30 Days)</CardTitle>
          <CardDescription>Aggregated demand across all SKUs with confidence intervals</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={recentData}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="upperBound"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="url(#colorForecast)"
                fillOpacity={0.2}
                name="Upper Confidence"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stackId="2"
                stroke="hsl(var(--primary))"
                fill="url(#colorForecast)"
                fillOpacity={0.2}
                name="Lower Confidence"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
                name="Actual Demand"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Critical Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSKUs
                .filter((sku) => sku.status === "critical")
                .slice(0, 5)
                .map((sku) => (
                  <div key={sku.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{sku.name}</p>
                      <p className="text-xs text-muted-foreground">{sku.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-destructive">{sku.currentStock} units</p>
                      <p className="text-xs text-muted-foreground">Below {sku.reorderPoint}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-warning" />
              Top Reorder Priorities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockRecommendations.slice(0, 5).map((rec) => (
                <div key={rec.skuId} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{rec.skuName}</p>
                    <p className="text-xs text-muted-foreground">{rec.skuId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{rec.recommendedOrder} units</p>
                    <p className="text-xs text-muted-foreground">{rec.leadTime} days lead time</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
