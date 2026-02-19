import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getBalance, setBalance, getWallet, setWallet, addTransaction } from '@/utils/storage';
import { CRYPTO_PRICES, formatCurrency, formatCrypto } from '@/utils/helpers';
import { useLiveFXRates } from '@/hooks/useLiveFXRates';
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
import { ArrowRight, Calculator, DollarSign, RefreshCw } from 'lucide-react';

const FIAT_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'AED'];
const CRYPTO_LIST = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE'];

const CRYPTO_NAMES = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  USDT: 'Tether',
  BNB: 'BNB',
  SOL: 'Solana',
  XRP: 'Ripple',
  ADA: 'Cardano',
  DOGE: 'Dogecoin',
};

export default function CryptoToFiatTransfer({ onTransferComplete }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { convertCurrency } = useLiveFXRates('USD');

  const [open, setOpen] = useState(false);
  const [fromCrypto, setFromCrypto] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState('sell'); // 'sell' or 'calculator'

  const balance = getBalance(user?.id);
  const wallet = getWallet(user?.id);

  const TRANSACTION_FEE = 0.015; // 1.5% fee

  const calculateFiatAmount = () => {
    const cryptoAmount = parseFloat(amount) || 0;
    if (cryptoAmount <= 0) return 0;

    // Convert crypto to USD first
    const usdAmount = cryptoAmount * CRYPTO_PRICES[fromCrypto];

    // Apply fee
    const amountAfterFee = usdAmount * (1 - TRANSACTION_FEE);

    // Convert USD to target currency
    const fiatAmount = toCurrency === 'USD'
      ? amountAfterFee
      : convertCurrency(amountAfterFee, 'USD', toCurrency);

    return fiatAmount;
  };

  const calculateFee = () => {
    const cryptoAmount = parseFloat(amount) || 0;
    const usdValue = cryptoAmount * CRYPTO_PRICES[fromCrypto];
    return usdValue * TRANSACTION_FEE;
  };

  const handleSellCrypto = () => {
    const cryptoAmount = parseFloat(amount);

    if (!cryptoAmount || cryptoAmount <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }

    if (cryptoAmount > (wallet[fromCrypto] || 0)) {
      toast({ title: 'Insufficient crypto balance', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const fiatAmount = calculateFiatAmount();

      // Update crypto wallet
      const newWallet = { ...wallet, [fromCrypto]: (wallet[fromCrypto] || 0) - cryptoAmount };
      setWallet(user?.id, newWallet);

      // Update fiat balance
      const newBalance = { ...balance, [toCurrency]: (balance[toCurrency] || 0) + fiatAmount };
      setBalance(user?.id, newBalance);

      // Add transaction
      addTransaction(user?.id, {
        type: 'crypto_to_fiat',
        fromCrypto,
        toCurrency,
        cryptoAmount,
        fiatAmount,
        fee: calculateFee(),
        status: 'Completed',
      });

      toast({
        title: 'Sale Complete!',
        description: `Sold ${formatCrypto(cryptoAmount, fromCrypto)} for ${formatCurrency(fiatAmount, toCurrency)}`,
      });

      setOpen(false);
      setAmount('');
      setIsProcessing(false);
      onTransferComplete?.();
    }, 1500);
  };

  const fiatAmount = calculateFiatAmount();
  const fee = calculateFee();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <DollarSign className="w-5 h-5" />
          Sell Crypto
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Crypto to Fiat
          </DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setMode('sell')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              mode === 'sell'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sell Crypto
          </button>
          <button
            onClick={() => setMode('calculator')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              mode === 'calculator'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calculator className="w-4 h-4 inline mr-1" />
            Calculator
          </button>
        </div>

        <div className="space-y-4 pt-2">
          {/* From Crypto */}
          <div className="space-y-2">
            <Label>From Cryptocurrency</Label>
            <Select value={fromCrypto} onValueChange={setFromCrypto}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_LIST.map((crypto) => (
                  <SelectItem key={crypto} value={crypto}>
                    {crypto} - {CRYPTO_NAMES[crypto]} {mode === 'sell' && `(${formatCrypto(wallet[crypto] || 0, crypto)})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {mode === 'sell' && (
              <p className="text-xs text-muted-foreground">
                Available: {formatCrypto(wallet[fromCrypto] || 0, fromCrypto)}
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* To Currency */}
          <div className="space-y-2">
            <Label>To Currency</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIAT_CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency} {mode === 'sell' && `(Balance: ${formatCurrency(balance[currency] || 0, currency)})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {amount && parseFloat(amount) > 0 && (
            <div className="p-4 bg-secondary rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You sell</span>
                <span className="font-medium">{formatCrypto(parseFloat(amount), fromCrypto)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee (1.5%)</span>
                <span className="text-warning">{formatCurrency(fee, 'USD')}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-muted-foreground">You receive</span>
                <span className="font-semibold text-success">{formatCurrency(fiatAmount, toCurrency)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-1">
                Rate: 1 {fromCrypto} = ${CRYPTO_PRICES[fromCrypto].toLocaleString()}
              </p>
            </div>
          )}

          {/* Action Button */}
          {mode === 'sell' ? (
            <Button
              variant="gradient"
              className="w-full"
              onClick={handleSellCrypto}
              disabled={isProcessing || !amount || parseFloat(amount) <= 0}
            >
              {isProcessing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                `Sell ${fromCrypto}`
              )}
            </Button>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              Use this calculator to preview conversion rates
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}