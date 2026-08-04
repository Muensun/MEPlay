import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const MIN_LOADING_MS = 1500;

export function usePageLoading() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return loading;
}
