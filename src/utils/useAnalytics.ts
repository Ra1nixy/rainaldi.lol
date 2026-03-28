import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackInteraction } from '../utils/analyticsService';
import { auth } from '../config/firebase';

/**
 * Drop this hook in App.tsx or any layout component to auto-track:
 *  - page views on route change
 *  - link clicks & form submits via event delegation
 */
export function useAnalytics() {
  const location = useLocation();
  const prevPath = useRef<string | null>(null);

  // Track page view on route change
  useEffect(() => {
    const current = location.pathname;
    
    // 1. Skip if same path (prevent double track on re-renders)
    if (current === prevPath.current) return;
    
    // 2. Skip tracking in development (localhost)
    if (window.location.hostname === 'localhost') return;

    // 3. Skip tracking if user is logged in (likely you, the Admin)
    if (auth.currentUser) return;

    // 4. Skip tracking for Admin related routes & Login page
    if (current.startsWith('/admin') || current === '/login') {
      prevPath.current = current;
      return;
    }
    
    prevPath.current = current;

    // Map path → readable name
    const pageMap: Record<string, string> = {
      '/': 'Home',
      '/portfolio': 'Portfolio',
    };

    const pageName = pageMap[current] ?? current;
    trackPageView(pageName);
  }, [location.pathname]);

  // Track interactions via event delegation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 1. Skip if on localhost
      if (window.location.hostname === 'localhost') return;

      // 2. Skip if admin is logged in
      if (auth.currentUser) return;

      // 3. Skip if on an admin or login page
      const current = location.pathname;
      if (current.startsWith('/admin') || current === '/login') return;

      const target = e.target as HTMLElement;

      // Track anchor / button clicks
      const link = target.closest('a');
      const button = target.closest('button');

      if (link) {
        const href = link.getAttribute('href') || '';
        // Skip internal navigation (already tracked via page view)
        if (!href.startsWith('/') && !href.startsWith('#')) {
          trackInteraction('link_click', href, location.pathname);
        }
      } else if (button) {
        const label =
          button.getAttribute('aria-label') || button.textContent?.trim().slice(0, 50) || 'button';
        trackInteraction('click', label, location.pathname);
      }
    };

    const handleSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      const name = form.getAttribute('id') || form.getAttribute('name') || 'form';
      trackInteraction('form_submit', name, location.pathname);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
    };
  }, [location.pathname]);
}
