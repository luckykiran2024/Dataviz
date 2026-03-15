/* ======================================================
   Sample Datasets — Built-in data for instant exploration
   ====================================================== */

export const sampleDatasets = [
  {
    id: 'sales',
    name: 'Sales Performance',
    icon: '📊',
    description: 'Quarterly sales data across regions and products',
    generator: () => {
      const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
      const products = ['Electronics', 'Clothing', 'Food & Beverage', 'Home & Garden', 'Sports'];
      const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025'];
      const rows = [];
      for (const region of regions) {
        for (const product of products) {
          for (const quarter of quarters) {
            rows.push({
              Region: region,
              Product: product,
              Quarter: quarter,
              Revenue: Math.round(50000 + Math.random() * 450000),
              Units: Math.round(100 + Math.random() * 9900),
              Profit: Math.round(5000 + Math.random() * 95000),
              'Growth %': Math.round((Math.random() * 40 - 10) * 10) / 10,
              'Customer Count': Math.round(50 + Math.random() * 500)
            });
          }
        }
      }
      return rows;
    }
  },
  {
    id: 'population',
    name: 'World Population',
    icon: '🌍',
    description: 'Population statistics by country with demographics',
    generator: () => {
      const countries = [
        { name: 'China', continent: 'Asia', pop: 1412, gdp: 17963, area: 9597 },
        { name: 'India', continent: 'Asia', pop: 1408, gdp: 3385, area: 3287 },
        { name: 'United States', continent: 'North America', pop: 331, gdp: 25462, area: 9834 },
        { name: 'Indonesia', continent: 'Asia', pop: 274, gdp: 1319, area: 1905 },
        { name: 'Pakistan', continent: 'Asia', pop: 229, gdp: 376, area: 882 },
        { name: 'Brazil', continent: 'South America', pop: 215, gdp: 1920, area: 8516 },
        { name: 'Nigeria', continent: 'Africa', pop: 218, gdp: 477, area: 924 },
        { name: 'Bangladesh', continent: 'Asia', pop: 169, gdp: 460, area: 148 },
        { name: 'Russia', continent: 'Europe', pop: 144, gdp: 2240, area: 17098 },
        { name: 'Mexico', continent: 'North America', pop: 130, gdp: 1322, area: 1964 },
        { name: 'Japan', continent: 'Asia', pop: 125, gdp: 4231, area: 378 },
        { name: 'Germany', continent: 'Europe', pop: 84, gdp: 4256, area: 357 },
        { name: 'United Kingdom', continent: 'Europe', pop: 67, gdp: 3198, area: 243 },
        { name: 'France', continent: 'Europe', pop: 66, gdp: 2937, area: 551 },
        { name: 'Italy', continent: 'Europe', pop: 60, gdp: 2107, area: 301 },
        { name: 'Canada', continent: 'North America', pop: 39, gdp: 2140, area: 9985 },
        { name: 'Australia', continent: 'Oceania', pop: 26, gdp: 1675, area: 7692 },
        { name: 'South Korea', continent: 'Asia', pop: 52, gdp: 1804, area: 100 },
        { name: 'Spain', continent: 'Europe', pop: 47, gdp: 1400, area: 506 },
        { name: 'Argentina', continent: 'South America', pop: 46, gdp: 632, area: 2780 },
      ];
      return countries.map(c => ({
        Country: c.name,
        Continent: c.continent,
        'Population (M)': c.pop,
        'GDP (B USD)': c.gdp,
        'Area (K km²)': c.area,
        'GDP per Capita': Math.round(c.gdp * 1000 / c.pop),
        'Pop Density': Math.round(c.pop * 1000 / c.area),
        'Life Expectancy': Math.round(65 + Math.random() * 20),
        'Literacy Rate': Math.round(75 + Math.random() * 25),
      }));
    }
  },
  {
    id: 'weather',
    name: 'Weather Data',
    icon: '🌤️',
    description: 'Monthly weather statistics for major cities',
    generator: () => {
      const cities = [
        { name: 'New York', lat: 40.7 },
        { name: 'London', lat: 51.5 },
        { name: 'Tokyo', lat: 35.7 },
        { name: 'Sydney', lat: -33.9 },
        { name: 'Dubai', lat: 25.1 },
        { name: 'São Paulo', lat: -23.5 },
        { name: 'Mumbai', lat: 19.1 },
        { name: 'Paris', lat: 48.9 },
      ];
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const rows = [];
      for (const city of cities) {
        for (let m = 0; m < 12; m++) {
          const isSouthern = city.lat < 0;
          const summerOffset = isSouthern ? 6 : 0;
          const warmth = Math.sin(((m + summerOffset) / 12) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
          const baseTemp = city.lat > 0 ? 30 - Math.abs(city.lat) * 0.3 : 25;
          rows.push({
            City: city.name,
            Month: months[m],
            'Avg Temp (°C)': Math.round((baseTemp - 15 + warmth * 25) * 10) / 10,
            'Max Temp (°C)': Math.round((baseTemp - 10 + warmth * 30) * 10) / 10,
            'Rainfall (mm)': Math.round(20 + Math.random() * 200),
            'Humidity (%)': Math.round(40 + warmth * 30 + Math.random() * 20),
            'Wind Speed (km/h)': Math.round(5 + Math.random() * 30),
            'Sunny Days': Math.round(10 + Math.random() * 20),
          });
        }
      }
      return rows;
    }
  },
  {
    id: 'stocks',
    name: 'Stock Market',
    icon: '📈',
    description: 'Monthly stock performance for tech companies',
    generator: () => {
      const companies = ['Apple', 'Google', 'Microsoft', 'Amazon', 'Tesla', 'Meta', 'Netflix', 'NVIDIA'];
      const months = [];
      for (let y = 2023; y <= 2025; y++) {
        for (let m = 1; m <= 12; m++) {
          if (y === 2025 && m > 3) break;
          months.push(`${y}-${String(m).padStart(2, '0')}`);
        }
      }
      const rows = [];
      for (const company of companies) {
        let price = 100 + Math.random() * 200;
        for (const month of months) {
          price = Math.max(20, price + (Math.random() - 0.45) * 30);
          rows.push({
            Company: company,
            Month: month,
            'Close Price': Math.round(price * 100) / 100,
            Volume: Math.round(1000000 + Math.random() * 50000000),
            'Market Cap (B)': Math.round(price * (5 + Math.random() * 20) * 100) / 100,
            'P/E Ratio': Math.round((15 + Math.random() * 40) * 10) / 10,
            Change: Math.round((Math.random() * 20 - 10) * 100) / 100,
          });
        }
      }
      return rows;
    }
  }
];
