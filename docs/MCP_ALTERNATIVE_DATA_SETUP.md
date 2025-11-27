# Alternative Data MCP Servers Setup Guide

This guide covers the setup of three high-value MCP servers that enable alternative data collection and research capabilities for the Personal Trading Cockpit.

## Overview

We've integrated three powerful MCP servers:

1. **Firecrawl** - Web scraping for earnings transcripts, financial news, analyst reports
2. **Exa** - AI-powered search engine for market research and intelligence gathering
3. **Kaggle** - Access to datasets, models, and competitions for ML/backtesting

## Prerequisites

- Node.js v18 or higher
- Claude Code or Claude Desktop
- Active internet connection

## 1. Firecrawl MCP Server Setup

### What It Does
- Scrapes earnings call transcripts and analyst reports
- Extracts data from financial news sites (Bloomberg, Reuters, etc.)
- Pulls company fundamentals from financial websites
- Gathers social sentiment from trading forums/Reddit

### Getting Your API Key

1. Visit [https://firecrawl.dev/app/api-keys](https://firecrawl.dev/app/api-keys)
2. Create a free account or sign in
3. Navigate to the API Keys section
4. Click "Create New API Key"
5. Copy the key (starts with `fc-`)

### Add to Environment

Edit your `.env.local` file:

```bash
FIRECRAWL_API_KEY=fc-your-actual-api-key-here
```

### Pricing

Firecrawl offers a free tier with limited credits. Check [Firecrawl pricing](https://www.firecrawl.dev/pricing) for details.

### Available Tools

Once configured, you can use Firecrawl through Claude Code with commands like:
- "Scrape the latest earnings transcript for AAPL from Seeking Alpha"
- "Extract analyst ratings from this URL: [financial news URL]"
- "Crawl Bloomberg for recent articles about semiconductor stocks"

### Documentation
- [Firecrawl MCP Server Docs](https://docs.firecrawl.dev/mcp-server)
- [GitHub Repository](https://github.com/mendableai/firecrawl-mcp-server)

## 2. Exa MCP Server Setup

### What It Does
- AI-powered web search optimized for research
- Deep search with query expansion
- Company research and analysis
- LinkedIn search capabilities
- URL content extraction

### Getting Your API Key

1. Visit [https://dashboard.exa.ai/api-keys](https://dashboard.exa.ai/api-keys)
2. Sign up for an account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key for use in your environment

### Add to Environment

Edit your `.env.local` file:

```bash
EXA_API_KEY=your-exa-api-key-here
```

### Pricing

Exa offers a free tier with search credits. Visit [Exa pricing](https://exa.ai/pricing) for tier details.

### Available Tools

- `web_search_exa` - Real-time web searches
- `deep_search_exa` - Deep web search with query expansion
- `company_research` - Comprehensive company research
- `linkedin_search` - Search LinkedIn profiles and companies

### Example Usage

Through Claude Code:
- "Use Exa to search for the latest Fed policy changes and their impact on tech stocks"
- "Deep search for sentiment on Tesla's Q4 earnings"
- "Research Microsoft's AI strategy and competitive position"

### Documentation
- [Exa MCP Docs](https://docs.exa.ai/examples/exa-mcp)
- [GitHub Repository](https://github.com/exa-labs/exa-mcp-server)

## 3. Kaggle MCP Server Setup

### What It Does
- Access thousands of financial datasets
- Download pre-trained ML models
- Browse Kaggle competitions
- Search and download notebooks/kernels
- Alternative data sources (satellite imagery, credit card data, etc.)

### Getting Your Credentials

1. Visit [https://www.kaggle.com/settings/account](https://www.kaggle.com/settings/account)
2. Log in or create a free account
3. Scroll to the "API" section
4. Click "Create New API Token"
5. A `kaggle.json` file will download automatically

### Install Kaggle MCP

Since Kaggle uses a different authentication method, install the package:

```bash
pip install git+https://github.com/54yyyu/kaggle-mcp.git
```

Or using uv:

```bash
uv pip install git+https://github.com/54yyyu/kaggle-mcp.git
```

### Configure Credentials

**Windows:**
1. Create the directory: `%USERPROFILE%\.kaggle\`
2. Move `kaggle.json` to that directory
3. Set permissions:
   ```cmd
   icacls "%USERPROFILE%\.kaggle\kaggle.json" /inheritance:r /grant:r "%USERNAME%:F"
   ```

**Mac/Linux:**
1. Create the directory: `~/.kaggle/`
2. Move `kaggle.json` to that directory
3. Set permissions:
   ```bash
   chmod 600 ~/.kaggle/kaggle.json
   ```

### Verify Installation

Run the setup utility:
```bash
kaggle-mcp-setup
```

This will automatically configure Claude Desktop if installed.

### Available Capabilities

- Browse and download competition data
- Search and download datasets
- Access pre-trained models
- View Kaggle notebooks and kernels
- Download specific dataset files

### Example Usage

Through Claude Code:
- "Show me Kaggle datasets about stock market sentiment"
- "Download the S&P 500 historical data from Kaggle"
- "Find machine learning models for time series forecasting"
- "Search for notebooks about technical analysis strategies"

### Documentation
- [Kaggle API Docs](https://www.kaggle.com/docs/api)
- [Kaggle MCP Setup](https://apidog.com/blog/exa-mcp-server/)

## Activating the MCP Servers

### For Claude Code

1. Restart Claude Code completely
2. The servers should auto-load on next session
3. Verify with: `/mcp` command
4. You should see all 6 servers listed:
   - supabase
   - netlify
   - youtube-transcript
   - firecrawl
   - exa
   - kaggle

### For Claude Desktop

If you're using Claude Desktop instead:
1. Open Settings → Developer
2. Click "Edit Config"
3. Ensure the servers are in your config
4. Restart Claude Desktop

## Testing the Integrations

### Test Firecrawl
```
"Use Firecrawl to scrape the homepage of https://finance.yahoo.com/quote/AAPL"
```

### Test Exa
```
"Use Exa to search for recent news about Federal Reserve interest rate decisions"
```

### Test Kaggle
```
"Show me available Kaggle datasets related to cryptocurrency prices"
```

## Use Cases for Trading Platform

### Alternative Data Intelligence
- **Earnings Analysis**: Scrape and analyze earnings call transcripts for sentiment
- **News Monitoring**: Track breaking news and its impact on specific sectors
- **Social Sentiment**: Monitor Reddit/Twitter sentiment on trending stocks
- **Company Research**: Deep dive into competitor analysis and market positioning

### Backtesting & Strategy Development
- **Historical Datasets**: Download financial datasets from Kaggle for backtesting
- **ML Models**: Access pre-trained models for price prediction
- **Strategy Validation**: Use notebooks and competitions for strategy ideas
- **Alternative Data**: Satellite imagery, credit card data, weather data for predictive models

### Market Intelligence
- **Sector Analysis**: Use Exa to research emerging trends in specific sectors
- **Competitive Intelligence**: Monitor competitor moves and strategic shifts
- **Regulatory Changes**: Track policy changes that impact specific industries
- **Supply Chain**: Monitor supply chain disruptions via news scraping

## Security Considerations

1. **Never commit API keys to git**
   - Keys are in `.env.local` (already in `.gitignore`)
   - Use `.env.local.example` as template only

2. **Rate Limiting**
   - Firecrawl: Check your plan's credit limits
   - Exa: Monitor search credits
   - Kaggle: No rate limits on API

3. **Data Usage**
   - Respect website terms of service when scraping
   - Kaggle datasets have specific licenses - check before commercial use
   - Cache results to minimize API calls

## Troubleshooting

### MCP Servers Not Loading
- Verify `.mcp.json` syntax is correct
- Check that API keys are in `.env.local`
- Restart Claude Code completely
- Check logs with `/mcp` command

### Kaggle Authentication Fails
- Verify `kaggle.json` is in correct location
- Check file permissions (should be 600 on Mac/Linux)
- Ensure JSON format is valid
- Re-download token if needed

### API Rate Limits
- Monitor credit usage in provider dashboards
- Implement caching for repeated queries
- Upgrade to paid tier if needed for production use

### Firecrawl Returns Errors
- Check if target website blocks scraping
- Verify URL is accessible
- Check credit balance
- Review Firecrawl status page for outages

## Next Steps

1. **Test Each Integration**: Run the test commands above to verify setup
2. **Explore Capabilities**: Ask Claude Code what each server can do
3. **Build Features**: Start integrating alternative data into scanner logic
4. **Monitor Usage**: Track API credit consumption
5. **Document Insights**: Keep notes on useful data sources discovered

## Cost Optimization Tips

1. **Use Free Tiers First**: All three services offer generous free tiers
2. **Cache Aggressively**: Store scraped data in Supabase to avoid re-fetching
3. **Batch Requests**: Combine multiple searches/scrapes when possible
4. **Monitor Credits**: Set up alerts for credit usage
5. **Fallback Logic**: Have backup strategies if APIs are unavailable

## Support & Resources

- **Firecrawl Support**: [https://discord.gg/firecrawl](https://discord.gg/firecrawl)
- **Exa Support**: [https://docs.exa.ai/](https://docs.exa.ai/)
- **Kaggle Forums**: [https://www.kaggle.com/discussions](https://www.kaggle.com/discussions)
- **MCP Documentation**: [https://mcpservers.org/](https://mcpservers.org/)

## Related Documentation

- `docs/MCP_SERVERS_SETUP.md` - Original MCP setup (Supabase, Netlify)
- `ALTERNATIVE_DATA_INTELLIGENCE.md` - Strategy for alternative data integration
- `docs/RESEARCH_TOOLS.md` - Research tools and workflows

---

**Last Updated**: 2025-01-24
**Status**: Ready for testing
**Prerequisites Met**: ✅ Configuration complete, ⏳ API keys needed
