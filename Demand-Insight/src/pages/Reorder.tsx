import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockRecommendations } from "@/lib/mockData";
import { CheckCircle, XCircle, AlertTriangle, Package, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Reorder() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const activeRecommendations = mockRecommendations.filter((rec) => !dismissedIds.has(rec.skuId));

  const handleAcknowledge = (skuId: string, skuName: string) => {
    setDismissedIds((prev) => new Set([...prev, skuId]));
    toast.success(`Reorder acknowledged for ${skuName}`);
  };

  const handleDismiss = (skuId: string, skuName: string) => {
    setDismissedIds((prev) => new Set([...prev, skuId]));
    toast.info(`Recommendation dismissed for ${skuName}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reorder Recommendations</h1>
        <p className="text-muted-foreground mt-1">Review and action prioritized reorder suggestions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activeRecommendations.filter((r) => r.priority === "high").length}
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
              {activeRecommendations.filter((r) => r.priority === "medium").length}
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
              {activeRecommendations.reduce((acc, r) => acc + r.recommendedOrder, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all SKUs</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Recommendations ({activeRecommendations.length})</CardTitle>
          <CardDescription>Sorted by priority and estimated stockout date</CardDescription>
        </CardHeader>
        <CardContent>
          {activeRecommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-success mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">All recommendations reviewed</h3>
              <p className="text-muted-foreground">Great job! No pending reorder actions at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
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
