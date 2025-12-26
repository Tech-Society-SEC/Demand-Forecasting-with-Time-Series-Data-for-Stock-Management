from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import shutil
import os
from typing import List, Optional

# Import your existing scripts
from train import ProductLevelTrainer
from forecast import ProductForecaster

app = FastAPI()

# Enable CORS - Add your frontend ports here
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "retail_store_inventory.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")

# --- Pydantic Models ---
class ForecastRequest(BaseModel):
    horizon: int
    scenario: str

# --- Endpoints ---

@app.post("/api/upload")
async def upload_data(file: UploadFile = File(...)):
    try:
        # 1. Save the uploaded file to disk
        os.makedirs(BASE_DIR, exist_ok=True)
        with open(DATA_PATH, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. Read it back to return preview data to frontend
        df = pd.read_csv(DATA_PATH)
        
        # --- CRITICAL FIX: NORMALIZE COLUMN NAMES ---
        # Frontend expects 'Product_ID', CSV has 'Product ID'
        # This replaces spaces and slashes with underscores
        df.columns = df.columns.str.replace(' ', '_').str.replace('/', '_')
        # ---------------------------------------------

        # Convert NaNs to None/null for JSON compatibility
        records = df.fillna(0).to_dict(orient="records")
        return records
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/api/train")
async def train_model(data: List[dict]):
    try:
        # We use the saved CSV directly for training
        trainer = ProductLevelTrainer(DATA_PATH, MODELS_DIR)
        trainer.train_all_products()
        
        metrics_response = []
        for res in trainer.results:
            rec = "Maintain Strategy"
            insights = res.get('causal_insights', {})
            if insights.get('Price_Sensitivity', 0) < -2.0:
                rec = "Price Sensitive: Monitor closely"
            elif insights.get('Discount_Effect', 0) > 1.0:
                rec = "Promotion Responsive"

            metrics_response.append({
                "product_id": res['product_id'],
                "success_rate": float(res['confidence']), 
                "wmape": float(res['wmape']),
                "guardrail_triggered": res['guardrail_triggered'],
                "drivers": [res['main_driver']],
                "recommendation": rec,
                "predicted_demand": 0, 
                "confidence": float(res['confidence'])
            })
            
        return metrics_response
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/api/forecast")
async def get_forecast(req: ForecastRequest):
    try:
        forecaster = ProductForecaster(MODELS_DIR, DATA_PATH)
        
        combined_df, results = forecaster.forecast_all_products(
            forecast_days=req.horizon,
            scenario=req.scenario
        )
        
        if not results:
            raise HTTPException(status_code=400, detail="No forecasts generated. Did you train the models first?")

        updated_metrics = []
        for res in results:
            rec = forecaster._get_recommendation(res)
            
            updated_metrics.append({
                "product_id": res['product_id'],
                "success_rate": float(res['confidence']),
                "wmape": max(0.0, 1.0 - float(res['confidence'])), 
                "guardrail_triggered": "Price_Ratio" not in res['active_features'],
                "drivers": [res['main_driver']],
                "recommendation": rec,
                "predicted_demand": float(res['total_forecast']),
                "confidence": float(res['confidence'])
            })

        return updated_metrics
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)