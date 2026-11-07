import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  FileSearch,
  HardDrive,
  KeyRound,
  Moon,
  Waypoints,
} from "lucide-react";
import { LogoMark } from "@/components/layout/sidebar";
import { MarketPreview } from "@/components/finance/market-preview";
import { APP_VERSION } from "@/lib/nav";

const FEATURES = [
  {
    icon: HardDrive,
    title: "Local-first",
    body: "Runs on your machine with a local SQLite database. No FinSight server, no account required.",
  },
  {
    icon: KeyRound,
    title: "Bring your own keys",
    body: "Provider keys are stored locally and never leave your machine — or reach the browser.",
  },
  {
    icon: Waypoints,
    title: "Faster provider routing",
    body: "Only enabled, configured providers are called. Supported quote requests run concurrently, with bounded timeouts and honest demo fallbacks.",
  },
  {
    icon: FileSearch,
    title: "Evidence-first research",
    body: "Questions collect market, news, and filing evidence first. Sources stay separate from interpretation.",
  },
  {
    icon: Calculator,
    title: "Deterministic math",
    body: "Screener filters, indicators, and calculators run as plain code — never as model output.",
  },
  {
    icon: Moon,
    title: "Terminal design",
    body: "A dense, near-black research terminal with restrained accents and tabular numbers everywhere.",
  },
];

const ARCHITECTURE = [
  {
    layer: "Web client",
    nodes: ["Overview", "Research", "Markets", "News", "Screener", "Portfolio"],
  },
  {
    layer: "FinSight services",
    nodes: ["market-data service", "news service", "AI router", "screener", "cache"],
  },
  {
    layer: "Provider adapters",
    nodes: ["MarketDataProvider A/B/C", "AIProvider Gemini/AIMLAPI/BazaarLink", "NewsProvider API/RSS"],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={22} />
            <span className="text-sm font-semibold tracking-tight">FinSight</span>
            <span className="text-2xs font-medium text-faint">v{APP_VERSION}</span>
          </Link>
          <nav className="flex items-center gap-5">
            <a href="#architecture" className="hidden text-sm text-muted transition-colors hover:text-foreground sm:block">
              Architecture
            </a>
            <a href="#quickstart" className="hidden text-sm text-muted transition-colors hover:text-foreground sm:block">
              Quickstart
            </a>
            <Link
              href="/overview"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              Open terminal
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </nav>
        </div>
      </header>

      {/* --------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 72% 100% at 16% 0%, rgba(230, 176, 76, 0.08), transparent 100%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-5 items-center rounded border border-accent-border bg-accent-soft px-1.5 text-2xs font-medium uppercase tracking-wider text-accent">
              v{APP_VERSION} · Performance & reliability
            </span>
            <span className="text-2xs text-faint">Open source · MIT · Local-first · BYOK</span>
          </div>

          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            The open-source
            <span className="text-accent"> finance research </span>
            terminal.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-secondary sm:text-lg">
            Explore market and news evidence, inspect where each data point comes from, and build a clearer research picture. Your keys, your machine, your data — with provider adapters that never lock you in. AI-generated interpretation remains on the roadmap.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/overview"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-[15px] font-medium text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              Open the terminal
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="#architecture"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-5 text-[15px] font-medium text-secondary transition-colors hover:border-border-strong hover:text-foreground"
            >
              How it stays provider-independent
            </a>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- terminal preview */}
      <section className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <MarketPreview />
        </div>
      </section>

      {/* ------------------------------------------------------------ features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_2fr] lg:gap-16">
          <h2 className="max-w-sm text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
            Built like a terminal, not a dashboard template
          </h2>
          <div className="grid gap-x-8 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="border-t border-border py-4 first:border-t-0 sm:first:border-t"
              >
                <div className="flex items-center gap-2.5">
                  <feature.icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- architecture */}
      <section id="architecture" className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Provider-independent by construction
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            The frontend never imports a provider. It talks to FinSight services, which resolve
            adapters through a registry — so any provider can be replaced or added without
            rebuilding UI.
          </p>

          <div className="mt-8 space-y-3">
            {ARCHITECTURE.map((layer, i) => (
              <div key={layer.layer}>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="border-b border-border px-4 py-2 text-2xs font-medium uppercase tracking-wider text-faint">
                    {layer.layer}
                  </div>
                  <div className="flex flex-wrap gap-2 px-4 py-3">
                    {layer.nodes.map((node) => (
                      <span
                        key={node}
                        className="mono rounded border border-border bg-background px-2 py-1 text-xs text-secondary"
                      >
                        {node}
                      </span>
                    ))}
                  </div>
                </div>
                {i < ARCHITECTURE.length - 1 && (
                  <div className="py-1 text-center text-xs text-accent" aria-hidden>
                    ↓ normalized objects · registry lookup · fallback chain
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mono mt-5 rounded-lg border border-border bg-background p-4 text-xs leading-relaxed text-muted">
            <div className="text-faint">{"// normalized quote (every provider emits this shape)"}</div>
            {`{
  symbol, price, currency, change, changePercent,
  timestamp, source, isMock
}`}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- quickstart */}
      <section id="quickstart" className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Quickstart
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary">
              FinSight runs on a laptop. Clone, install, and start — it works with{" "}
              <span className="text-foreground">zero keys</span> in demo mode. Add provider
              keys later in <span className="text-foreground">Settings → Providers</span> to
              unlock supported live market data and news. AI interpretation is planned for a future release.
            </p>
            <Link
              href="/overview"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              Open the terminal
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-2 text-2xs font-medium uppercase tracking-wider text-faint">
              shell
            </div>
            <pre className="overflow-x-auto px-4 py-4 text-xs leading-relaxed text-secondary">
{`git clone <your-repo-url> finsight
cd finsight
bun install
bun run dev          # → http://localhost:3000

# optional — add your own keys (BYOK)
cp .env.example .env.local`}
            </pre>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark size={20} />
            <span className="text-xs text-muted">
              FinSight · open-source finance research terminal
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-faint">
            <span>MIT License</span>
            <span>Local-first</span>
            <span>BYOK</span>
            <Link href="/overview" className="text-secondary transition-colors hover:text-foreground">
              Open terminal →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
