'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Shield, TrendingUp, BarChart3, Clock } from 'lucide-react';
import { useState } from 'react';

interface VettingBreakdownProps {
  vettingScore: number;
  vettingPassed: boolean;
  vettingSummary: string;
  vettingRedFlags: string[];
  vettingGreenFlags: string[];
  vettingChecks: any;
}

export function VettingBreakdown({
  vettingScore,
  vettingPassed,
  vettingSummary,
  vettingRedFlags,
  vettingGreenFlags,
  vettingChecks,
}: VettingBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Score color coding
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 dark:bg-green-950';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-950';
    return 'bg-red-100 dark:bg-red-950';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 85) return 'border-green-300 dark:border-green-800';
    if (score >= 70) return 'border-yellow-300 dark:border-yellow-800';
    return 'border-red-300 dark:border-red-800';
  };

  // Calculate category scores
  const getTechnicalScore = () => {
    if (!vettingChecks?.technical) return 0;
    const { channelQuality, patternReliability, volumeConfirmation, riskRewardRatio } = vettingChecks.technical;
    return channelQuality.score + patternReliability.score + volumeConfirmation.score + riskRewardRatio.score;
  };

  const getFundamentalScore = () => {
    if (!vettingChecks?.fundamental) return 0;
    const { earningsProximity, marketCap, averageVolume, priceEarningsRatio, debtToEquity } = vettingChecks.fundamental;
    return earningsProximity.score + marketCap.score + averageVolume.score + priceEarningsRatio.score + debtToEquity.score;
  };

  const getSentimentScore = () => {
    if (!vettingChecks?.sentiment) return 0;
    const { newsSentiment, socialSentiment, analystRating } = vettingChecks.sentiment;
    return newsSentiment.score + socialSentiment.score + analystRating.score;
  };

  const getTimingScore = () => {
    if (!vettingChecks?.timing) return 0;
    const { marketHours, spreadQuality } = vettingChecks.timing;
    return marketHours.score + spreadQuality.score;
  };

  const techScore = getTechnicalScore();
  const fundScore = getFundamentalScore();
  const sentScore = getSentimentScore();
  const timeScore = getTimingScore();

  return (
    <div className="space-y-3">
      {/* Compact Score Badge */}
      <div
        className={`border rounded-lg p-3 cursor-pointer transition-all ${getScoreBorderColor(vettingScore)} ${getScoreBgColor(vettingScore)}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className={`h-5 w-5 ${getScoreColor(vettingScore)}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Vetting Score</span>
                <Badge variant={vettingPassed ? 'default' : 'destructive'} className="text-xs">
                  {vettingScore}/100
                </Badge>
                {vettingPassed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{vettingSummary}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Flags */}
        {(vettingGreenFlags.length > 0 || vettingRedFlags.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {vettingGreenFlags.map((flag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {flag}
              </Badge>
            ))}
            {vettingRedFlags.map((flag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                {flag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && vettingChecks && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vetting Breakdown</CardTitle>
            <CardDescription className="text-xs">
              20-point checklist combining technical, fundamental, sentiment, and timing factors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Technical Analysis (40 pts) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Technical Analysis</span>
                </div>
                <span className="text-sm font-semibold">{techScore}/40</span>
              </div>
              <Progress value={(techScore / 40) * 100} className="h-2 mb-2" />
              <div className="space-y-1 text-xs text-muted-foreground">
                <CheckItem check={vettingChecks.technical.channelQuality} />
                <CheckItem check={vettingChecks.technical.patternReliability} />
                <CheckItem check={vettingChecks.technical.volumeConfirmation} />
                <CheckItem check={vettingChecks.technical.riskRewardRatio} />
              </div>
            </div>

            {/* Fundamental Analysis (30 pts) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Fundamental Analysis</span>
                </div>
                <span className="text-sm font-semibold">{fundScore}/30</span>
              </div>
              <Progress value={(fundScore / 30) * 100} className="h-2 mb-2" />
              <div className="space-y-1 text-xs text-muted-foreground">
                <CheckItem check={vettingChecks.fundamental.earningsProximity} />
                <CheckItem check={vettingChecks.fundamental.marketCap} />
                <CheckItem check={vettingChecks.fundamental.averageVolume} />
                <CheckItem check={vettingChecks.fundamental.priceEarningsRatio} />
                <CheckItem check={vettingChecks.fundamental.debtToEquity} />
              </div>
            </div>

            {/* Sentiment Analysis (20 pts) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Sentiment Analysis</span>
                </div>
                <span className="text-sm font-semibold">{sentScore}/20</span>
              </div>
              <Progress value={(sentScore / 20) * 100} className="h-2 mb-2" />
              <div className="space-y-1 text-xs text-muted-foreground">
                <CheckItem check={vettingChecks.sentiment.newsSentiment} />
                <CheckItem check={vettingChecks.sentiment.socialSentiment} />
                <CheckItem check={vettingChecks.sentiment.analystRating} />
              </div>
            </div>

            {/* Timing & Liquidity (10 pts) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Timing & Liquidity</span>
                </div>
                <span className="text-sm font-semibold">{timeScore}/10</span>
              </div>
              <Progress value={(timeScore / 10) * 100} className="h-2 mb-2" />
              <div className="space-y-1 text-xs text-muted-foreground">
                <CheckItem check={vettingChecks.timing.marketHours} />
                <CheckItem check={vettingChecks.timing.spreadQuality} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for individual check items
function CheckItem({ check }: { check: any }) {
  const percentage = (check.score / check.maxScore) * 100;
  const Icon = percentage >= 70 ? CheckCircle2 : percentage >= 50 ? AlertCircle : XCircle;
  const color = percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="flex items-start gap-2">
      <Icon className={`h-3 w-3 mt-0.5 ${color}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span>{check.details}</span>
          <span className="font-medium ml-2">{check.score}/{check.maxScore}</span>
        </div>
      </div>
    </div>
  );
}
