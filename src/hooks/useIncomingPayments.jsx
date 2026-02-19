import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTransactions, getBalance, setBalance, addTransaction } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/helpers';

export function useIncomingPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomingPayments, setIncomingPayments] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCheckRef = useRef(Date.now());
  const notifiedIdsRef = useRef(new Set());

  // Check for new incoming payments
  const checkForIncoming = useCallback(() => {
    if (!user?.id) return;
    
    const transactions = getTransactions(user.id);
    const incoming = transactions.filter(tx => 
      tx.type === 'received' || tx.type === 'payment_received'
    );
    
    // Find new incoming payments since last check
    const newIncoming = incoming.filter(tx => {
      const txTime = new Date(tx.timestamp).getTime();
      return txTime > lastCheckRef.current && !notifiedIdsRef.current.has(tx.id);
    });

    // Show toast for each new payment
    newIncoming.forEach(tx => {
      notifiedIdsRef.current.add(tx.id);
      toast({
        title: "💰 Money Received!",
        description: `You received ${formatCurrency(tx.amount, tx.currency || 'USD')} from ${tx.sender || 'External Account'}`,
        duration: 5000,
      });
    });

    if (newIncoming.length > 0) {
      setUnreadCount(prev => prev + newIncoming.length);
    }

    setIncomingPayments(incoming.slice(0, 10));
    lastCheckRef.current = Date.now();
  }, [user?.id, toast]);

  // Simulate receiving a payment (for demo purposes)
  const simulateIncomingPayment = useCallback((amount, currency, senderName) => {
    if (!user?.id) return;

    // Add to balance
    const balances = getBalance(user.id);
    balances[currency] = (balances[currency] || 0) + amount;
    setBalance(user.id, balances);

    // Add transaction record
    const tx = addTransaction(user.id, {
      type: 'payment_received',
      amount,
      currency,
      sender: senderName || 'External Account',
      status: 'completed',
      description: `Received from ${senderName || 'External Account'}`
    });

    // Trigger notification
    notifiedIdsRef.current.add(tx.id);
    toast({
      title: "💰 Money Received!",
      description: `You received ${formatCurrency(amount, currency)} from ${senderName || 'External Account'}`,
      duration: 5000,
    });

    setUnreadCount(prev => prev + 1);
    checkForIncoming();

    return tx;
  }, [user?.id, toast, checkForIncoming]);

  // Clear unread count
  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Poll for new payments every 10 seconds
  useEffect(() => {
    checkForIncoming();
    const interval = setInterval(checkForIncoming, 10000);
    return () => clearInterval(interval);
  }, [checkForIncoming]);

  return {
    incomingPayments,
    unreadCount,
    markAllRead,
    simulateIncomingPayment,
    checkForIncoming
  };
}
