import { useState, useEffect } from "react"; // MODIFIED
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
// import { mockRecommendations } from "@/lib/mockData"; // <-- 1. REMOVED MOCK DATA
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Calendar,
  BrainCircuit, // For our test card
  Loader2, // ADDED for loading state
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 2. ADDED A TYPE for our new recommendation data
// This should match the JSON from mockData.ts and our new Python API
interface Recommendation {
  skuId: string;
  skuName: string;
  currentStock: number;
  reorderPoint: number;
  recommendedOrder: number;
  leadTime: number;
  priority: "high" | "medium" | "low";
  estimatedStockoutDate?: string;
}

export default function Reorder() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // --- API Test Card State ---
  const [apiResult, setApiResult] = useState<any>(null);
  const [isApiTestLoading, setIsApiTestLoading] = useState(false);
  const [productId, setProductId] = useState("P0001");
  const [storeId, setStoreId] = useState("S001");
  const [leadTime, setLeadTime] = useState("7");

  // --- 3. ADDED NEW STATE for REAL data ---
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ------------------------------------------

  // --- 4. ADDED useEffect to fetch REAL data on page load ---
  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsPageLoading(true);
      setError(null);
      try {
        // Call our new Python endpoint
        const response = await fetch("http://127.0.0.1:5000/api/all_recommendations");
        if (!response.ok) {
          throw new Error("Failed to fetch recommendations from the backend.");
        }
        const data: Recommendation[] = await response.json();
        setRecommendations(data);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchRecommendations();
  }, []); // The empty array [] means this runs once when the page loads
  // ---------------------------------------------------------

  // 5. MODIFIED activeRecommendations to use REAL state
  const activeRecommendations = recommendations.filter((rec) => !dismissedIds.has(rec.skuId));

  const handleAcknowledge = (skuId: string, skuName: string) => {
    setDismissedIds((prev) => new Set([...prev, skuId]));
    toast.success(`Reorder acknowledged for ${skuName}`);
  };

  const handleDismiss = (skuId: string, skuName: string) => {
    setDismissedIds((prev) => new Set([...prev, skuId]));
    toast.info(`Recommendation dismissed for ${skuName}`);
  };

  // --- API Test Card Function (no change) ---
  const handleCalculateRop = async () => {
    setIsApiTestLoading(true);
    setApiResult(null);
    try {
      const url = `http://127.0.0.1:5000/api/calculate_rop?product_id=${productId}&store_id=${storeId}&lead_time=${leadTime}`;
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "API request failed");
      }
      const data = await response.json();
      setApiResult(data);
      toast.success(`Successfully calculated ROP for ${productId}`);
    } catch (error: any) {
      console.error("Error fetching ROP:", error);
      setApiResult({ error: error.message });
      toast.error(error.message);
    } finally {
      setIsApiTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reorder Recommendations</h1>
        <p className="text-muted-foreground mt-1">
          Review and action prioritized reorder suggestions
        </p>
      </div>

      {/* Summary Cards (now use real data) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {/* 6. This now counts REAL data */}
              {isPageLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                activeRecommendations.filter((r) => r.priority === "high").length
              )}
            </div>
            <p className="text-xs text-muted-foreground">Critical reorders needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            <Package className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isPageLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                activeRecommendations.filter((r) => r.priority === "medium").length
              )}
            </div>
            <p className="text-xs text-muted-foreground">Approaching reorder point</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recommended Units</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isPageLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                activeRecommendations.reduce((acc, r) => acc + r.recommendedOrder, 0).toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">Across all SKUs</p>
          </CardContent>
        </Card>
      </div>

      {/* --- API Test Card (no change, still good for testing) --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" />
            Live API Test: ROP Calculator
          </CardTitle>
          <CardDescription>
            Use this to test the connection to your live Python backend (http://127.0.0.1:5000)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="prodId" className="text-sm font-medium">Product ID</label>
              <Input id="prodId" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="e.g., P0001" />
            </div>
            <div className="space-y-1">
              <label htmlFor="storeId" className="text-sm font-medium">Store ID</label>
              <Input id="storeId" value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="e.g., S001" />
            </div>
            <div className="space-y-1">
              <label htmlFor="leadTime" className="text-sm font-medium">Lead Time (days)</label>
              <Input id="leadTime" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="e.g., 7" />
            </div>
          </div>
          <Button onClick={handleCalculateRop} disabled={isApiTestLoading}>
            {isApiTestLoading ? "Calculating..." : "Calculate ROP"}
          </Button>

          {apiResult && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">API Response:</h4>
              <pre className="text-sm overflow-x-auto">{JSON.stringify(apiResult, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations List (now shows REAL data) */}
      <Card>
        <CardHeader>
          <CardTitle>Active Recommendations ({activeRecommendations.length})</CardTitle>
          <CardDescription>Sorted by priority and (now loaded from your live backend)</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 7. ADDED Loading and Error states */}
          {isPageLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Loading Recommendations...</h3>
              <p className="text-muted-foreground">Connecting to the Python backend...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold text-destructive mb-2">Connection Error</h3>
              <p className="text-muted-foreground">Could not load data: {error}</p>
              <p className="text-muted-foreground mt-2">
                Please make sure your Python backend is running at `http://127.0.0.1:5000`.
              </p>
            </div>
          ) : activeRecommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-success mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">All recommendations reviewed</h3>
              <p className="text-muted-foreground">Great job! No pending reorder actions at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 8. This .map() now uses REAL data */}
              {activeRecommendations.map((rec) => (
                <div
                  key={rec.skuId}
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    rec.priority === "high" && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-foreground">{rec.skuName}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            rec.priority === "high" && "border-destructive text-destructive bg-destructive/10",
                            rec.priority === "medium" && "border-warning text-warning bg-warning/10",
                            rec.priority === "low" && "border-muted-foreground text-muted-foreground"
                          )}
                        >
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rec.skuId}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
                          <p className="text-base font-semibold text-foreground">{rec.currentStock} units</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Reorder Point</p>
                          <p className="text-base font-semibold text-foreground">{rec.reorderPoint} units</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Recommended Order</p>
                          <p className="text-base font-semibold text-primary">{rec.recommendedOrder} units</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Lead Time</p>
                          <p className="text-base font-semibold text-foreground">{rec.leadTime} days</p>
                        </div>
                      </div>

                      {rec.estimatedStockoutDate && (
                        <div className="flex items-center gap-2 text-sm text-destructive mb-3">
                          <Calendar className="h-4 w-4" />
                          <span>Estimated stockout: {new Date(rec.estimatedStockoutDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm" onClick={() => handleAcknowledge(rec.skuId, rec.skuName)} className="whitespace-nowrap">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDismiss(rec.skuId, rec.skuName)}
                        className="whitespace-nowrap"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}