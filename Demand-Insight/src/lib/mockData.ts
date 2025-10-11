export interface SKUData {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  forecastAccuracy: number;
  status: "healthy" | "warning" | "critical";
  lastUpdated: string;
}

export interface ForecastPoint {
  date: string;
  actual: number;
  forecast: number;
  upperBound: number;
  lowerBound: number;
}

export interface ReorderRecommendation {
  skuId: string;
  skuName: string;
  currentStock: number;
  reorderPoint: number;
  recommendedOrder: number;
  leadTime: number;
  priority: "high" | "medium" | "low";
  estimatedStockoutDate?: string;
}

// Generate mock SKU data
export const mockSKUs: SKUData[] = Array.from({ length: 50 }, (_, i) => {
  const stockLevel = Math.random();
  let status: "healthy" | "warning" | "critical" = "healthy";
  if (stockLevel < 0.3) status = "critical";
  else if (stockLevel < 0.6) status = "warning";

  return {
    id: `SKU-${String(i + 1).padStart(4, "0")}`,
    name: `Product ${i + 1}`,
    category: ["Electronics", "Apparel", "Food", "Furniture", "Sports"][Math.floor(Math.random() * 5)],
    currentStock: Math.floor(Math.random() * 1000),
    reorderPoint: Math.floor(Math.random() * 300) + 100,
    forecastAccuracy: 75 + Math.random() * 20,
    status,
    lastUpdated: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  };
});

// Generate forecast data for a single SKU
export function generateForecastData(skuId: string): ForecastPoint[] {
  const data: ForecastPoint[] = [];
  const baseValue = 100 + Math.random() * 200;
  const trend = Math.random() * 2 - 1;
  const seasonality = Math.random() * 50;

  for (let i = 0; i < 90; i++) {
    const date = new Date();
    date.setDate(date.getDate() - 90 + i);
    
    const seasonal = Math.sin((i / 7) * Math.PI) * seasonality;
    const noise = (Math.random() - 0.5) * 20;
    const trendValue = trend * i;
    
    const forecast = baseValue + seasonal + trendValue;
    const actual = i < 60 ? forecast + noise : 0; // Only have actuals for past data
    
    data.push({
      date: date.toISOString().split("T")[0],
      actual: actual > 0 ? Math.round(actual) : 0,
      forecast: Math.round(forecast),
      upperBound: Math.round(forecast * 1.15),
      lowerBound: Math.round(forecast * 0.85),
    });
  }

  return data;
}

// Generate reorder recommendations
export const mockRecommendations: ReorderRecommendation[] = mockSKUs
  .filter((sku) => sku.status !== "healthy")
  .slice(0, 15)
  .map((sku): ReorderRecommendation => ({
    skuId: sku.id,
    skuName: sku.name,
    currentStock: sku.currentStock,
    reorderPoint: sku.reorderPoint,
    recommendedOrder: Math.floor(Math.random() * 500) + 200,
    leadTime: Math.floor(Math.random() * 14) + 3,
    priority: (sku.status === "critical" ? "high" : sku.status === "warning" ? "medium" : "low") as "high" | "medium" | "low",
    estimatedStockoutDate:
      sku.status === "critical"
        ? new Date(Date.now() + Math.random() * 7 * 86400000).toISOString().split("T")[0]
        : undefined,
  }))
  .sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

// Generate aggregated forecast vs actuals data
export function generateAggregatedForecast(): ForecastPoint[] {
  const data: ForecastPoint[] = [];
  const baseValue = 5000;

  for (let i = 0; i < 90; i++) {
    const date = new Date();
    date.setDate(date.getDate() - 90 + i);
    
    const seasonal = Math.sin((i / 7) * Math.PI) * 800;
    const trend = i * 10;
    const noise = (Math.random() - 0.5) * 300;
    
    const forecast = baseValue + seasonal + trend;
    const actual = i < 60 ? forecast + noise : 0;
    
    data.push({
      date: date.toISOString().split("T")[0],
      actual: actual > 0 ? Math.round(actual) : 0,
      forecast: Math.round(forecast),
      upperBound: Math.round(forecast * 1.1),
      lowerBound: Math.round(forecast * 0.9),
    });
  }

  return data;
}
