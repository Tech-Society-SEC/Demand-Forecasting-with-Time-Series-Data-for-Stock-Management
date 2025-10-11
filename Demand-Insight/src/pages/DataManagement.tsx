import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Database, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function DataManagement() {
  const handleFileUpload = () => {
    toast.success("File upload simulated successfully");
  };

  const handleRefreshData = () => {
    toast.info("Data refresh initiated");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Management</h1>
        <p className="text-muted-foreground mt-1">Upload and manage your historical sales data</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Historical Data</CardTitle>
          <CardDescription>Import CSV files with sales history, promotions, and external factors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Upload your data files</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: CSV, Excel (.xlsx). Maximum file size: 50MB
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleFileUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Select Files
              </Button>
              <Button variant="outline">View Template</Button>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-foreground mb-3">Required Data Fields:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Date</p>
                  <p className="text-xs text-muted-foreground">Transaction date (YYYY-MM-DD)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">SKU ID</p>
                  <p className="text-xs text-muted-foreground">Product identifier</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Quantity</p>
                  <p className="text-xs text-muted-foreground">Units sold</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Price (Optional)</p>
                  <p className="text-xs text-muted-foreground">Unit price at sale time</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Data Sources</CardTitle>
          <CardDescription>Monitor your integrated data pipelines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Internal Sales Database</p>
                  <p className="text-sm text-muted-foreground">Last synced: 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-success">Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-foreground">External Market Data</p>
                  <p className="text-sm text-muted-foreground">Last synced: 1 day ago</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium text-warning">Syncing</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground">CSV Upload History</p>
                  <p className="text-sm text-muted-foreground">15 files uploaded this month</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Upload History</CardTitle>
          <CardDescription>Track your data imports and processing status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "sales_data_2024_Q4.csv", date: "2024-03-15", records: "45,230", status: "success" },
              { name: "promotions_march.xlsx", date: "2024-03-14", records: "1,250", status: "success" },
              { name: "inventory_snapshot.csv", date: "2024-03-13", records: "3,420", status: "success" },
            ].map((upload, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium text-sm text-foreground">{upload.name}</p>
                  <p className="text-xs text-muted-foreground">{upload.records} records processed</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{upload.date}</p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">Completed</span>
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
