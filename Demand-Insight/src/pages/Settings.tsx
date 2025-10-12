import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function Settings() {
  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure system parameters and alert preferences</p>
      </div>

      {/* Forecasting Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Forecasting Parameters</CardTitle>
          <CardDescription>Adjust model settings and forecast horizon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="forecast-horizon">Forecast Horizon (Days)</Label>
              <Input id="forecast-horizon" type="number" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confidence-level">Confidence Level</Label>
              <Select defaultValue="85">
                <SelectTrigger id="confidence-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80">80%</SelectItem>
                  <SelectItem value="85">85%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="95">95%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seasonality">Seasonality Pattern</Label>
              <Select defaultValue="weekly">
                <SelectTrigger id="seasonality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-type">Model Type</Label>
              <Select defaultValue="ensemble">
                <SelectTrigger id="model-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arima">ARIMA</SelectItem>
                  <SelectItem value="prophet">Prophet</SelectItem>
                  <SelectItem value="lstm">LSTM Neural Network</SelectItem>
                  <SelectItem value="ensemble">Ensemble (Recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>Configure reorder points and stock parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-level">Target Service Level (%)</Label>
              <Input id="service-level" type="number" defaultValue="95" min="0" max="100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-lead-time">Default Lead Time (Days)</Label>
              <Input id="default-lead-time" type="number" defaultValue="7" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="safety-stock">Safety Stock Multiplier</Label>
              <Input id="safety-stock" type="number" step="0.1" defaultValue="1.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-period">Review Period (Days)</Label>
              <Input id="review-period" type="number" defaultValue="7" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Preferences</CardTitle>
          <CardDescription>Configure notifications and warning thresholds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-alerts">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email alerts for critical events</p>
            </div>
            <Switch id="email-alerts" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="stockout-alerts">Stockout Warnings</Label>
              <p className="text-sm text-muted-foreground">Alert when SKU approaches stockout</p>
            </div>
            <Switch id="stockout-alerts" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="accuracy-alerts">Accuracy Degradation</Label>
              <p className="text-sm text-muted-foreground">Notify when forecast accuracy drops</p>
            </div>
            <Switch id="accuracy-alerts" defaultChecked />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alert-threshold">Alert Threshold (% below reorder point)</Label>
            <Input id="alert-threshold" type="number" defaultValue="10" min="0" max="100" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={handleSaveSettings}>Save Changes</Button>
      </div>
    </div>
  );
}
