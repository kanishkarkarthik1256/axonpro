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
import { ArrowRight, Calculator, Wallet, RefreshCw } from 'lucide-react';

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

export default function FiatToCryptoTransfer({ onTransferComplete }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { convertCurrency } = useLiveFXRates('USD');
  
  const [open, setOpen] = useState(false);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCrypto, setToCrypto] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState('buy'); // 'buy' or 'calculator'

  const balance = getBalance(user?.id);
  const wallet = getWallet(user?.id);

  const TRANSACTION_FEE = 0.015; // 1.5% fee

  const calculateCryptoAmount = () => {
    const fiatAmount = parseFloat(amount) || 0;
    if (fiatAmount <= 0) return 0;
    
    // Convert to USD first if needed
    const usdAmount = fromCurrency === 'USD' 
      ? fiatAmount 
      : convertCurrency(fiatAmount, fromCurrency, 'USD');
    
    // Apply fee
    const amountAfterFee = usdAmount * (1 - TRANSACTION_FEE);
    
    // Convert to crypto
    const cryptoPrice = CRYPTO_PRICES[toCrypto];
    return amountAfterFee / cryptoPrice;
  };

  const calculateFee = () => {
    const fiatAmount = parseFloat(amount) || 0;
    return fiatAmount * TRANSACTION_FEE;
  };

  const handleBuyCrypto = () => {
    const fiatAmount = parseFloat(amount);
    
    if (!fiatAmount || fiatAmount <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }

    if (fiatAmount > (balance[fromCurrency] || 0)) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const cryptoAmount = calculateCryptoAmount();
      
      // Update fiat balance
      const newBalance = { ...balance, [fromCurrency]: (balance[fromCurrency] || 0) - fiatAmount };
      setBalance(user?.id, newBalance);

      // Update crypto wallet
      const newWallet = { ...wallet, [toCrypto]: (wallet[toCrypto] || 0) + cryptoAmount };
      setWallet(user?.id, newWallet);

      // Add transaction
      addTransaction(user?.id, {
        type: 'fiat_to_crypto',
        fromCurrency,
        toCrypto,
        fiatAmount,
        cryptoAmount,
        fee: calculateFee(),
        status: 'Completed',
      });

      toast({
        title: 'Purchase Complete!',
        description: `Bought ${formatCrypto(cryptoAmount, toCrypto)} for ${formatCurrency(fiatAmount, fromCurrency)}`,
      });

      setOpen(false);
      setAmount('');
      setIsProcessing(false);
      onTransferComplete?.();
    }, 1500);
  };

  const cryptoAmount = calculateCryptoAmount();
  const fee = calculateFee();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="lg" className="gap-2">
          <Wallet className="w-5 h-5" />
          Buy Crypto
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Fiat to Crypto
          </DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setMode('buy')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              mode === 'buy' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Buy Crypto
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
          {/* From Currency */}
          <div className="space-y-2">
            <Label>From Currency</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIAT_CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency} {mode === 'buy' && `(Balance: ${formatCurrency(balance[currency] || 0, currency)})`}
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
            {mode === 'buy' && (
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(balance[fromCurrency] || 0, fromCurrency)}
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* To Crypto */}
          <div className="space-y-2">
            <Label>To Cryptocurrency</Label>
            <Select value={toCrypto} onValueChange={setToCrypto}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_LIST.map((crypto) => (
                  <SelectItem key={crypto} value={crypto}>
                    {crypto} - {CRYPTO_NAMES[crypto]} (${CRYPTO_PRICES[crypto].toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {amount && parseFloat(amount) > 0 && (
            <div className="p-4 bg-secondary rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You pay</span>
                <span className="font-medium">{formatCurrency(parseFloat(amount), fromCurrency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee (1.5%)</span>
                <span className="text-warning">{formatCurrency(fee, fromCurrency)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-muted-foreground">You receive</span>
                <span className="font-semibold text-success">{formatCrypto(cryptoAmount, toCrypto)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-1">
                Rate: 1 {toCrypto} = ${CRYPTO_PRICES[toCrypto].toLocaleString()}
              </p>
            </div>
          )}

          {/* Action Button */}
          {mode === 'buy' ? (
            <Button
              variant="gradient"
              className="w-full"
              onClick={handleBuyCrypto}
              disabled={isProcessing || !amount || parseFloat(amount) <= 0}
            >
              {isProcessing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                `Buy ${toCrypto}`
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
