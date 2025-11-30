import type { UserConfig } from "@/types";
import conservative from "../../prompts/strategy_conservative.md?raw";
import swing from "../../prompts/strategy_swing.md?raw";
import aggressive from "../../prompts/strategy_aggressive.md?raw";
import master from "../../prompts/master_prompt.md?raw";

export function buildPrompt(cfg: UserConfig) {
  const common = master;
  let template = swing;
  if (cfg.strategy === 'Conservative') template = conservative;
  if (cfg.strategy === 'Aggressive') template = aggressive;

  const filled = template
    .replace('{risk_level}', String(cfg.riskLevel))
    .replace('{target_profit}', String(cfg.targetProfitPct))
    .replace('{stop_min}', String(cfg.stopMinPct))
    .replace('{stop_max}', String(cfg.stopMaxPct))
    .replace('{timeframe_days}', String(cfg.timeframeDays ?? ''))
    .replace('{timeframe_hours}', String(cfg.timeframeHours ?? ''))
    .replace('{conf_threshold}', String(cfg.confidenceThreshold))
    .replace('{min_rr}', String(cfg.minRR))
    .replace('{trail_start}', String(cfg.trailStartPct ?? 0));

  return {
    system: common,
    user: filled
  };
}
