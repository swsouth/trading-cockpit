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
  { symbol: 'D', company_name: 'Dominion Energy Inc.', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'AEP', company_name: 'American Electric Power', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'EXC', company_name: 'Exelon Corporation', sector: 'Utilities', data_source: 'sp500' },

  // More Technology - Cloud & Software
  { symbol: 'OKTA', company_name: 'Okta Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'TWLO', company_name: 'Twilio Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'SPLK', company_name: 'Splunk Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'VEEV', company_name: 'Veeva Systems Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'CCI', company_name: 'Crown Castle Inc.', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'EQIX', company_name: 'Equinix Inc.', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'DLR', company_name: 'Digital Realty Trust Inc.', sector: 'Real Estate', data_source: 'sp500' },

  // More Financials
  { symbol: 'USB', company_name: 'U.S. Bancorp', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'PNC', company_name: 'PNC Financial Services', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'TFC', company_name: 'Truist Financial Corporation', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'COF', company_name: 'Capital One Financial Corp.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'AON', company_name: 'Aon plc', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'MMC', company_name: 'Marsh & McLennan Companies', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'AIG', company_name: 'American International Group', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'MET', company_name: 'MetLife Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'PRU', company_name: 'Prudential Financial Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'AFL', company_name: 'Aflac Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'ALL', company_name: 'Allstate Corporation', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'TRV', company_name: 'Travelers Companies Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'PGR', company_name: 'Progressive Corporation', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'CB', company_name: 'Chubb Limited', sector: 'Financial', data_source: 'sp500' },

  // More Healthcare
  { symbol: 'ISRG', company_name: 'Intuitive Surgical Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'VRTX', company_name: 'Vertex Pharmaceuticals Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'REGN', company_name: 'Regeneron Pharmaceuticals', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'BSX', company_name: 'Boston Scientific Corporation', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'SYK', company_name: 'Stryker Corporation', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'ELV', company_name: 'Elevance Health Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'CI', company_name: 'Cigna Group', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'HUM', company_name: 'Humana Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'ZTS', company_name: 'Zoetis Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'BIIB', company_name: 'Biogen Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'IDXX', company_name: 'IDEXX Laboratories Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'IQV', company_name: 'IQVIA Holdings Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'A', company_name: 'Agilent Technologies Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'DXCM', company_name: 'DexCom Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'ALGN', company_name: 'Align Technology Inc.', sector: 'Healthcare', data_source: 'sp500' },

  // More Consumer Cyclical
  { symbol: 'BKNG', company_name: 'Booking Holdings Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'MAR', company_name: 'Marriott International Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'HLT', company_name: 'Hilton Worldwide Holdings', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'YUM', company_name: 'Yum! Brands Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'CMG', company_name: 'Chipotle Mexican Grill Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'ORLY', company_name: 'O\'Reilly Automotive Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'AZO', company_name: 'AutoZone Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'GM', company_name: 'General Motors Co.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'F', company_name: 'Ford Motor Co.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'DHI', company_name: 'D.R. Horton Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'LEN', company_name: 'Lennar Corporation', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'NVR', company_name: 'NVR Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'RCL', company_name: 'Royal Caribbean Cruises', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'CCL', company_name: 'Carnival Corporation', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'NCLH', company_name: 'Norwegian Cruise Line Holdings', sector: 'Consumer Cyclical', data_source: 'nasdaq' },

  // More Consumer Defensive
  { symbol: 'PM', company_name: 'Philip Morris International', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'MO', company_name: 'Altria Group Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'CL', company_name: 'Colgate-Palmolive Co.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'KMB', company_name: 'Kimberly-Clark Corporation', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'GIS', company_name: 'General Mills Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'K', company_name: 'Kellogg Co.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'HSY', company_name: 'Hershey Co.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'MDLZ', company_name: 'Mondelez International Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'STZ', company_name: 'Constellation Brands Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'TAP', company_name: 'Molson Coors Beverage Co.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'KR', company_name: 'Kroger Co.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'SYY', company_name: 'Sysco Corporation', sector: 'Consumer Defensive', data_source: 'sp500' },

  // More Industrials
  { symbol: 'UNP', company_name: 'Union Pacific Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'CSX', company_name: 'CSX Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'NSC', company_name: 'Norfolk Southern Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'FDX', company_name: 'FedEx Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'MMM', company_name: '3M Co.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'EMR', company_name: 'Emerson Electric Co.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'ETN', company_name: 'Eaton Corporation plc', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'ITW', company_name: 'Illinois Tool Works Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'PH', company_name: 'Parker-Hannifin Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'ROK', company_name: 'Rockwell Automation Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'JCI', company_name: 'Johnson Controls International', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'WM', company_name: 'Waste Management Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'RSG', company_name: 'Republic Services Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'GD', company_name: 'General Dynamics Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'NOC', company_name: 'Northrop Grumman Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'LHX', company_name: 'L3Harris Technologies Inc.', sector: 'Industrials', data_source: 'sp500' },

  // More Energy
  { symbol: 'OXY', company_name: 'Occidental Petroleum Corp.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'HAL', company_name: 'Halliburton Co.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'BKR', company_name: 'Baker Hughes Co.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'VLO', company_name: 'Valero Energy Corporation', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'KMI', company_name: 'Kinder Morgan Inc.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'WMB', company_name: 'Williams Companies Inc.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'OKE', company_name: 'ONEOK Inc.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'DVN', company_name: 'Devon Energy Corporation', sector: 'Energy', data_source: 'sp500' },

  // More Materials
  { symbol: 'DD', company_name: 'DuPont de Nemours Inc.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'ECL', company_name: 'Ecolab Inc.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'DOW', company_name: 'Dow Inc.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'PPG', company_name: 'PPG Industries Inc.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'NUE', company_name: 'Nucor Corporation', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'STLD', company_name: 'Steel Dynamics Inc.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'ALB', company_name: 'Albemarle Corporation', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'VMC', company_name: 'Vulcan Materials Co.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'MLM', company_name: 'Martin Marietta Materials', sector: 'Basic Materials', data_source: 'sp500' },

  // High-Volume Tech & Growth
  { symbol: 'DASH', company_name: 'DoorDash Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'SPOT', company_name: 'Spotify Technology SA', sector: 'Communication Services', data_source: 'nasdaq' },
  { symbol: 'HOOD', company_name: 'Robinhood Markets Inc.', sector: 'Financial', data_source: 'nasdaq' },
  { symbol: 'AFRM', company_name: 'Affirm Holdings Inc.', sector: 'Financial', data_source: 'nasdaq' },
  { symbol: 'U', company_name: 'Unity Software Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'PATH', company_name: 'UiPath Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'TTWO', company_name: 'Take-Two Interactive Software', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'EA', company_name: 'Electronic Arts Inc.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'PINS', company_name: 'Pinterest Inc.', sector: 'Communication Services', data_source: 'nasdaq' },
  { symbol: 'TWTR', company_name: 'Twitter Inc.', sector: 'Communication Services', data_source: 'high_volume' },
  { symbol: 'SE', company_name: 'Sea Limited', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'CHWY', company_name: 'Chewy Inc.', sector: 'Consumer Cyclical', data_source: 'nasdaq' },
  { symbol: 'W', company_name: 'Wayfair Inc.', sector: 'Consumer Cyclical', data_source: 'nasdaq' },
  { symbol: 'PTON', company_name: 'Peloton Interactive Inc.', sector: 'Consumer Cyclical', data_source: 'nasdaq' },
  { symbol: 'FSLY', company_name: 'Fastly Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'Bill', company_name: 'Bill.com Holdings Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'ENPH', company_name: 'Enphase Energy Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'SEDG', company_name: 'SolarEdge Technologies Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'FSLR', company_name: 'First Solar Inc.', sector: 'Technology', data_source: 'sp500' },

  // Additional S&P 500 - Technology & Software
  { symbol: 'ADSK', company_name: 'Autodesk Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'CDNS', company_name: 'Cadence Design Systems', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'SNPS', company_name: 'Synopsys Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'ROP', company_name: 'Roper Technologies Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'KEYS', company_name: 'Keysight Technologies Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'MPWR', company_name: 'Monolithic Power Systems', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'ON', company_name: 'ON Semiconductor Corporation', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'TER', company_name: 'Teradyne Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'NTAP', company_name: 'NetApp Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'HPQ', company_name: 'HP Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'HPE', company_name: 'Hewlett Packard Enterprise', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'DELL', company_name: 'Dell Technologies Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'WDC', company_name: 'Western Digital Corporation', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'STX', company_name: 'Seagate Technology Holdings', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'SWKS', company_name: 'Skyworks Solutions Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'QRVO', company_name: 'Qorvo Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'PSTG', company_name: 'Pure Storage Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'SMCI', company_name: 'Super Micro Computer Inc.', sector: 'Technology', data_source: 'nasdaq' },

  // Additional Healthcare & Biotech
  { symbol: 'BMY', company_name: 'Bristol-Myers Squibb Co.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'MRNA', company_name: 'Moderna Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'BNTX', company_name: 'BioNTech SE', sector: 'Healthcare', data_source: 'nasdaq' },
  { symbol: 'MDT', company_name: 'Medtronic plc', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'EW', company_name: 'Edwards Lifesciences Corp.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'ILMN', company_name: 'Illumina Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'HOLX', company_name: 'Hologic Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'BAX', company_name: 'Baxter International Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'BDX', company_name: 'Becton Dickinson and Co.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'WAT', company_name: 'Waters Corporation', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'TECH', company_name: 'Bio-Techne Corporation', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'PKI', company_name: 'PerkinElmer Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'EXAS', company_name: 'Exact Sciences Corporation', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'PODD', company_name: 'Insulet Corporation', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'INCY', company_name: 'Incyte Corporation', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'JAZZ', company_name: 'Jazz Pharmaceuticals plc', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'NBIX', company_name: 'Neurocrine Biosciences Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'ALNY', company_name: 'Alnylam Pharmaceuticals Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'SGEN', company_name: 'Seagen Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'BMRN', company_name: 'BioMarin Pharmaceutical Inc.', sector: 'Healthcare', data_source: 'sp500' },

  // Additional Financials & Insurance
  { symbol: 'AMP', company_name: 'Ameriprise Financial Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'TROW', company_name: 'T. Rowe Price Group Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'BEN', company_name: 'Franklin Resources Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'IVZ', company_name: 'Invesco Ltd.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'NTRS', company_name: 'Northern Trust Corporation', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'STT', company_name: 'State Street Corporation', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'FIS', company_name: 'Fidelity National Information', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'FISV', company_name: 'Fiserv Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'SYF', company_name: 'Synchrony Financial', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'ALLY', company_name: 'Ally Financial Inc.', sector: 'Financial', data_source: 'nasdaq' },
  { symbol: 'RF', company_name: 'Regions Financial Corporation', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'CFG', company_name: 'Citizens Financial Group Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'HBAN', company_name: 'Huntington Bancshares Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'KEY', company_name: 'KeyCorp', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'FITB', company_name: 'Fifth Third Bancorp', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'MTB', company_name: 'M&T Bank Corporation', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'ZION', company_name: 'Zions Bancorporation NA', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'CMA', company_name: 'Comerica Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'WBS', company_name: 'Webster Financial Corporation', sector: 'Financial', data_source: 'nasdaq' },

  // Additional Consumer - Retail & E-commerce
  { symbol: 'EBAY', company_name: 'eBay Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'ETSY', company_name: 'Etsy Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'MELI', company_name: 'MercadoLibre Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'BBY', company_name: 'Best Buy Co. Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'ROST', company_name: 'Ross Stores Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'TJX', company_name: 'TJX Companies Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'DLTR', company_name: 'Dollar Tree Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'DG', company_name: 'Dollar General Corporation', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'ULTA', company_name: 'Ulta Beauty Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'EL', company_name: 'Estee Lauder Companies Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'TPR', company_name: 'Tapestry Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'RL', company_name: 'Ralph Lauren Corporation', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'VFC', company_name: 'V.F. Corporation', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'HAS', company_name: 'Hasbro Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'MAT', company_name: 'Mattel Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'WHR', company_name: 'Whirlpool Corporation', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'LVS', company_name: 'Las Vegas Sands Corp.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'WYNN', company_name: 'Wynn Resorts Ltd.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'MGM', company_name: 'MGM Resorts International', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'PENN', company_name: 'PENN Entertainment Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },

  // Additional Communication Services & Media
  { symbol: 'PARA', company_name: 'Paramount Global', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'WBD', company_name: 'Warner Bros. Discovery Inc.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'FOX', company_name: 'Fox Corporation', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'FOXA', company_name: 'Fox Corporation Class A', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'OMC', company_name: 'Omnicom Group Inc.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'IPG', company_name: 'Interpublic Group of Cos.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'MTCH', company_name: 'Match Group Inc.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'NWSA', company_name: 'News Corporation', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'NWS', company_name: 'News Corporation Class B', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'NYT', company_name: 'New York Times Co.', sector: 'Communication Services', data_source: 'nasdaq' },

  // Additional Industrials & Aerospace
  { symbol: 'TDG', company_name: 'TransDigm Group Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'CARR', company_name: 'Carrier Global Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'OTIS', company_name: 'Otis Worldwide Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'PCAR', company_name: 'PACCAR Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'IR', company_name: 'Ingersoll Rand Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'CPRT', company_name: 'Copart Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'FAST', company_name: 'Fastenal Co.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'PAYX', company_name: 'Paychex Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'ODFL', company_name: 'Old Dominion Freight Line', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'CHRW', company_name: 'C.H. Robinson Worldwide', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'JBHT', company_name: 'J.B. Hunt Transport Services', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'EXPD', company_name: 'Expeditors International', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'XYL', company_name: 'Xylem Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'IEX', company_name: 'IDEX Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'FTV', company_name: 'Fortive Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'GNRC', company_name: 'Generac Holdings Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'BLDR', company_name: 'Builders FirstSource Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'SNA', company_name: 'Snap-on Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'DOV', company_name: 'Dover Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'SWK', company_name: 'Stanley Black & Decker Inc.', sector: 'Industrials', data_source: 'sp500' },

  // Additional Energy & Renewables
  { symbol: 'APA', company_name: 'APA Corporation', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'FANG', company_name: 'Diamondback Energy Inc.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'PXD', company_name: 'Pioneer Natural Resources', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'CTRA', company_name: 'Coterra Energy Inc.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'EQT', company_name: 'EQT Corporation', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'LNG', company_name: 'Cheniere Energy Inc.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'TRGP', company_name: 'Targa Resources Corp.', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'RUN', company_name: 'Sunrun Inc.', sector: 'Technology', data_source: 'nasdaq' },

  // Additional Materials & Chemicals
  { symbol: 'CE', company_name: 'Celanese Corporation', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'CF', company_name: 'CF Industries Holdings Inc.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'MOS', company_name: 'Mosaic Co.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'FMC', company_name: 'FMC Corporation', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'EMN', company_name: 'Eastman Chemical Co.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'IFF', company_name: 'International Flavors', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'CTVA', company_name: 'Corteva Inc.', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'SW', company_name: 'Smurfit WestRock plc', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'PKG', company_name: 'Packaging Corporation', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'AMCR', company_name: 'Amcor plc', sector: 'Basic Materials', data_source: 'sp500' },
  { symbol: 'IP', company_name: 'International Paper Co.', sector: 'Basic Materials', data_source: 'sp500' },

  // Additional Consumer Staples
  { symbol: 'TSN', company_name: 'Tyson Foods Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'CPB', company_name: 'Campbell Soup Co.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'HRL', company_name: 'Hormel Foods Corporation', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'CAG', company_name: 'Conagra Brands Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'MKC', company_name: 'McCormick & Co. Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'SJM', company_name: 'J.M. Smucker Co.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'CHD', company_name: 'Church & Dwight Co. Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'CLX', company_name: 'Clorox Co.', sector: 'Consumer Defensive', data_source: 'sp500' },

  // Additional REITs & Real Estate
  { symbol: 'PSA', company_name: 'Public Storage', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'O', company_name: 'Realty Income Corporation', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'WELL', company_name: 'Welltower Inc.', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'VICI', company_name: 'VICI Properties Inc.', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'AVB', company_name: 'AvalonBay Communities Inc.', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'EQR', company_name: 'Equity Residential', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'ARE', company_name: 'Alexandria Real Estate', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'SBAC', company_name: 'SBA Communications Corp.', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'INVH', company_name: 'Invitation Homes Inc.', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'VTR', company_name: 'Ventas Inc.', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'ESS', company_name: 'Essex Property Trust Inc.', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'MAA', company_name: 'Mid-America Apartment', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'KIM', company_name: 'Kimco Realty Corporation', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'REG', company_name: 'Regency Centers Corporation', sector: 'Real Estate', data_source: 'sp500' },
  { symbol: 'FRT', company_name: 'Federal Realty Investment', sector: 'Real Estate', data_source: 'sp500' },

  // Additional Utilities
  { symbol: 'PCG', company_name: 'PG&E Corporation', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'ED', company_name: 'Consolidated Edison Inc.', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'XEL', company_name: 'Xcel Energy Inc.', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'WEC', company_name: 'WEC Energy Group Inc.', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'ES', company_name: 'Eversource Energy', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'AWK', company_name: 'American Water Works Co.', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'PEG', company_name: 'Public Service Enterprise', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'SRE', company_name: 'Sempra', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'AEE', company_name: 'Ameren Corporation', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'CMS', company_name: 'CMS Energy Corporation', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'DTE', company_name: 'DTE Energy Co.', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'PPL', company_name: 'PPL Corporation', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'CNP', company_name: 'CenterPoint Energy Inc.', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'NI', company_name: 'NiSource Inc.', sector: 'Utilities', data_source: 'sp500' },
  { symbol: 'ETR', company_name: 'Entergy Corporation', sector: 'Utilities', data_source: 'sp500' },

  // High-Volume Crypto & Fintech
  { symbol: 'MSTR', company_name: 'MicroStrategy Inc.', sector: 'Technology', data_source: 'high_volume' },
  { symbol: 'UPST', company_name: 'Upstart Holdings Inc.', sector: 'Financial', data_source: 'nasdaq' },
  { symbol: 'LC', company_name: 'LendingClub Corporation', sector: 'Financial', data_source: 'nasdaq' },

  // High-Volume EVs & Autonomous
  { symbol: 'XPEV', company_name: 'XPeng Inc.', sector: 'Consumer Cyclical', data_source: 'nasdaq' },
  { symbol: 'LI', company_name: 'Li Auto Inc.', sector: 'Consumer Cyclical', data_source: 'nasdaq' },

  // Additional High-Volume Tech
  { symbol: 'IONQ', company_name: 'IonQ Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'RGTI', company_name: 'Rigetti Computing Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'QUBT', company_name: 'Quantum Computing Inc.', sector: 'Technology', data_source: 'nasdaq' },

  // Additional S&P 500 - Diversified
  { symbol: 'BRO', company_name: 'Brown & Brown Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'WRB', company_name: 'W. R. Berkley Corporation', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'L', company_name: 'Loews Corporation', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'GL', company_name: 'Globe Life Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'RJF', company_name: 'Raymond James Financial', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'CBOE', company_name: 'Cboe Global Markets Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'CME', company_name: 'CME Group Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'ICE', company_name: 'Intercontinental Exchange', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'NDAQ', company_name: 'Nasdaq Inc.', sector: 'Financial', data_source: 'sp500' },
  { symbol: 'MSCI', company_name: 'MSCI Inc.', sector: 'Financial', data_source: 'sp500' },

  // More Technology
  { symbol: 'ANET', company_name: 'Arista Networks Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'MCHP', company_name: 'Microchip Technology Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'NXPI', company_name: 'NXP Semiconductors NV', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'ADI', company_name: 'Analog Devices Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'APH', company_name: 'Amphenol Corporation', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'TEL', company_name: 'TE Connectivity Ltd.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'GLW', company_name: 'Corning Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'ZBRA', company_name: 'Zebra Technologies Corp.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'AKAM', company_name: 'Akamai Technologies Inc.', sector: 'Technology', data_source: 'sp500' },

  // More Healthcare
  { symbol: 'CAH', company_name: 'Cardinal Health Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'MCK', company_name: 'McKesson Corporation', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'COR', company_name: 'Cencora Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'COO', company_name: 'Cooper Companies Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'RMD', company_name: 'ResMed Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'STE', company_name: 'STERIS plc', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'HCA', company_name: 'HCA Healthcare Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'UHS', company_name: 'Universal Health Services', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'DVA', company_name: 'DaVita Inc.', sector: 'Healthcare', data_source: 'sp500' },
  { symbol: 'LH', company_name: 'Labcorp Holdings Inc.', sector: 'Healthcare', data_source: 'sp500' },

  // More Consumer
  { symbol: 'POOL', company_name: 'Pool Corporation', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'DPZ', company_name: 'Domino\'s Pizza Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'QSR', company_name: 'Restaurant Brands International', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'WEN', company_name: 'Wendy\'s Co.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'DRI', company_name: 'Darden Restaurants Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'TXRH', company_name: 'Texas Roadhouse Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'WING', company_name: 'Wingstop Inc.', sector: 'Consumer Cyclical', data_source: 'sp500' },
  { symbol: 'BROS', company_name: 'Dutch Bros Inc.', sector: 'Consumer Cyclical', data_source: 'nasdaq' },
  { symbol: 'CAVA', company_name: 'CAVA Group Inc.', sector: 'Consumer Cyclical', data_source: 'nasdaq' },
  { symbol: 'SHAK', company_name: 'Shake Shack Inc.', sector: 'Consumer Cyclical', data_source: 'nasdaq' },

  // More Industrials
  { symbol: 'VLTO', company_name: 'Veralto Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'VMI', company_name: 'Valmont Industries Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'AOS', company_name: 'A. O. Smith Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'ALLE', company_name: 'Allegion plc', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'AME', company_name: 'AMETEK Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'LDOS', company_name: 'Leidos Holdings Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'TXT', company_name: 'Textron Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'HWM', company_name: 'Howmet Aerospace Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'HEI', company_name: 'HEICO Corporation', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'DAL', company_name: 'Delta Air Lines Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'UAL', company_name: 'United Airlines Holdings', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'AAL', company_name: 'American Airlines Group', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'LUV', company_name: 'Southwest Airlines Co.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'ALK', company_name: 'Alaska Air Group Inc.', sector: 'Industrials', data_source: 'sp500' },
  { symbol: 'JBLU', company_name: 'JetBlue Airways Corporation', sector: 'Industrials', data_source: 'nasdaq' },

  // More Communication Services
  { symbol: 'LUMN', company_name: 'Lumen Technologies Inc.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'SIRI', company_name: 'Sirius XM Holdings Inc.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'WMG', company_name: 'Warner Music Group Corp.', sector: 'Communication Services', data_source: 'nasdaq' },

  // More Energy
  { symbol: 'TPL', company_name: 'Texas Pacific Land Corporation', sector: 'Energy', data_source: 'nasdaq' },
  { symbol: 'CQP', company_name: 'Cheniere Energy Partners', sector: 'Energy', data_source: 'nasdaq' },
  { symbol: 'AM', company_name: 'Antero Midstream Corporation', sector: 'Energy', data_source: 'sp500' },

  // More Materials
  { symbol: 'GOLD', company_name: 'Barrick Gold Corporation', sector: 'Basic Materials', data_source: 'nasdaq' },
  { symbol: 'AEM', company_name: 'Agnico Eagle Mines Ltd.', sector: 'Basic Materials', data_source: 'nasdaq' },
  { symbol: 'WPM', company_name: 'Wheaton Precious Metals', sector: 'Basic Materials', data_source: 'nasdaq' },
  { symbol: 'FNV', company_name: 'Franco-Nevada Corporation', sector: 'Basic Materials', data_source: 'nasdaq' },

  // Final additions to reach 500
  { symbol: 'BILL', company_name: 'Bill.com Holdings Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'GFS', company_name: 'GlobalFoundries Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'SMMT', company_name: 'Summit Therapeutics Inc.', sector: 'Healthcare', data_source: 'nasdaq' },
  { symbol: 'RDDT', company_name: 'Reddit Inc.', sector: 'Communication Services', data_source: 'nasdaq' },
  { symbol: 'HIMS', company_name: 'Hims & Hers Health Inc.', sector: 'Healthcare', data_source: 'nasdaq' },
  { symbol: 'CSGP', company_name: 'CoStar Group Inc.', sector: 'Technology', data_source: 'sp500' },
  { symbol: 'TOST', company_name: 'Toast Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'KVUE', company_name: 'Kenvue Inc.', sector: 'Consumer Defensive', data_source: 'sp500' },
  { symbol: 'GTLB', company_name: 'GitLab Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'AXON', company_name: 'Axon Enterprise Inc.', sector: 'Industrials', data_source: 'sp500' },
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
