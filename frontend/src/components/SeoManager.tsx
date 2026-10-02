import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

const CANONICAL_URL = 'https://impulse.uck.ac.in/';

interface SeoManagerProps {
  isNotFound?: boolean;
}

export const SeoManager: React.FC<SeoManagerProps> = ({ isNotFound = false }) => {
  const { user, activeTab } = useApp();

  useEffect(() => {
    const pathname = window.location.pathname.toLowerCase();

    // 1. Determine indexability
    // ONLY the clean, unauthenticated homepage (pathname === '/') is indexable
    const isIndexableHomepage = !user && !isNotFound && (pathname === '/' || pathname === '');

    // 2. Manage <meta name="robots">
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }

    if (isIndexableHomepage) {
      robotsMeta.setAttribute('content', 'index, follow');
    } else {
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    }

    // 3. Manage <link rel="canonical">
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (isIndexableHomepage) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', CANONICAL_URL);
    } else {
      // Remove canonical tag from private or invalid routes to avoid misleading search engines
      if (canonicalLink) {
        canonicalLink.remove();
      }
    }

    // 4. Manage dynamic document.title
    if (isNotFound) {
      document.title = 'Page Not Found | Impulse';
    } else if (!user) {
      if (pathname.includes('/register') || pathname.includes('/signup')) {
        document.title = 'Register | Impulse';
      } else if (pathname.includes('/login')) {
        document.title = 'Sign In | Impulse';
      } else {
        document.title = 'Impulse | UCEK Placement Suite';
      }
    } else {
      // Authenticated views
      switch (activeTab) {
        case 'dashboard':
          document.title = 'Dashboard | Impulse';
          break;
        case 'roadmap':
          document.title = 'Placement Roadmap | Impulse';
          break;
        case 'resumes':
          document.title = 'AI Resume Suite | Impulse';
          break;
        case 'tests':
          document.title = 'Mock Tests | Impulse';
          break;
        case 'interview':
          document.title = 'HR Interview Simulator | Impulse';
          break;
        case 'admin-dashboard':
        case 'admin-tests':
        case 'admin-roles':
          document.title = 'Admin Panel | Impulse';
          break;
        default:
          document.title = 'Impulse';
          break;
      }
    }
  }, [user, activeTab, isNotFound]);

  return null;
};

export default SeoManager;
