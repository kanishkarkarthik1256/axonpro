import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveFXRates } from '@/hooks/useLiveFXRates';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'AED'];

const TIMEFRAMES = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
];

const CHART_COLORS = {
  USD: 'hsl(var(--primary))',
  EUR: 'hsl(var(--accent))',
  GBP: 'hsl(var(--success))',
  JPY: 'hsl(var(--warning))',
  INR: 'hsl(var(--crypto-eth))',
  AUD: 'hsl(142, 76%, 36%)',
  CAD: 'hsl(0, 84%, 60%)',
  CHF: 'hsl(25, 95%, 53%)',
  CNY: 'hsl(262, 83%, 58%)',
  SGD: 'hsl(199, 89%, 48%)',
  AED: 'hsl(330, 81%, 60%)',
};

// Generate historical data based on current live rate
const generateHistoricalData = (baseCurrency, days, liveRates) => {
  const data = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const dayData = {
      date: days <= 1 
        ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: date.toISOString(),
    };

    CURRENCIES.forEach(currency => {
      if (currency !== baseCurrency && liveRates) {
        const baseRate = liveRates[currency] || 1;
        // Add historical variance (more variance for longer timeframes)
        const varianceMultiplier = Math.min(days / 30, 1) * 0.05;
        const fluctuation = 1 + (Math.random() - 0.5) * varianceMultiplier;
        const historicalRate = baseRate * fluctuation;
        dayData[currency] = parseFloat(historicalRate.toFixed(currency === 'JPY' || currency === 'INR' ? 2 : 4));
      }
    });

    data.push(dayData);
  }

  // Set the last data point to actual live rate
  if (data.length > 0 && liveRates) {
    const lastPoint = data[data.length - 1];
    CURRENCIES.forEach(currency => {
      if (currency !== baseCurrency && liveRates[currency]) {
        lastPoint[currency] = parseFloat(liveRates[currency].toFixed(currency === 'JPY' || currency === 'INR' ? 2 : 4));
      }
    });
  }

  return data;
};

export default function FXRateChart() {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [compareCurrencies, setCompareCurrencies] = useState(['EUR', 'GBP']);
  const [chartData, setChartData] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[1]); // 1W default
  
  const { rates, loading, lastUpdate, refreshRates, error } = useLiveFXRates(baseCurrency);

  useEffect(() => {
    if (rates) {
      const data = generateHistoricalData(baseCurrency, selectedTimeframe.days, rates);
      setChartData(data);
    }
  }, [rates, baseCurrency, selectedTimeframe]);

  const toggleCurrency = (currency) => {
    if (compareCurrencies.includes(currency)) {
      if (compareCurrencies.length > 1) {
        setCompareCurrencies(compareCurrencies.filter(c => c !== currency));
      }
    } else {
      setCompareCurrencies([...compareCurrencies, currency]);
    }
  };

  const availableCurrencies = CURRENCIES.filter(c => c !== baseCurrency);

  const handleRefresh = async () => {
    await refreshRates();
  };

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Live FX Rates</h3>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Updating...' : error ? 'Using cached rates' : `Updated: ${lastUpdate?.toLocaleTimeString() || 'N/A'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={baseCurrency} onValueChange={setBaseCurrency}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-4">
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

      {/* Currency Toggle Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {availableCurrencies.map((currency) => (
          <button
            key={currency}
            onClick={() => toggleCurrency(currency)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              compareCurrencies.includes(currency)
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {currency}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            {compareCurrencies.map((currency) => (
              <Line
                key={currency}
                type="monotone"
                dataKey={currency}
                stroke={CHART_COLORS[currency]}
                strokeWidth={2}
                dot={selectedTimeframe.days <= 7 ? { fill: CHART_COLORS[currency], r: 3 } : false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current Rates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
        {availableCurrencies.slice(0, 5).map((currency) => {
          const currentRate = rates?.[currency];
          const prevRate = chartData[chartData.length - 2]?.[currency];
          const change = currentRate && prevRate ? ((currentRate - prevRate) / prevRate * 100).toFixed(2) : 0;
          
          return (
            <div key={currency} className="bg-secondary p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">1 {baseCurrency} =</p>
              <p className="font-semibold">
                {currentRate?.toFixed(currency === 'JPY' || currency === 'INR' ? 2 : 4) || '...'} {currency}
              </p>
              <p className={`text-xs ${parseFloat(change) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {parseFloat(change) >= 0 ? '+' : ''}{change}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
