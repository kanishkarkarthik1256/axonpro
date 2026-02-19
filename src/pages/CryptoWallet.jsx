import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWallet, setWallet, addTransaction, getTransactions, generateHash } from '@/utils/storage';
import { CRYPTO_PRICES, formatCrypto, formatCurrency, shortenHash, formatDate } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet,
  Send,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ArrowLeftRight,
  Bitcoin,
  DollarSign
} from 'lucide-react';
import FiatToCryptoTransfer from '@/components/FiatToCryptoTransfer';
import CryptoToFiatTransfer from '@/components/CryptoToFiatTransfer';
import CryptoPriceChart from '@/components/CryptoPriceChart';
import PriceAlerts from '@/components/PriceAlerts';
import PortfolioAnalytics from '@/components/PortfolioAnalytics';

export default function CryptoWallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWalletState] = useState(getWallet(user?.id));
  const [transactions, setTransactions] = useState(
    getTransactions(user?.id).filter(tx => tx.crypto)
  );
  
  // Send Modal State
  const [sendOpen, setSendOpen] = useState(false);
  const [sendCrypto, setSendCrypto] = useState('BTC');
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Receive Modal State
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveCrypto, setReceiveCrypto] = useState('BTC');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);

  // Swap Modal State
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapFrom, setSwapFrom] = useState('BTC');
  const [swapTo, setSwapTo] = useState('ETH');
  const [swapAmount, setSwapAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  const walletAddress = `0x${user?.id?.slice(-40) || 'a1b2c3d4e5f6789012345678901234567890abcd'}`;

  const cryptoData = [
    { symbol: 'BTC', name: 'Bitcoin', bgColor: 'bg-orange-500', textColor: 'text-white', icon: '₿', change: 2.4 },
    { symbol: 'ETH', name: 'Ethereum', bgColor: 'bg-indigo-500', textColor: 'text-white', icon: 'Ξ', change: -1.2 },
    { symbol: 'USDT', name: 'Tether', bgColor: 'bg-emerald-500', textColor: 'text-white', icon: '₮', change: 0.01 },
    { symbol: 'BNB', name: 'BNB', bgColor: 'bg-yellow-500', textColor: 'text-white', icon: 'B', change: 1.8 },
    { symbol: 'SOL', name: 'Solana', bgColor: 'bg-violet-500', textColor: 'text-white', icon: 'S', change: 5.2 },
    { symbol: 'XRP', name: 'Ripple', bgColor: 'bg-blue-500', textColor: 'text-white', icon: 'X', change: -0.5 },
    { symbol: 'ADA', name: 'Cardano', bgColor: 'bg-cyan-500', textColor: 'text-white', icon: 'A', change: 3.1 },
    { symbol: 'DOGE', name: 'Dogecoin', bgColor: 'bg-amber-500', textColor: 'text-white', icon: 'Ð', change: 8.5 },
  ];

  const handleSend = () => {
    const amount = parseFloat(sendAmount);
    
    if (!amount || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    if (amount > wallet[sendCrypto]) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }

    if (!sendAddress || sendAddress.length < 10) {
      toast({ title: 'Invalid wallet address', variant: 'destructive' });
      return;
    }

    setIsSending(true);

    setTimeout(() => {
      const newWallet = { ...wallet, [sendCrypto]: wallet[sendCrypto] - amount };
      setWallet(user?.id, newWallet);
      setWalletState(newWallet);

      const tx = addTransaction(user?.id, {
        type: 'send',
        crypto: sendCrypto,
        amount,
        toAddress: sendAddress,
        hash: generateHash(),
        status: 'Completed',
      });

      setTransactions([tx, ...transactions]);

      toast({
        title: 'Transaction Sent!',
        description: `${formatCrypto(amount, sendCrypto)} sent successfully`,
      });

      setSendOpen(false);
      setSendAmount('');
      setSendAddress('');
      setIsSending(false);
    }, 1500);
  };

  const handleReceive = () => {
    const amount = parseFloat(receiveAmount);
    
    if (!amount || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    setIsReceiving(true);

    setTimeout(() => {
      const newWallet = { ...wallet, [receiveCrypto]: (wallet[receiveCrypto] || 0) + amount };
      setWallet(user?.id, newWallet);
      setWalletState(newWallet);

      const tx = addTransaction(user?.id, {
        type: 'receive',
        crypto: receiveCrypto,
        amount,
        fromAddress: generateHash().slice(0, 42),
        hash: generateHash(),
        status: 'Completed',
      });

      setTransactions([tx, ...transactions]);

      toast({
        title: 'Crypto Received!',
        description: `${formatCrypto(amount, receiveCrypto)} added to your wallet`,
      });

      setReceiveOpen(false);
      setReceiveAmount('');
      setIsReceiving(false);
    }, 1500);
  };

  const handleSwap = () => {
    const amount = parseFloat(swapAmount);
    
    if (!amount || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    if (amount > (wallet[swapFrom] || 0)) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }

    if (swapFrom === swapTo) {
      toast({ title: 'Cannot swap same cryptocurrency', variant: 'destructive' });
      return;
    }

    setIsSwapping(true);

    setTimeout(() => {
      // Calculate swap rate
      const fromPrice = CRYPTO_PRICES[swapFrom];
      const toPrice = CRYPTO_PRICES[swapTo];
      const swapFee = 0.005; // 0.5% fee
      const usdValue = amount * fromPrice;
      const receivedAmount = (usdValue * (1 - swapFee)) / toPrice;

      const newWallet = { 
        ...wallet, 
        [swapFrom]: (wallet[swapFrom] || 0) - amount,
        [swapTo]: (wallet[swapTo] || 0) + receivedAmount
      };
      setWallet(user?.id, newWallet);
      setWalletState(newWallet);

      const tx = addTransaction(user?.id, {
        type: 'swap',
        crypto: swapFrom,
        toCrypto: swapTo,
        amount,
        receivedAmount,
        hash: generateHash(),
        status: 'Completed',
      });

      setTransactions([tx, ...transactions]);

      toast({
        title: 'Swap Completed!',
        description: `${formatCrypto(amount, swapFrom)} → ${formatCrypto(receivedAmount, swapTo)}`,
      });

      setSwapOpen(false);
      setSwapAmount('');
      setIsSwapping(false);
    }, 1500);
  };

  const getSwapPreview = () => {
    const amount = parseFloat(swapAmount) || 0;
    const fromPrice = CRYPTO_PRICES[swapFrom];
    const toPrice = CRYPTO_PRICES[swapTo];
    const swapFee = 0.005;
    const usdValue = amount * fromPrice;
    const receivedAmount = (usdValue * (1 - swapFee)) / toPrice;
    return receivedAmount;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({ title: 'Address copied!' });
  };

  const totalValue = Object.entries(wallet).reduce(
    (total, [symbol, balance]) => total + (balance || 0) * (CRYPTO_PRICES[symbol] || 0),
    0
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
            <Wallet className="w-8 h-8 text-primary" />
            Crypto Wallet
          </h1>
          <p className="text-muted-foreground mt-2">Manage your cryptocurrency portfolio</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Buy Crypto with Fiat */}
          <FiatToCryptoTransfer 
            onTransferComplete={() => {
              setWalletState(getWallet(user?.id));
              setTransactions(getTransactions(user?.id).filter(tx => tx.crypto || tx.type === 'fiat_to_crypto' || tx.type === 'crypto_to_fiat'));
            }} 
          />

          {/* Sell Crypto to Fiat */}
          <CryptoToFiatTransfer 
            onTransferComplete={() => {
              setWalletState(getWallet(user?.id));
              setTransactions(getTransactions(user?.id).filter(tx => tx.crypto || tx.type === 'fiat_to_crypto' || tx.type === 'crypto_to_fiat'));
            }} 
          />

          {/* Swap Dialog */}
          <Dialog open={swapOpen} onOpenChange={setSwapOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg">
                <ArrowLeftRight className="w-5 h-5" />
                Swap
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">Swap Crypto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select value={swapFrom} onValueChange={setSwapFrom}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoData.map((c) => (
                        <SelectItem key={c.symbol} value={c.symbol}>
                          {c.symbol} - {c.name} ({formatCrypto(wallet[c.symbol] || 0, c.symbol)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {formatCrypto(wallet[swapFrom] || 0, swapFrom)}
                  </p>
                </div>

                <div className="flex justify-center">
                  <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <Label>To</Label>
                  <Select value={swapTo} onValueChange={setSwapTo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoData.filter(c => c.symbol !== swapFrom).map((c) => (
                        <SelectItem key={c.symbol} value={c.symbol}>
                          {c.symbol} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {swapAmount && parseFloat(swapAmount) > 0 && (
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">You will receive (0.5% fee):</p>
                    <p className="text-lg font-semibold text-foreground">
                      ~{formatCrypto(getSwapPreview(), swapTo)}
                    </p>
                  </div>
                )}

                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={handleSwap}
                  disabled={isSwapping}
                >
                  {isSwapping ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Swap'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Receive Dialog */}
          <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg">
                <Download className="w-5 h-5" />
                Receive
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">Receive Crypto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Select Cryptocurrency</Label>
                  <Select value={receiveCrypto} onValueChange={setReceiveCrypto}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoData.map((c) => (
                        <SelectItem key={c.symbol} value={c.symbol}>
                          {c.symbol} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount (Demo)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Your Wallet Address</Label>
                  <div className="flex gap-2">
                    <Input value={walletAddress} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={copyAddress}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={handleReceive}
                  disabled={isReceiving}
                >
                  {isReceiving ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Simulate Receive'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Send Dialog */}
          <Dialog open={sendOpen} onOpenChange={setSendOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" size="lg">
                <Send className="w-5 h-5" />
                Send
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">Send Crypto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Select Cryptocurrency</Label>
                  <Select value={sendCrypto} onValueChange={setSendCrypto}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoData.map((c) => (
                        <SelectItem key={c.symbol} value={c.symbol}>
                          {c.symbol} - {c.name} ({formatCrypto(wallet[c.symbol] || 0, c.symbol)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {formatCrypto(wallet[sendCrypto] || 0, sendCrypto)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Recipient Address</Label>
                  <Input
                    placeholder="0x..."
                    value={sendAddress}
                    onChange={(e) => setSendAddress(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={handleSend}
                  disabled={isSending}
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Send'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Total Portfolio Value */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bitcoin className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-muted-foreground">Total Portfolio Value</p>
            <p className="text-4xl font-bold text-foreground">{formatCurrency(totalValue, 'USD')}</p>
          </div>
        </div>
      </div>

      {/* Portfolio Analytics */}
      <PortfolioAnalytics />

      {/* Crypto Price Chart & Price Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <CryptoPriceChart />
        <PriceAlerts />
      </div>

      {/* Crypto Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {cryptoData.map((crypto) => {
          const balance = wallet[crypto.symbol] || 0;
          const value = balance * CRYPTO_PRICES[crypto.symbol];
          
          return (
            <div key={crypto.symbol} className="glass-card p-5 rounded-2xl hover-scale">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${crypto.bgColor} flex items-center justify-center`}>
                    <span className={`text-lg font-bold ${crypto.textColor}`}>{crypto.icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{crypto.symbol}</p>
                    <p className="text-xs text-muted-foreground">{crypto.name}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  crypto.change >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                }`}>
                  {crypto.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(crypto.change)}%
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xl font-bold text-foreground">{formatCrypto(balance, crypto.symbol)}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(value, 'USD')}</p>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-foreground">{formatCurrency(CRYPTO_PRICES[crypto.symbol], 'USD')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Transaction History</h2>
        <div className="glass-card rounded-2xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No crypto transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.slice(0, 10).map((tx) => {
                // Handle different transaction types with different field names
                const getTransactionDisplay = () => {
                  if (tx.type === 'fiat_to_crypto') {
                    return {
                      label: `Buy ${tx.toCrypto}`,
                      amount: formatCrypto(tx.cryptoAmount || 0, tx.toCrypto),
                      isPositive: true,
                      icon: 'receive',
                    };
                  }
                  if (tx.type === 'crypto_to_fiat') {
                    return {
                      label: `Sell ${tx.fromCrypto}`,
                      amount: formatCrypto(tx.cryptoAmount || 0, tx.fromCrypto),
                      isPositive: false,
                      icon: 'send',
                    };
                  }
                  if (tx.type === 'swap') {
                    return {
                      label: `Swap ${tx.crypto} → ${tx.toCrypto}`,
                      amount: formatCrypto(tx.receivedAmount || 0, tx.toCrypto),
                      isPositive: null,
                      icon: 'swap',
                    };
                  }
                  return {
                    label: `${tx.type} ${tx.crypto || ''}`,
                    amount: formatCrypto(tx.amount || 0, tx.crypto || 'BTC'),
                    isPositive: tx.type !== 'send',
                    icon: tx.type === 'send' ? 'send' : 'receive',
                  };
                };

                const display = getTransactionDisplay();

                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        display.icon === 'send' ? 'bg-destructive/20 text-destructive' : 
                        display.icon === 'swap' ? 'bg-primary/20 text-primary' : 
                        'bg-success/20 text-success'
                      }`}>
                        {display.icon === 'send' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : display.icon === 'swap' ? (
                          <ArrowLeftRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize text-foreground">
                          {display.label}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {shortenHash(tx.hash) || tx.id?.slice(0, 16)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        display.isPositive === null ? 'text-primary' :
                        display.isPositive ? 'text-success' : 'text-destructive'
                      }`}>
                        {display.isPositive === null ? '' : display.isPositive ? '+' : '-'}{display.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}