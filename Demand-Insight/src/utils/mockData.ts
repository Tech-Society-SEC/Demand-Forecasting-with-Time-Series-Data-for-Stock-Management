import { InventoryRecord } from '@/types/inventory';

export const generateMockData = (): InventoryRecord[] => {
  const records: InventoryRecord[] = [];
  const products = ['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008'];
  const stores = ['S01', 'S02', 'S03', 'S04', 'S05'];
  const categories = ['Electronics', 'Clothing', 'Food', 'Home'];
  const regions = ['North', 'South', 'East', 'West'];
  const weather = ['Sunny', 'Rainy', 'Cloudy', 'Snowy'];
  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
  
  const startDate = new Date('2024-10-01');
  const days = 60;
  
  for (let day = 0; day < days; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    for (const product of products) {
      for (const store of stores) {
        const basePrice = 50 + Math.random() * 200;
        const discount = Math.random() * 0.3;
        const unitsSold = Math.floor(10 + Math.random() * 90);
        
        records.push({
          Date: dateStr,
          Store_ID: store,
          Product_ID: product,
          Category: categories[Math.floor(Math.random() * categories.length)],
          Region: regions[Math.floor(Math.random() * regions.length)],
          Inventory_Level: Math.floor(100 + Math.random() * 400),
          Units_Sold: unitsSold,
          Units_Ordered: Math.floor(unitsSold * (1.1 + Math.random() * 0.2)),
          Demand_Forecast: Math.floor(unitsSold * (0.95 + Math.random() * 0.1)),
          Price: parseFloat(basePrice.toFixed(2)),
          Discount: parseFloat(discount.toFixed(2)),
          Weather_Condition: weather[Math.floor(Math.random() * weather.length)],
          Holiday_Promotion: Math.random() > 0.9 ? 1 : 0,
          Competitor_Pricing: parseFloat((basePrice * (0.9 + Math.random() * 0.2)).toFixed(2)),
          Seasonality: seasons[Math.floor(Math.random() * seasons.length)]
        });
      }
    }
  }
  
  return records;
};

export const parseCSV = (csvText: string): InventoryRecord[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const record: any = {};
    
    headers.forEach((header, index) => {
      const key = header.trim();
      const value = values[index]?.trim();
      
      if (['Inventory_Level', 'Units_Sold', 'Units_Ordered', 'Demand_Forecast', 'Holiday_Promotion'].includes(key)) {
        record[key] = parseInt(value) || 0;
      } else if (['Price', 'Discount', 'Competitor_Pricing'].includes(key)) {
        record[key] = parseFloat(value) || 0;
      } else {
        record[key] = value || '';
      }
    });
    
    return record as InventoryRecord;
  });
};
