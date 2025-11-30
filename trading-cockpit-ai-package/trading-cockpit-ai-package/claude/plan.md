# Claude Code Implementation Plan

## Objectives
- Add strategy selection (Conservative / Swing / Aggressive)
- Add sliders (risk, target profit, timeframe, confidence threshold, etc.)
- Generate an LLM prompt from user settings
- Compute and display trade metrics for each recommendation
- Enable alerts/updates to re-evaluate exits and stops on price changes

## Tasks

### 1) Project plumbing
- [ ] Create `src/lib`, `src/components`, and copy files from this package
- [ ] Ensure TypeScript path alias (`@/`) is configured or update imports

### 2) Strategy UI
- [ ] Drop in `<StrategyControls />` and wire `onChange` to store user `UserConfig`
- [ ] Persist config in local storage (optional) for UX continuity

### 3) Prompt building
- [ ] Use `buildPrompt(config)` to create a SYSTEM+USER prompt pair
- [ ] Send prompt to your LLM endpoint; request `json` output format per `/prompts/output_schema.json`

### 4) Results display
- [ ] For each coin recommendation, map values to `TradeInputs` and call `calculateTradeMetrics(...)`
- [ ] Render `<TradeMetricCard metrics={...} inputs={...} />`

### 5) Alerts / updates (polling or websockets)
- [ ] Every N minutes (from config), refresh price + confidence
- [ ] If confidence < threshold or target/stop hit, flag item and suggest action

### 6) Tests
- [ ] Run `tests/calc.test.ts` and verify ROI, RR, breakeven computation

## Acceptance Criteria
- Strategy switch changes the text of prompts (visible in request body) and the filtering of results
- Sliders directly influence stop ranges, target % and min R/R in prompt
- Calculator displays Qty, Net P&L at target/stop, ROI%, R/R, Breakeven
- Tiered take-profit shows blended outcomes consistent with weights
- All outputs conform to `/prompts/output_schema.json`

## Out of Scope
- Brokerage execution
- Live exchange integration (assume an existing price feed)
