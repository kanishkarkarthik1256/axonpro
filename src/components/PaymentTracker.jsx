import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTransactions } from '@/utils/storage';
import { formatCurrency, getTimeAgo } from '@/utils/helpers';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  RefreshCw,
  Bell,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Delay thresholds in minutes
const DELAY_THRESHOLDS = {
  warning: 5,    // 5 minutes for pending = warning
  critical: 15,  // 15 minutes for pending = critical delay
};

export default function PaymentTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('outgoing');
  const [transactions, setTransactions] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const [incomingTransactions, setIncomingTransactions] = useState([]);
  const [recentIncoming, setRecentIncoming] = useState([]);

  // Fetch and update transactions
  const refreshTransactions = () => {
    setIsRefreshing(true);
    const allTx = getTransactions(user?.id) || [];
    
    // Get active transactions (pending, processing, incomplete) - outgoing
    const activeTx = allTx.filter(tx => 
      (tx.status === 'pending' || tx.status === 'processing' || tx.status === 'incomplete') &&
      tx.type !== 'received' && tx.type !== 'payment_received'
    ).slice(0, 10);

    // Get incoming transactions
    const incoming = allTx.filter(tx => 
      tx.type === 'received' || tx.type === 'payment_received'
    ).slice(0, 10);
    
    // Recent incoming (last 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = incoming.filter(tx => new Date(tx.timestamp).getTime() > dayAgo);
    
    setIncomingTransactions(incoming);
    setRecentIncoming(recent);
    
    // Detect delays
    const newAlerts = [];
    const now = Date.now();
    
    activeTx.forEach(tx => {
      const ageMinutes = (now - tx.timestamp) / 60000;
      
      if (tx.status === 'pending' || tx.status === 'processing') {
        if (ageMinutes >= DELAY_THRESHOLDS.critical) {
          newAlerts.push({
            id: tx.id,
            type: 'critical',
            message: `Payment ${tx.id.slice(0, 8)}... is critically delayed (${Math.floor(ageMinutes)} min)`,
            tx
          });
        } else if (ageMinutes >= DELAY_THRESHOLDS.warning) {
          newAlerts.push({
            id: tx.id,
            type: 'warning',
            message: `Payment ${tx.id.slice(0, 8)}... is taking longer than expected`,
            tx
          });
        }
      }
    });

    // Show toast for new critical alerts
    const prevAlertIds = alerts.filter(a => a.type === 'critical').map(a => a.id);
    const newCriticalAlerts = newAlerts.filter(a => 
      a.type === 'critical' && !prevAlertIds.includes(a.id)
    );
    
    if (newCriticalAlerts.length > 0) {
      toast({
        title: "Payment Delay Detected",
        description: `${newCriticalAlerts.length} payment(s) are experiencing delays`,
        variant: "destructive"
      });
    }

    setAlerts(newAlerts);
    setTransactions(activeTx);
    setLastUpdate(new Date());
    
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Initial load and auto-refresh every 30 seconds
  useEffect(() => {
    refreshTransactions();
    const interval = setInterval(refreshTransactions, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const getStatusConfig = (status, timestamp) => {
    const ageMinutes = (Date.now() - timestamp) / 60000;
    
    if (status === 'completed') {
      return { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/20', label: 'Completed' };
    }
    if (status === 'failed') {
      return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/20', label: 'Failed' };
    }
    if (status === 'pending' || status === 'processing') {
      if (ageMinutes >= DELAY_THRESHOLDS.critical) {
        return { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/20', label: 'Delayed', pulse: true };
      }
      if (ageMinutes >= DELAY_THRESHOLDS.warning) {
        return { icon: Clock, color: 'text-warning', bg: 'bg-warning/20', label: 'Slow', pulse: true };
      }
      return { icon: Clock, color: 'text-primary', bg: 'bg-primary/20', label: status === 'processing' ? 'Processing' : 'Pending', pulse: true };
    }
    return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: status };
  };

  const activeCount = transactions.filter(t => t.status === 'pending' || t.status === 'processing').length;
  const delayedCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  const renderTransactionItem = (tx, isIncoming = false) => {
    const config = getStatusConfig(tx.status, new Date(tx.timestamp).getTime());
    const StatusIcon = isIncoming ? ArrowDownLeft : config.icon;
    
    return (
      <div key={tx.id} className="p-3 hover:bg-secondary/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${isIncoming ? 'bg-success/20' : config.bg} flex items-center justify-center ${!isIncoming && config.pulse ? 'animate-pulse' : ''}`}>
              <StatusIcon className={`w-4 h-4 ${isIncoming ? 'text-success' : config.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium capitalize">
                  {isIncoming ? 'Received' : (tx.type?.replace('_', ' ') || 'Payment')}
                </p>
                {isIncoming ? (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 bg-success/10 text-success border-success/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    New
                  </Badge>
                ) : (
                  <Badge 
                    variant={config.label === 'Delayed' ? 'destructive' : config.label === 'Slow' ? 'secondary' : 'outline'}
                    className="text-xs px-1.5 py-0"
                  >
                    {config.label}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isIncoming && tx.sender ? `From: ${tx.sender} • ` : ''}
                {tx.id.slice(0, 12)}... • {getTimeAgo(tx.timestamp)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${isIncoming ? 'text-success' : ''}`}>
              {isIncoming ? '+' : ''}{formatCurrency(tx.amount, tx.currency || 'USD')}
            </p>
            {!isIncoming && tx.recipient && (
              <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                To: {tx.recipient}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Payment Tracker</h3>
            <p className="text-xs text-muted-foreground">
              Real-time • Updated {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={refreshTransactions}
          className={isRefreshing ? 'animate-spin' : ''}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs for Outgoing/Incoming */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border bg-secondary/30">
          <TabsTrigger value="outgoing" className="rounded-none data-[state=active]:bg-background">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            Outgoing ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="incoming" className="rounded-none data-[state=active]:bg-background relative">
            <ArrowDownLeft className="w-4 h-4 mr-1" />
            Incoming
            {recentIncoming.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-success text-success-foreground rounded-full">
                {recentIncoming.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing" className="m-0">
          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-2 p-4 bg-secondary/30">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{warningCount}</p>
              <p className="text-xs text-muted-foreground">Slow</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">{delayedCount}</p>
              <p className="text-xs text-muted-foreground">Delayed</p>
            </div>
          </div>

          {/* Delay Alerts */}
          {alerts.length > 0 && (
            <div className="p-3 bg-destructive/10 border-b border-destructive/20">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">Delay Alerts</span>
              </div>
              <div className="space-y-1">
                {alerts.slice(0, 3).map(alert => (
                  <div 
                    key={alert.id} 
                    className={`text-xs px-2 py-1 rounded ${
                      alert.type === 'critical' 
                        ? 'bg-destructive/20 text-destructive' 
                        : 'bg-warning/20 text-warning'
                    }`}
                  >
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Transaction List */}
          <div className="divide-y divide-border max-h-[250px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active payments</p>
                <p className="text-xs mt-1">All payments are complete</p>
              </div>
            ) : (
              transactions.map(tx => renderTransactionItem(tx, false))
            )}
          </div>
        </TabsContent>

        <TabsContent value="incoming" className="m-0">
          {/* Incoming Summary */}
          <div className="p-4 bg-success/10 border-b border-success/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success">Recent Deposits (24h)</p>
                <p className="text-2xl font-bold">
                  {recentIncoming.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-success">{recentIncoming.length}</p>
                <p className="text-xs text-muted-foreground">transactions</p>
              </div>
            </div>
          </div>

          {/* Incoming Transaction List */}
          <div className="divide-y divide-border max-h-[250px] overflow-y-auto">
            {incomingTransactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ArrowDownLeft className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No incoming payments yet</p>
                <p className="text-xs mt-1">Received funds will appear here</p>
              </div>
            ) : (
              incomingTransactions.map(tx => renderTransactionItem(tx, true))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-secondary/20">
        <Link to="/history">
          <Button variant="ghost" size="sm" className="w-full text-sm">
            View Full History
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
