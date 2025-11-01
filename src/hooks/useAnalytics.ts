import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}

class Analytics {
  private userId?: string;

  setUser(userId: string) {
    this.userId = userId;
  }

  track(event: AnalyticsEvent) {
    if (typeof window === 'undefined') return;

    // Send to backend
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        ...event,
        userId: this.userId,
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
        userAgent: navigator.userAgent
      })
    }).catch(console.error);

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics:', event);
    }
  }

  pageView(path: string) {
    this.track({
      action: 'page_view',
      category: 'navigation',
      label: path
    });
  }

  userAction(action: string, category: string, label?: string) {
    this.track({
      action,
      category,
      label
    });
  }
}

const analytics = new Analytics();

export const useAnalytics = () => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      analytics.setUser(user.id);
    }
  }, [user]);

  useEffect(() => {
    analytics.pageView(location.pathname);
  }, [location.pathname]);

  return {
    track: analytics.track.bind(analytics),
    pageView: analytics.pageView.bind(analytics),
    userAction: analytics.userAction.bind(analytics)
  };
};

export { analytics };