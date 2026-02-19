import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CRYPTO_PRICES } from '@/utils/helpers';
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
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const CRYPTO_LIST = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE'];
const FIAT_LIST = ['EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'AED'];

export default function PriceAlerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { rates } = useLiveFXRates('USD');

  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem(`price_alerts_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [newAlert, setNewAlert] = useState({
    type: 'crypto', // 'crypto' or 'fiat'
    asset: 'BTC',
    condition: 'above', // 'above' or 'below'
    targetPrice: '',
  });

  // Check alerts periodically
  useEffect(() => {
    const checkAlerts = () => {
      alerts.forEach((alert) => {
        if (alert.triggered) return;

        let currentPrice;
        if (alert.type === 'crypto') {
          currentPrice = CRYPTO_PRICES[alert.asset];
        } else {
          currentPrice = rates?.[alert.asset] || 1;
        }

        const target = parseFloat(alert.targetPrice);
        const isTriggered =
          (alert.condition === 'above' && currentPrice >= target) ||
          (alert.condition === 'below' && currentPrice <= target);

        if (isTriggered) {
          toast({
            title: `🔔 Price Alert Triggered!`,
            description: `${alert.asset} is now ${alert.condition === 'above' ? 'above' : 'below'} ${alert.type === 'crypto' ? '$' : ''}${target}${alert.type === 'fiat' ? ` (1 USD)` : ''}`,
          });

          const updatedAlerts = alerts.map((a) =>
            a.id === alert.id ? { ...a, triggered: true } : a
          );
          setAlerts(updatedAlerts);
          localStorage.setItem(`price_alerts_${user?.id}`, JSON.stringify(updatedAlerts));
        }
      });
    };

    const interval = setInterval(checkAlerts, 5000);
    return () => clearInterval(interval);
  }, [alerts, rates, user?.id, toast]);

  const handleAddAlert = () => {
    if (!newAlert.targetPrice || parseFloat(newAlert.targetPrice) <= 0) {
      toast({ title: 'Enter a valid target price', variant: 'destructive' });
      return;
    }

    const alert = {
      id: 'alert_' + Date.now(),
      ...newAlert,
      targetPrice: parseFloat(newAlert.targetPrice),
      createdAt: new Date().toISOString(),
      triggered: false,
    };

    const updatedAlerts = [alert, ...alerts];
    setAlerts(updatedAlerts);
    localStorage.setItem(`price_alerts_${user?.id}`, JSON.stringify(updatedAlerts));

    toast({ title: 'Price alert created!' });
    setNewAlert({
      type: 'crypto',
      asset: 'BTC',
      condition: 'above',
      targetPrice: '',
    });
    setOpen(false);
  };

  const handleDeleteAlert = (alertId) => {
    const updatedAlerts = alerts.filter((a) => a.id !== alertId);
    setAlerts(updatedAlerts);
    localStorage.setItem(`price_alerts_${user?.id}`, JSON.stringify(updatedAlerts));
    toast({ title: 'Alert removed' });
  };

  const getCurrentPrice = (alert) => {
    if (alert.type === 'crypto') {
      return `$${CRYPTO_PRICES[alert.asset]?.toLocaleString() || 'N/A'}`;
    } else {
      return `${rates?.[alert.asset]?.toFixed(4) || 'N/A'} per USD`;
    }
  };

  const assetOptions = newAlert.type === 'crypto' ? CRYPTO_LIST : FIAT_LIST;

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-primary flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Price Alerts</h3>
            <p className="text-xs text-muted-foreground">{alerts.filter((a) => !a.triggered).length} active</p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4" />
              Add Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Create Price Alert
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Asset Type */}
              <div className="flex gap-2 p-1 bg-secondary rounded-lg">
                <button
                  onClick={() => setNewAlert({ ...newAlert, type: 'crypto', asset: 'BTC' })}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    newAlert.type === 'crypto'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Crypto
                </button>
                <button
                  onClick={() => setNewAlert({ ...newAlert, type: 'fiat', asset: 'EUR' })}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    newAlert.type === 'fiat'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Fiat (vs USD)
                </button>
              </div>

              {/* Asset Selection */}
              <div className="space-y-2">
                <Label>Asset</Label>
                <Select
                  value={newAlert.asset}
                  onValueChange={(val) => setNewAlert({ ...newAlert, asset: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assetOptions.map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset} - Current: {newAlert.type === 'crypto' ? `$${CRYPTO_PRICES[asset]?.toLocaleString()}` : `${rates?.[asset]?.toFixed(4) || '...'}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={newAlert.condition}
                  onValueChange={(val) => setNewAlert({ ...newAlert, condition: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-success" /> Goes above
                      </span>
                    </SelectItem>
                    <SelectItem value="below">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-destructive" /> Falls below
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Price */}
              <div className="space-y-2">
                <Label>Target Price {newAlert.type === 'crypto' ? '(USD)' : '(per 1 USD)'}</Label>
                <Input
                  type="number"
                  placeholder={newAlert.type === 'crypto' ? '50000' : '0.85'}
                  value={newAlert.targetPrice}
                  onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                />
              </div>

              <Button variant="gradient" className="w-full" onClick={handleAddAlert}>
                Create Alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No price alerts set</p>
          <p className="text-sm">Create an alert to get notified when prices change</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-4 rounded-xl ${
                alert.triggered ? 'bg-success/20 border border-success/30' : 'bg-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    alert.condition === 'above' ? 'bg-success/20' : 'bg-destructive/20'
                  }`}
                >
                  {alert.condition === 'above' ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {alert.asset} {alert.condition === 'above' ? '>' : '<'}{' '}
                    {alert.type === 'crypto' ? '$' : ''}{alert.targetPrice}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current: {getCurrentPrice(alert)}
                    {alert.triggered && <span className="ml-2 text-success">✓ Triggered</span>}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteAlert(alert.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}