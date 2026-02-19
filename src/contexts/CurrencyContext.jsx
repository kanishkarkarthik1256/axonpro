import { createContext, useContext, useState, useEffect } from 'react';
import { useLiveFXRates } from '@/hooks/useLiveFXRates';
import { updateLiveRates } from '@/utils/helpers';

const CurrencyContext = createContext();

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'AED'];

export function CurrencyProvider({ children }) {
  const [preferredCurrency, setPreferredCurrency] = useState(() => {
    const saved = localStorage.getItem('preferredCurrency');
    return saved || 'USD';
  });

  const { rates, loading, error, lastUpdate, refreshRates } = useLiveFXRates('USD');

  // Sync live rates into the global FX_RATES object used by helpers
  useEffect(() => {
    if (rates) {
      updateLiveRates(rates);
    }
  }, [rates]);

  useEffect(() => {
    localStorage.setItem('preferredCurrency', preferredCurrency);
  }, [preferredCurrency]);

  return (
    <CurrencyContext.Provider value={{
      preferredCurrency,
      setPreferredCurrency,
      currencies: CURRENCIES,
      liveRates: rates,
      ratesLoading: loading,
      ratesError: error,
      lastRateUpdate: lastUpdate,
      refreshRates,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
