# FinSight

**An open-source, local-first, BYOK finance research terminal.**

Ask a financial question → FinSight retrieves market, news, and filing evidence → your
selected AI provider interprets it → you get an answer with sources. Evidence and AI
interpretation are always kept clearly separate.

> **Status: v0.1 — Foundation.** This release ships the terminal shell, design system,
> provider architecture, SQLite storage, and the full page scaffolding on **demo (mock)
> data**. Live market data, AI, and news adapters arrive in v0.2–v0.4. Everything mock is
> labeled `MOCK DATA` in the UI — FinSight never pretends demo data is a live API.

---

## What works today (v0.1)

| Area | State |
| --- | --- |
| Landing page + terminal shell (sidebar, header, global search) | ✅ |
| Dark financial-terminal design system (tokens, components, states) | ✅ |
| Overview dashboard (indices, brief, stories, focus, watchlist, movers) | ✅ |
| Research pipeline UI (steps → evidence → observations → AI status) | ✅ |
| Markets / Companies / News / Screener pages | ✅ on demo data |
| Watchlist, Portfolio, Alerts — CRUD backed by local SQLite | ✅ |
| Calculators (SIP, Lumpsum, CAGR, Compound, EMI, Dividend) | ✅ deterministic |
| BYOK Settings (store keys, enable/disable, honest connection tests) | ✅ |
| Provider architecture (interfaces, registry, fallback chain, TTL cache) | ✅ |
| Live provider adapters (Alpha Vantage, Finnhub, Gemini, NewsAPI, RSS) | ⏳ v0.2–v0.4 |
| AI answers / citations | ⏳ v0.3 (router is honest today: "not configured") |
| Alert evaluation & notifications | ⏳ v0.7 |

## Quickstart

```bash
git clone <your-repo-url> finsight
cd finsight
bun install          # or: npm install
bun run dev          # → http://localhost:3000
```

Zero-key mode works out of the box: every payload served is labeled demo data.

```bash
# optional — bring your own keys (BYOK)
cp env.example .env.local     # then fill in only the keys you use
# (rename the template to `.env.example` first if you prefer the conventional name)
```

Keys can also be added later at **Settings → Providers** — they are stored server-side in
the local SQLite database and are never exposed to the browser.

## Supported providers (BYOK)

| Provider | Kind | Adapter | Planned |
| --- | --- | --- | --- |
| Google Gemini | AI | descriptor only | v0.3 |
| AIMLAPI | AI | descriptor only | v0.3 |
| BazaarLink | AI | descriptor only | v0.3 |
| Alpha Vantage | Market data | descriptor only | v0.2 |
| Finnhub | Market data | descriptor only | v0.2 |
| NewsAPI | News | descriptor only | v0.4 |
| Public RSS feeds (no key) | News | descriptor only | v0.4 |
| FinSight mock adapter | Market data + news | ✅ ships now, labeled `MOCK` | — |

**Connection test** in Settings is honest: with no live adapter it reports whether a key is
configured, where it came from, and that *no request was sent*.

## Architecture

```
UI (Next.js)
   │  fetch /api/*
   ▼
FinSight services            lib/market-data, lib/news, lib/ai (router), lib/screener
   │  provider registry lookup + TTL cache + fallback chain
   ▼
Provider adapters            providers/<vendor>  (MarketDataProvider / AIProvider / NewsProvider)
   │
   ▼
Normalized objects           Quote { symbol, price, currency, change, changePercent,
                                    timestamp, source, isMock }
```

Design rules enforced in code:

- The frontend **never** imports a concrete provider — only services and types.
- Every payload carries a `DataSourceInfo { providerId, label, isMock, degraded }`, which
  the UI renders as a `MOCK DATA` / provider badge.
- Fallback chain (spec §23): preferred provider → next provider → demo data → clear
  "unavailable" message. Never a fabricated result.
- AI results are gated on `descriptor.adapterImplemented` — v0.1 returns
  `available: false` with an explanation instead of inventing answers.

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `FINSIGHT_DB_PATH` | Local SQLite database path | `./data/finsight.db` |
| `GEMINI_API_KEY` | AI (v0.3) | — |
| `AIMLAPI_API_KEY` / `AIMLAPI_BASE_URL` | AI (v0.3) | — |
| `BAZAARLINK_API_KEY` / `BAZAARLINK_BASE_URL` | AI (v0.3) | — |
| `ALPHA_VANTAGE_API_KEY` | Market data (v0.2) | — |
| `FINNHUB_API_KEY` | Market data (v0.2) | — |
| `NEWSAPI_API_KEY` | News (v0.4) | — |

All keys are optional. Never commit real keys (`.env.local` is git-ignored).

## Project structure

```
finsight/
├── app/
│   ├── page.tsx                 # landing
│   ├── (terminal)/              # sidebar + header shell
│   │   ├── overview/ research/ markets/ companies/ news/
│   │   ├── screener/ portfolio/ watchlist/ alerts/
│   │   └── calculators/ settings/
│   └── api/                     # route handlers → services (never providers)
├── components/
│   ├── ui/                      # Button, Input, Card, Badge, Tabs, Modal, Dropdown,
│   │                            # Tooltip, Skeleton, DataTable, states…
│   ├── layout/                  # Shell, Sidebar, Header, GlobalSearch, PageHeader
│   └── finance/                 # MetricCard, ChartCard, Sparkline, LineChart,
│                                # StockCard, NewsCard, SourceBadge, ChangeValue
├── lib/
│   ├── market-data/             # types + service (fallback chain)
│   ├── news/  ├── ai/           # news service; AI router + research orchestration
│   ├── screener/ ├── finance/   # NL parser + filter runner; calculators
│   ├── providers/               # registry, key config, connection tests
│   ├── database/                # sqlite, schema, repositories (watchlist…)
│   ├── cache/  ├── hooks/  ├── mock/   # TTL cache, data hooks, demo universe
│   └── nav.ts format.ts api.ts utils.ts
├── providers/                   # adapters: mock/, gemini/, aimlapi/, bazaarlink/,
│                                # alphavantage/, finnhub/, newsapi/, rss/
├── env.example                  # template (rename to .env.example if preferred)
├── .gitignore  README.md  LICENSE
```

## Verification

```bash
bun run typecheck        # tsc --noEmit
bun run smoke            # headless-browser UI sweep (playwright, dev-only)
```

The smoke suite loads every route, asserts key copy, design tokens (colors, sidebar
states, header), search → research navigation, SQLite CRUD round-trips, calculator math,
the BYOK save/test/clear flow, and a desktop/laptop/tablet/mobile viewport matrix —
failing on any page or console error.

## UI states

Every data-driven view handles **loading** (skeletons), **loaded**, **empty** (with an
action), **error** (with retry), **no API key**, **provider unavailable**, and **mock
data** labeling — see `components/ui/states.tsx` and the `MOCK DATA` badge.

## Security

- API keys live in the local SQLite `settings` table (server-side only) or environment
  variables. API routes return `configured: true/false` — never key values.
- `.env.local` is git-ignored; only the placeholder template is committed.
- Rotate a key by revoking it at the provider, then updating it in Settings.
- The Settings → Data page can wipe all local data (records **and** stored keys).

## Contributing

Issues and PRs are welcome. Good first areas: a live provider adapter (v0.2 scope),
additional calculators, or chart improvements. Please keep the two hard rules:

1. The UI talks to **services**, never to a provider directly.
2. Anything that is not live data must be **explicitly labeled as mock/demo**.

## License

[MIT](LICENSE) — free to use, fork, and self-host. BYOK: you pay providers directly for
your own usage.
