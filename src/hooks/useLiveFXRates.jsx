import { useState, useEffect, useCallback } from 'react';

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'AED'];

// Cache for storing rates
let ratesCache = {
  rates: null,
  timestamp: null,
  baseCurrency: null,
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (daily updates)

export function useLiveFXRates(baseCurrency = 'USD') {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchRates = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (
      !forceRefresh &&
      ratesCache.rates &&
      ratesCache.baseCurrency === baseCurrency &&
      ratesCache.timestamp &&
      Date.now() - ratesCache.timestamp < CACHE_DURATION
    ) {
      setRates(ratesCache.rates);
      setLastUpdate(new Date(ratesCache.timestamp));
      setLoading(false);
      return ratesCache.rates;
    }

    setLoading(true);
    setError(null);

    try {
      // ExchangeRate-API free tier (no key required)
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      
      // Filter to only supported currencies
      const filteredRates = {};
      SUPPORTED_CURRENCIES.forEach(currency => {
        if (data.rates[currency]) {
          filteredRates[currency] = data.rates[currency];
        }
      });

      // Update cache
      ratesCache = {
        rates: filteredRates,
        timestamp: Date.now(),
        baseCurrency,
      };

      setRates(filteredRates);
      setLastUpdate(new Date());
      setLoading(false);

      return filteredRates;
    } catch (err) {
      console.error('Error fetching FX rates:', err);
      setError(err.message);
      setLoading(false);
      
      // Fallback to static rates if API fails
      const fallbackRates = getFallbackRates(baseCurrency);
      setRates(fallbackRates);
      return fallbackRates;
    }
  }, [baseCurrency]);

  useEffect(() => {
    fetchRates();
    
    // Refresh daily (check every hour if cache expired)
    const interval = setInterval(() => {
      if (!ratesCache.timestamp || Date.now() - ratesCache.timestamp >= CACHE_DURATION) {
        fetchRates(true);
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [fetchRates]);

  const refreshRates = () => fetchRates(true);

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (!rates || fromCurrency === toCurrency) return amount;
    
    // If base currency is the from currency
    if (fromCurrency === baseCurrency) {
      return amount * (rates[toCurrency] || 1);
    }
    
    // If base currency is the to currency
    if (toCurrency === baseCurrency) {
      return amount / (rates[fromCurrency] || 1);
    }
    
    // Cross rate calculation
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    return (amount / fromRate) * toRate;
  };

  const getRate = (fromCurrency, toCurrency) => {
    if (!rates || fromCurrency === toCurrency) return 1;
    
    if (fromCurrency === baseCurrency) {
      return rates[toCurrency] || 1;
    }
    
    if (toCurrency === baseCurrency) {
      return 1 / (rates[fromCurrency] || 1);
    }
    
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    return toRate / fromRate;
  };

  return {
    rates,
    loading,
    error,
    lastUpdate,
    refreshRates,
    convertCurrency,
    getRate,
    supportedCurrencies: SUPPORTED_CURRENCIES,
  };
}

// Fallback rates if API fails
function getFallbackRates(baseCurrency) {
  const baseRates = {
    USD: { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.50, INR: 83.12, AUD: 1.53, CAD: 1.36, CHF: 0.88, CNY: 7.24, SGD: 1.34, AED: 3.67 },
    EUR: { USD: 1.09, EUR: 1, GBP: 0.86, JPY: 162.45, INR: 90.35, AUD: 1.66, CAD: 1.48, CHF: 0.96, CNY: 7.87, SGD: 1.46, AED: 3.99 },
    GBP: { USD: 1.27, EUR: 1.16, GBP: 1, JPY: 189.23, INR: 105.18, AUD: 1.93, CAD: 1.72, CHF: 1.11, CNY: 9.16, SGD: 1.70, AED: 4.64 },
  };
  
  return baseRates[baseCurrency] || baseRates.USD;
}

export default useLiveFXRates;
