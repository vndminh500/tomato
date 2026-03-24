import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const elementId = hash.replace('#', '');
      let retryCount = 0;
      const maxRetries = 20;

      const scrollToHashTarget = () => {
        const target = document.getElementById(elementId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return true;
        }
        return false;
      };

      if (scrollToHashTarget()) return;

      const retryTimer = setInterval(() => {
        retryCount += 1;
        const done = scrollToHashTarget() || retryCount >= maxRetries;
        if (done) {
          clearInterval(retryTimer);
        }
      }, 50);

      return () => clearInterval(retryTimer);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
