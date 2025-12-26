import { useState, useCallback, useEffect } from 'react';
import { DashboardState, DataSummary, ProductMetrics, InventoryRecord, ScenarioType, HistoryItem, DashboardSnapshot } from '@/types/inventory';
import { api } from '@/services/api'; 
import { toast } from '@/hooks/use-toast';

export const useDashboardState = () => {
  const [state, setState] = useState<DashboardState>("idle");
  const [data, setData] = useState<InventoryRecord[]>([]);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [productMetrics, setProductMetrics] = useState<ProductMetrics[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState(20);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("baseline");
  
  // --- FIX: Login Persistence ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check if user was previously logged in
    if (typeof window !== 'undefined') {
      return localStorage.getItem('demandiq_is_logged_in') === 'true';
    }
    return false;
  });

  // History State (Safe Load)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('demandiq_history_v3');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Persist history safely
  useEffect(() => {
    try {
      localStorage.setItem('demandiq_history_v3', JSON.stringify(history));
    } catch (e) {
      console.error("History full, trimming old items");
      if (history.length > 10) {
         const trimmed = history.slice(0, 10);
         setHistory(trimmed);
         try { localStorage.setItem('demandiq_history_v3', JSON.stringify(trimmed)); } catch(e) {}
      }
    }
  }, [history]);

  // Helper to create lightweight snapshots (No huge raw data)
  const createSnapshot = (
    overrideState?: DashboardState, 
    overrideSummary?: DataSummary | null,
    overrideMetrics?: ProductMetrics[]
  ): DashboardSnapshot => ({
    state: overrideState || state,
    data: [], // Do not store raw CSV data in history to prevent quota errors
    dataSummary: overrideSummary || dataSummary,
    productMetrics: overrideMetrics || productMetrics,
    forecastHorizon,
    selectedScenario
  });

  const addToHistory = useCallback((
    action: string, 
    details: string, 
    status: HistoryItem['status'] = 'success',
    snapshot?: DashboardSnapshot
  ) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      action,
      details,
      timestamp: new Date().toISOString(),
      status,
      snapshot
    };
    setHistory(prev => [newItem, ...prev]);
  }, []);

  const restoreSnapshot = useCallback((snapshot: DashboardSnapshot) => {
    setState(snapshot.state);
    
    // If snapshot has data, use it. Otherwise keep current data if available.
    if (snapshot.data.length > 0) {
       setData(snapshot.data); 
    } else if (state === 'idle' && snapshot.state !== 'idle') {
       // Warning: We can't fully restore charts if we don't have the raw data
       // But we can restore the metrics table.
       toast({ title: "Restoring View", description: "Restoring metrics and results." });
    }

    setDataSummary(snapshot.dataSummary);
    setProductMetrics(snapshot.productMetrics);
    setForecastHorizon(snapshot.forecastHorizon);
    setSelectedScenario(snapshot.selectedScenario);
    
    if (snapshot.productMetrics.length > 0) {
      setSelectedProduct(snapshot.productMetrics[0].product_id);
    }
    
    toast({
      title: "State Restored",
      description: "Dashboard reverted to selected history point.",
    });
  }, [state]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('demandiq_history_v3');
  }, []);

  const login = useCallback((username: string, pwd: string): boolean => {
    if (username === "admin123" && pwd === "2006") {
      setIsLoggedIn(true);
      localStorage.setItem('demandiq_is_logged_in', 'true'); // SAVE LOGIN
      addToHistory("Login", "Admin logged in successfully", "info");
      return true;
    }
    return false;
  }, [addToHistory]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem('demandiq_is_logged_in'); // CLEAR LOGIN
    addToHistory("Logout", "User logged out", "info");
    
    // Optional: Reset state on logout
    setState("idle");
    setData([]);
    setProductMetrics([]);
  }, [addToHistory]);

  const loadData = useCallback(async (file: File) => {
    setState("loading");
    try {
      const records = await api.uploadData(file);
      setData(records);
      
      let summary: DataSummary | null = null;
      if (records.length > 0) {
        const uniqueProducts = new Set(records.map(r => r.Product_ID)).size;
        const dates = records.map(r => new Date(r.Date));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

        summary = {
          totalRecords: records.length,
          uniqueProducts,
          dateRange: {
            min: minDate.toISOString().split('T')[0],
            max: maxDate.toISOString().split('T')[0]
          }
        };
        setDataSummary(summary);
      }
      
      const newState = "idle";
      setState(newState);
      
      addToHistory(
        "Data Upload", 
        `Uploaded ${file.name} (${records.length} records)`, 
        "success",
        createSnapshot(newState, summary, [])
      );

    } catch (error) {
      console.error("Upload failed", error);
      setTrainingLogs(prev => [...prev, "Error: File upload failed"]);
      addToHistory("Upload Failed", "Failed to process CSV file", "error");
      setState("idle");
    }
  }, [addToHistory]); 

  const trainModels = useCallback(async () => {
    setState("training");
    setTrainingLogs(["Starting training on server..."]);
    
    try {
      const metrics = await api.trainModel(data);
      setProductMetrics(metrics);
      setTrainingLogs(prev => [...prev, "Training completed successfully."]);
      
      const newState = "trained";
      setState(newState);
      
      if (metrics.length > 0) {
        setSelectedProduct(metrics[0].product_id);
      }

      addToHistory(
        "Model Training", 
        `Trained on ${dataSummary?.uniqueProducts || 0} products`, 
        "success",
        createSnapshot(newState, undefined, metrics)
      );

    } catch (error) {
      console.error("Training error", error);
      setTrainingLogs(prev => [...prev, "Error: Training failed."]);
      addToHistory("Training Failed", "Server error during training", "error");
      setState("idle");
    }
  }, [data, dataSummary, addToHistory]);

  const generateForecast = useCallback(async () => {
    setState("forecasting");
    try {
      const updatedMetrics = await api.getForecast(forecastHorizon, selectedScenario);
      setProductMetrics(updatedMetrics);
      
      const newState = "results";
      setState(newState);

      addToHistory(
        "Forecast Generated", 
        `Horizon: ${forecastHorizon} days, Scenario: ${selectedScenario}`, 
        "success",
        createSnapshot(newState, undefined, updatedMetrics)
      );

    } catch (e) {
      console.error("Forecast failed", e);
      addToHistory("Forecast Failed", "Could not generate predictions", "error");
      setState("idle");
    }
  }, [forecastHorizon, selectedScenario, addToHistory]);

  return {
    state,
    data,
    dataSummary,
    trainingLogs,
    productMetrics,
    selectedProduct,
    forecastHorizon,
    selectedScenario,
    history,
    isLoggedIn,
    setSelectedProduct,
    setForecastHorizon,
    setSelectedScenario,
    loadData,
    trainModels,
    generateForecast,
    login,
    logout,
    clearHistory,
    restoreSnapshot
  };
};