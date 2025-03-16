import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_SERVER,
  PHASE_PRODUCTION_BUILD,
} from 'next/constants.js';

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import('./src/env.mjs');

const botService = async (prod = false) => {
  return fetch(prod ? `${process.env.HOST}/api/_bot` : 'http://localhost:3000/api/_bot')
    .then(async (res) => {
      const resJson = await res.json();
      return JSON.stringify(resJson.bootedServices);
    })
    .catch(() => false);
};

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /**
   * If you have `experimental: { appDir: true }` set, then you must comment the below `i18n` config
   * out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
};

/**
 * @param {string} phase
 */
async function setupConfig(phase) {
  if (process.argv.includes('dev') && phase === PHASE_DEVELOPMENT_SERVER) {
    console.log('[next.config.js (dev)]');
    const botServices = await botService();
    console.log(`[next.config.js (dev)] => botedServices: ${botServices}`);
  } else if (process.argv.includes('start') && phase === PHASE_PRODUCTION_SERVER) {
    console.log('[next.config.js (start)]');
    await botService(true);
  }

  return config;
}

export default setupConfig;
