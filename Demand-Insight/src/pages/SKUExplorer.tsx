import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { mockSKUs } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function SKUExplorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const navigate = useNavigate();

  const filteredSKUs = mockSKUs.filter((sku) => {
    const matchesSearch =
      sku.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sku.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || sku.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(mockSKUs.map((sku) => sku.category)))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">SKU Explorer</h1>
        <p className="text-muted-foreground mt-1">Search and analyze individual product forecasts</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Narrow down your SKU search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by SKU ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredSKUs.length} SKU{filteredSKUs.length !== 1 ? "s" : ""} Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {filteredSKUs.map((sku) => (
              <div
                key={sku.id}
                onClick={() => navigate(`/sku/${sku.id}`)}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">{sku.name}</h3>
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
                    <Badge variant="secondary">{sku.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{sku.id}</p>
                </div>
                <div className="flex items-center gap-8 text-right">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Stock</p>
                    <p className="text-lg font-semibold text-foreground">{sku.currentStock}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reorder Point</p>
                    <p className="text-lg font-semibold text-foreground">{sku.reorderPoint}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-lg font-semibold text-primary">{sku.forecastAccuracy.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
