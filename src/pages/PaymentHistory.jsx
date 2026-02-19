import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTransactions } from '@/utils/storage';
import { formatCurrency, formatCrypto, shortenHash, formatDate, getTimeAgo } from '@/utils/helpers';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Route
} from 'lucide-react';

const PAGE_SIZE = 10;

export default function PaymentHistory() {
  const { user } = useAuth();
  const [allTransactions, setAllTransactions] = useState([]);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const transactions = getTransactions(user?.id);
    setAllTransactions(transactions);
  }, [user?.id]);

  const getStatusFromTransaction = (tx) => {
    return tx.status?.toLowerCase() || 'completed';
  };

  const filteredTransactions = allTransactions.filter(tx => {
    const matchesSearch = 
      (tx.id?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.hash?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.paymentId?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || 
      (filterType === 'crypto' && tx.crypto) ||
      (filterType === 'payment' && (tx.type === 'payment_sent' || tx.type === 'payment_received')) ||
      (filterType === 'fx' && tx.fxOptimized);

    const txStatus = getStatusFromTransaction(tx);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'completed' && txStatus === 'completed') ||
      (statusFilter === 'pending' && txStatus === 'pending') ||
      (statusFilter === 'failed' && txStatus === 'failed');

    return matchesSearch && matchesType && matchesStatus;
  });

  useEffect(() => {
    setDisplayedTransactions(filteredTransactions.slice(0, PAGE_SIZE));
    setPage(1);
    setHasMore(filteredTransactions.length > PAGE_SIZE);
  }, [searchQuery, filterType, statusFilter, allTransactions]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const nextPage = page + 1;
      const endIndex = nextPage * PAGE_SIZE;
      const newItems = filteredTransactions.slice(0, endIndex);
      
      setDisplayedTransactions(newItems);
      setPage(nextPage);
      setHasMore(endIndex < filteredTransactions.length);
      setIsLoading(false);
    }, 500);
  }, [page, filteredTransactions, isLoading, hasMore]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-success" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-success/20 text-success';
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'failed':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-success/20 text-success';
    }
  };

  const getTypeLabel = (tx) => {
    if (tx.crypto) return 'Crypto';
    if (tx.fxOptimized) return 'FX Optimized';
    if (tx.type?.includes('payment')) return 'Payment';
    return tx.type?.replace('_', ' ') || 'Transaction';
  };

  const getTypeBadgeColor = (tx) => {
    if (tx.crypto) return 'bg-crypto-btc/20 text-crypto-btc';
    if (tx.fxOptimized) return 'bg-accent/20 text-accent';
    if (tx.type?.includes('payment')) return 'bg-primary/20 text-primary';
    return 'bg-secondary text-secondary-foreground';
  };

  // Stats
  const completedCount = allTransactions.filter(tx => getStatusFromTransaction(tx) === 'completed').length;
  const pendingCount = allTransactions.filter(tx => getStatusFromTransaction(tx) === 'pending').length;
  const failedCount = allTransactions.filter(tx => getStatusFromTransaction(tx) === 'failed').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <History className="w-8 h-8 text-primary" />
          Transaction History
        </h1>
        <p className="text-muted-foreground mt-2">
          View all your transactions in one place
        </p>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="all" className="gap-2">
            All
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
              {allTransactions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Completed
            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
              {completedCount}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending
            <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          </TabsTrigger>
          <TabsTrigger value="failed" className="gap-2">
            <XCircle className="w-4 h-4" />
            Failed
            <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
              {failedCount}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by ID, hash, or recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="crypto">Crypto Only</SelectItem>
            <SelectItem value="payment">Payments Only</SelectItem>
            <SelectItem value="fx">FX Optimized</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Total Transactions</p>
          <p className="text-2xl font-bold">{allTransactions.length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Crypto Txns</p>
          <p className="text-2xl font-bold">{allTransactions.filter(tx => tx.crypto).length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">FX Optimized</p>
          <p className="text-2xl font-bold">{allTransactions.filter(tx => tx.fxOptimized).length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-2xl font-bold">
            {allTransactions.filter(tx => {
              const txDate = new Date(tx.timestamp);
              const now = new Date();
              return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {displayedTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No Transactions Found</h3>
            <p className="text-muted-foreground mt-2">
              {searchQuery || filterType !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start making transactions to see them here'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayedTransactions.map((tx) => (
              <div 
                key={tx.id} 
                className="p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'send' || tx.type === 'payment_sent' 
                        ? 'bg-destructive/20 text-destructive' 
                        : 'bg-success/20 text-success'
                    }`}>
                      {tx.type === 'send' || tx.type === 'payment_sent' ? (
                        <ArrowUpRight className="w-6 h-6" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold capitalize">
                          {tx.type?.replace('_', ' ') || 'Transaction'}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(tx)}`}>
                          {getTypeLabel(tx)}
                        </span>
                        {tx.fxOptimized && tx.route && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                            <Route className="w-3 h-3" />
                            {tx.route.name}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 space-y-1 text-sm">
                        {tx.recipientName && (
                          <p className="text-muted-foreground">
                            To: {tx.recipientName}
                          </p>
                        )}
                        {tx.fxOptimized && tx.route && (
                          <p className="text-muted-foreground text-xs">
                            Route: {tx.route.path?.join(' → ')}
                          </p>
                        )}
                        {(tx.hash || tx.paymentId) && (
                          <p className="font-mono text-xs text-muted-foreground">
                            {tx.hash ? shortenHash(tx.hash) : tx.paymentId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`font-semibold ${
                      tx.type === 'send' || tx.type === 'payment_sent' 
                        ? 'text-destructive' 
                        : 'text-success'
                    }`}>
                      {tx.type === 'send' || tx.type === 'payment_sent' ? '-' : '+'}
                      {tx.crypto 
                        ? formatCrypto(tx.amount, tx.crypto) 
                        : formatCurrency(tx.amount, tx.currency || 'USD')
                      }
                    </p>
                    {tx.fxOptimized && tx.convertedAmount && tx.targetCurrency && (
                      <p className="text-xs text-success">
                        → {formatCurrency(tx.convertedAmount, tx.targetCurrency)}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(tx.status)}`}>
                        {getStatusIcon(tx.status)}
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getTimeAgo(tx.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {hasMore && (
          <div ref={observerRef} className="p-4 flex justify-center">
            {isLoading && (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}