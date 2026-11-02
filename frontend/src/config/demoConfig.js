/**
 * Centralized Demo Mode Configuration
 *
 * Enabled by default across development, staging, and production when requested.
 * Set VITE_DEMO_MODE=false explicitly to disable demo features and switcher.
 */
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'false' ? false : true;
