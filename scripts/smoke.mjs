/**
 * FinSight UI smoke test (dev tool — not part of the app bundle).
 *
 * Loads every route in a headless browser, waits for hydration + data,
 * and fails on: HTTP errors, page/console errors, missing key copy,
 * broken design tokens, or broken CRUD flows.
 *
 *   bun run smoke
 *
 * Notes:
 * - innerText reflects CSS text-transform, so matching is case-insensitive.
 * - Page navs are retried once: the Next dev server can auto-restart under
 *   memory pressure while a full browser sweep runs.
 */

import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const ROUTES = [
  {
    path: "/",
    expect: [
      "The open-source",
      "finance research terminal",
      "Open the terminal",
      "Provider-independent by construction",
      "Quickstart",
    ],
  },
  {
    path: "/overview",
    expect: [
      "market snapshot",
      "Daily Market Brief",
      "What to watch",
      "Top stories",
      "Watchlist snapshot",
      "Stocks in focus",
      "Market movers",
      "Mock data",
      "S&P 500",
      "NIFTY 50",
    ],
  },
  {
    path: "/research?q=Why is NVDA down today",
    expect: [
      "Research pipeline",
      "AI interpretation",
      "Evidence observations",
      "Retrieved evidence",
      "not available yet",
      "matched: NVDA",
    ],
  },
  {
    path: "/markets",
    expect: ["Markets", "Equities", "Nasdaq Composite", "TSLA", "AAPL", "Mock data"],
  },
  {
    path: "/companies?symbol=NVDA",
    expect: ["NVIDIA", "Key metrics", "Market cap", "P/E", "ROE", "Price"],
  },
  {
    path: "/news",
    expect: ["News", "outlets", "Reuters", "Mock data"],
  },
  {
    path: "/screener",
    expect: ["Screener", "Filters", "Ask in plain English", "Run screen", "match"],
  },
  {
    path: "/portfolio",
    expect: ["Portfolio", "Total value", "Invested", "Allocation by sector", "Holdings"],
  },
  {
    path: "/watchlist",
    expect: ["Watchlist", "demo universe"],
  },
  {
    path: "/alerts",
    expect: ["Alerts", "New alert", "arrive in"],
  },
  {
    path: "/calculators",
    expect: ["Calculators", "SIP", "Monthly investment", "Future value"],
  },
  {
    path: "/settings",
    expect: ["Settings", "AI providers", "Market data providers", "News providers", "GEMINI_API_KEY"],
  },
];

let failures = 0;
const report = (ok, label, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
  if (!ok) failures += 1;
};

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const pageErrors = [];
page.on("pageerror", (err) => pageErrors.push(err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") pageErrors.push(msg.text());
});

const cleanErrors = () =>
  pageErrors.filter(
    (e) => !e.includes("favicon") && !e.includes("Download the React DevTools"),
  );

async function gotoRetry(target) {
  try {
    return await page.goto(target, { waitUntil: "load", timeout: 45000 });
  } catch {
    await page.waitForTimeout(2500);
    return await page.goto(target, { waitUntil: "load", timeout: 45000 }).catch(() => null);
  }
}

async function waitForNeedles(needles, timeout = 15000) {
  await page
    .waitForFunction(
      (list) => {
        const text = document.body.innerText.toLowerCase();
        return list.every((n) => text.includes(n.toLowerCase()));
      },
      needles,
      { timeout },
    )
    .catch(() => {});
}

async function visit(path, expect = []) {
  pageErrors.length = 0;
  const response = await gotoRetry(BASE + path);
  if (expect.length > 0) await waitForNeedles(expect);
  await page.waitForTimeout(400);
  const text = await page.evaluate(() => document.body.innerText);
  const lower = text.toLowerCase();
  const missing = expect.filter((needle) => !lower.includes(needle.toLowerCase()));
  const errors = cleanErrors();
  report(
    response?.status() === 200 && missing.length === 0 && errors.length === 0,
    `${path}`,
    [
      response?.status() !== 200 ? `status ${response?.status()}` : "",
      missing.length ? `missing: ${JSON.stringify(missing.slice(0, 2))}` : "",
      errors.length ? `error: ${errors[0].slice(0, 160)}` : "",
    ]
      .filter(Boolean)
      .join(" | "),
  );
  return text;
}

/* ------------------------------------------------------------ 1. routes */
console.log("— routes —");
for (const route of ROUTES) {
  await visit(route.path, route.expect);
}

/* ------------------------------------------------- 2. design tokens (CSS) */
console.log("— design system —");
await visit("/overview", ["Market movers"]);
const tokens = await page.evaluate(() => {
  const body = getComputedStyle(document.body);
  const sidebar = document.querySelector("aside");
  const active = document.querySelector('[aria-current="page"]');
  const header = document.querySelector("header");
  const search = document.querySelector('input[aria-label="Global financial research search"]');
  const mock = [...document.querySelectorAll("span")].find(
    (s) => s.textContent?.trim().toLowerCase() === "mock data",
  );
  return {
    bodyBg: body.backgroundColor,
    bodyFont: body.fontFamily,
    sidebarWidth: sidebar ? Math.round(sidebar.getBoundingClientRect().width) : 0,
    activeBg: active ? getComputedStyle(active).backgroundColor : null,
    activeText: active?.innerText?.trim().split("\n")[0] ?? null,
    headerHeight: header ? Math.round(header.getBoundingClientRect().height) : 0,
    searchHeight: search
      ? Math.round(search.closest("div").getBoundingClientRect().height)
      : 0,
    accentText: mock ? getComputedStyle(mock).color : null,
  };
});
report(tokens.bodyBg === "rgb(10, 10, 10)", `background near-black (${tokens.bodyBg})`);
report(tokens.bodyFont.toLowerCase().includes("geist"), `Geist font applied`);
report(tokens.sidebarWidth === 240, `sidebar expanded = 240px (${tokens.sidebarWidth})`);
report(tokens.activeText === "Overview", `active nav obvious (${tokens.activeText})`);
report(
  tokens.activeBg !== "rgba(0, 0, 0, 0)" && tokens.activeBg !== "transparent",
  `active nav has surface fill (${tokens.activeBg})`,
);
report(tokens.headerHeight >= 56 && tokens.headerHeight <= 58, `header ~56px (${tokens.headerHeight})`);
report(tokens.searchHeight >= 36, `search bar container (${tokens.searchHeight}px)`);
report(tokens.accentText !== null, `MOCK badge rendered (color ${tokens.accentText})`);

// asset-class tab actually swaps the table
await visit("/markets", ["Equities", "Mock data"]);
await page.getByRole("tab", { name: "ETFs" }).click();
await waitForNeedles(["SPY", "NIFTYBEES"], 10000);
const etfText = await page.evaluate(() => document.body.innerText);
report(
  etfText.includes("SPY") && etfText.includes("NIFTYBEES"),
  "markets: ETF tab shows ETF rows",
);
await page.getByRole("tab", { name: "Stocks" }).click();
await waitForNeedles(["TSLA"], 8000);

/* --------------------------------------------- 3. collapse + global search */
console.log("— interactions —");
await page.getByRole("button", { name: "Collapse sidebar" }).click();
await page.waitForTimeout(400);
const collapsedWidth = await page.evaluate(
  () => Math.round(document.querySelector("aside").getBoundingClientRect().width),
);
report(collapsedWidth === 64, `sidebar collapses to 64px (${collapsedWidth})`);
await page.getByRole("button", { name: "Expand sidebar" }).click();
await page.waitForTimeout(300);

/**
 * Full search → research flow. The Next dev server may auto-restart under
 * memory pressure during a long sweep; one retry absorbs that transient.
 */
async function researchFlow() {
  await gotoRetry(`${BASE}/markets`);
  await waitForNeedles(["Equities"], 15000);
  const box = page.locator('input[aria-label="Global financial research search"]').first();
  await box.click();
  await box.fill("nvda");
  await page.waitForTimeout(1200);
  const dd = await page.evaluate(() => document.body.innerText);
  const dropdownOk = dd.includes("NVDA") && dd.includes("Companies");
  await box.press("Enter");
  await waitForNeedles(["Research pipeline", "not available yet", "Evidence observations"], 20000);
  const urlOk = page.url().includes("/research?q=");
  const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
  return {
    dropdownOk,
    urlOk,
    pipeline: text.includes("research pipeline"),
    unavailable: text.includes("not available yet"),
    codeLabeled: text.includes("computed by code"),
  };
}

let flow = await researchFlow();
if (!flow.pipeline || !flow.urlOk) {
  console.log("   (retrying research flow — dev server may have restarted)");
  flow = await researchFlow();
}
report(flow.dropdownOk, "search dropdown shows matches");
report(flow.urlOk, "Enter launches research (?q=nvda)");
report(flow.pipeline, "research pipeline renders after hydration");
report(flow.unavailable, "AI unavailable state is honest");
report(flow.codeLabeled, "observations labeled as code, not AI");

/* -------------------------------------------------------- 4. SQLite CRUD */
console.log("— SQLite CRUD (watchlist) —");
await page.goto(`${BASE}/watchlist`, { waitUntil: "load" }).catch(() => {});
await waitForNeedles(["demo universe"], 15000);
const addInput = page.locator('input[aria-label="Symbol to watch"]');
await addInput.fill("NVDA");
await page.getByRole("button", { name: "Add", exact: true }).click();
await waitForNeedles(["NVDA"], 10000).catch(() => {});
await page.waitForTimeout(800);
let watchText = await page.evaluate(() => document.body.innerText);
report(watchText.includes("NVDA"), "watchlist add writes to SQLite");
await page.getByRole("button", { name: "Remove NVDA" }).click();
await waitForNeedles(["No symbols tracked yet"], 10000).catch(() => {});
watchText = await page.evaluate(() => document.body.innerText);
report(watchText.includes("No symbols tracked yet"), "watchlist delete restores empty state");

console.log("— SQLite CRUD (portfolio demo seed) —");
await page.goto(`${BASE}/portfolio`, { waitUntil: "load" }).catch(() => {});
await waitForNeedles(["Holdings"], 15000);
await page
  .getByRole("button", { name: "Load demo portfolio" })
  .first()
  .click()
  .catch(() => {});
await waitForNeedles(["RELIANCE", "Allocation by sector"], 15000);
const portfolioText = await page.evaluate(() => document.body.innerText);
report(
  portfolioText.includes("NVDA") && portfolioText.includes("RELIANCE"),
  "demo portfolio seeded and rendered",
);
report(/\$[\d,]{4,}/.test(portfolioText), "portfolio totals computed");
report(portfolioText.includes("demo rate"), "FX demo note shown");

/* ------------------------------------------------- 5. calculators (math) */
console.log("— calculators —");
await page.goto(`${BASE}/calculators`, { waitUntil: "load" }).catch(() => {});
await waitForNeedles(["Future value"], 15000);
const calcText = await page.evaluate(() => document.body.innerText);
report(calcText.includes("Future value"), "SIP result renders");
report(
  /2,323,39\d/.test(calcText) || /23,23,39\d/.test(calcText),
  "SIP future value matches closed-form math (₹/$ 2,323,39x)",
  `snippet: ${(calcText.match(/[\d,]{7,}/) ?? ["none"])[0]}`,
);

/* ----------------------------------------------------- 6. BYOK round trip */
console.log("— BYOK settings —");
await page.goto(`${BASE}/settings`, { waitUntil: "load" }).catch(() => {});
await waitForNeedles(["GEMINI_API_KEY"], 15000);
const geminiRow = () => page.locator('[data-provider-row="gemini"]');

await page.locator('input[aria-label="Google Gemini API key"]').fill("demo-key-123");
await geminiRow().locator('button:has-text("Save")').first().click().catch(() => {});
await waitForNeedles(["configured (stored)"], 10000);
let settingsText = await page.evaluate(() => document.body.innerText);
report(settingsText.includes("configured (stored)"), "key saved to SQLite, reported configured");

await geminiRow().locator('button:has-text("Test")').first().click().catch(() => {});
await waitForNeedles(["No request was sent"], 10000);
settingsText = await page.evaluate(() => document.body.innerText);
report(
  settingsText.includes("No request was sent"),
  "connection test is honest (no fake request)",
  settingsText.includes("No request was sent")
    ? ""
    : `excerpt: ${(settingsText.match(/Google Gemini[\s\S]{0,300}/) ?? ["n/a"])[0].replace(/\n/g, " | ").slice(0, 220)}`,
);

await geminiRow().locator('button:has-text("Clear")').first().click().catch(() => {});
await waitForNeedles(["not configured"], 10000);
settingsText = await page.evaluate(() => document.body.innerText);
report(settingsText.includes("not configured"), "key cleared again");

/* ------------------------------------------------ 7. viewport matrix — */
console.log("— viewport matrix (desktop/laptop/tablet/mobile) —");
for (const vp of [
  { w: 1440, h: 900, name: "desktop" },
  { w: 1280, h: 800, name: "laptop" },
  { w: 768, h: 1024, name: "tablet" },
  { w: 390, h: 844, name: "mobile" },
]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errs.push(m.text());
  });
  await p.goto(`${BASE}/overview`, { waitUntil: "load", timeout: 45000 }).catch(() => {});
  await p
    .waitForFunction(() => document.body.innerText.toLowerCase().includes("market movers"), null, {
      timeout: 20000,
    })
    .catch(() => {});
  const state = await p.evaluate(() => {
    const aside = document.querySelector("aside");
    const rect = aside?.getBoundingClientRect();
    const visible =
      !!aside && rect.width > 0 && getComputedStyle(aside).display !== "none";
    const hamburger = document.querySelector('button[aria-label="Open navigation"]');
    return {
      visible,
      width: Math.round(rect?.width ?? 0),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      hamburger: hamburger ? hamburger.getBoundingClientRect().width > 0 : false,
      text: document.body.innerText.length,
    };
  });
  const expectSidebar = vp.w >= 1024;
  report(
    state.visible === expectSidebar && (!expectSidebar || state.width === 240),
    `${vp.name} ${vp.w}px: sidebar ${expectSidebar ? "240px" : "hidden"} (${state.width}px)`,
  );
  report(state.overflow <= 2, `${vp.name}: no horizontal overflow (${state.overflow}px)`);
  if (!expectSidebar) report(state.hamburger, `${vp.name}: hamburger visible`);
  report(state.text > 300, `${vp.name}: dashboard content rendered (${state.text} chars)`);
  const clean = errs.filter((e) => !e.includes("favicon"));
  report(clean.length === 0, `${vp.name}: no page errors (${clean[0] ?? "clean"})`);
  await ctx.close();
}

/* ------------------------------------------------------ 8. mobile drawer */
console.log("— mobile drawer —");
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
});
const mpage = await mobile.newPage();
const mobileErrors = [];
mpage.on("pageerror", (err) => mobileErrors.push(err.message));
mpage.on("console", (msg) => {
  if (msg.type() === "error") mobileErrors.push(msg.text());
});

const loadMobile = async () => {
  try {
    await mpage.goto(`${BASE}/overview`, { waitUntil: "load", timeout: 45000 });
  } catch {
    await mpage.waitForTimeout(3000);
    await mpage.goto(`${BASE}/overview`, { waitUntil: "load", timeout: 45000 });
  }
  // "BAJFINANCE" only renders client-side after the overview fetch — a safe
  // signal that hydration finished and click handlers are attached.
  await mpage
    .waitForFunction(() => document.body.innerText.includes("BAJFINANCE"), null, {
      timeout: 25000,
    })
    .catch(() => {});
};
await loadMobile();

const mobileState = await mpage.evaluate(() => {
  const sidebar = document.querySelector("aside");
  const hamburger = document.querySelector('button[aria-label="Open navigation"]');
  return {
    sidebarVisible: sidebar ? sidebar.getBoundingClientRect().width > 0 : false,
    hamburgerVisible: hamburger ? hamburger.getBoundingClientRect().width > 0 : false,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    bg: getComputedStyle(document.body).backgroundColor,
  };
});
report(!mobileState.sidebarVisible, "mobile: sidebar hidden");
report(mobileState.hamburgerVisible, "mobile: hamburger visible");
report(mobileState.overflow <= 2, `mobile: no horizontal overflow (${mobileState.overflow}px)`);
report(mobileState.bg === "rgb(10, 10, 10)", `mobile: theme applied (${mobileState.bg})`);

let drawerOk = false;
for (let attempt = 0; attempt < 3 && !drawerOk; attempt++) {
  await mpage.getByRole("button", { name: "Open navigation" }).click();
  await mpage.waitForTimeout(800);
  const drawerLower = (await mpage.evaluate(() => document.body.innerText)).toLowerCase();
  drawerOk = drawerLower.includes("terminal") && drawerLower.includes("calculators");
  if (!drawerOk) {
    // close any partial drawer before retrying
    await mpage
      .getByRole("button", { name: "Close navigation" })
      .click()
      .catch(() => {});
    await mpage.waitForTimeout(400);
  }
}
report(drawerOk, "mobile: drawer shows navigation groups");
const cleanMobileErrors = mobileErrors.filter((e) => !e.includes("favicon"));
report(cleanMobileErrors.length === 0, `mobile: no page errors (${cleanMobileErrors[0] ?? "clean"})`);

await browser.close();

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
