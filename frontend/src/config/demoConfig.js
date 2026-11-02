/**
 * Centralized Demo Mode Configuration
 *
 * In Production (Vercel, Docker, static release):
 * When VITE_DEMO_MODE is 'false' or omitted, isDemoMode is statically evaluated to `false`
 * and all demo components/strings are tree-shaken and eliminated from the production build.
 *
 * In Staging (npm run build:staging):
 * VITE_DEMO_MODE is 'true' and VITE_ALLOW_PROD_DEMO is 'true', keeping the complete demo experience.
 *
 * In Development (npm run dev):
 * Enabled by default for local development.
 */
export const isDemoMode =
  import.meta.env.VITE_DEMO_MODE === 'true'
    ? import.meta.env.DEV || import.meta.env.VITE_ALLOW_PROD_DEMO === 'true'
    : false;
