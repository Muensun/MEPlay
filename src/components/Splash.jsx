import { useEffect, useRef, useState } from 'react';
import { en } from '../i18n/en';

const SPLASH_KEY = 'meplay_splash_shown';
const FADE_MS = 400;
const FALLBACK_MAX_MS = 10000; // safety net in case the video never fires "ended"

export default function Splash({ onDone }) {
  const [fadingOut, setFadingOut] = useState(false);
  const finishedRef = useRef(false);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    sessionStorage.setItem(SPLASH_KEY, '1');
    setFadingOut(true);
    setTimeout(onDone, FADE_MS);
  }

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    const fallback = setTimeout(finish, FALLBACK_MAX_MS);
    return () => clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`splash ${fadingOut ? 'splash-out' : ''}`}>
      <video
        className="splash-logo"
        src="/melogo.mp4"
        autoPlay
        muted
        playsInline
        onEnded={finish}
        onError={finish}
      />
      <p className="splash-credit">{en.splash.credit}</p>
    </div>
  );
}

export function shouldShowSplash() {
  return !sessionStorage.getItem(SPLASH_KEY);
}
