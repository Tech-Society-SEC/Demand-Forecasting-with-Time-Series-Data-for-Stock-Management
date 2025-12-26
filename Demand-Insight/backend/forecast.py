"""
Production-Grade Product-Level Demand Forecasting Script
Generates 20-day forecasts for all trained product models with scenario analysis.

FEATURES:
- Compatible with "Guardrail" models (handles dropped Price variables dynamically)
- Runs Scenario Analysis (Price Cuts, Promotions) only on valid products
- Generates actionable recommendations based on causal insights
"""

import pandas as pd
import numpy as np
import pickle
from pathlib import Path
from datetime import datetime, timedelta
import warnings

# Suppress warnings for cleaner output in production
warnings.filterwarnings('ignore')


class ProductForecaster:
    """Generate forecasts using trained product-level models"""
    
    def __init__(self, models_dir='backend/models', data_path='retail_store_inventory.csv'):
        self.models_dir = Path(models_dir)
        self.data_path = data_path
        self.forecasts = []
        
    def load_historical_data(self):
        """Load and aggregate historical data to get last known values"""
        print("Loading historical data for context...")
        try:
            df = pd.read_csv(self.data_path)
            df['Date'] = pd.to_datetime(df['Date'])
            
            # Aggregate to product level (same as training)
            agg_config = {
                'Units Sold': 'sum',
                'Price': 'mean',
                'Discount': 'mean',
                'Competitor Pricing': 'mean',
                'Holiday/Promotion': 'max'
            }
            
            df_agg = df.groupby(['Date', 'Product ID']).agg(agg_config).reset_index()
            
            print(f"✓ Loaded data up to {df_agg['Date'].max().date()}\n")
            return df_agg
        except Exception as e:
            print(f"CRITICAL ERROR loading history: {str(e)}")
            return None
    
    def get_last_values(self, df_agg, product_id):
        """Get last known values for a product to seed the forecast"""
        df_prod = df_agg[df_agg['Product ID'] == product_id].sort_values('Date')
        
        if len(df_prod) == 0:
            return None
        
        last_row = df_prod.iloc[-1]
        last_30 = df_prod.tail(30)
        
        return {
            'last_date': last_row['Date'],
            'last_price': last_row['Price'],
            'last_discount': last_row['Discount'],
            'last_competitor_price': last_row['Competitor Pricing'],
            'last_holiday': last_row['Holiday/Promotion'],
            'avg_price_30d': last_30['Price'].mean(),
            'avg_discount_30d': last_30['Discount'].mean(),
            'avg_competitor_30d': last_30['Competitor Pricing'].mean()
        }
    
    def create_future_exog(self, last_values, forecast_days=20, scenario='baseline'):
        """
        Create future exogenous variables for forecasting
        
        Scenarios:
        - 'baseline': Use last known values
        - 'discount_boost': Increase discount by 10%
        - 'price_cut': Reduce price by 5%
        - 'holiday_promo': Mark next weekend as holiday
        """
        future_dates = pd.date_range(
            start=last_values['last_date'] + timedelta(days=1),
            periods=forecast_days,
            freq='D'
        )
        
        df_future = pd.DataFrame(index=future_dates)
        
        # Base scenario: use last known values (Assumption: Prices stay flat unless changed)
        df_future['Price'] = last_values['avg_price_30d']
        df_future['Discount'] = last_values['avg_discount_30d']
        df_future['Competitor Pricing'] = last_values['avg_competitor_30d']
        df_future['Holiday/Promotion'] = 0  # Default no holiday
        
        # Apply scenario modifications
        if scenario == 'discount_boost':
            df_future['Discount'] = df_future['Discount'] + 10  # +10% discount
            
        elif scenario == 'price_cut':
            df_future['Price'] = df_future['Price'] * 0.95  # -5% price
            
        elif scenario == 'holiday_promo':
            # Mark upcoming weekend as holiday
            weekend_mask = df_future.index.dayofweek.isin([5, 6])  # Sat, Sun
            df_future.loc[weekend_mask, 'Holiday/Promotion'] = 1
        
        # Construct causal features (MUST MATCH TRAINING LOGIC)
        # Adding epsilon to avoid division by zero
        df_future['Price_Ratio'] = df_future['Price'] / (df_future['Competitor Pricing'] + 1e-6)
        
        # Lagged holiday feature
        df_future['Holiday_Lag1'] = df_future['Holiday/Promotion'].shift(1).fillna(
            last_values['last_holiday']
        )
        
        return df_future
    
    def load_model(self, product_id):
        """Load trained model for a product"""
        model_path = self.models_dir / f"{product_id}_AGGREGATED_model.pkl"
        
        if not model_path.exists():
            return None
        
        with open(model_path, 'rb') as f:
            model_dict = pickle.load(f)
        
        return model_dict
    
    def forecast_product(self, product_id, df_agg, forecast_days=20, scenario='baseline'):
        """
        Generate forecast for a single product.
        CRITICAL: Handles Dynamic Feature Selection (columns dropped by Guardrails).
        """
        try:
            # Load model
            model_dict = self.load_model(product_id)
            if model_dict is None:
                print(f"  ✗ [{product_id}] Model not found")
                return None
            
            # Get historical context
            last_values = self.get_last_values(df_agg, product_id)
            if last_values is None:
                print(f"  ✗ [{product_id}] No historical data")
                return None
            
            # Create future exogenous variables
            df_future = self.create_future_exog(last_values, forecast_days, scenario)
            
            # Ensure lengths match exactly
            df_future = df_future.head(forecast_days)

            # ---------------------------------------------------------
            # CRITICAL FIX: Handle Feature Selection (Dropped Columns)
            # ---------------------------------------------------------
            
            # 1. Identify ALL columns the Scaler expects
            # Support both old models ('exog_columns') and new Guardrail models ('all_exog_cols')
            all_cols = model_dict.get('all_exog_cols', model_dict.get('exog_columns'))
            
            # 2. Identify ACTIVE columns the Model uses
            # If 'active_exog' missing, assume all cols are active (legacy support)
            active_cols = model_dict.get('active_exog', all_cols)
            
            # 3. Scale ALL features first
            # The scaler was fitted on ALL columns, so it needs ALL columns to transform
            X_future_full = model_dict['scaler'].transform(df_future[all_cols])
            
            # 4. Slice to keep only ACTIVE features
            # We find the indices of the active columns within the full list
            active_indices = [all_cols.index(c) for c in active_cols]
            X_future_active = X_future_full[:, active_indices]
            
            # ---------------------------------------------------------
            
            # Generate forecast
            model_fit = model_dict['model']
            forecast = model_fit.forecast(steps=len(df_future), exog=X_future_active)
            forecast = np.maximum(forecast, 0) # No negative sales
            
            # Get confidence
            confidence = model_dict.get('confidence', 0.0)
            
            # Create result DataFrame
            result_df = pd.DataFrame({
                'Date': df_future.index,
                'Product_ID': product_id,
                'Predicted_Demand': forecast if isinstance(forecast, np.ndarray) else forecast.values,
                'Price': df_future['Price'].values,
                'Discount': df_future['Discount'].values,
                'Scenario': scenario
            })
            
            # Calculate metrics
            total_forecast = result_df['Predicted_Demand'].sum()
            avg_daily = result_df['Predicted_Demand'].mean()
            
            print(f"  ✓ [{product_id}] Forecast: {total_forecast:,.0f} units | Features Used: {len(active_cols)}")
            
            return {
                'product_id': product_id,
                'forecast_df': result_df,
                'total_forecast': total_forecast,
                'avg_daily': avg_daily,
                'confidence': confidence,
                'main_driver': model_dict.get('main_driver', 'Unknown'),
                'causal_insights': model_dict.get('causal_insights', {}),
                'active_features': active_cols
            }
            
        except Exception as e:
            print(f"  ✗ [{product_id}] Forecast failed - {str(e)}")
            return None
    
    def _get_recommendation(self, result):
        """Generate action recommendation based on causal insights"""
        insights = result['causal_insights']
        active_feats = result.get('active_features', [])
        
        price_sens = insights.get('Price_Sensitivity', 0)
        discount_eff = insights.get('Discount_Effect', 0)
        holiday_eff = insights.get('Holiday_Effect', 0)
        
        # Check if Price was dropped by Guardrail
        price_dropped = 'Price_Ratio' not in active_feats
        
        if price_dropped:
            return "Fix Data Quality (Price ignored due to anomalies)"
        elif discount_eff > 1.5:
            return "High Potential: Run aggressive promotion"
        elif holiday_eff > 2.0:
            return "Stock up for Holidays"
        elif price_sens < -2.0:
            return "Sensitive: Consider small price reduction"
        else:
            return "Maintain current strategy"

    def run_scenario_analysis(self, product_id, df_agg, forecast_days=20):
        """
        Run multiple scenarios for a product to show impact of decisions
        """
        scenarios = ['baseline', 'discount_boost', 'price_cut', 'holiday_promo']
        results = {}
        
        print(f"\n{'='*60}")
        print(f"SCENARIO ANALYSIS: {product_id}")
        print(f"{'='*60}")
        
        for scenario in scenarios:
            result = self.forecast_product(product_id, df_agg, forecast_days, scenario)
            if result:
                results[scenario] = result
        
        # Compare scenarios
        if len(results) > 1:
            print(f"\n--- Impact Analysis (vs Baseline) ---")
            base_res = results.get('baseline')
            if not base_res:
                print("Baseline forecast failed, cannot compare.")
                return results
                
            baseline_demand = base_res['total_forecast']
            
            for scenario, result in results.items():
                if scenario == 'baseline':
                    continue
                
                diff = result['total_forecast'] - baseline_demand
                pct_change = (diff / baseline_demand) * 100 if baseline_demand > 0 else 0.0
                
                # Highlight significant changes
                indicator = ""
                if abs(pct_change) > 1.0: indicator = "⬅ IMPACT"
                if abs(pct_change) == 0.0: indicator = "(No Effect - Guardrail Active)"
                
                print(f"{scenario:20s}: {diff:+,.0f} units ({pct_change:+.1f}%) {indicator}")
        
        return results
    
    def forecast_all_products(self, forecast_days=20, scenario='baseline'):
        """
        Main forecasting pipeline
        """
        print("\n" + "="*80)
        print("PRODUCT-LEVEL DEMAND FORECASTING")
        print("="*80)
        print(f"Forecast Horizon: {forecast_days} days")
        print(f"Scenario: {scenario}")
        print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Load historical data
        df_agg = self.load_historical_data()
        if df_agg is None:
            return None, None
        
        # Get all trained models
        model_files = list(self.models_dir.glob("*_AGGREGATED_model.pkl"))
        products = [f.stem.replace('_AGGREGATED_model', '') for f in model_files]
        
        if not products:
            print("No trained models found in backend/models/")
            return None, None
        
        print("="*80)
        print(f"Generating Forecasts for {len(products)} Products")
        print("="*80)
        
        all_forecasts = []
        success_count = 0
        
        for i, product_id in enumerate(products, 1):
            # print(f"\n[{i}/{len(products)}] Forecasting: {product_id}")
            result = self.forecast_product(product_id, df_agg, forecast_days, scenario)
            
            if result:
                all_forecasts.append(result)
                success_count += 1
        
        # Combine all forecasts
        if all_forecasts:
            combined_df = pd.concat([r['forecast_df'] for r in all_forecasts])
            
            # Save to CSV
            output_path = f"product_forecasts_{scenario}_{forecast_days}days.csv"
            combined_df.to_csv(output_path, index=False)
            
            # Summary report
            print("\n" + "="*80)
            print("FORECAST SUMMARY")
            print("="*80)
            print(f"✓ Successfully Forecasted: {success_count}/{len(products)}")
            
            total_company_demand = sum(r['total_forecast'] for r in all_forecasts)
            avg_confidence = np.mean([r['confidence'] for r in all_forecasts])
            
            print(f"\nTotal Company Demand (20 days): {total_company_demand:,.0f} units")
            print(f"Average Daily Demand: {total_company_demand/forecast_days:,.1f} units/day")
            print(f"Average Model Confidence: {avg_confidence:.2f}")
            
            # Top/Bottom performers
            print("\n--- Top 5 Products by Forecasted Demand ---")
            top5 = sorted(all_forecasts, key=lambda x: x['total_forecast'], reverse=True)[:5]
            for r in top5:
                print(f"  {r['product_id']}: {r['total_forecast']:,.0f} units | "
                      f"Driver: {r['main_driver']}")
            
            print("\n--- Strategic Recommendations (Bottom 5) ---")
            bottom5 = sorted(all_forecasts, key=lambda x: x['total_forecast'])[:5]
            for r in bottom5:
                rec = self._get_recommendation(r)
                print(f"  {r['product_id']}: {r['total_forecast']:,.0f} units | Action: {rec}")
            
            print(f"\n✓ Forecasts saved to: {output_path}")
            print(f"End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("="*80 + "\n")
            
            return combined_df, all_forecasts
        
        else:
            print("\n✗ No successful forecasts generated")
            return None, None


def main():
    """Main execution with examples"""
    forecaster = ProductForecaster()
    
    # 1. Run Baseline
    print("\n" + "🔮 RUNNING BASELINE FORECAST...")
    combined_df, results = forecaster.forecast_all_products(
        forecast_days=20, 
        scenario='baseline'
    )
    
    # 2. Pick a product that kept Price and run scenarios
    if results:
        # Find a product where 'Price_Ratio' is in active features (Logical Product)
        price_sensitive_prod = next((r['product_id'] for r in results if 'Price_Ratio' in r['active_features']), None)
        
        # Find a product where Price was dropped (Guardrailed Product)
        price_insensitive_prod = next((r['product_id'] for r in results if 'Price_Ratio' not in r['active_features']), None)
        
        if price_sensitive_prod:
            print(f"\n🔎 DEMONSTRATING PRICE SENSITIVITY ON: {price_sensitive_prod}")
            forecaster.run_scenario_analysis(price_sensitive_prod, forecaster.load_historical_data())
            
        if price_insensitive_prod:
            print(f"\n🛡️ DEMONSTRATING GUARDRAIL PROTECTION ON: {price_insensitive_prod}")
            forecaster.run_scenario_analysis(price_insensitive_prod, forecaster.load_historical_data())


if __name__ == "__main__":
    main()