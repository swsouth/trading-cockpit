# Trading Cockpit — AI Strategy + Calculator Package

This package bundles:
- AI prompt templates (master + 3 strategy variants)
- A **prompt builder** that maps UI sliders → model instructions
- A **return calculator** (TypeScript) with tiered take-profit
- Example React controls and a trade metrics card
- A **Claude Code**-friendly implementation plan with tasks & acceptance criteria

Use this to wire strategy selection, risk sliders, and a built-in calculator into your existing Next.js/React app at `/day-trader`.

---

## Quick start

1. Copy `/prompts` and `/src` into your project.
2. Call `buildPrompt(config)` with the user’s strategy + slider settings to produce an LLM prompt.
3. For each recommendation, call `calculateTradeMetrics(inputs)` and render `<TradeMetricCard .../>`.
4. Use `/claude/plan.md` as your task breakdown for Claude Code.

---

## Files

- `/prompts` — master prompt + per-strategy templates and an output schema
- `/src/lib/calc.ts` — return calculator
- `/src/lib/promptBuilder.ts` — prompt assembler
- `/src/components/StrategyControls.tsx` — sliders + selector UI (unopinionated styling)
- `/src/components/TradeMetricCard.tsx` — compact PnL/RR card
- `/examples/example-config.json` — sample slider state → prompt config
- `/tests/calc.test.ts` — minimal unit test (Vitest/Jest compatible)

---

## Integration sketch

```ts
import { buildPrompt } from "@/lib/promptBuilder";
import { calculateTradeMetrics } from "@/lib/calc";
import type { UserConfig, TradeInputs } from "@/types";

// 1) Build prompt for LLM:
const prompt = buildPrompt(userConfig);

// 2) After LLM returns a recommendation:
const metrics = calculateTradeMetrics(tradeInputs);
```

## Notes

- Prompts include risk management, invalidation conditions, watchlist, and confidence scoring.
- Calculator accounts for **fees + slippage on both sides** and supports **tiered take-profit** via weighted targets.
- Output schema is JSON: easy to parse and display in your UI.

