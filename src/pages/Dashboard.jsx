import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getBalance, getWallet, getTransactions } from '@/utils/storage';
import { formatCurrency, formatCrypto, CRYPTO_PRICES, getTimeAgo, convertToPreferredCurrency, FX_RATES } from '@/utils/helpers';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PaymentTracker from '@/components/PaymentTracker';
import { useIncomingPayments } from '@/hooks/useIncomingPayments';
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Wallet,
  CreditCard,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Bitcoin,
  CircleDollarSign,
  Banknote,
  Download
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { preferredCurrency } = useCurrency();
  const { simulateIncomingPayment } = useIncomingPayments();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const balances = getBalance(user?.id) || {};
  const wallet = getWallet(user?.id) || {};
  const transactions = getTransactions(user?.id).slice(0, 5);

  // Simulate receiving money (for demo)
  const handleSimulateReceive = () => {
    const currencies = ['USD', 'EUR', 'GBP'];
    const senders = ['John Smith', 'Alice Johnson', 'Bob Williams', 'External Bank', 'Wire Transfer'];
    const amounts = [150, 250, 500, 1000, 2500];
    
    const currency = currencies[Math.floor(Math.random() * currencies.length)];
    const sender = senders[Math.floor(Math.random() * senders.length)];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    
    simulateIncomingPayment(amount, currency, sender);
    setRefreshKey(prev => prev + 1);
  };

  // Calculate total fiat in preferred currency
  const totalFiatInPreferred = Object.entries(balances).reduce((total, [currency, amount]) => {
    return total + convertToPreferredCurrency(amount || 0, currency, preferredCurrency);
  }, 0);

  // Calculate total crypto value in preferred currency (via USD first)
  const cryptoList = Object.entries(wallet).filter(([symbol]) => CRYPTO_PRICES[symbol]);
  const totalCryptoUSD = cryptoList.reduce((total, [symbol, amount]) => {
    return total + ((amount || 0) * (CRYPTO_PRICES[symbol] || 0));
  }, 0);
  const totalCryptoInPreferred = convertToPreferredCurrency(totalCryptoUSD, 'USD', preferredCurrency);

  const quickActions = [
    { label: 'Send Money', icon: Send, path: '/payments' },
    { label: 'FX Optimizer', icon: ArrowRightLeft, path: '/fx-optimizer' },
    { label: 'Crypto Wallet', icon: Bitcoin, path: '/crypto-wallet' },
  ];

  const cryptoCards = [
    { symbol: 'BTC', name: 'Bitcoin', balance: wallet.BTC || 0, price: CRYPTO_PRICES.BTC, change: 2.4, bgColor: 'bg-orange-500' },
    { symbol: 'ETH', name: 'Ethereum', balance: wallet.ETH || 0, price: CRYPTO_PRICES.ETH, change: -1.2, bgColor: 'bg-indigo-500' },
    { symbol: 'USDT', name: 'Tether', balance: wallet.USDT || 0, price: CRYPTO_PRICES.USDT, change: 0.01, bgColor: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground mt-1">Here's your financial overview</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={handleSimulateReceive}>
            <Download className="w-5 h-5" />
            Simulate Receive
          </Button>
          <Link to="/payments">
            <Button variant="gradient" size="lg">
              <Send className="w-5 h-5" />
              Send Money
            </Button>
          </Link>
        </div>
      </div>

      {/* Total Balance Cards */}
      <div className="grid md:grid-cols-2 gap-6 stagger-children">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <CircleDollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Fiat Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(totalFiatInPreferred, preferredCurrency)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(balances).map(([currency, amount]) => (
              <div key={currency} className="px-3 py-1.5 bg-secondary rounded-lg text-sm">
                <span className="text-muted-foreground">{currency}:</span>{' '}
                <span className="font-medium">{formatCurrency(amount || 0, currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Crypto Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCryptoInPreferred, preferredCurrency)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {cryptoCards.map((crypto) => (
              <div key={crypto.symbol} className="px-3 py-1.5 bg-secondary rounded-lg text-sm">
                <span className="text-muted-foreground">{crypto.symbol}:</span>{' '}
                <span className="font-medium">{crypto.balance.toFixed(crypto.symbol === 'USDT' ? 2 : 4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Balances */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Account Balances</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 stagger-children">
          {Object.entries(balances).map(([currency, amount]) => (
            <div key={currency} className="glass-card p-4 rounded-xl text-center hover-scale">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Banknote className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-bold">{currency}</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(amount || 0, currency)}</p>
              {currency !== preferredCurrency && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {formatCurrency(convertToPreferredCurrency(amount || 0, currency, preferredCurrency), preferredCurrency)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.path} to={action.path}>
                <div className="glass-card p-6 rounded-2xl hover:border-primary/30 transition-colors cursor-pointer group">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <p className="font-semibold text-lg">{action.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">Click to get started</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Crypto Portfolio */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Crypto Portfolio</h2>
          <Link to="/crypto-wallet" className="text-primary hover:underline text-sm">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
          {cryptoCards.map((crypto) => (
            <div key={crypto.symbol} className="glass-card p-5 rounded-2xl hover-scale">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${crypto.bgColor} flex items-center justify-center`}>
                    <span className="text-sm font-bold text-white">{crypto.symbol[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{crypto.symbol}</p>
                    <p className="text-xs text-muted-foreground">{crypto.name}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-sm ${crypto.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {crypto.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(crypto.change)}%
                </div>
              </div>
              <div>
                <p className="text-lg font-bold">{formatCrypto(crypto.balance, crypto.symbol)}</p>
                <p className="text-sm text-muted-foreground">
                  ≈ {formatCurrency(convertToPreferredCurrency(crypto.balance * crypto.price, 'USD', preferredCurrency), preferredCurrency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Tracker & Recent Transactions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Real-time Payment Tracker */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Live Payment Status</h2>
          <PaymentTracker />
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <Link to="/history" className="text-primary hover:underline text-sm">
              View All
            </Link>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Start by sending money or trading crypto</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'send' || tx.type === 'payment_sent' ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'
                      }`}>
                        {tx.type === 'send' || tx.type === 'payment_sent' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{getTimeAgo(tx.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        tx.type === 'send' || tx.type === 'payment_sent' ? 'text-destructive' : 'text-success'
                      }`}>
                        {tx.type === 'send' || tx.type === 'payment_sent' ? '-' : '+'}
                        {tx.crypto ? formatCrypto(tx.amount, tx.crypto) : formatCurrency(tx.amount, tx.currency || 'USD')}
                      </p>
                      <p className="text-xs text-muted-foreground">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
