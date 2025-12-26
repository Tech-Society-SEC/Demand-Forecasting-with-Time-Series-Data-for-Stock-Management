export interface InventoryRecord {
  Date: string;
  Store_ID: string;
  Product_ID: string;
  Category: string;
  Region: string;
  Inventory_Level: number;
  Units_Sold: number;
  Units_Ordered: number;
  Demand_Forecast: number;
  Price: number;
  Discount: number;
  Weather_Condition: string;
  Holiday_Promotion: number;
  Competitor_Pricing: number;
  Seasonality: string;
}

export interface DataSummary {
  totalRecords: number;
  uniqueProducts: number;
  dateRange: {
    min: string;
    max: string;
  };
}

export interface ProductMetrics {
  product_id: string;
  success_rate: number;
  wmape: number;
  guardrail_triggered: boolean;
  drivers: string[];
  recommendation: string;
  predicted_demand: number;
  confidence: number;
}

export interface ForecastDataPoint {
  date: string;
  historical?: number;
  forecast?: number;
}

// NEW: Define what a "Save Point" looks like
export interface DashboardSnapshot {
  state: DashboardState;
  data: InventoryRecord[];
  dataSummary: DataSummary | null;
  productMetrics: ProductMetrics[];
  forecastHorizon: number;
  selectedScenario: ScenarioType;
}

export interface HistoryItem {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  status: 'success' | 'error' | 'info';
  snapshot?: DashboardSnapshot; // Optional snapshot of data
}

export type DashboardState = "idle" | "loading" | "training" | "trained" | "forecasting" | "results";
export type ScenarioType = "baseline" | "discount" | "price_cut" | "holiday";