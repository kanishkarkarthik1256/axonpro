import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWallet, getBalance, getTransactions } from '@/utils/storage';
import { CRYPTO_PRICES, FX_RATES, formatCurrency } from '@/utils/helpers';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const CRYPTO_COLORS = {
  BTC: 'hsl(25, 95%, 53%)',
  ETH: 'hsl(240, 70%, 60%)',
  USDT: 'hsl(142, 76%, 36%)',
  BNB: 'hsl(45, 93%, 47%)',
  SOL: 'hsl(280, 70%, 50%)',
  XRP: 'hsl(210, 70%, 50%)',
  ADA: 'hsl(190, 70%, 50%)',
  DOGE: 'hsl(35, 93%, 53%)',
};

const FIAT_COLORS = {
  USD: 'hsl(142, 76%, 36%)',
  EUR: 'hsl(220, 70%, 50%)',
  GBP: 'hsl(280, 70%, 50%)',
  JPY: 'hsl(0, 70%, 50%)',
  INR: 'hsl(25, 95%, 53%)',
  AUD: 'hsl(45, 93%, 47%)',
  CAD: 'hsl(0, 84%, 60%)',
  CHF: 'hsl(0, 0%, 50%)',
  CNY: 'hsl(0, 70%, 45%)',
  SGD: 'hsl(330, 70%, 50%)',
  AED: 'hsl(120, 50%, 40%)',
};

const TIMEFRAMES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
];

export default function PortfolioAnalytics() {
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[1]);
  
  const wallet = getWallet(user?.id);
  const balance = getBalance(user?.id);
  const transactions = getTransactions(user?.id);

  // Calculate total portfolio value in USD
  const portfolioData = useMemo(() => {
    // Crypto holdings value
    const cryptoHoldings = Object.entries(wallet)
      .filter(([_, amount]) => amount > 0)
      .map(([symbol, amount]) => ({
        symbol,
        amount,
        valueUSD: amount * (CRYPTO_PRICES[symbol] || 0),
        type: 'crypto',
        color: CRYPTO_COLORS[symbol] || 'hsl(var(--primary))',
      }));

    // Fiat holdings value (converted to USD)
    const fiatHoldings = Object.entries(balance)
      .filter(([_, amount]) => amount > 0)
      .map(([currency, amount]) => {
        const usdRate = currency === 'USD' ? 1 : (FX_RATES[currency]?.USD || 1);
        return {
          symbol: currency,
          amount,
          valueUSD: amount * usdRate,
          type: 'fiat',
          color: FIAT_COLORS[currency] || 'hsl(var(--accent))',
        };
      });

    const allHoldings = [...cryptoHoldings, ...fiatHoldings];
    const totalValue = allHoldings.reduce((sum, h) => sum + h.valueUSD, 0);

    // Calculate percentages
    const holdingsWithPercentage = allHoldings.map(h => ({
      ...h,
      percentage: totalValue > 0 ? (h.valueUSD / totalValue) * 100 : 0,
    }));

    return {
      holdings: holdingsWithPercentage,
      totalValue,
      cryptoValue: cryptoHoldings.reduce((sum, h) => sum + h.valueUSD, 0),
      fiatValue: fiatHoldings.reduce((sum, h) => sum + h.valueUSD, 0),
    };
  }, [wallet, balance]);

  // Calculate profit/loss from transactions
  const profitLoss = useMemo(() => {
    let totalInvested = 0;
    let totalWithdrawn = 0;
    let cryptoBuys = 0;
    let cryptoSells = 0;
    let feesPaid = 0;

    transactions.forEach(tx => {
      if (tx.type === 'fiat_to_crypto') {
        cryptoBuys += tx.fiatAmount || 0;
        feesPaid += tx.fee || 0;
      } else if (tx.type === 'crypto_to_fiat') {
        cryptoSells += tx.fiatAmount || 0;
        feesPaid += tx.fee || 0;
      } else if (tx.type === 'deposit' || tx.type === 'receive') {
        totalInvested += tx.amount || 0;
      } else if (tx.type === 'payment' || tx.type === 'send') {
        totalWithdrawn += tx.amount || 0;
      }
    });

    const netInvestment = totalInvested - totalWithdrawn + cryptoBuys - cryptoSells;
    const currentValue = portfolioData.totalValue;
    const profitLossAmount = currentValue - netInvestment;
    const profitLossPercent = netInvestment > 0 ? (profitLossAmount / netInvestment) * 100 : 0;

    return {
      totalInvested: netInvestment,
      currentValue,
      profitLossAmount,
      profitLossPercent,
      feesPaid,
      isProfit: profitLossAmount >= 0,
    };
  }, [transactions, portfolioData.totalValue]);

  // Generate historical performance data
  const performanceData = useMemo(() => {
    const data = [];
    const now = new Date();
    const baseValue = portfolioData.totalValue;
    const volatility = 0.03;

    for (let i = selectedTimeframe.days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Simulate historical value with trend
      const trendFactor = 1 - (i / selectedTimeframe.days) * 0.15;
      const randomFactor = 1 + (Math.random() - 0.5) * volatility;
      const value = baseValue * trendFactor * randomFactor;

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: parseFloat(value.toFixed(2)),
        crypto: parseFloat((portfolioData.cryptoValue * trendFactor * randomFactor).toFixed(2)),
        fiat: parseFloat((portfolioData.fiatValue * trendFactor * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)),
      });
    }

    // Ensure last point is current value
    if (data.length > 0) {
      data[data.length - 1].value = baseValue;
      data[data.length - 1].crypto = portfolioData.cryptoValue;
      data[data.length - 1].fiat = portfolioData.fiatValue;
    }

    return data;
  }, [portfolioData, selectedTimeframe]);

  // Diversification score (0-100)
  const diversificationScore = useMemo(() => {
    const holdings = portfolioData.holdings;
    if (holdings.length === 0) return 0;
    if (holdings.length === 1) return 20;

    // Calculate Herfindahl-Hirschman Index (HHI)
    const hhi = holdings.reduce((sum, h) => sum + Math.pow(h.percentage, 2), 0);
    // Convert HHI to diversification score (lower HHI = more diversified)
    const score = Math.max(0, Math.min(100, 100 - (hhi / 100)));
    return Math.round(score);
  }, [portfolioData.holdings]);

  const getDiversificationLabel = (score) => {
    if (score >= 70) return { label: 'Well Diversified', color: 'text-success' };
    if (score >= 40) return { label: 'Moderately Diversified', color: 'text-warning' };
    return { label: 'Concentrated', color: 'text-destructive' };
  };

  const diversificationInfo = getDiversificationLabel(diversificationScore);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Total Value</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(portfolioData.totalValue, 'USD')}
          </p>
        </div>

        {/* Profit/Loss */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              profitLoss.isProfit ? 'bg-success/20' : 'bg-destructive/20'
            }`}>
              {profitLoss.isProfit ? (
                <ArrowUpRight className="w-5 h-5 text-success" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-destructive" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">Profit/Loss</p>
          </div>
          <p className={`text-2xl font-bold ${profitLoss.isProfit ? 'text-success' : 'text-destructive'}`}>
            {profitLoss.isProfit ? '+' : ''}{formatCurrency(profitLoss.profitLossAmount, 'USD')}
          </p>
          <p className={`text-sm ${profitLoss.isProfit ? 'text-success' : 'text-destructive'}`}>
            {profitLoss.isProfit ? '+' : ''}{profitLoss.profitLossPercent.toFixed(2)}%
          </p>
        </div>

        {/* Crypto Holdings */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-muted-foreground">Crypto Holdings</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(portfolioData.cryptoValue, 'USD')}
          </p>
          <p className="text-sm text-muted-foreground">
            {portfolioData.totalValue > 0 
              ? `${((portfolioData.cryptoValue / portfolioData.totalValue) * 100).toFixed(1)}% of portfolio`
              : '0%'}
          </p>
        </div>

        {/* Diversification Score */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Diversification</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{diversificationScore}/100</p>
          <p className={`text-sm ${diversificationInfo.color}`}>{diversificationInfo.label}</p>
        </div>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="performance" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="allocation" className="gap-2">
            <PieChartIcon className="w-4 h-4" />
            Allocation
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Info className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Portfolio Performance</h3>
              <div className="flex gap-2">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.label}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedTimeframe.label === tf.label
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Crypto vs Fiat breakdown */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-secondary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm text-muted-foreground">Crypto</span>
                </div>
                <p className="text-lg font-semibold">{formatCurrency(portfolioData.cryptoValue, 'USD')}</p>
              </div>
              <div className="p-4 bg-secondary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Fiat</span>
                </div>
                <p className="text-lg font-semibold">{formatCurrency(portfolioData.fiatValue, 'USD')}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-semibold text-foreground mb-6">Asset Allocation</h3>

            {portfolioData.holdings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No assets in portfolio</p>
                <p className="text-sm">Add funds to see allocation breakdown</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioData.holdings}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="valueUSD"
                        nameKey="symbol"
                      >
                        {portfolioData.holdings.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Holdings List */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {portfolioData.holdings
                    .sort((a, b) => b.valueUSD - a.valueUSD)
                    .map((holding) => (
                      <div
                        key={holding.symbol}
                        className="flex items-center justify-between p-3 bg-secondary rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: holding.color }}
                          >
                            <span className="text-xs font-bold text-white">
                              {holding.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{holding.symbol}</p>
                            <p className="text-xs text-muted-foreground capitalize">{holding.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(holding.valueUSD, 'USD')}</p>
                          <p className="text-xs text-muted-foreground">
                            {holding.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-semibold text-foreground mb-6">Portfolio Insights</h3>

            <div className="space-y-4">
              {/* Diversification Insight */}
              <div className="p-4 bg-secondary rounded-xl">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    diversificationScore >= 70 ? 'bg-success/20' : diversificationScore >= 40 ? 'bg-warning/20' : 'bg-destructive/20'
                  }`}>
                    <PieChartIcon className={`w-5 h-5 ${
                      diversificationScore >= 70 ? 'text-success' : diversificationScore >= 40 ? 'text-warning' : 'text-destructive'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Diversification Analysis</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {diversificationScore >= 70
                        ? 'Your portfolio is well-diversified across multiple assets, reducing overall risk.'
                        : diversificationScore >= 40
                        ? 'Consider adding more assets to improve diversification and reduce concentration risk.'
                        : 'Your portfolio is highly concentrated. Diversifying across more assets could help reduce risk.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Crypto Allocation Insight */}
              <div className="p-4 bg-secondary rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Crypto Exposure</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {portfolioData.totalValue > 0 ? (
                        (portfolioData.cryptoValue / portfolioData.totalValue) * 100 > 50
                          ? 'Your crypto allocation is above 50%. Consider your risk tolerance for high volatility assets.'
                          : (portfolioData.cryptoValue / portfolioData.totalValue) * 100 > 20
                          ? 'You have a balanced mix of crypto and traditional currencies.'
                          : 'Your crypto exposure is conservative. Consider increasing if you have a longer investment horizon.'
                      ) : 'Add assets to see crypto exposure analysis.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Holding Insight */}
              {portfolioData.holdings.length > 0 && (
                <div className="p-4 bg-secondary rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Largest Position</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {portfolioData.holdings[0]?.symbol} makes up {portfolioData.holdings[0]?.percentage.toFixed(1)}% of your portfolio.
                        {portfolioData.holdings[0]?.percentage > 40
                          ? ' This is a significant concentration - consider rebalancing.'
                          : ' This is within a healthy range.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fees Paid */}
              <div className="p-4 bg-secondary rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                    <Info className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Transaction Costs</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You've paid {formatCurrency(profitLoss.feesPaid, 'USD')} in transaction fees.
                      {profitLoss.feesPaid > 100
                        ? ' Consider batching transactions to reduce fee costs.'
                        : ' Your fee costs are reasonable.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}