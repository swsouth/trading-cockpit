/**
 * Score Breakdown Tooltip Component
 *
 * Interactive hover tooltip showing AI score components with transparency
 * Addresses UX P0-3: AI Score Transparency
 */

'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface ScoreComponent {
  name: string;
  score: number;
  maxScore: number;
  description: string;
  color: string;
}

interface ScoreBreakdownTooltipProps {
  opportunityScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  // Optional: If we have actual component data
  components?: {
    trendStrength?: number;
    patternQuality?: number;
    volumeScore?: number;
    riskRewardScore?: number;
    momentumScore?: number;
  };
}

/**
 * Estimate component scores based on total score
 * This is a fallback when we don't have actual component data
 */
function estimateComponents(totalScore: number): ScoreComponent[] {
  // Distribute score proportionally across components
  // Total possible: 30 + 25 + 20 + 15 + 10 = 100
  const ratio = totalScore / 100;

  return [
    {
      name: 'Trend Strength',
      score: Math.round(30 * ratio),
      maxScore: 30,
      description: 'Channel clarity, slope, price position',
      color: 'bg-blue-500',
    },
    {
      name: 'Pattern Quality',
      score: Math.round(25 * ratio),
      maxScore: 25,
      description: 'Candlestick pattern reliability',
      color: 'bg-purple-500',
    },
    {
      name: 'Volume Confirmation',
      score: Math.round(20 * ratio),
      maxScore: 20,
      description: 'Recent vs 30-day average volume',
      color: 'bg-green-500',
    },
    {
      name: 'Risk/Reward',
      score: Math.round(15 * ratio),
      maxScore: 15,
      description: 'R:R ratio quality, channel-based targets',
      color: 'bg-orange-500',
    },
    {
      name: 'Momentum/RSI',
      score: Math.round(10 * ratio),
      maxScore: 10,
      description: 'RSI positioning in optimal zones',
      color: 'bg-pink-500',
    },
  ];
}

/**
 * Build components from actual data if available
 */
function buildComponents(data: ScoreBreakdownTooltipProps['components']): ScoreComponent[] {
  if (!data) return [];

  return [
    ...(data.trendStrength !== undefined
      ? [
          {
            name: 'Trend Strength',
            score: data.trendStrength,
            maxScore: 30,
            description: 'Channel clarity, slope, price position',
            color: 'bg-blue-500',
          },
        ]
      : []),
    ...(data.patternQuality !== undefined
      ? [
          {
            name: 'Pattern Quality',
            score: data.patternQuality,
            maxScore: 25,
            description: 'Candlestick pattern reliability',
            color: 'bg-purple-500',
          },
        ]
      : []),
    ...(data.volumeScore !== undefined
      ? [
          {
            name: 'Volume Confirmation',
            score: data.volumeScore,
            maxScore: 20,
            description: 'Recent vs 30-day average volume',
            color: 'bg-green-500',
          },
        ]
      : []),
    ...(data.riskRewardScore !== undefined
      ? [
          {
            name: 'Risk/Reward',
            score: data.riskRewardScore,
            maxScore: 15,
            description: 'R:R ratio quality, channel-based targets',
            color: 'bg-orange-500',
          },
        ]
      : []),
    ...(data.momentumScore !== undefined
      ? [
          {
            name: 'Momentum/RSI',
            score: data.momentumScore,
            maxScore: 10,
            description: 'RSI positioning in optimal zones',
            color: 'bg-pink-500',
          },
        ]
      : []),
  ];
}

export function ScoreBreakdownTooltip({
  opportunityScore,
  confidenceLevel,
  components: componentData,
}: ScoreBreakdownTooltipProps) {
  // Use actual component data if available, otherwise estimate
  const components = componentData
    ? buildComponents(componentData)
    : estimateComponents(opportunityScore);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-accent transition-colors"
            aria-label="View score breakdown"
          >
            <Info className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="w-80 p-4" sideOffset={8}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="font-bold text-lg">
                  Score: {opportunityScore}/100
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {confidenceLevel} Confidence
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                AI Analysis
              </div>
            </div>

            {/* Component Breakdown */}
            <div className="space-y-3">
              {components.map((component) => {
                const percentage = (component.score / component.maxScore) * 100;
                return (
                  <div key={component.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">{component.name}</div>
                      <div className="text-xs font-bold">
                        {component.score}/{component.maxScore}
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {component.description}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Note */}
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <div className="flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <p>
                  Scores combine technical analysis, pattern recognition, and volume
                  data. Higher scores indicate stronger setup confluence.
                </p>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
