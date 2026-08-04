import { useEffect, useState } from 'react';

const SPLASH_KEY = 'meplay_splash_shown';
const HOLD_MS = 1400;
const FADE_MS = 400;

export default function Splash({ onDone }) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), HOLD_MS);
    const doneTimer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, '1');
      onDone();
    }, HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className={`splash ${fadingOut ? 'splash-out' : ''}`}>
      <img src="/MElogo.svg" alt="Mission Earth" className="splash-logo" />
    </div>
  );
}

export function shouldShowSplash() {
  return !sessionStorage.getItem(SPLASH_KEY);
}
