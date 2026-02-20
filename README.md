# Axon – Intelligent Cross-Border Payment & FX Platform

<p align="center">
  <img src="src/assets/logo.png" alt="Axon Logo" width="80" />
</p>

<p align="center">
  <strong>Smart money movement across borders, currencies, and crypto — powered by real-time data.</strong>
</p>

---

## 🚀 What is Axon?

Axon is a modern fintech web application that optimizes international payments, foreign exchange, and cryptocurrency management in a single unified platform. It empowers users to find the cheapest, fastest, and most reliable payment routes across 11+ currencies and 7+ payment providers.

---

## ✨ Features

### 💱 FX Optimizer
- **Multi-hop route optimization** — Finds the best direct and multi-hop currency conversion paths (e.g., USD → EUR → GBP) to minimize fees.
- **Real-time exchange rates** — Powered by [ExchangeRate-API](https://www.exchangerate-api.com/) with automatic daily refresh and intelligent caching.
- **Provider comparison** — Compares fees, speed, and reliability across Wise, SWIFT, Remitly, Western Union, OFX, XE, and Crypto Bridge.
- **Corridor-specific fee adjustments** — Accounts for real-world fee variations between specific currency pairs.

### 🪙 Crypto Wallet
- **Portfolio overview** — Track holdings across BTC, ETH, USDT, BNB, SOL, XRP, ADA, and DOGE with live price charts.
- **Fiat ↔ Crypto transfers** — Seamless conversion between traditional currencies and cryptocurrencies.
- **Price alerts** — Set custom alerts for crypto price movements.
- **Portfolio analytics** — Visual breakdowns of allocation, performance, and trends.

### 💳 Payments
- **International payment tracker** — Monitor outgoing and incoming cross-border payments.
- **Payment history** — Full audit trail with status tracking, timestamps, and transaction details.
- **Multi-currency support** — Send and receive in USD, EUR, GBP, JPY, INR, AUD, CAD, CHF, CNY, SGD, and AED.

### 📊 Dashboard
- **Unified overview** — Balances, recent transactions, FX rates, and crypto holdings at a glance.
- **Preferred currency** — All values auto-convert to the user's chosen display currency using live rates.
- **Live FX rate chart** — Interactive Recharts-powered visualization of currency pair trends.

### ⚙️ Settings
- **Theme toggle** — Dark and light mode with system preference detection.
- **Currency preference** — Choose default display currency across the entire app.
- **Profile management** — User account settings and preferences.

### 🔐 Authentication
- **Login & Registration** — Secure client-side auth with protected route guards.
- **Session persistence** — Stays logged in across browser sessions via localStorage.

---

## 🌐 External APIs

| API | Purpose | Endpoint |
|-----|---------|----------|
| [ExchangeRate-API v4](https://www.exchangerate-api.com/) | Live FX rates for 11 currencies | `api.exchangerate-api.com/v4/latest/{base}` |

- **Caching**: 24-hour client-side cache to minimize API calls
- **Fallback**: Static rate matrix used when API is unavailable
- **Cross-rate matrix**: Full NxN rate table computed from USD-base rates for accurate conversions between any pair

---

## 🛠️ Tech Stack

### Languages
| Language | Usage |
|----------|-------|
| **TypeScript** | UI components, type safety, configuration |
| **JavaScript (JSX)** | Page components, hooks, contexts, utilities |
| **CSS** | Design system tokens, animations, Tailwind utilities |
| **HTML** | Entry point, meta tags, SEO |

### Frontend Framework
- **React 18** — Component-based UI with hooks, context API, and functional components
- **Vite** — Lightning-fast dev server and optimized production builds

### Styling & Design
- **Tailwind CSS** — Utility-first CSS with custom design tokens (HSL-based)
- **shadcn/ui** — Accessible, composable UI primitives (40+ components)
- **Radix UI** — Headless accessible components powering shadcn
- **Space Grotesk** — Modern geometric sans-serif for brand typography
- **Custom animations** — `fade-in`, `scale-in`, `slide-in-right` with staggered children

### Data & State
- **TanStack React Query** — Server state management and data fetching
- **React Context API** — Global state for auth, theme, and currency preferences
- **localStorage** — Persistence for user preferences and session data

### Routing
- **React Router v6** — Client-side routing with protected route guards and redirects

### Charting
- **Recharts** — Responsive, composable charts for FX rates, crypto prices, and portfolio analytics

### Utilities
- **date-fns** — Lightweight date formatting and manipulation
- **clsx + tailwind-merge** — Conditional class merging without conflicts
- **class-variance-authority** — Type-safe component variant management
- **Zod** — Schema validation for forms
- **React Hook Form** — Performant form handling with validation

### UI Components (shadcn/ui)
Accordion, Alert Dialog, Avatar, Badge, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, Context Menu, Dialog, Drawer, Dropdown Menu, Form, Hover Card, Input, Label, Menubar, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable Panels, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner (toasts), Switch, Table, Tabs, Textarea, Toast, Toggle, Tooltip

---

## 🏆 Why Axon is Better Than Competitors

### vs. Wise / Remitly / Western Union
| Feature | Competitors | Axon |
|---------|------------|------|
| Provider comparison | ❌ Shows only their own rates | ✅ Compares 7+ providers side-by-side |
| Multi-hop routing | ❌ Direct transfers only | ✅ Finds cheaper routes through intermediate currencies |
| Crypto integration | ❌ Fiat only | ✅ Unified fiat + crypto in one platform |
| Fee transparency | ⚠️ Hidden markups | ✅ Full fee breakdown per provider and corridor |
| Real-time rates | ⚠️ Delayed or marked up | ✅ Live mid-market rates from ExchangeRate-API |

### vs. Revolut / N26
| Feature | Competitors | Axon |
|---------|------------|------|
| Route optimization | ❌ Single provider | ✅ Multi-provider, multi-hop optimization |
| Open & transparent | ❌ Proprietary rates | ✅ Uses open mid-market API rates |
| No account lock-in | ❌ Must hold funds in their wallet | ✅ Compare and choose any provider |

### 🎯 Axon's Unique Advantages

1. **Multi-Hop Route Engine** — The only platform that calculates whether routing through an intermediate currency (e.g., USD → EUR → INR) is cheaper than going direct, factoring in cumulative fees.

2. **Provider-Agnostic Comparison** — Axon doesn't profit from transfers. It shows the true cost across Wise, SWIFT, OFX, XE, Remitly, Western Union, and crypto bridges — letting users pick the best option.

3. **Unified Fiat + Crypto** — Most platforms handle either fiat or crypto. Axon bridges both worlds with fiat-to-crypto and crypto-to-fiat transfers in a single interface.

4. **Corridor-Aware Fees** — Fee calculations account for real-world corridor-specific cost variations (e.g., USD→EUR is cheaper than INR→JPY), not flat percentages.

5. **Live Rate Accuracy** — Real-time mid-market rates with a full cross-rate matrix computed on every update, ensuring conversions between any currency pair are mathematically precise.

6. **Minimalist, Accessible Design** — Clean UI built with accessible Radix primitives, dark/light theming, and smooth staggered animations — no visual clutter.

7. **Privacy-First Architecture** — All data stays client-side. No tracking, no data selling, no third-party analytics.

---

## 📁 Project Structure

```
src/
├── assets/          # Logo and static assets
├── components/
│   ├── layout/      # Navbar, Layout, ProtectedRoute
│   ├── ui/          # 40+ shadcn/ui components
│   ├── CryptoPriceChart.jsx
│   ├── CryptoToFiatTransfer.jsx
│   ├── FiatToCryptoTransfer.jsx
│   ├── FXRateChart.jsx
│   ├── PaymentTracker.jsx
│   ├── PortfolioAnalytics.jsx
│   └── PriceAlerts.jsx
├── contexts/        # Auth, Theme, Currency providers
├── hooks/           # useLiveFXRates, useIncomingPayments, use-mobile
├── pages/           # Dashboard, FXOptimizer, CryptoWallet, Payments, etc.
├── utils/           # helpers.js (FX engine), storage.js
├── App.tsx          # Root with routing
├── main.tsx         # Entry point
└── index.css        # Design system tokens & animations
```

---

## 🏁 Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project
cd axon

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## 📄 License

This project is proprietary. All rights reserved.
