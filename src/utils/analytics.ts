const GA_ID = 'G-LYG5704YQH';

export const analytics = {
  pageView(path?: string) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('config', GA_ID, { page_path: path || window.location.pathname + window.location.search });
  },

  track(eventName: string, params?: Record<string, unknown>) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, params);
  },
};
