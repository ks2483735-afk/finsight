# Changelog

All notable FinSight changes are documented here.

## [0.4.0] - Unreleased

### Performance and reliability
- Avoid unsupported full-universe live quote requests. Broad market tables and movers remain clearly labeled demo data until a provider offers a supported bulk endpoint.
- Preserve partial quote results across providers so unsupported symbols from one adapter can be served by another adapter or the mock fallback.
- Run supported Finnhub quote requests with bounded concurrency and fetch supported indices concurrently.
- Process Alpha Vantage quote requests in small batches to reduce sequential wait time while respecting provider quotas.
- Skip disabled and unconfigured live providers before making upstream requests.
- Prefer configured NewsAPI and retain public RSS as a zero-key fallback.
- Apply shorter bounded timeouts to external data providers.
- Remove artificial delay timers from local mock market and news adapters.
- Statically prerender the landing page and move its simulated market preview into a client component that refreshes independently.

### UI and documentation
- Update the landing page, sidebar, Settings → About panel, and roadmap to identify v0.4.0.
- Explain that the broad market universe and movers are simulated, while individual quotes and supported indices may use live providers.
- Document the public deployment limitation: personal-data APIs remain disabled on shared public hosts until authentication and per-user data isolation are implemented.

### Known limitations
- AI adapters, AI-generated analysis, and citations are not implemented in this release.
- The broad market universe and movers remain mock/demo data; they are not live bulk market feeds.
- Public deployments do not support personal watchlists, portfolios, alerts, or saved provider settings.
- No quantified before/after runtime benchmark is published yet. Performance changes are based on removing identified waits and unnecessary requests; users should validate real-world behavior on their own deployment.

## [0.3.0] - 2026-10-09

### Performance and reliability
- Added TTL caching and request deduplication for repeated market/news requests.
- Added bounded timeouts for external provider requests.
- Improved provider connection testing so a successful status requires a real provider response.

### Release foundation
- Added Finnhub and Alpha Vantage market-data adapters.
- Added public RSS and NewsAPI news adapters.
- Retained clearly labeled mock fallbacks for unsupported data.
- Added public-host safeguards for personal-data APIs.
