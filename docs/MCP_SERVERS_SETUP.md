# MCP Servers Setup

**Model Context Protocol (MCP) servers configured for this project**

---

## Quick Reference

**Active MCP Servers:**
1. ✅ **Supabase** - Database operations (read-only for safety)
2. ✅ **Netlify** - Deployment and site management
3. ✅ **YouTube Transcript** - Video content research & competitive intelligence

**Configuration File:** `.mcp.json`
**Auto-Enable:** `.claude/settings.local.json` has `enableAllProjectMcpServers: true`

---

## 1. Supabase MCP Server

**Purpose:** Query database, inspect schema, count records

**Type:** HTTP-based MCP server
**Mode:** Read-only (safe - cannot modify data)

### Configuration

```json
{
  "supabase": {
    "type": "http",
    "url": "https://mcp.supabase.com/mcp?project_ref=hjfokaueppsvpcjzrcjg"
  }
}
```

### Available Tools

- `mcp__supabase__list_tables` - List all tables in schema(s)
- `mcp__supabase__list_extensions` - List database extensions
- `mcp__supabase__list_migrations` - List applied migrations
- `mcp__supabase__execute_sql` - Run read-only SQL queries
- `mcp__supabase__apply_migration` - Apply DDL migrations (use with caution)
- `mcp__supabase__get_logs` - Fetch service logs (api, postgres, auth, etc.)
- `mcp__supabase__get_advisors` - Get security/performance advisories
- `mcp__supabase__get_project_url` - Get API URL
- `mcp__supabase__get_anon_key` - Get anonymous API key
- `mcp__supabase__generate_typescript_types` - Generate TypeScript types from schema

### Example Usage

**During conversation:**
- "Show me all recommendations with score > 80"
- "How many active stocks are in scan_universe?"
- "What's the schema for trade_recommendations table?"
- "Generate TypeScript types for the database"

**What gets executed:**
```sql
-- Example: "Show recommendations with score > 80"
SELECT * FROM trade_recommendations
WHERE opportunity_score > 80
AND is_active = true
ORDER BY opportunity_score DESC;
```

### Safety

**Read-Only Mode:** The MCP server is configured for read-only access. Modifications require using `apply_migration` tool (DDL only, not DML).

**Best Practice:** For data modifications, use:
- Scripts (`scripts/dailyMarketScan.ts`) with service role key
- Supabase Dashboard SQL Editor
- API routes (`app/api/scan/trigger/route.ts`)

---

## 2. Netlify MCP Server

**Purpose:** Check deployments, view logs, trigger builds, manage environment variables

**Type:** Command-based MCP server (NPM package)

### Configuration

```json
{
  "netlify": {
    "command": "cmd",
    "args": ["/c", "npx", "-y", "@netlify/mcp"]
  }
}
```

### Available Tools

- `mcp__netlify__netlify-user-services-reader` - Get user info
- `mcp__netlify__netlify-deploy-services-reader` - Get deployment status
- `mcp__netlify__netlify-deploy-services-updater` - Deploy site
- `mcp__netlify__netlify-team-services-reader` - Get team info
- `mcp__netlify__netlify-project-services-reader` - Get project/site info, forms
- `mcp__netlify__netlify-project-services-updater` - Update site settings, env vars
- `mcp__netlify__netlify-extension-services-reader` - Get installed extensions
- `mcp__netlify__netlify-extension-services-updater` - Install/uninstall extensions

### Example Usage

**During conversation:**
- "What's the status of the latest deployment?"
- "Show me recent deploy logs"
- "What environment variables are set for production?"
- "Deploy the site"

**Common Operations:**
```typescript
// Check latest deploy status
netlify-deploy-services-reader: { operation: "get-deploy", params: { deployId: "..." } }

// Get site environment variables
netlify-project-services-updater: {
  operation: "manage-env-vars",
  params: { siteId: "...", getAllEnvVars: true }
}
```

### Authentication

**Automatic:** Uses your Netlify CLI credentials (from `netlify login`)

**Setup:**
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Login: `netlify login`
3. Link site: `netlify link` (if needed)

---

## 3. YouTube Transcript MCP Server

**Purpose:** Extract video transcripts for competitive intelligence and research

**Type:** Command-based MCP server (NPM package)

### Configuration

```json
{
  "youtube-transcript": {
    "command": "cmd",
    "args": ["/c", "npx", "-y", "@transcriptapi/mcp-server"],
    "env": {
      "YOUTUBE_TRANSCRIPT_API_KEY": "${YOUTUBE_TRANSCRIPT_API_KEY}"
    }
  }
}
```

### Setup

1. **Get API Key:** https://transcriptapi.com/dashboard/api-keys
2. **Add to `.env.local`:**
   ```bash
   YOUTUBE_TRANSCRIPT_API_KEY=sk_your_key_here
   ```
3. **Restart Claude Code** to load the MCP server

### Available Tools

- `get_youtube_transcript` - Fetch transcript for a YouTube video
  - Accepts: Video URL or 11-character video ID
  - Options: Format (json/text), include timestamps, include metadata
  - Returns: Transcript segments with timing + video metadata

### Example Usage

**During conversation:**
- "Get the transcript for this video: https://youtube.com/watch?v=aHPZUb-OO-A"
- "Analyze the trading strategies discussed in [video URL]"
- "What features does TradeIdeas mention in their demo video?"

**Response:**
```
Video: "Google Finance AI Features Overview"
Author: FinanceChannel
Transcript:
[Full text of video with timestamps...]

Analysis:
- Feature 1: AI-powered stock recommendations (similar to your Domain 1-5)
- Feature 2: Sentiment analysis from news (your Domain 3, Phase 1 Week 2)
...
```

### Rate Limits

- **200 requests/minute** per API key
- **2 concurrent requests** maximum
- **1 credit per successful transcript**

### Cost

- **Pay-as-you-go:** 1 credit per transcript
- **Typical usage:** $10-50/mo for competitive research (50-250 videos)

### Use Cases

**See:** [RESEARCH_TOOLS.md](./RESEARCH_TOOLS.md) for detailed workflows

1. **Competitive Intelligence** - Extract features from competitor demos
2. **Strategy Research** - Learn from trading education channels
3. **Market Intelligence** - Analyze earnings calls, CEO interviews
4. **Feature Validation** - See how others explain complex concepts

---

## Activating MCP Servers

### Automatic Activation

Your project has this setting in `.claude/settings.local.json`:

```json
{
  "enableAllProjectMcpServers": true
}
```

**This means:** All MCP servers in `.mcp.json` are automatically enabled when Claude Code starts.

### Manual Activation (if needed)

If `enableAllProjectMcpServers` is not set:

1. Restart Claude Code
2. When prompted, approve each MCP server:
   - ✅ Allow Supabase MCP server
   - ✅ Allow Netlify MCP server
   - ✅ Allow YouTube Transcript MCP server

---

## Testing MCP Servers

### Test Supabase Connection

**Ask Claude Code:**
> "How many rows are in the trade_recommendations table?"

**Expected:** Query executes, returns count

---

### Test Netlify Connection

**Ask Claude Code:**
> "What's the status of my latest Netlify deployment?"

**Expected:** Shows deployment status, build logs

---

### Test YouTube Transcript

**Ask Claude Code:**
> "Get the transcript for https://www.youtube.com/watch?v=aHPZUb-OO-A"

**Expected:** Returns video title, author, full transcript

---

## Troubleshooting

### MCP Server Not Loading

**Symptom:** Claude Code doesn't respond to MCP-related requests

**Fix:**
1. Check `.mcp.json` syntax (valid JSON)
2. Restart Claude Code completely
3. Check error logs in Claude Code terminal
4. Verify environment variables are set (for YouTube Transcript)

---

### YouTube Transcript: "API Key Not Set"

**Symptom:** Error when trying to fetch transcripts

**Fix:**
1. Verify `.env.local` has `YOUTUBE_TRANSCRIPT_API_KEY=...`
2. Key format: `sk_...` (starts with `sk_`)
3. Restart Claude Code to reload environment variables

---

### Netlify: "Not Authenticated"

**Symptom:** Netlify commands fail with auth error

**Fix:**
1. Run: `netlify login` in terminal
2. Complete browser authentication
3. Run: `netlify link` to link site (if needed)
4. Restart Claude Code

---

### Supabase: "Permission Denied"

**Symptom:** SQL queries fail with permission errors

**Fix:**
1. Verify project_ref in `.mcp.json` matches your Supabase project
2. Check RLS policies allow read access
3. Use Supabase Dashboard to test query manually
4. For writes, use `apply_migration` tool (not `execute_sql`)

---

## Adding New MCP Servers

### Command-Based (NPM Package)

```json
{
  "my-new-server": {
    "command": "cmd",
    "args": ["/c", "npx", "-y", "@package/mcp-server"],
    "env": {
      "API_KEY": "${MY_API_KEY}"
    }
  }
}
```

**Steps:**
1. Add to `.mcp.json`
2. Set environment variable in `.env.local` (if needed)
3. Restart Claude Code
4. Test with a simple query

---

### HTTP-Based

```json
{
  "my-new-server": {
    "type": "http",
    "url": "https://api.example.com/mcp?apikey=YOUR_KEY"
  }
}
```

**Steps:**
1. Add to `.mcp.json`
2. Restart Claude Code
3. Test with a simple query

---

## Future MCP Servers (Planned)

**From Phase 1-3 (Multi-Modal Confidence):**
- ✅ Alpha Vantage MCP (when available) - Market data, fundamentals, macro
- ✅ Finnhub MCP (when available) - News, sentiment, analyst ratings
- ✅ Polygon MCP (when available) - Real-time market data, corporate actions

**From Phase 4-6 (Alternative Data):**
- ✅ Google Trends MCP (when available) - Consumer demand signals
- ✅ GitHub MCP (when available) - Developer ecosystem metrics
- ✅ Weather MCP (when available) - Climate/energy data

**See:** [MULTI_MODAL_CONFIDENCE_STRATEGY.md](../MULTI_MODAL_CONFIDENCE_STRATEGY.md) for provider roadmap

---

## See Also

- [INTELLIGENCE_PLATFORM_MASTER_PLAN.md](../INTELLIGENCE_PLATFORM_MASTER_PLAN.md) - Overall strategy
- [RESEARCH_TOOLS.md](./RESEARCH_TOOLS.md) - YouTube Transcript usage workflows
- [DATA_SOURCE_DIRECTORY.md](./DATA_SOURCE_DIRECTORY.md) - All data providers

---

**Last Updated:** 2025-01-24
**Active Servers:** 3 (Supabase, Netlify, YouTube Transcript)
**Status:** All operational ✅
