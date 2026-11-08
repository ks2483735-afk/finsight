# FinSight product promo

This project contains a 24-second, silent 16:9 FinSight product introduction. It uses FinSight's near-black background, warm gold accent, terminal-style labels, and the real overview dashboard screenshot.

The four scenes introduce the finance research terminal, show the overview dashboard, explain source labeling for provider and demo data, and close on FinSight's open-source, local-first, BYOK positioning. The script sticks to shipped features and keeps configured live provider data distinct from labeled demo data.

The composition is named FinSightPromo (1920x1080 at 30 fps). The preview is available in Remotion Studio while the dev server is running.

## Commands

**Install Dependencies**

```console
npm install --ignore-scripts --omit=dev
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render FinSightPromo out/finsight-promo.mp4
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
