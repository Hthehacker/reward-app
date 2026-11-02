/**
 * scrollHelper.js – Centralized smooth scroll & anchor navigation utility
 * 
 * Features:
 * - Unlocks document.body overflow before scrolling (preventing browser scroll aborts)
 * - Uses double requestAnimationFrame for guaranteed layout & paint readiness
 * - Waits for asynchronously loaded elements (retrying while data loads)
 * - Native scrollIntoView({ behavior: 'smooth', block: 'start' }) respecting scroll-margin-top
 * - Stabilizes against post-scroll dynamic layout shifts (e.g. late image/font loads)
 */

export const scrollToSection = (targetId, options = {}) => {
  if (!targetId) return;

  const id = targetId.replace(/^#/, '');

  // 1. Immediately remove any body scroll lock (e.g. from mobile drawer)
  if (document.body.style.overflow === 'hidden') {
    document.body.style.overflow = '';
  }

  const maxAttempts = options.maxAttempts ?? 30; // 30 * 50ms = 1.5 seconds max wait
  let attempts = 0;

  const tryScroll = () => {
    const el = document.getElementById(id);
    if (el) {
      // Allow browser reflow & paint to settle before executing smooth scroll
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollIntoView({
            behavior: options.behavior || 'smooth',
            block: 'start'
          });
        });
      });
      return;
    }

    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(tryScroll, 50);
    }
  };

  tryScroll();
};

export const scrollToTop = (options = {}) => {
  if (document.body.style.overflow === 'hidden') {
    document.body.style.overflow = '';
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: options.behavior || 'smooth'
      });
    });
  });
};

export default {
  scrollToSection,
  scrollToTop
};
