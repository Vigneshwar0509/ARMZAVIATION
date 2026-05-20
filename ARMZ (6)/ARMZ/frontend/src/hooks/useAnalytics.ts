import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ENV } from '@/src/config/env';
import { logger } from '@/src/utils/logger';

const trackPageView = (path: string) => {
  if (!ENV.ENABLE_ANALYTICS) {
    return;
  }

  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
    });
    return;
  }

  logger.info('Analytics enabled but gtag is not available', { path });
};

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
};
