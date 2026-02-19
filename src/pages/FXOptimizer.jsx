import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { addFXOptimization, getFXHistory } from '@/utils/storage';
import { COUNTRIES, getMultiHopRoutes, formatCurrency, calculateFX, formatDate } from '@/utils/helpers';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRightLeft,
  TrendingUp,
  Clock,
  DollarSign,
  Zap,
  History,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Route,
  Percent
} from 'lucide-react';
import FXRateChart from '@/components/FXRateChart';

export default function FXOptimizer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sourceCountry, setSourceCountry] = useState('');
  const [targetCountry, setTargetCountry] = useState('');
  const [amount, setAmount] = useState('');
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [history, setHistory] = useState(getFXHistory());
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const handleOptimize = () => {
    if (!sourceCountry || !targetCountry || !amount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (sourceCountry === targetCountry) {
      toast({
        title: 'Invalid Selection',
        description: 'Source and target countries must be different',
        variant: 'destructive',
      });
      return;
    }

    setIsOptimizing(true);
    setSelectedRoute(null);

    // Simulate optimization delay
    setTimeout(() => {
      const sourceCurrency = COUNTRIES.find(c => c.code === sourceCountry)?.currency;
      const targetCurrency = COUNTRIES.find(c => c.code === targetCountry)?.currency;
      const amountNum = parseFloat(amount);

      // Get all possible routes including multi-hop
      const allRoutes = getMultiHopRoutes(amountNum, sourceCurrency, targetCurrency);
      
      setRoutes(allRoutes);
      setSelectedRoute(allRoutes[0]); // Pre-select best route

      toast({
        title: 'Routes Found!',
        description: `Found ${allRoutes.length} possible routes`,
      });

      setIsOptimizing(false);
    }, 1500);
  };

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
  };

  const handleProceedToPayment = () => {
    if (!selectedRoute) return;

    const sourceCurrency = COUNTRIES.find(c => c.code === sourceCountry)?.currency;
    const targetCurrency = COUNTRIES.find(c => c.code === targetCountry)?.currency;
    const amountNum = parseFloat(amount);

    // Save to history
    const optimization = {
      sourceCountry,
      targetCountry,
      sourceCurrency,
      targetCurrency,
      originalAmount: amountNum,
      route: selectedRoute,
      userId: user?.id,
    };
    
    addFXOptimization(optimization);
    setHistory(getFXHistory());

    // Store selected route for payment page
    localStorage.setItem('pending_fx_payment', JSON.stringify({
      ...optimization,
      timestamp: new Date().toISOString(),
    }));

    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = () => {
    setShowPaymentDialog(false);
    navigate('/payments', { state: { fromFXOptimizer: true } });
  };

  const sourceCurrency = COUNTRIES.find(c => c.code === sourceCountry)?.currency;
  const targetCurrency = COUNTRIES.find(c => c.code === targetCountry)?.currency;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ArrowRightLeft className="w-8 h-8 text-primary" />
          FX Optimizer
        </h1>
        <p className="text-muted-foreground mt-2">
          Find the best exchange rates through optimal currency routing
        </p>
      </div>

      {/* FX Rate Chart */}
      <FXRateChart />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Optimization Form */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-6">Optimize Your Transfer</h2>
          
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Country</Label>
                <Select value={sourceCountry} onValueChange={setSourceCountry}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          {country.name} ({country.currency})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To Country</Label>
                <Select value={targetCountry} onValueChange={setTargetCountry}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          {country.name} ({country.currency})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amount to Send</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-11"
                />
              </div>
              {sourceCountry && (
                <p className="text-sm text-muted-foreground">
                  Currency: {sourceCurrency}
                </p>
              )}
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={handleOptimize}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Finding Best Routes...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Find Best Routes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Routes Results */}
        <div className="space-y-4">
          {routes.length > 0 ? (
            <>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Route className="w-5 h-5 text-primary" />
                Available Routes ({routes.length})
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {routes.map((route, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectRoute(route)}
                    className={`glass-card p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] ${
                      selectedRoute === route
                        ? 'ring-2 ring-primary bg-primary/5'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-success/20 text-success text-xs font-medium rounded">
                            BEST
                          </span>
                        )}
                        <span className="font-semibold">{route.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {route.speed}
                      </div>
                    </div>

                    {/* Route Path */}
                    <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
                      {route.path.map((currency, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="px-2 py-1 bg-secondary rounded font-medium">
                            {currency}
                          </span>
                          {i < route.path.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Fee</p>
                        <p className="font-medium">{route.totalFee.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">You Receive</p>
                        <p className="font-medium text-success">
                          {formatCurrency(route.convertedAmount, targetCurrency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Savings</p>
                        <p className="font-medium text-primary">
                          {formatCurrency(route.savings, targetCurrency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Proceed Button */}
              {selectedRoute && (
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full animate-slide-up"
                  onClick={handleProceedToPayment}
                >
                  <CreditCard className="w-5 h-5" />
                  Proceed with {selectedRoute.name}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              )}
            </>
          ) : (
            <div className="glass-card p-8 rounded-2xl text-center">
              <TrendingUp className="w-16 h-16 mx-auto text-primary mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No Routes Yet</h3>
              <p className="text-muted-foreground mt-2">
                Select countries and amount to find the best FX routes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Recent Optimizations</h2>
        </div>

        {history.length === 0 ? (
          <div className="glass-card p-6 rounded-2xl text-center text-muted-foreground">
            No optimization history yet
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Route</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">From</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">To</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm">{formatDate(item.timestamp)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-primary/20 text-primary rounded text-sm">
                          {item.route.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {COUNTRIES.find(c => c.code === item.sourceCountry)?.flag} {item.sourceCurrency}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {COUNTRIES.find(c => c.code === item.targetCountry)?.flag} {item.targetCurrency}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {formatCurrency(item.originalAmount, item.sourceCurrency)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-success">
                        {formatCurrency(item.route.convertedAmount, item.targetCurrency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Confirm Payment Route
            </DialogTitle>
            <DialogDescription>
              You have selected the optimal route. Proceed to payment?
            </DialogDescription>
          </DialogHeader>

          {selectedRoute && (
            <div className="space-y-4 py-4">
              <div className="bg-secondary p-4 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Route</span>
                  <span className="font-semibold">{selectedRoute.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Path</span>
                  <span className="font-medium">{selectedRoute.path.join(' → ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You Send</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(amount), sourceCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">They Receive</span>
                  <span className="font-semibold text-success">
                    {formatCurrency(selectedRoute.convertedAmount, targetCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Fee</span>
                  <span>{selectedRoute.totalFee.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Time</span>
                  <span>{selectedRoute.speed}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleConfirmPayment}>
              <CheckCircle2 className="w-4 h-4" />
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}