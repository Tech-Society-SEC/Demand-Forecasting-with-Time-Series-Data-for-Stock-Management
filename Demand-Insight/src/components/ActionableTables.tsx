import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";
import { ProductMetrics } from "@/types/inventory";

interface ActionableTablesProps {
  metrics: ProductMetrics[];
}

export const ActionableTables = ({ metrics }: ActionableTablesProps) => {
  const sortedMetrics = [...metrics].sort((a, b) => b.predicted_demand - a.predicted_demand);
  const lowConfidence = sortedMetrics.filter(m => m.confidence < 0.7);
  const highImpact = sortedMetrics.filter(m => m.predicted_demand > 1000);

  return (
    <div className="space-y-8">
      {/* Low Confidence Table */}
      {lowConfidence.length > 0 && (
        <div className="space-y-3 px-6 pt-6">
          <div className="flex items-center gap-2 text-amber-600">
             <AlertTriangle className="h-5 w-5" />
             <h4 className="font-medium">Needs Attention (Low Confidence)</h4>
          </div>
          <div className="rounded-md border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full min-w-[600px]">
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[20%] pl-6">Product</TableHead>
                    <TableHead className="w-[25%]">Issue</TableHead>
                    <TableHead className="w-[40%]">Action Required</TableHead>
                    <TableHead className="w-[15%] text-right pr-6">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowConfidence.slice(0, 5).map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell className="pl-6 font-medium truncate">{product.product_id}</TableCell>
                      <TableCell>
                        {product.guardrail_triggered ? (
                          <Badge variant="destructive" className="whitespace-nowrap">Price Guardrail</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 whitespace-nowrap">
                            Volatile History
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600 truncate" title={product.recommendation}>
                         {product.recommendation}
                      </TableCell>
                      <TableCell className="text-right pr-6 font-mono">
                        {(product.confidence * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* High Impact Table */}
      <div className="space-y-3">
         <div className="flex items-center gap-2 text-emerald-600 px-6">
            <TrendingUp className="h-5 w-5" />
            <h4 className="font-medium">High Impact Opportunities</h4>
        </div>
        <div className="overflow-x-auto">
          <Table className="table-fixed w-full min-w-[600px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[25%] pl-6">Product</TableHead>
                <TableHead className="w-[25%]">Projected Demand</TableHead>
                <TableHead className="w-[25%]">Primary Driver</TableHead>
                <TableHead className="w-[25%] text-right pr-6">Strategy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highImpact.slice(0, 5).map((product) => (
                <TableRow key={product.product_id}>
                  <TableCell className="pl-6 font-medium flex items-center gap-2 truncate">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {product.product_id}
                  </TableCell>
                  <TableCell className="font-bold text-slate-700 truncate">
                    {product.predicted_demand.toLocaleString()} units
                  </TableCell>
                  <TableCell>
                    {product.drivers[0] ? (
                       <Badge variant="secondary" className="bg-slate-100 text-slate-700 truncate max-w-full">
                         {product.drivers[0]}
                       </Badge>
                    ) : (
                       <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6 text-emerald-700 font-medium truncate">
                    Run Promotion
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};