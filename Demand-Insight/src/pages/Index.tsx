import { useEffect } from 'react';
import { useDashboardState } from '@/hooks/useDashboardState';
import { DataUpload } from '@/components/DataUpload';
import { TrainingConsole } from '@/components/TrainingConsole';
import { ScenarioConfig } from '@/components/ScenarioConfig';
import { ProductDeepDive } from '@/components/ProductDeepDive';
import { ActionableTables } from '@/components/ActionableTables';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Download, Lock } from 'lucide-react';

const Index = () => {
  const {
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
  } = useDashboardState();

  const handleFileUpload = async (file: File) => {
    try {
      await loadData(file);
      toast({
        title: "Data Uploaded Successfully",
        description: "File sent to server for processing",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Server rejected the file. Ensure backend is running.",
        variant: "destructive",
      });
    }
  };

  const uniqueProducts = data.length > 0 
    ? Array.from(new Set(data.map(r => r.Product_ID))).sort()
    : [];

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <Header 
        history={history} 
        isLoggedIn={isLoggedIn} 
        onLogin={login}
        onLogout={logout}
        onClearHistory={clearHistory}
        onRestore={restoreSnapshot}
      />
      
      <main className="container max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
            <p className="text-slate-500 mt-1">Manage your inventory intelligence and forecasting models.</p>
          </div>
          {(state === "results") && (
             <Button variant="outline" className="gap-2 bg-white/50 border-slate-200 hover:bg-white transition-colors">
               <Download className="h-4 w-4" /> Export Report
             </Button>
          )}
        </div>

        {/* Access Control */}
        {!isLoggedIn ? (
           <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in zoom-in-95 duration-500">
              <div className="p-6 bg-white/50 rounded-full border border-white/60 backdrop-blur-sm shadow-xl">
                <Lock className="h-12 w-12 text-slate-400" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-700">Authentication Required</h2>
              <p className="text-slate-500 max-w-md">Please login with your administrator credentials to access the forecasting dashboard and sensitivity analysis tools.</p>
           </div>
        ) : (
           <>
            {/* Step 1: Data Upload */}
            <section className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100">
              <PremiumCard>
                <DataUpload onUpload={handleFileUpload} dataSummary={dataSummary} />
              </PremiumCard>
            </section>
            
            {/* Step 2: Training */}
            <section className="animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
                <PremiumCard title="Model Training" subtitle="Train AI models on your uploaded data" className="min-w-0">
                  <TrainingConsole 
                      state={state}
                      logs={trainingLogs}
                      onTrain={trainModels}
                      metrics={productMetrics}
                  />
                </PremiumCard>
            </section>

            {/* Step 3: Scenario Planning */}
            {(state === "trained" || state === "forecasting" || state === "results") && (
                <section className="animate-in fade-in slide-in-from-bottom-6 duration-500 delay-300">
                    <PremiumCard title="Scenario Planning" subtitle="Simulate market conditions & Generate Forecast">
                      <ScenarioConfig
                          state={state}
                          forecastHorizon={forecastHorizon}
                          selectedScenario={selectedScenario}
                          onHorizonChange={setForecastHorizon}
                          onScenarioChange={setSelectedScenario}
                          onGenerate={generateForecast}
                          metrics={productMetrics}
                      />
                    </PremiumCard>
                </section>
            )}

            {/* Step 4: Product Analysis */}
            {(state === "trained" || state === "results") && (
                <section className="animate-in fade-in slide-in-from-bottom-7 duration-500 delay-400">
                    <PremiumCard title="Product Analysis" subtitle="Deep dive into individual product performance" className="min-w-0">
                      <ProductDeepDive
                        products={uniqueProducts}
                        selectedProduct={selectedProduct}
                        onProductChange={setSelectedProduct}
                        metrics={productMetrics}
                        data={data}
                        forecastHorizon={forecastHorizon}
                      />
                    </PremiumCard>
                </section>
            )}
            
            {/* Step 5: Strategic Recommendations */}
            {(state === "trained" || state === "results") && (
              <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                <PremiumCard 
                  title="Strategic Recommendations" 
                  subtitle="AI-driven actionable insights"
                  noPadding 
                >
                  <ActionableTables metrics={productMetrics} />
                </PremiumCard>
              </section>
            )}
           </>
        )}
      </main>
    </div>
  );
};

export default Index;