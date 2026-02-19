// Helper functions for FX and crypto calculations

// Mutable FX rates - updated by live API via updateLiveRates()
export let FX_RATES = {
  USD: { EUR: 0.92, GBP: 0.79, JPY: 149.50, INR: 83.12, AUD: 1.53, CAD: 1.36, CHF: 0.88, CNY: 7.24, SGD: 1.34, AED: 3.67, USD: 1 },
  EUR: { USD: 1.09, GBP: 0.86, JPY: 162.45, INR: 90.35, AUD: 1.66, CAD: 1.48, CHF: 0.96, CNY: 7.87, SGD: 1.46, AED: 3.99, EUR: 1 },
  GBP: { USD: 1.27, EUR: 1.16, JPY: 189.23, INR: 105.18, AUD: 1.93, CAD: 1.72, CHF: 1.11, CNY: 9.16, SGD: 1.70, AED: 4.64, GBP: 1 },
  JPY: { USD: 0.0067, EUR: 0.0062, GBP: 0.0053, INR: 0.556, AUD: 0.010, CAD: 0.0091, CHF: 0.0059, CNY: 0.048, SGD: 0.009, AED: 0.025, JPY: 1 },
  INR: { USD: 0.012, EUR: 0.011, GBP: 0.0095, JPY: 1.80, AUD: 0.018, CAD: 0.016, CHF: 0.011, CNY: 0.087, SGD: 0.016, AED: 0.044, INR: 1 },
  AUD: { USD: 0.65, EUR: 0.60, GBP: 0.52, JPY: 97.71, INR: 54.32, CAD: 0.89, CHF: 0.58, CNY: 4.73, SGD: 0.88, AED: 2.40, AUD: 1 },
  CAD: { USD: 0.74, EUR: 0.68, GBP: 0.58, JPY: 109.93, INR: 61.12, AUD: 1.13, CHF: 0.65, CNY: 5.32, SGD: 0.99, AED: 2.70, CAD: 1 },
  CHF: { USD: 1.14, EUR: 1.04, GBP: 0.90, JPY: 169.89, INR: 94.45, AUD: 1.74, CAD: 1.55, CNY: 8.23, SGD: 1.53, AED: 4.17, CHF: 1 },
  CNY: { USD: 0.14, EUR: 0.13, GBP: 0.11, JPY: 20.65, INR: 11.48, AUD: 0.21, CAD: 0.19, CHF: 0.12, SGD: 0.19, AED: 0.51, CNY: 1 },
  SGD: { USD: 0.75, EUR: 0.69, GBP: 0.59, JPY: 111.94, INR: 62.24, AUD: 1.14, CAD: 1.02, CHF: 0.66, CNY: 5.43, AED: 2.75, SGD: 1 },
  AED: { USD: 0.27, EUR: 0.25, GBP: 0.22, JPY: 40.74, INR: 22.65, AUD: 0.42, CAD: 0.37, CHF: 0.24, CNY: 1.97, SGD: 0.36, AED: 1 }
};

// Update FX_RATES with live data from API (called from CurrencyContext)
export function updateLiveRates(baseRates) {
  // baseRates is { EUR: 0.847, GBP: 0.739, ... } relative to USD
  if (!baseRates || !baseRates.USD) return;

  const currencies = Object.keys(FX_RATES);

  // Build a complete rate matrix from the USD-based rates
  const usdRates = { ...baseRates };

  currencies.forEach(from => {
    if (!FX_RATES[from]) FX_RATES[from] = {};
    currencies.forEach(to => {
      if (from === to) {
        FX_RATES[from][to] = 1;
      } else {
        // Cross rate: from→USD→to
        const fromToUsd = 1 / (usdRates[from] || 1);
        const usdToTo = usdRates[to] || 1;
        FX_RATES[from][to] = fromToUsd * usdToTo;
      }
    });
  });
}

export const CRYPTO_PRICES = {
  BTC: 67500,
  ETH: 3450,
  USDT: 1,
  BNB: 605,
  SOL: 172,
  XRP: 2.35,
  ADA: 1.05,
  DOGE: 0.38
};

export const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'EU', name: 'European Union', currency: 'EUR', flag: '🇪🇺' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', flag: '🇨🇭' },
  { code: 'CN', name: 'China', currency: 'CNY', flag: '🇨🇳' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬' },
  { code: 'AE', name: 'UAE', currency: 'AED', flag: '🇦🇪' }
];

// Payment providers with their fees for different corridors
export const PAYMENT_PROVIDERS = {
  'Wise': { baseFee: 0.5, speedDays: '1-2 days', reliability: 98 },
  'SWIFT': { baseFee: 2.0, speedDays: '3-5 days', reliability: 95 },
  'Remitly': { baseFee: 0.8, speedDays: '1-3 days', reliability: 94 },
  'Western Union': { baseFee: 1.5, speedDays: 'Same day', reliability: 92 },
  'OFX': { baseFee: 0.4, speedDays: '1-2 days', reliability: 96 },
  'XE': { baseFee: 0.6, speedDays: '1-3 days', reliability: 97 },
  'Crypto Bridge': { baseFee: 0.3, speedDays: '10 mins', reliability: 88 },
};

// Corridor-specific fee adjustments
const CORRIDOR_FEES = {
  'USD-EUR': -0.1, 'USD-GBP': -0.1, 'USD-INR': 0.3, 'USD-JPY': 0.2,
  'EUR-USD': -0.1, 'EUR-GBP': -0.05, 'EUR-INR': 0.4, 'EUR-JPY': 0.3,
  'GBP-USD': -0.1, 'GBP-EUR': -0.05, 'GBP-INR': 0.3, 'GBP-JPY': 0.25,
  'JPY-USD': 0.2, 'JPY-EUR': 0.25, 'JPY-GBP': 0.25, 'JPY-INR': 0.5,
  'INR-USD': 0.5, 'INR-EUR': 0.6, 'INR-GBP': 0.5, 'INR-JPY': 0.7,
};

export const calculateFX = (amount, fromCurrency, toCurrency) => {
  const rate = FX_RATES[fromCurrency]?.[toCurrency] || 1;
  return amount * rate;
};

// Calculate fee for a specific corridor and provider
const getProviderFee = (provider, fromCurrency, toCurrency) => {
  const corridorKey = `${fromCurrency}-${toCurrency}`;
  const corridorAdjustment = CORRIDOR_FEES[corridorKey] || 0;
  return Math.max(0.1, PAYMENT_PROVIDERS[provider].baseFee + corridorAdjustment);
};

// Generate multi-hop routes
export const getMultiHopRoutes = (amount, fromCurrency, toCurrency) => {
  const routes = [];
  const allCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR'];
  const intermediateCurrencies = allCurrencies.filter(c => c !== fromCurrency && c !== toCurrency);

  // Direct routes (single hop)
  Object.entries(PAYMENT_PROVIDERS).forEach(([providerName, provider]) => {
    const fee = getProviderFee(providerName, fromCurrency, toCurrency);
    const feeAmount = (amount * fee) / 100;
    const amountAfterFee = amount - feeAmount;
    const convertedAmount = calculateFX(amountAfterFee, fromCurrency, toCurrency);
    
    routes.push({
      name: providerName,
      type: 'direct',
      path: [fromCurrency, toCurrency],
      totalFee: fee,
      feeAmount,
      convertedAmount,
      speed: provider.speedDays,
      reliability: provider.reliability,
      savings: 0,
    });
  });

  // Multi-hop routes (through intermediate currency)
  intermediateCurrencies.forEach(intermediateCurrency => {
    const providersForFirstLeg = ['Wise', 'OFX', 'XE'];
    const providersForSecondLeg = ['Wise', 'OFX', 'XE'];

    providersForFirstLeg.forEach(provider1 => {
      providersForSecondLeg.forEach(provider2 => {
        const fee1 = getProviderFee(provider1, fromCurrency, intermediateCurrency);
        const fee2 = getProviderFee(provider2, intermediateCurrency, toCurrency);
        const totalFee = fee1 + fee2;

        if (totalFee > 3) return;

        const feeAmount1 = (amount * fee1) / 100;
        const amountAfterFee1 = amount - feeAmount1;
        const intermediateAmount = calculateFX(amountAfterFee1, fromCurrency, intermediateCurrency);
        
        const feeAmount2 = (intermediateAmount * fee2) / 100;
        const amountAfterFee2 = intermediateAmount - feeAmount2;
        const convertedAmount = calculateFX(amountAfterFee2, intermediateCurrency, toCurrency);

        const avgReliability = (PAYMENT_PROVIDERS[provider1].reliability + PAYMENT_PROVIDERS[provider2].reliability) / 2;

        routes.push({
          name: `${provider1} → ${provider2} via ${intermediateCurrency}`,
          type: 'multi-hop',
          path: [fromCurrency, intermediateCurrency, toCurrency],
          totalFee,
          feeAmount: (amount * totalFee) / 100,
          convertedAmount,
          speed: '2-4 days',
          reliability: Math.round(avgReliability),
          savings: 0,
        });
      });
    });
  });

  // Sort by converted amount (best first)
  routes.sort((a, b) => b.convertedAmount - a.convertedAmount);

  // Calculate savings compared to worst route
  const worstConversion = routes[routes.length - 1]?.convertedAmount || 0;
  routes.forEach(route => {
    route.savings = route.convertedAmount - worstConversion;
  });

  return routes.slice(0, 8);
};

export const getBestRoute = (amount, fromCurrency, toCurrency) => {
  const routes = getMultiHopRoutes(amount, fromCurrency, toCurrency);
  return routes[0];
};

export const formatCurrency = (amount, currency) => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF ',
    CNY: '¥',
    SGD: 'S$',
    AED: 'د.إ'
  };
  
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Convert any currency amount to target currency
export function convertToPreferredCurrency(amount, fromCurrency, targetCurrency) {
  if (fromCurrency === targetCurrency) return amount;
  const rate = FX_RATES[fromCurrency]?.[targetCurrency] || 1;
  return amount * rate;
}

export const formatCrypto = (amount, symbol) => {
  return `${amount.toFixed(symbol === 'USDT' ? 2 : 8)} ${symbol}`;
};

export const shortenHash = (hash) => {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};
