const configuredInterval = Number(process.env.NEXT_PUBLIC_GREY_FEED_INTERVAL_MS);

export const DEMO_FEED_INTERVAL_MS = Number.isFinite(configuredInterval)
  ? Math.min(10_000, Math.max(3_000, configuredInterval))
  : 4_000;