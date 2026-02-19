import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getBalance, setBalance, addTransaction, generatePaymentId } from '@/utils/storage';
import { formatCurrency, COUNTRIES } from '@/utils/helpers';
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
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Send,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowRight,
  Building,
  User,
  Route,
  AlertCircle
} from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'INR'];

export default function Payments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [balances, setBalances] = useState(() => getBalance(user?.id) || { USD: 0, EUR: 0, GBP: 0, JPY: 0, INR: 0 });
  
  const [fromAccount, setFromAccount] = useState('USD');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  
  // FX Optimizer integration
  const [pendingFXPayment, setPendingFXPayment] = useState(null);

  useEffect(() => {
    // Check for pending FX payment from optimizer
    const storedPayment = localStorage.getItem('pending_fx_payment');
    if (storedPayment && location.state?.fromFXOptimizer) {
      const payment = JSON.parse(storedPayment);
      setPendingFXPayment(payment);
      setFromAccount(payment.sourceCurrency);
      setAmount(payment.originalAmount.toString());
    }
  }, [location.state]);

  const handleSendPayment = () => {
    const amountNum = parseFloat(amount);
    
    if (!amountNum || amountNum <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    if (!toAccount) {
      toast({ title: 'Please enter recipient account', variant: 'destructive' });
      return;
    }

    if (!recipientName) {
      toast({ title: 'Please enter recipient name', variant: 'destructive' });
      return;
    }

    if (amountNum > balances[fromAccount]) {
      toast({ 
        title: 'Insufficient balance', 
        description: `Available: ${formatCurrency(balances[fromAccount], fromAccount)}`,
        variant: 'destructive' 
      });
      return;
    }

    setIsSending(true);

    // Simulate payment processing
    setTimeout(() => {
      // Deduct from sender
      const newBalances = {
        ...balances,
        [fromAccount]: balances[fromAccount] - amountNum
      };
      setBalance(user?.id, newBalances);
      setBalances(newBalances);

      // Create transaction record
      const paymentId = generatePaymentId();
      const tx = addTransaction(user?.id, {
        type: 'payment_sent',
        currency: fromAccount,
        amount: amountNum,
        recipientAccount: toAccount,
        recipientName,
        paymentId,
        status: 'Completed',
        route: pendingFXPayment?.route || null,
        fxOptimized: !!pendingFXPayment,
        targetCurrency: pendingFXPayment?.targetCurrency || fromAccount,
        convertedAmount: pendingFXPayment?.route?.convertedAmount || amountNum,
      });

      // Show success modal
      setSuccessData({
        paymentId,
        amount: amountNum,
        currency: fromAccount,
        recipient: recipientName,
        account: toAccount,
        timestamp: new Date().toLocaleString(),
        route: pendingFXPayment?.route || null,
        targetCurrency: pendingFXPayment?.targetCurrency,
        convertedAmount: pendingFXPayment?.route?.convertedAmount,
      });
      setShowSuccess(true);

      toast({
        title: 'Payment Sent!',
        description: `${formatCurrency(amountNum, fromAccount)} sent to ${recipientName}`,
      });

      // Clear pending FX payment
      localStorage.removeItem('pending_fx_payment');
      setPendingFXPayment(null);

      // Reset form
      setAmount('');
      setToAccount('');
      setRecipientName('');
      setIsSending(false);
    }, 2000);
  };

  const handleCancelFXPayment = () => {
    localStorage.removeItem('pending_fx_payment');
    setPendingFXPayment(null);
    setAmount('');
    toast({ title: 'FX payment cancelled' });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-primary" />
          Send Payment
        </h1>
        <p className="text-muted-foreground mt-2">
          Send money to any account instantly
        </p>
      </div>

      {/* FX Optimized Payment Banner */}
      {pendingFXPayment && (
        <div className="glass-card p-4 rounded-xl border-2 border-primary/50 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Route className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-2">
                FX Optimized Payment
                <span className="px-2 py-0.5 bg-success/20 text-success text-xs rounded">
                  {pendingFXPayment.route.name}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Route: {pendingFXPayment.route.path.join(' → ')}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span>
                  Send: <strong>{formatCurrency(pendingFXPayment.originalAmount, pendingFXPayment.sourceCurrency)}</strong>
                </span>
                <ArrowRight className="w-4 h-4" />
                <span className="text-success">
                  Receive: <strong>{formatCurrency(pendingFXPayment.route.convertedAmount, pendingFXPayment.targetCurrency)}</strong>
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancelFXPayment}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-6">Payment Details</h2>
            
            <div className="space-y-6">
              {/* From Account */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  From Account
                </Label>
                <Select 
                  value={fromAccount} 
                  onValueChange={setFromAccount}
                  disabled={!!pendingFXPayment}
                >
                  <SelectTrigger className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        <span className="flex items-center justify-between w-full">
                          <span>{currency}</span>
                          <span className="text-muted-foreground ml-4">
                            {formatCurrency(balances[currency], currency)}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Available: {formatCurrency(balances[fromAccount], fromAccount)}
                </p>
              </div>

              {/* Recipient Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Recipient Name
                </Label>
                <Input
                  placeholder="John Doe"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>

              {/* To Account */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Recipient Account Number
                </Label>
                <Input
                  placeholder="Enter account number or IBAN"
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Amount
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-2xl h-14 font-semibold"
                    disabled={!!pendingFXPayment}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    {fromAccount}
                  </span>
                </div>
                {pendingFXPayment && (
                  <p className="text-sm text-success flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Recipient will receive: {formatCurrency(pendingFXPayment.route.convertedAmount, pendingFXPayment.targetCurrency)}
                  </p>
                )}
              </div>

              {/* Quick Amounts (only show if not FX payment) */}
              {!pendingFXPayment && (
                <div className="flex flex-wrap gap-2">
                  {[100, 500, 1000, 5000].map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount.toString())}
                    >
                      {formatCurrency(quickAmount, fromAccount)}
                    </Button>
                  ))}
                </div>
              )}

              {/* Send Button */}
              <Button
                variant="gradient"
                size="xl"
                className="w-full"
                onClick={handleSendPayment}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {pendingFXPayment ? 'Complete FX Payment' : 'Send Payment'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Account Balances */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Balances</h3>
          {CURRENCIES.map((currency) => (
            <div
              key={currency}
              className={`glass-card p-4 rounded-xl cursor-pointer transition-all ${
                fromAccount === currency ? 'ring-2 ring-primary' : ''
              } ${pendingFXPayment ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => !pendingFXPayment && setFromAccount(currency)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {currency[0]}
                  </div>
                  <span className="font-medium">{currency}</span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(balances[currency], currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Payment Successful</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-6 animate-pulse-glow">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground">Your payment has been processed</p>

            {successData && (
              <div className="mt-6 space-y-4">
                <div className="bg-secondary p-4 rounded-xl text-left space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Sent</span>
                    <span className="font-semibold">
                      {formatCurrency(successData.amount, successData.currency)}
                    </span>
                  </div>
                  {successData.route && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Route</span>
                        <span className="font-medium">{successData.route.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recipient Receives</span>
                        <span className="font-semibold text-success">
                          {formatCurrency(successData.convertedAmount, successData.targetCurrency)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="font-medium">{successData.recipient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment ID</span>
                    <span className="font-mono text-sm">{successData.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="flex items-center gap-1 text-sm">
                      <Clock className="w-3 h-3" />
                      {successData.timestamp}
                    </span>
                  </div>
                </div>

                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={() => setShowSuccess(false)}
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}