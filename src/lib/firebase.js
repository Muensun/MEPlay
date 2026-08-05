// Firebase app init — config comes from env vars (see .env.example) so the
// real project credentials never live in source. Vite only exposes
// VITE_-prefixed vars to client code; these values aren't secret in the
// security sense (a web API key is meant to be public — access control is
// enforced by firestore.rules, not by hiding this), but they're
// per-project and shouldn't be hardcoded, so a wrong/missing .env fails
// loudly instead of silently pointing at nobody's project.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length > 0) {
  // Thrown at import time, not swallowed — a half-configured Firebase
  // project fails the whole app immediately instead of misbehaving
  // silently at the first sign-in attempt.
  throw new Error(
    `Missing Firebase config: ${missing.join(', ')}. Copy .env.example to .env.local and fill in your Firebase project's values.`
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
