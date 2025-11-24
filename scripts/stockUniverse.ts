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
  { symbol: 'HES', company_name: 'Hess Corporation', sector: 'Energy', data_source: 'sp500' },
  { symbol: 'MRO', company_name: 'Marathon Oil Corporation', sector: 'Energy', data_source: 'sp500' },

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
  { symbol: 'ATVI', company_name: 'Activision Blizzard Inc.', sector: 'Communication Services', data_source: 'sp500' },
  { symbol: 'PINS', company_name: 'Pinterest Inc.', sector: 'Communication Services', data_source: 'nasdaq' },
  { symbol: 'TWTR', company_name: 'Twitter Inc.', sector: 'Communication Services', data_source: 'high_volume' },
  { symbol: 'SE', company_name: 'Sea Limited', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'RIVN', company_name: 'Rivian Automotive Inc.', sector: 'Consumer Cyclical', data_source: 'high_volume' },
  { symbol: 'CHWY', company_name: 'Chewy Inc.', sector: 'Consumer Cyclical', data_source: 'nasdaq' },
  { symbol: 'W', company_name: 'Wayfair Inc.', sector: 'Consumer Cyclical', data_source: 'nasdaq' },
  { symbol: 'PTON', company_name: 'Peloton Interactive Inc.', sector: 'Consumer Cyclical', data_source: 'nasdaq' },
  { symbol: 'FSLY', company_name: 'Fastly Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'Bill', company_name: 'Bill.com Holdings Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'ENPH', company_name: 'Enphase Energy Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'SEDG', company_name: 'SolarEdge Technologies Inc.', sector: 'Technology', data_source: 'nasdaq' },
  { symbol: 'FSLR', company_name: 'First Solar Inc.', sector: 'Technology', data_source: 'sp500' },
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
