"""
Production-Grade Product-Level Demand Forecasting Trainer
Aggregates store-level data to predict total company demand per SKU.

FEATURES:
- Aggregates data from Store -> Product level
- Auto-detects "Reverse Causality" (Positive Price Elasticity)
- Economic Guardrails: Automatically drops Price variable if the model learns illogical behavior
- Generates full causal explainability (Price Elasticity, Discount Impact)
"""

import pandas as pd
import numpy as np
import pickle
import warnings
from pathlib import Path
from datetime import datetime
from sklearn.preprocessing import StandardScaler
from statsmodels.tsa.statespace.sarimax import SARIMAX

warnings.filterwarnings('ignore')


class ProductLevelTrainer:
    """Train SARIMAX models for product-level demand forecasting with Guardrails"""
    
    def __init__(self, data_path, output_dir='backend/models'):
        self.data_path = data_path
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.results = []
        
    def load_and_aggregate_data(self):
        """
        Load CSV and aggregate across all stores to product-level
        Returns: DataFrame with (Date, Product ID) index
        """
        print("=" * 80)
        print("STEP 1: Loading and Aggregating Store-Level Data to Product-Level")
        print("=" * 80)
        
        # Load raw data
        try:
            df = pd.read_csv(self.data_path)
            df['Date'] = pd.to_datetime(df['Date'])
            
            print(f"✓ Loaded {len(df):,} records from {df['Store ID'].nunique()} stores")
            print(f"✓ Date range: {df['Date'].min()} to {df['Date'].max()}")
            print(f"✓ Products: {df['Product ID'].nunique()}")
            
            # Aggregate by Date and Product ID
            agg_config = {
                'Units Sold': 'sum',              # Total demand across stores
                'Price': 'mean',                  # Average price
                'Discount': 'mean',               # Average discount rate
                'Competitor Pricing': 'mean',     # Average competitor price
                'Holiday/Promotion': 'max'        # Holiday if ANY store has it
            }
            
            df_agg = df.groupby(['Date', 'Product ID']).agg(agg_config).reset_index()
            
            print(f"✓ Aggregated to {len(df_agg):,} product-day records")
            print(f"✓ Dropped store-specific columns: Store ID, Weather, Region")
            print()
            
            return df_agg
            
        except Exception as e:
            print(f"CRITICAL ERROR loading data: {str(e)}")
            raise e
    
    def prepare_timeseries(self, df, product_id):
        """
        Prepare time series for a single product with proper frequency
        """
        # Filter to product
        df_prod = df[df['Product ID'] == product_id].copy()
        df_prod = df_prod.set_index('Date').sort_index()
        
        # Ensure daily frequency
        df_prod = df_prod.asfreq('D')
        
        # Fill missing values
        df_prod['Units Sold'] = df_prod['Units Sold'].fillna(0)  # No sales = 0
        
        # Forward fill explanatory variables (prices don't change on weekends usually)
        cols_to_fill = ['Price', 'Discount', 'Competitor Pricing', 'Holiday/Promotion']
        df_prod[cols_to_fill] = df_prod[cols_to_fill].fillna(method='ffill')
        
        return df_prod
    
    def construct_causal_features(self, df):
        """
        Build causal drivers for explainability
        """
        # Price Ratio (Relative Price vs Competitor)
        # Adding small epsilon to avoid division by zero
        df['Price_Ratio'] = df['Price'] / (df['Competitor Pricing'] + 1e-6)
        
        # Holiday Lag (pre-holiday demand spike)
        df['Holiday_Lag1'] = df['Holiday/Promotion'].shift(1).fillna(0)
        
        # Select final exogenous features candidates
        exog_cols = ['Price_Ratio', 'Discount', 'Holiday/Promotion', 'Holiday_Lag1']
        
        return df, exog_cols
    
    def calculate_wmape(self, y_true, y_pred):
        """Weighted Mean Absolute Percentage Error"""
        y_true = np.array(y_true)
        y_pred = np.array(y_pred)
        
        # Avoid division by zero
        mask = y_true > 0
        if mask.sum() == 0:
            return 1.0
        
        wmape = np.sum(np.abs(y_true[mask] - y_pred[mask])) / np.sum(y_true[mask])
        return wmape
    
    def extract_causal_insights(self, model_fit, active_exog, scaler):
        """
        Extract interpretable coefficients from SARIMAX
        """
        try:
            params = model_fit.params
            insights = {}
            coef_map = {}
            
            # The params often come back as x1, x2, etc. if we used numpy arrays
            # We map them back to the active column names
            for i, col_name in enumerate(active_exog):
                
                # Try to find the coefficient
                coef = 0.0
                if col_name in params.index:
                    coef = params[col_name]
                elif f'x{i+1}' in params.index:
                    coef = params[f'x{i+1}']
                
                # Map to business terms
                if 'Price_Ratio' in col_name:
                    insights['Price_Sensitivity'] = float(coef)
                    coef_map['Price_Sensitivity'] = abs(coef)
                elif 'Discount' in col_name:
                    insights['Discount_Effect'] = float(coef)
                    coef_map['Discount_Effect'] = abs(coef)
                elif 'Holiday' in col_name and 'Lag' not in col_name:
                    insights['Holiday_Effect'] = float(coef)
                    coef_map['Holiday_Effect'] = abs(coef)
            
            # Trend parameter
            if 'drift' in params.index:
                insights['Base_Trend'] = float(params['drift'])
            else:
                insights['Base_Trend'] = 0.0
            
            # Find main driver
            if coef_map:
                main_driver = max(coef_map, key=coef_map.get)
                main_coef = insights.get(main_driver, 0.0)
            else:
                main_driver = 'Trend/Seasonality'
                main_coef = insights.get('Base_Trend', 0.0)
            
            return insights, main_driver, main_coef
            
        except Exception as e:
            print(f"    ⚠ Warning: Could not extract coefficients - {str(e)}")
            return {}, 'Unknown', 0.0
    
    def train_product_model(self, df, product_id):
        """
        Train SARIMAX model for a single product with ECONOMIC GUARDRAILS.
        If Price Elasticity is positive (Reverse Causality), it retrains without Price.
        """
        try:
            # Prepare time series
            df_ts = self.prepare_timeseries(df, product_id)
            
            if len(df_ts) < 60:  # Need minimum data
                print(f"  ✗ Skipped - Insufficient data ({len(df_ts)} days)")
                return None
            
            # Construct causal features
            df_ts, all_exog_cols = self.construct_causal_features(df_ts)
            
            # Remove any remaining NaNs
            df_ts = df_ts.dropna()
            
            if len(df_ts) < 60:
                print(f"  ✗ Skipped - Too many NaNs after feature engineering")
                return None
            
            # Split train/validation (last 30 days for validation)
            split_idx = len(df_ts) - 30
            train = df_ts.iloc[:split_idx]
            val = df_ts.iloc[split_idx:]
            
            # Standardize exogenous variables
            # We fit on ALL potential columns first
            scaler = StandardScaler()
            X_train_full = scaler.fit_transform(train[all_exog_cols])
            X_val_full = scaler.transform(val[all_exog_cols])
            
            y_train = train['Units Sold']
            y_val = val['Units Sold']
            
            # =================================================================
            # GUARDRAIL LOOP
            # =================================================================
            # We attempt to train. If we detect reverse causality (positive price coef),
            # we remove the offending column and retrain.
            
            active_exog = all_exog_cols.copy()
            model_fit = None
            guardrail_triggered = False
            
            # Allow max 2 attempts (Original -> Fix)
            for attempt in range(2):
                
                # Filter X to currently active columns
                col_indices = [all_exog_cols.index(c) for c in active_exog]
                X_train_curr = X_train_full[:, col_indices]
                
                # Train SARIMAX
                model = SARIMAX(
                    endog=y_train,
                    exog=X_train_curr,
                    order=(1, 1, 1),              # ARIMA(1,1,1)
                    seasonal_order=(1, 0, 0, 7),  # Weekly seasonality
                    trend='t',                    # Linear trend
                    enforce_stationarity=False,
                    enforce_invertibility=False
                )
                model_fit = model.fit(disp=False, maxiter=200)
                
                # CHECK: Extract Price Coefficient
                params = model_fit.params
                price_violation = False
                
                # Check coefficients for active columns
                for i, col_name in enumerate(active_exog):
                    # Param names are likely x1, x2...
                    coef_name = f'x{i+1}'
                    if coef_name in params:
                        coef = params[coef_name]
                        
                        # THE GUARDRAIL CHECK
                        # Price Ratio should be NEGATIVE (Price goes up, demand goes down)
                        # We allow a small noise buffer of +0.05
                        if 'Price_Ratio' == col_name and coef > 0.05:
                            print(f"  ⚠ [GUARDRAIL] {product_id}: Price Coef is +{coef:.3f} (Illogical). Removing Price.")
                            active_exog.remove(col_name)
                            price_violation = True
                            guardrail_triggered = True
                            break # Break inner loop to restart training with new columns
                
                if not price_violation:
                    break # Model passed sanity check
            
            # =================================================================
            # VALIDATION
            # =================================================================
            
            # Re-select validation features based on final active_exog
            final_col_indices = [all_exog_cols.index(c) for c in active_exog]
            X_val_curr = X_val_full[:, final_col_indices]
            
            # Forecast
            y_pred = model_fit.forecast(steps=len(val), exog=X_val_curr)
            y_pred = np.maximum(y_pred, 0)  # No negative predictions
            
            wmape = self.calculate_wmape(y_val, y_pred)
            confidence = max(0, 1 - wmape)
            
            # Extract causal insights
            insights, main_driver, main_coef = self.extract_causal_insights(
                model_fit, active_exog, scaler
            )
            
            # Build output dictionary
            model_dict = {
                'model': model_fit,
                'scaler': scaler,
                'model_type': 'sarimax_product_level',
                'confidence': float(confidence),
                'wmape': float(wmape),
                'avg_daily_demand': float(train['Units Sold'].mean()),
                'last_date': str(df_ts.index[-1].date()),
                'causal_insights': insights,
                'main_driver': main_driver,
                'all_exog_cols': all_exog_cols,  # The full list (for scaler)
                'active_exog': active_exog,      # The list actually used (for selection)
                'exog_columns': all_exog_cols,   # Backward compatibility
                'product_id': product_id,
                'guardrail_triggered': guardrail_triggered
            }
            
            # Save model
            output_path = self.output_dir / f"{product_id}_AGGREGATED_model.pkl"
            with open(output_path, 'wb') as f:
                pickle.dump(model_dict, f)
            
            # Log success
            status = "✓" if wmape < 0.3 else "⚠"
            feature_count = len(active_exog)
            print(f"  {status} [{product_id}] WMAPE: {wmape:.3f} | Conf: {confidence:.2f} | "
                  f"Features: {feature_count} | Driver: {main_driver}")
            
            return model_dict
            
        except Exception as e:
            print(f"  ✗ [{product_id}] Failed - {str(e)}")
            return None
    
    def train_all_products(self):
        """
        Main training pipeline
        """
        print("\n" + "=" * 80)
        print("PRODUCT-LEVEL DEMAND FORECASTING TRAINER (WITH GUARDRAILS)")
        print("=" * 80)
        print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Load and aggregate data
        df_agg = self.load_and_aggregate_data()
        
        # Get unique products
        products = df_agg['Product ID'].unique()
        
        print("=" * 80)
        print(f"STEP 2: Training SARIMAX Models for {len(products)} Products")
        print("=" * 80)
        
        success_count = 0
        failed_count = 0
        guardrail_count = 0
        
        for i, product_id in enumerate(products, 1):
            # Progress header
            # print(f"\n[{i}/{len(products)}] Training: {product_id}")
            
            result = self.train_product_model(df_agg, product_id)
            
            if result:
                self.results.append(result)
                success_count += 1
                if result.get('guardrail_triggered', False):
                    guardrail_count += 1
            else:
                failed_count += 1
        
        # Summary
        print("\n" + "=" * 80)
        print("TRAINING SUMMARY")
        print("=" * 80)
        print(f"✓ Successfully Trained: {success_count}/{len(products)}")
        print(f"🛡️ Guardrails Triggered:  {guardrail_count} (Price removed due to reverse causality)")
        print(f"✗ Failed:               {failed_count}/{len(products)}")
        
        if self.results:
            avg_wmape = np.mean([r['wmape'] for r in self.results])
            avg_conf = np.mean([r['confidence'] for r in self.results])
            print(f"\nAverage WMAPE: {avg_wmape:.3f}")
            print(f"Average Confidence: {avg_conf:.2f}")
            
            # Causal insights summary
            print("\n--- CAUSAL INSIGHTS ACROSS PRODUCTS ---")
            # Use .get(..., 0) because some products may have dropped Price/Discount
            price_sens = [r['causal_insights'].get('Price_Sensitivity', 0) 
                          for r in self.results if 'Price_Sensitivity' in r['causal_insights']]
            
            discount_eff = [r['causal_insights'].get('Discount_Effect', 0) 
                            for r in self.results]
            
            if price_sens:
                print(f"Avg Price Sensitivity: {np.mean(price_sens):+.2f} (For products with logical pricing)")
            else:
                print("Avg Price Sensitivity: N/A (All prices removed by guardrail)")
                
            print(f"Avg Discount Effect:   {np.mean(discount_eff):+.2f}")
        
        print(f"\nModels saved to: {self.output_dir}/")
        print(f"End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80 + "\n")


if __name__ == "__main__":
    # Configuration
    DATA_PATH = "backend/retail_store_inventory.csv"
    OUTPUT_DIR = "backend/models"
    
    # Initialize and run trainer
    trainer = ProductLevelTrainer(DATA_PATH, OUTPUT_DIR)
    trainer.train_all_products()