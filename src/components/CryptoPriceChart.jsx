import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CRYPTO_PRICES } from '@/utils/helpers';

const CRYPTO_LIST = [
  { symbol: 'BTC', name: 'Bitcoin', color: 'hsl(25, 95%, 53%)' },
  { symbol: 'ETH', name: 'Ethereum', color: 'hsl(240, 70%, 60%)' },
  { symbol: 'USDT', name: 'Tether', color: 'hsl(142, 76%, 36%)' },
  { symbol: 'BNB', name: 'BNB', color: 'hsl(45, 93%, 47%)' },
  { symbol: 'SOL', name: 'Solana', color: 'hsl(280, 70%, 50%)' },
  { symbol: 'XRP', name: 'Ripple', color: 'hsl(210, 70%, 50%)' },
  { symbol: 'ADA', name: 'Cardano', color: 'hsl(190, 70%, 50%)' },
  { symbol: 'DOGE', name: 'Dogecoin', color: 'hsl(35, 93%, 53%)' },
];

const TIMEFRAMES = [
  { label: '1D', days: 1, points: 24 },
  { label: '1W', days: 7, points: 28 },
  { label: '1M', days: 30, points: 30 },
  { label: '3M', days: 90, points: 30 },
  { label: '1Y', days: 365, points: 52 },
];

const generateHistoricalData = (crypto, days, points) => {
  const data = [];
  const now = new Date();
  const basePrice = CRYPTO_PRICES[crypto];
  const volatility = crypto === 'USDT' ? 0.001 : 0.05 + Math.random() * 0.1;

  for (let i = points; i >= 0; i--) {
    const date = new Date(now);
    
    if (days <= 1) {
      date.setHours(date.getHours() - i);
    } else {
      date.setDate(date.getDate() - Math.floor((i / points) * days));
    }

    // Simulate price with trend and volatility
    const trendFactor = 1 + (Math.random() - 0.45) * volatility * (days / 30);
    const randomFactor = 1 + (Math.random() - 0.5) * volatility * 0.5;
    const price = basePrice * trendFactor * randomFactor;

    data.push({
      date: days <= 1
        ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(2)),
    });
  }

  // Ensure last point is current price
  if (data.length > 0) {
    data[data.length - 1].price = basePrice;
  }

  return data;
};

export default function CryptoPriceChart() {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[1]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const data = generateHistoricalData(
      selectedCrypto,
      selectedTimeframe.days,
      selectedTimeframe.points
    );
    setChartData(data);
  }, [selectedCrypto, selectedTimeframe]);

  const cryptoInfo = CRYPTO_LIST.find((c) => c.symbol === selectedCrypto);
  const currentPrice = CRYPTO_PRICES[selectedCrypto];
  const startPrice = chartData[0]?.price || currentPrice;
  const priceChange = ((currentPrice - startPrice) / startPrice) * 100;
  const isPositive = priceChange >= 0;

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: cryptoInfo?.color }}
          >
            <span className="text-white font-bold text-sm">{selectedCrypto.slice(0, 2)}</span>
          </div>
          <div>
            <h3 className="font-semibold">{cryptoInfo?.name} Price</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">${currentPrice.toLocaleString()}</span>
              <span
                className={`flex items-center text-sm font-medium ${
                  isPositive ? 'text-success' : 'text-destructive'
                }`}
              >
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CRYPTO_LIST.map((crypto) => (
              <SelectItem key={crypto.symbol} value={crypto.symbol}>
                {crypto.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              tickFormatter={(val) => `$${val.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={cryptoInfo?.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {CRYPTO_LIST.slice(0, 4).map((crypto) => {
          const price = CRYPTO_PRICES[crypto.symbol];
          const randomChange = (Math.random() - 0.5) * 10;
          return (
            <button
              key={crypto.symbol}
              onClick={() => setSelectedCrypto(crypto.symbol)}
              className={`p-3 rounded-lg text-left transition-all ${
                selectedCrypto === crypto.symbol
                  ? 'bg-primary/20 border border-primary'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              <p className="text-xs text-muted-foreground">{crypto.symbol}</p>
              <p className="font-semibold">${price.toLocaleString()}</p>
              <p className={`text-xs ${randomChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {randomChange >= 0 ? '+' : ''}{randomChange.toFixed(2)}%
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}