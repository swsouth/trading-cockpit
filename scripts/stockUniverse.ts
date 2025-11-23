/**
 * Stock Universe Data
 *
 * Top 500+ most liquid US stocks for daily scanning
 * Sources: S&P 500, high-volume NASDAQ stocks, popular trading stocks
 */

export interface StockUniverseEntry {
  symbol: string;
  company_name: string;
  sector: string;
  data_source: string;
}

/**
 * S&P 500 Top 100 by Market Cap + High Volume Stocks
 * This covers the most liquid and actively traded stocks
 */
export const STOCK_UNIVERSE: StockUniverseEntry[] = [
  // Technology - Mega Caps
  { symbol: 'AAPL', company_name: 'Apple Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'MSFT', company_name: 'Microsoft Corporation', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'GOOGL', company_name: 'Alphabet Inc. Class A', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'GOOG', company_name: 'Alphabet Inc. Class C', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'AMZN', company_name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'NVDA', company_name: 'NVIDIA Corporation', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'META', company_name: 'Meta Platforms Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'TSLA', company_name: 'Tesla Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'AVGO', company_name: 'Broadcom Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'ORCL', company_name: 'Oracle Corporation', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'CRM', company_name: 'Salesforce Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'ADBE', company_name: 'Adobe Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'NFLX', company_name: 'Netflix Inc.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'AMD', company_name: 'Advanced Micro Devices Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'INTC', company_name: 'Intel Corporation', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'CSCO', company_name: 'Cisco Systems Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'QCOM', company_name: 'QUALCOMM Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'TXN', company_name: 'Texas Instruments Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'AMAT', company_name: 'Applied Materials Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'MU', company_name: 'Micron Technology Inc.', sector: 'Technology', data_source: 'sp500' },

  // Financials
  { symbol: 'BRK.B', company_name: 'Berkshire Hathaway Inc. Class B', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'JPM', company_name: 'JPMorgan Chase & Co.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'V', company_name: 'Visa Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'MA', company_name: 'Mastercard Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'BAC', company_name: 'Bank of America Corp.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'WFC', company_name: 'Wells Fargo & Co.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'GS', company_name: 'Goldman Sachs Group Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'MS', company_name: 'Morgan Stanley', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'C', company_name: 'Citigroup Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'BLK', company_name: 'BlackRock Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'SCHW', company_name: 'Charles Schwab Corp.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'AXP', company_name: 'American Express Co.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'SPGI', company_name: 'S&P Global Inc.', sector: 'Financial', data_source: 'sp500' },

  // Healthcare
  { symbol: 'UNH', company_name: 'UnitedHealth Group Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'JNJ', company_name: 'Johnson & Johnson', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'LLY', company_name: 'Eli Lilly and Co.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'ABBV', company_name: 'AbbVie Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'MRK', company_name: 'Merck & Co. Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'PFE', company_name: 'Pfizer Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'TMO', company_name: 'Thermo Fisher Scientific Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'ABT', company_name: 'Abbott Laboratories', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'DHR', company_name: 'Danaher Corporation', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'AMGN', company_name: 'Amgen Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'GILD', company_name: 'Gilead Sciences Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'CVS', company_name: 'CVS Health Corporation', sector: 'Healthcare', data_source: 'sp500' },

  // Consumer
  { symbol: 'WMT', company_name: 'Walmart Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'HD', company_name: 'Home Depot Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'PG', company_name: 'Procter & Gamble Co.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'KO', company_name: 'Coca-Cola Co.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'PEP', company_name: 'PepsiCo Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'COST', company_name: 'Costco Wholesale Corp.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'MCD', company_name: 'McDonald\'s Corp.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'NKE', company_name: 'Nike Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'SBUX', company_name: 'Starbucks Corporation', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'TGT', company_name: 'Target Corporation', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'LOW', company_name: 'Lowe\'s Companies Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },

  // Energy
  { symbol: 'XOM', company_name: 'Exxon Mobil Corporation', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'CVX', company_name: 'Chevron Corporation', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'COP', company_name: 'ConocoPhillips', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'SLB', company_name: 'Schlumberger NV', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'EOG', company_name: 'EOG Resources Inc.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'MPC', company_name: 'Marathon Petroleum Corp.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'PSX', company_name: 'Phillips 66', sector: 'Energy', data_source: 'sp500' },

  // Industrials
  { symbol: 'BA', company_name: 'Boeing Co.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'CAT', company_name: 'Caterpillar Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'GE', company_name: 'General Electric Co.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'HON', company_name: 'Honeywell International Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'UPS', company_name: 'United Parcel Service Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'RTX', company_name: 'RTX Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'LMT', company_name: 'Lockheed Martin Corp.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'DE', company_name: 'Deere & Co.', sector: 'Industrials', data_source: 'sp500' },

  // Communication Services
  { symbol: 'DIS', company_name: 'Walt Disney Co.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'CMCSA', company_name: 'Comcast Corporation', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'VZ', company_name: 'Verizon Communications Inc.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'T', company_name: 'AT&T Inc.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'TMUS', company_name: 'T-Mobile US Inc.', sector: 'Communication Services', data_source: 'sp500' },

  // High-Volume Growth/Meme Stocks (Popular for trading)
  { symbol: 'PLTR', company_name: 'Palantir Technologies Inc.', sector: 'Technology', data_source: 'high_volume' },
  { symbol: 'SOFI', company_name: 'SoFi Technologies Inc.', sector: 'Financial', data_source: 'high_volume' },
  { symbol: 'RIVN', company_name: 'Rivian Automotive Inc.', sector: 'Consumer Cyclical', data_source: 'high_volume' },
  { symbol: 'LCID', company_name: 'Lucid Group Inc.', sector: 'Consumer Cyclical', data_source: 'high_volume' },
  { symbol: 'NIO', company_name: 'NIO Inc.', sector: 'Consumer Cyclical', data_source: 'high_volume' },
  { symbol: 'GME', company_name: 'GameStop Corp.', sector: 'Consumer Cyclical', data_source: 'high_volume' },
  { symbol: 'AMC', company_name: 'AMC Entertainment Holdings Inc.', sector: 'Communication Services', data_source: 'high_volume' },
  { symbol: 'SNAP', company_name: 'Snap Inc.', sector: 'Communication Services', data_source: 'high_volume' },
  { symbol: 'UBER', company_name: 'Uber Technologies Inc.', sector: 'Technology', data_source: 'high_volume' },
  { symbol: 'LYFT', company_name: 'Lyft Inc.', sector: 'Technology', data_source: 'high_volume' },
  { symbol: 'COIN', company_name: 'Coinbase Global Inc.', sector: 'Financial', data_source: 'high_volume' },
  { symbol: 'RBLX', company_name: 'Roblox Corporation', sector: 'Communication Services', data_source: 'high_volume' },
  { symbol: 'ABNB', company_name: 'Airbnb Inc.', sector: 'Consumer Cyclical', data_source: 'high_volume' },
  { symbol: 'DOCU', company_name: 'DocuSign Inc.', sector: 'Technology', data_source: 'high_volume' },
  { symbol: 'ZM', company_name: 'Zoom Video Communications Inc.', sector: 'Technology', data_source: 'high_volume' },
  { symbol: 'SQ', company_name: 'Block Inc.', sector: 'Technology', data_source: 'high_volume' },
  { symbol: 'PYPL', company_name: 'PayPal Holdings Inc.', sector: 'Financial', data_source: 'high_volume' },
  { symbol: 'SHOP', company_name: 'Shopify Inc.', sector: 'Technology', data_source: 'high_volume' },
  { symbol: 'ROKU', company_name: 'Roku Inc.', sector: 'Technology', data_source: 'high_volume' },
  { symbol: 'MARA', company_name: 'Marathon Digital Holdings Inc.', sector: 'Financial', data_source: 'high_volume' },
  { symbol: 'RIOT', company_name: 'Riot Platforms Inc.', sector: 'Financial', data_source: 'high_volume' },

  // Semiconductors & AI (Hot sector)
  { symbol: 'TSM', company_name: 'Taiwan Semiconductor Manufacturing', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'ASML', company_name: 'ASML Holding NV', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'KLAC', company_name: 'KLA Corporation', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'LRCX', company_name: 'Lam Research Corporation', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'MRVL', company_name: 'Marvell Technology Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'ARM', company_name: 'Arm Holdings plc', sector: 'Technology', data_source: 'nasdaq' },

  // Additional S&P 500 Stocks
  { symbol: 'ACN', company_name: 'Accenture plc', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'INTU', company_name: 'Intuit Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'NOW', company_name: 'ServiceNow Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'IBM', company_name: 'International Business Machines', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'SNOW', company_name: 'Snowflake Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'PANW', company_name: 'Palo Alto Networks Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'CRWD', company_name: 'CrowdStrike Holdings Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'NET', company_name: 'Cloudflare Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'DDOG', company_name: 'Datadog Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'MDB', company_name: 'MongoDB Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'TEAM', company_name: 'Atlassian Corporation', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'WDAY', company_name: 'Workday Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'FTNT', company_name: 'Fortinet Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'ZS', company_name: 'Zscaler Inc.', sector: 'Technology', data_source: 'nasdaq' },

  // REITs & Real Estate
  { symbol: 'PLD', company_name: 'Prologis Inc.', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'AMT', company_name: 'American Tower Corporation', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'SPG', company_name: 'Simon Property Group Inc.', sector: 'Real Estate', data_source: 'sp500' },

  // Materials
  { symbol: 'LIN', company_name: 'Linde plc', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'APD', company_name: 'Air Products and Chemicals Inc.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'SHW', company_name: 'Sherwin-Williams Co.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'NEM', company_name: 'Newmont Corporation', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'FCX', company_name: 'Freeport-McMoRan Inc.', sector: 'Basic Materials', data_source: 'sp500' },

  // Utilities
  { symbol: 'NEE', company_name: 'NextEra Energy Inc.', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'DUK', company_name: 'Duke Energy Corporation', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'SO', company_name: 'Southern Co.', sector: 'Utilities', data_source: 'sp500' },

  // Add more stocks here to reach 500+ total
  // You can expand each sector or add additional popular trading stocks
];

/**
 * Get total count of stocks in universe
 */
export function getUniverseCount(): number {
  return STOCK_UNIVERSE.length;
}

/**
 * Get stocks by data source
 */
export function getStocksBySource(source: string): StockUniverseEntry[] {
  return STOCK_UNIVERSE.filter(stock => stock.data_source === source);
}

/**
 * Get stocks by sector
 */
export function getStocksBySector(sector: string): StockUniverseEntry[] {
  return STOCK_UNIVERSE.filter(stock => stock.sector === sector);
}
