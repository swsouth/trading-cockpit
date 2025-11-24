'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Your Personal{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Trading Cockpit
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            AI-powered market scanner that finds high-probability trade setups across 250 stocks daily.
            Professional-grade analysis, actionable recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/auth/signup">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Start finding better trades today
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Find Better Trades
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional-grade tools that help you identify opportunities, manage risk, and execute with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Feature 1: Daily Scanner */}
          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl">Daily Market Scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automated scanning of 250 stocks every trading day. Channel detection, pattern recognition,
                and opportunity scoring built in.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>250 stocks scanned daily</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Runs Mon-Fri at 5 PM ET</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Top 30 opportunities ranked</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature 2: Smart Recommendations */}
          <Card className="border-2 hover:border-green-500 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl">AI-Powered Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Clear entry points, profit targets, and stop losses calculated using technical analysis
                and risk/reward optimization.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Channel-based entries</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Minimum 2:1 risk/reward</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Confidence scoring 0-100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature 3: TradingView Charts */}
          <Card className="border-2 hover:border-purple-500 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-xl">Professional Charts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Integrated TradingView charts with advanced features. Draw trendlines, add indicators,
                and save your analysis.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Full TradingView integration</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Drawing tools & indicators</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Mobile-responsive design</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature 4: Pattern Recognition */}
          <Card className="border-2 hover:border-orange-500 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-xl">Pattern Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automatic detection of 7 candlestick patterns including engulfing, hammers, and dojis.
                Never miss a setup again.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>7 candlestick patterns</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Support & resistance levels</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Channel breakout alerts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature 5: Risk Management */}
          <Card className="border-2 hover:border-red-500 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">Built-in Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Every recommendation includes calculated stop losses and position sizing guidance.
                Protect your capital first.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>ATR-based stops</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Max 10% risk per trade</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Position sizing calculator</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature 6: Real-time Updates */}
          <Card className="border-2 hover:border-cyan-500 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <CardTitle className="text-xl">Fresh Daily Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automated scans run every weekday at market close. Wake up to fresh opportunities ready
                for the next trading session.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>GitHub Actions automation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Daily email notifications</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Watchlist tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps from market scan to actionable trade
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="h-16 w-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Daily Scan</h3>
              <p className="text-muted-foreground">
                Our system scans 250 stocks every weekday at 5 PM ET, analyzing channels, patterns,
                and momentum to find the best setups.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="h-16 w-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Review Recommendations</h3>
              <p className="text-muted-foreground">
                Check your dashboard for top-scored opportunities with clear entry, target, and stop
                loss levels. View detailed charts and analysis.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="h-16 w-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Execute with Confidence</h3>
              <p className="text-muted-foreground">
                Take action on high-confidence setups with predefined risk parameters. Track your
                results and continuously improve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Better Trades?
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Join traders who use data-driven analysis to identify high-probability setups.
            Get access to daily recommendations and professional-grade tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100"
            >
              <Link href="/auth/signup">
                Start Trading Smarter
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-white text-white hover:bg-white/10"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
          <p className="text-sm mt-6 opacity-75">
            Professional trading tools • Daily market insights
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm">
            Personal Trading Cockpit • AI-Powered Market Analysis
          </p>
          <p className="text-xs mt-2">
            Not financial advice. All investments carry risk. Past performance does not guarantee future results.
          </p>
        </div>
      </footer>
    </div>
  );
}
