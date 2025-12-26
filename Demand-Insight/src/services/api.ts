import { InventoryRecord, ProductMetrics, ScenarioType } from '@/types/inventory';

// Replace with your actual backend URL (e.g., http://localhost:8000)
const API_BASE = 'http://localhost:8000/api'; 

export const api = {
  // 1. Upload CSV File
  async uploadData(file: File): Promise<InventoryRecord[]> {
    const formData = new FormData();
    formData.append('file', file); // 'file' must match the backend endpoint param name
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },

  // 2. Train Model
  async trainModel(data: InventoryRecord[]): Promise<ProductMetrics[]> {
    const response = await fetch(`${API_BASE}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Training failed');
    return response.json();
  },

  // 3. Get Forecast
  async getForecast(horizon: number, scenario: ScenarioType) {
    const response = await fetch(`${API_BASE}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horizon, scenario }),
    });

    if (!response.ok) throw new Error('Forecasting failed');
    return response.json();
  }
};