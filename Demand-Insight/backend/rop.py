import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import datetime  # Import the datetime module

# --- Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)+"\\backend"
DATA_FILE_NAME = 'retail_store_inventory.csv'
DATA_FILE = os.path.join(PROJECT_ROOT, DATA_FILE_NAME)

# --- THESE ARE ASSUMPTIONS ---
# Since Lead Time is not in your CSV, we must *assume* it.
# You should change this default or pass it in the API call.
DEFAULT_LEAD_TIME_DAYS = 3
# This is how many days of stock you want to order
RECOMMENDED_ORDER_DAYS = 14
DEFAULT_SERVICE_LEVEL = 0.95
# -----------------------------

Z_SCORES = {
    0.90: 1.28,
    0.95: 1.645,
    0.98: 2.05,
    0.99: 2.33
}

# --- Load and Prepare Data ---

def load_data(file_path):
    print(f"Attempting to load data from: {file_path}")
    if not os.path.exists(file_path):
        print(f"Error: Data file '{file_path}' not found.")
        return None
    try:
        df = pd.read_csv(file_path, parse_dates=['Date'])
        df['Units Sold'] = pd.to_numeric(df['Units Sold'], errors='coerce')
        df.dropna(subset=['Units Sold'], inplace=True)
        # Add a simple 'Product Name' column for better display
        df['Product Name'] = df['Product ID'].apply(lambda x: f"Product {x.split('P')[-1]}")
        print(f"Successfully loaded data from '{file_path}'.")
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

df_inventory = load_data(DATA_FILE)

# --- Initialize Flask App ---
app = Flask(__name__)
CORS(app)

# --- Helper Function to Calculate ROP ---
def calculate_rop_for_sku(sku_data, lead_time, service_level):
    """Calculates ROP stats for a given dataframe of SKU data."""
    if len(sku_data) < 2:
        return None # Not enough data

    avg_daily_demand = sku_data['Units Sold'].mean()
    std_dev_daily_demand = sku_data['Units Sold'].std()
    
    if std_dev_daily_demand == 0 or pd.isna(std_dev_daily_demand):
        std_dev_daily_demand = 0 

    z_score = Z_SCORES.get(service_level, Z_SCORES[DEFAULT_SERVICE_LEVEL])
    
    demand_during_lead_time = avg_daily_demand * lead_time
    std_dev_lead_time_demand = std_dev_daily_demand * np.sqrt(lead_time)
    
    safety_stock = z_score * std_dev_lead_time_demand
    reorder_point = demand_during_lead_time + safety_stock
    
    latest_record = sku_data.sort_values(by='Date').iloc[-1]
    current_stock = int(latest_record['Inventory Level'])

    # Order (Avg Daily Demand * X days)
    recommended_order = (avg_daily_demand * RECOMMENDED_ORDER_DAYS)

    return {
        "avg_daily_demand": round(avg_daily_demand, 2),
        "std_dev_daily_demand": round(std_dev_daily_demand, 2),
        "safety_stock": int(np.ceil(safety_stock)),
        "reorder_point": int(np.ceil(reorder_point)),
        "current_stock": current_stock,
        "recommended_order": int(np.ceil(recommended_order))
    }

# --- API Endpoint 1: Single ROP Calculation (Your Test Endpoint) ---
@app.route('/api/calculate_rop', methods=['GET'])
def get_reorder_point():
    # (This function is unchanged, kept for testing)
    if df_inventory is None:
        return jsonify({"error": "Data not loaded"}), 500
    product_id = request.args.get('product_id')
    store_id = request.args.get('store_id')
    if not product_id or not store_id:
        return jsonify({"error": "Missing 'product_id' and 'store_id'"}), 400
    lead_time = float(request.args.get('lead_time', DEFAULT_LEAD_TIME_DAYS))
    service_level = float(request.args.get('service_level', DEFAULT_SERVICE_LEVEL))
    sku_data = df_inventory[
        (df_inventory['Product ID'] == product_id) & 
        (df_inventory['Store ID'] == store_id)
    ]
    if sku_data.empty:
        return jsonify({"error": f"No data found for {product_id} at {store_id}"}), 404
    stats = calculate_rop_for_sku(sku_data, lead_time, service_level)
    if stats is None:
        return jsonify({"error": "Not enough data to calculate."}), 400
    return jsonify({
        "product_id": product_id,
        "store_id": store_id,
        "inputs": {
            "lead_time_days": lead_time,
            "service_level_percent": service_level * 100,
            "z_score_used": Z_SCORES.get(service_level, Z_SCORES[DEFAULT_SERVICE_LEVEL])
        },
        "results": stats
    })


# --- API Endpoint 2: Full Recommendation List (MODIFIED) ---
@app.route('/api/all_recommendations', methods=['GET'])
def get_all_recommendations():
    if df_inventory is None:
        return jsonify({"error": "Data not loaded"}), 500

    # This allows you to change the lead time for *all* products via the URL
    # Example: http://127.0.0.1:5000/api/all_recommendations?lead_time=10
    lead_time = float(request.args.get('lead_time', DEFAULT_LEAD_TIME_DAYS))
    service_level = float(request.args.get('service_level', DEFAULT_SERVICE_LEVEL))
    
    print(f"--- Generating recommendations with Lead Time: {lead_time} days ---")

    recommendations = []
    grouped = df_inventory.groupby(['Product ID', 'Store ID'])
    
    for (product_id, store_id), sku_data in grouped:
        stats = calculate_rop_for_sku(sku_data, lead_time, service_level)
        
        if stats is None:
            continue
        
        # The main reorder logic
        if stats['current_stock'] < stats['reorder_point']:
            
            # Determine priority
            if stats['current_stock'] <= (stats['reorder_point'] * 0.5):
                priority = "high"
            elif stats['current_stock'] <= (stats['reorder_point'] * 0.9):
                priority = "medium"
            else:
                priority = "low"
            
            # --- NEW: Calculate Estimated Stockout Date ---
            estimated_stockout_date = None
            # We can only calculate this if there is average demand
            if stats['avg_daily_demand'] > 0:
                days_to_stockout = stats['current_stock'] / stats['avg_daily_demand']
                # Only show stockout date if it's a high/medium priority
                if priority in ["high", "medium"]:
                    stockout_date_obj = datetime.date.today() + datetime.timedelta(days=days_to_stockout)
                    estimated_stockout_date = stockout_date_obj.isoformat() # Format as "YYYY-MM-DD"
            # --- END NEW ---

            product_name = sku_data.sort_values(by='Date').iloc[-1]['Product Name']

            # Build the JSON object to match the frontend
            rec = {
                "skuId": f"{product_id}_{store_id}",
                "skuName": f"{product_name} (at {store_id})",
                "currentStock": stats['current_stock'],
                "reorderPoint": stats['reorder_point'],
                "recommendedOrder": stats['recommended_order'],
                "leadTime": int(lead_time), # Return the lead time we used
                "priority": priority,
                "estimatedStockoutDate": estimated_stockout_date # Add the new date
            }
            recommendations.append(rec)
            
    priority_order = {"high": 0, "medium": 1, "low": 2}
    sorted_recommendations = sorted(recommendations, key=lambda x: priority_order[x['priority']])
    
    return jsonify(sorted_recommendations)

# --- Run the Flask App ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)