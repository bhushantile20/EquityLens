# EquityLens — Stock Portfolio Frontend

A modern dark-theme React frontend for the Stock Portfolio Django REST API.

## Tech Stack

- **React 18** + Vite
- **Tailwind CSS** (dark theme)
- **React Router v6**
- **Axios** (JWT auto-attach + 401 handling)
- **Plotly.js** (candlestick charts)

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure backend URL

The Vite dev server proxies `/api` → `http://localhost:8000` automatically.
If your Django backend runs on a different port, edit `vite.config.js`:

```js
proxy: {
  "/api": {
    target: "http://localhost:8000",   // ← change this
    changeOrigin: true,
  },
},
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Build for production

```bash
npm run build
npm run preview
```

---

## Folder Structure

```
src/
├── api/
│   └── axios.js            # Axios instance, JWT interceptors, 401 handler
├── components/
│   ├── CandlestickChart.jsx # Reusable Plotly candlestick + volume chart
│   └── ProtectedRoute.jsx  # Auth guard — redirects to /login if not authed
├── layouts/
│   ├── PublicLayout.jsx    # Navbar + <Outlet> for public pages
│   └── DashboardLayout.jsx # Sidebar + <Outlet> for private pages
├── pages/
│   ├── Home.jsx            # Hero, ticker, sector cards, CTA
│   ├── SectorPage.jsx      # Sector tabs, sortable stocks table, search
│   ├── StockDetail.jsx     # Public: chart + analytics (PE, RSI, etc.)
│   ├── Login.jsx           # JWT login form
│   ├── Dashboard.jsx       # Private: portfolio overview
│   ├── PortfolioList.jsx   # Portfolio cards grid + create modal
│   ├── PortfolioDetail.jsx # Holdings table + sector pie chart
│   └── StockAnalytics.jsx  # Private: holding position + market analytics
├── routes/
│   └── AppRoutes.jsx       # All routes wired together
└── utils/
    └── auth.js             # login(), logout(), isAuthenticated() helpers
```

---

## API Endpoints Expected

| Method | Endpoint | Used by |
|--------|----------|---------|
| `POST` | `/api/auth/login/` | Login page |
| `GET` | `/api/sectors/` | Home, SectorPage |
| `GET` | `/api/stocks/<symbol>/analysis/` | StockDetail, StockAnalytics |
| `GET` | `/api/portfolio/` | Dashboard, PortfolioList |
| `POST` | `/api/portfolio/` | PortfolioList create modal |
| `GET` | `/api/portfolio/<id>/overview/` | PortfolioDetail, StockAnalytics |

---

## Authentication

- Login returns `{ access, refresh }` JWT tokens
- Tokens stored in `localStorage`
- Every request automatically gets `Authorization: Bearer <token>`
- On 401 → tokens cleared, user redirected to `/login`

---

## Color System (Tailwind tokens)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-base` | `#0f172a` | Page background |
| `bg-surface` | `#1e293b` | Cards, panels |
| `border-border` | `#1e3a5f` | All borders |
| `text-accent` | `#3b82f6` | Blue accent |
| `text-profit` | `#22c55e` | Positive P/L, RSI oversold |
| `text-loss` | `#ef4444` | Negative P/L, RSI overbought |

---

## Notes

- **No Redux** — all state is local via `useState` / `useEffect`
- **Graceful degradation** — all pages fall back gracefully if API is down
- **Responsive** — works on mobile, tablet, and desktop
- **Chart data format** — `CandlestickChart` expects: `[{ date, open, high, low, close, volume }]`
