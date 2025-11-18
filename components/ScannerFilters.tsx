'use client';

import { useState } from 'react';
import { ScanCriteria, RecommendedAction, ConfidenceLevel } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface ScannerFiltersProps {
  criteria: ScanCriteria;
  onCriteriaChange: (criteria: ScanCriteria) => void;
  sortBy: 'riskReward' | 'confidence' | 'priceChange' | 'setup';
  onSortChange: (sortBy: 'riskReward' | 'confidence' | 'priceChange' | 'setup') => void;
}

export function ScannerFilters({
  criteria,
  onCriteriaChange,
  sortBy,
  onSortChange,
}: ScannerFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleActionToggle = (action: RecommendedAction) => {
    const current = criteria.recommendedActions || [];
    const updated = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    onCriteriaChange({ ...criteria, recommendedActions: updated });
  };

  const handleConfidenceToggle = (conf: ConfidenceLevel) => {
    const current = criteria.confidenceLevels || [];
    const updated = current.includes(conf)
      ? current.filter((c) => c !== conf)
      : [...current, conf];
    onCriteriaChange({ ...criteria, confidenceLevels: updated });
  };

  const handleMinRRChange = (value: string) => {
    const num = parseFloat(value);
    onCriteriaChange({
      ...criteria,
      minRiskReward: isNaN(num) ? undefined : num,
    });
  };

  const clearFilters = () => {
    onCriteriaChange({});
  };

  const hasActiveFilters =
    (criteria.recommendedActions && criteria.recommendedActions.length > 0) ||
    (criteria.confidenceLevels && criteria.confidenceLevels.length > 0) ||
    criteria.minRiskReward !== undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Sorting
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent className="space-y-6">
          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select value={sortBy} onValueChange={(v) => onSortChange(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="riskReward">Risk/Reward Ratio</SelectItem>
                <SelectItem value="confidence">Confidence Level</SelectItem>
                <SelectItem value="priceChange">Price Change</SelectItem>
                <SelectItem value="setup">Setup Type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recommended Actions */}
          <div className="space-y-2">
            <Label>Recommended Actions</Label>
            <div className="flex flex-wrap gap-2">
              {(['BUY', 'SELL', 'SHORT', 'BUY_BREAKOUT', 'WAIT'] as RecommendedAction[]).map(
                (action) => {
                  const isSelected = criteria.recommendedActions?.includes(action);
                  return (
                    <Badge
                      key={action}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleActionToggle(action)}
                    >
                      {action === 'BUY_BREAKOUT' ? 'BREAKOUT' : action}
                    </Badge>
                  );
                }
              )}
            </div>
          </div>

          {/* Confidence Levels */}
          <div className="space-y-2">
            <Label>Confidence Levels</Label>
            <div className="flex flex-wrap gap-2">
              {(['HIGH', 'MODERATE', 'LOW'] as ConfidenceLevel[]).map((conf) => {
                const isSelected = criteria.confidenceLevels?.includes(conf);
                return (
                  <Badge
                    key={conf}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleConfidenceToggle(conf)}
                  >
                    {conf}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Min Risk/Reward */}
          <div className="space-y-2">
            <Label>Minimum Risk/Reward Ratio</Label>
            <Select
              value={criteria.minRiskReward?.toString() || 'none'}
              onValueChange={handleMinRRChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any</SelectItem>
                <SelectItem value="1">1:1 or better</SelectItem>
                <SelectItem value="2">2:1 or better</SelectItem>
                <SelectItem value="3">3:1 or better</SelectItem>
                <SelectItem value="4">4:1 or better</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <div className="text-sm font-medium mb-2">Active Filters:</div>
              <div className="flex flex-wrap gap-2">
                {criteria.recommendedActions?.map((action) => (
                  <Badge key={action} variant="secondary">
                    {action}
                  </Badge>
                ))}
                {criteria.confidenceLevels?.map((conf) => (
                  <Badge key={conf} variant="secondary">
                    {conf}
                  </Badge>
                ))}
                {criteria.minRiskReward !== undefined && (
                  <Badge variant="secondary">
                    R/R ≥ {criteria.minRiskReward}:1
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
