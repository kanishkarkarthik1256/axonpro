// Storage utility functions for the cross-border payments app

export const getWallet = (userId) => {
  const wallet = localStorage.getItem(`wallet_${userId}`);
  return wallet ? JSON.parse(wallet) : { BTC: 0, ETH: 0, USDT: 0, BNB: 0, SOL: 0, XRP: 0, ADA: 0, DOGE: 0 };
};

export const setWallet = (userId, wallet) => {
  localStorage.setItem(`wallet_${userId}`, JSON.stringify(wallet));
};

export const getBalance = (userId) => {
  const balance = localStorage.getItem(`balance_${userId}`);
  return balance ? JSON.parse(balance) : { USD: 0, EUR: 0, GBP: 0, JPY: 0, INR: 0, AUD: 0, CAD: 0, CHF: 0, CNY: 0, SGD: 0, AED: 0 };
};

export const getBankAccounts = (userId) => {
  const accounts = localStorage.getItem(`bank_accounts_${userId}`);
  return accounts ? JSON.parse(accounts) : [];
};

export const saveBankAccounts = (userId, accounts) => {
  localStorage.setItem(`bank_accounts_${userId}`, JSON.stringify(accounts));
};

export const setBalance = (userId, balance) => {
  localStorage.setItem(`balance_${userId}`, JSON.stringify(balance));
};

export const getTransactions = (userId) => {
  const transactions = localStorage.getItem(`transactions_${userId}`);
  return transactions ? JSON.parse(transactions) : [];
};

export const addTransaction = (userId, transaction) => {
  const transactions = getTransactions(userId);
  const newTransaction = {
    ...transaction,
    id: 'txn_' + Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString()
  };
  transactions.unshift(newTransaction);
  localStorage.setItem(`transactions_${userId}`, JSON.stringify(transactions));
  return newTransaction;
};

export const getFXHistory = () => {
  const history = localStorage.getItem('fx_history');
  return history ? JSON.parse(history) : [];
};

export const addFXOptimization = (optimization) => {
  const history = getFXHistory();
  const newOptimization = {
    ...optimization,
    id: 'fx_' + Date.now(),
    timestamp: new Date().toISOString()
  };
  history.unshift(newOptimization);
  // Keep only last 10
  const trimmed = history.slice(0, 10);
  localStorage.setItem('fx_history', JSON.stringify(trimmed));
  return newOptimization;
};

export const clearAllData = () => {
  const keysToKeep = [];
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
};

export const generateHash = () => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

export const generatePaymentId = () => {
  return 'PAY' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
};
