import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, TrendingUp, Package, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { mockSKUs, generateForecastData } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function SKUDetail() {
  const { skuId } = useParams();
  const navigate = useNavigate();
  const sku = mockSKUs.find((s) => s.id === skuId);

  if (!sku) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">SKU Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested SKU could not be found.</p>
          <Button onClick={() => navigate("/sku-explorer")}>Back to Explorer</Button>
        </div>
      </div>
    );
  }

  const forecastData = generateForecastData(sku.id);
  const historicalData = forecastData.slice(0, 60);
  const futureData = forecastData.slice(60);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/sku-explorer")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{sku.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">{sku.id}</p>
              <Badge variant="secondary">{sku.category}</Badge>
              <Badge
                variant="outline"
                className={cn(
                  sku.status === "healthy" && "border-success text-success",
                  sku.status === "warning" && "border-warning text-warning",
                  sku.status === "critical" && "border-destructive text-destructive"
                )}
              >
                {sku.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{sku.currentStock}</div>
            <p className="text-xs text-muted-foreground">units in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reorder Point</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{sku.reorderPoint}</div>
            <p className="text-xs text-muted-foreground">trigger threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{sku.forecastAccuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">MAPE score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {new Date(sku.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(sku.lastUpdated).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Sales & Demand Forecast</CardTitle>
          <CardDescription>60 days of historical data and 30-day forecast with confidence intervals</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
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
                labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="hsl(var(--primary))"
                fill="url(#colorConfidence)"
                strokeWidth={1}
                name="Upper Confidence (85%)"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="hsl(var(--primary))"
                fill="url(#colorConfidence)"
                strokeWidth={1}
                name="Lower Confidence (85%)"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--success))", r: 2 }}
                name="Actual Sales"
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

      {/* Forecast Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Insights</CardTitle>
          <CardDescription>Key observations from the demand forecast model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium text-foreground">30-Day Forecast Summary</p>
                <p className="text-sm text-muted-foreground">
                  Expected demand: {futureData.reduce((acc, d) => acc + d.forecast, 0)} units over next 30 days
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-success mt-2" />
              <div>
                <p className="font-medium text-foreground">Confidence Level</p>
                <p className="text-sm text-muted-foreground">
                  85% confidence interval shown. Actual demand expected to fall within the shaded region.
                </p>
              </div>
            </div>
            {sku.status !== "healthy" && (
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-destructive mt-2" />
                <div>
                  <p className="font-medium text-foreground">Reorder Alert</p>
                  <p className="text-sm text-muted-foreground">
                    Current stock ({sku.currentStock} units) is {sku.status === "critical" ? "below" : "approaching"} the
                    reorder point ({sku.reorderPoint} units). Consider placing an order soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
