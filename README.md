

# 📊 Demand-Insight: AI-Powered Demand Forecasting System

**Automating inventory optimization through predictive and prescriptive time-series analysis.**

Demand-Insight is an end-to-end stock management solution designed to solve the challenges of manual inventory planning. By leveraging machine learning models, the system predicts SKU-level demand and provides actionable reorder recommendations to eliminate overstocking and prevent lost sales.

---

## 🚀 Key Features

* **Predictive Forecasting:** Utilizes **SARIMA** and **Exponential Smoothing** to generate accurate daily demand forecasts.
* **Intelligent Reorder Points (ROP):** Automatically calculates Safety Stock and ROP based on forecasted demand, lead times, and desired service levels.
* **Actionable Recommendations:** A "Priority-Based" alert system (High, Medium, Low) that identifies which products need immediate attention.
* **Dynamic Dashboard:** Interactive visualization of historical trends and future demand projections using Recharts.
* **Data-Driven Insights:** Integrated ETL pipeline to process diverse datasets from retail and e-commerce sources.

---

## 🏗️ System Architecture

The project follows a robust **3-Tier Architecture** for scalability and performance:

1. **Frontend (Presentation Layer):** Built with **React (Vite)** and **Shadcn UI**, offering a responsive interface for data visualization and inventory monitoring.
2. **Backend (Application Layer):** A **Python (Flask)** REST API that manages business logic, data processing, and model orchestration.
3. **Modeling Engine (Intelligence Layer):** The "brain" of the system, implementing statistical models to generate forecasts and prescriptive analytics.

---

## 🛠️ Tech Stack

### Frontend

* **Framework:** React 18 (TypeScript)
* **Bundler:** Vite
* **Styling:** Tailwind CSS & Shadcn UI
* **Charts:** Recharts
* **State Management:** TanStack Query

### Backend & ML

* **Language:** Python 3.x
* **API Framework:** Flask (CORS enabled)
* **Forecasting Models:** SARIMA, Exponential Smoothing (ETS)
* **Data Libraries:** Pandas, NumPy, Statsmodels
* **Database:** MongoDB (Planned)

---
## Demo Images

<img width="1887" height="959" alt="image" src="https://github.com/user-attachments/assets/a8902737-4edf-44d6-8dc3-64e9f08c4e58" />
<img width="1886" height="898" alt="image" src="https://github.com/user-attachments/assets/25f6ac73-a3f9-4943-abfa-ef179293eb6a" />
<img width="467" height="900" alt="image" src="https://github.com/user-attachments/assets/ae59e317-0e9b-4dfd-bf2b-91ff3365e9cb" />
<img width="1123" height="315" alt="image" src="https://github.com/user-attachments/assets/8ff2b0a5-3da9-40ea-993e-a6ec1f2e2be1" />
<img width="1889" height="862" alt="image" src="https://github.com/user-attachments/assets/e1dbd1c5-4ab5-4311-9265-2b7f07df66e5" />
<img width="1140" height="803" alt="image" src="https://github.com/user-attachments/assets/52ccd9df-3d11-4dda-af51-08c3a391e8bb" />
<img width="1170" height="792" alt="image" src="https://github.com/user-attachments/assets/502cd1ee-8daa-426c-b7f3-cf685143c6d8" />

## 📈 Project Methodology

### Phase 1: ETL & Feature Engineering

Ingesting historical sales data and engineering time-based features (seasonality, lag variables, and rolling averages) to improve model sensitivity.

### Phase 2: Model Development

A tiered modeling approach:

* **Descriptive:** Decomposing trends and seasonality.
* **Predictive:** Using SARIMA to forecast future demand with calculated confidence intervals.
* **Prescriptive:** Calculating optimal order quantities and ROP.

---

## 📂 Project Structure

```text
├── Demand-Insight/           # Main application folder
│   ├── src/                  # React Frontend (Vite)
│   ├── backend/              # Python Flask API & Logic
│   │   ├── main.py           # Model & API implementation
│   │   ├── datasets/         # CSV files (Retail & E-comm)
│   │   └── models/           # Persistent ML models
│   └── package.json          # Node.js dependencies
├── README.md                 # Project documentation
└── Project Workflow.docx     # Comprehensive methodology

```

---

## 🚦 Getting Started

### Prerequisites

* Node.js (v18+)
* Python 3.10+
* Pip (Python package manager)
* Kaggle Dataset : [retail_store_inventory.csv](https://www.kaggle.com/datasets/anirudhchauhan/retail-store-inventory-forecasting-dataset)
  
### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/sectechsociety/Demand-Forecasting-with-Time-Series-Data-for-Stock-Management.git

```


2. **Setup the Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py

```


3. **Setup the Frontend:**
```bash
cd ../Demand-Insight
npm install
npm run dev

```



---

## 📡 API Endpoints Summary

You can explore and test the API endpoints interactively via the built-in Swagger UI documentation.

* **Interactive Documentation:** [http://localhost:8000/docs](https://www.google.com/search?q=http://localhost:8000/docs)
* **Detailed Forecast:** `GET /api/forecast/<product_id>/<store_id>` — Returns detailed historical data and a 30-day demand forecast.
* **ROP Calculation:** `GET /api/calculate_rop` — Calculates the specific reorder point and safety stock for a SKU.
* **Bulk Recommendations:** `GET /api/all_recommendations` — Generates a prioritized list of all SKUs requiring restocking.
---

## 👥 Contributors

* **S Mohamed Ahsan:** System Architecture, Git Management, & Backend Logic.
* **Abishai K C:** Backend Research, Feature Analysis, & Dataset Selection.
* **Narendran K:** Frontend Foundation & UI Layout Design.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.







