/**
 * Analysis Engine - Main Export
 *
 * Single entry point for the unified analysis engine.
 */

export { AnalysisEngine } from './AnalysisEngine';
export { loadConfig } from './config';
export { signalToAnalysisResult } from './adapter';

// Export types
export type {
  AnalysisConfig,
  AnalysisInput,
  Signal,
  PatternType,
  PatternResult,
  MarketRegime,
  RegimeAnalysis,
  TradeSetup,
  OpportunityScore,
  ScoreComponents,
  Indicators,
  EngineOptions,
} from './types';
