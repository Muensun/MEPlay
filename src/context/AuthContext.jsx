import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { en } from '../i18n/en';
import { accrue, MAX_TIME_SEC } from '../lib/time';

const AuthContext = createContext(null);
const ACCRUAL_POLL_MS = 30 * 1000;

// Firebase Auth needs an email; players only ever type a username. The
// email is a deterministic, never-shown synthetic address derived from
// the username — same username always resolves to the same account, and
// login never has to look anything up first.
function hashUsername(str) {
  let h = 0x811c9dc5; // FNV-1a
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function usernameToEmail(username) {
  return `u${hashUsername(username.trim().toLowerCase())}@meplay.local`;
}

function newUserStats(now = Date.now()) {
  return { meScore: 0, timeSec: MAX_TIME_SEC, lastAccrualAt: now };
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState(null); // users/{uid}
  const [stats, setStats] = useState(null); // stats/{uid}
  const [sessions, setSessions] = useState([]); // this account's own sessions
  const [leaderboardUsers, setLeaderboardUsers] = useState([]);
  const [leaderboardStats, setLeaderboardStats] = useState([]);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setFirebaseUser(u);
        setAuthReady(true);
      }),
    []
  );

  // Subscribe to this account's own profile/stats/sessions once signed in.
  useEffect(() => {
    if (!firebaseUser) {
      setProfile(null);
      setStats(null);
      setSessions([]);
      return undefined;
    }
    const uid = firebaseUser.uid;
    const unsubUser = onSnapshot(doc(db, 'users', uid), (snap) =>
      setProfile(snap.exists() ? { id: uid, ...snap.data() } : null)
    );
    const unsubStats = onSnapshot(doc(db, 'stats', uid), (snap) =>
      setStats(snap.exists() ? snap.data() : null)
    );
    const sessionsQuery = query(collection(db, 'sessions'), where('userId', '==', uid));
    const unsubSessions = onSnapshot(sessionsQuery, (snap) =>
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubUser();
      unsubStats();
      unsubSessions();
    };
  }, [firebaseUser]);

  // Leaderboard needs every account's profile + score — public read per
  // firestore.rules, live so a rank change shows up without a refresh.
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) =>
      setLeaderboardUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubStats = onSnapshot(collection(db, 'stats'), (snap) =>
      setLeaderboardStats(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubUsers();
      unsubStats();
    };
  }, []);

  // Accrue this account's time balance on load, on focus, and every 30s
  // while idle — derived from timestamps, never a running countdown, so
  // it's correct even after the tab was closed for days. Runs inside a
  // transaction reading the server's current doc (not the locally-cached
  // `stats`) and only touches timeSec/lastAccrualAt — spendTime()/
  // addScore() can otherwise land between this read and write, and a
  // plain write of the stale local copy would clobber them.
  useEffect(() => {
    if (!firebaseUser) return undefined;
    const ref = doc(db, 'stats', firebaseUser.uid);

    function tick() {
      runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const current = snap.data();
        const next = accrue(current, Date.now());
        if (next === current) return;
        tx.update(ref, { timeSec: next.timeSec, lastAccrualAt: next.lastAccrualAt });
      }).catch(() => {});
    }

    tick();
    const interval = setInterval(tick, ACCRUAL_POLL_MS);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', tick);
    };
  }, [firebaseUser]);

  const user = firebaseUser && profile ? { id: firebaseUser.uid, ...profile } : null;
  // True the instant Firebase confirms a session, even before the
  // Firestore profile doc has loaded — RequireAuth gates on this rather
  // than on `user`, so a signed-in player isn't bounced to /login during
  // that brief profile-fetch window.
  const signedIn = Boolean(firebaseUser);
  const users = leaderboardUsers;
  const allStats = Object.fromEntries(leaderboardStats.map((s) => [s.id, s]));

  async function createAccount(username, password, avatarId) {
    const clean = username.trim();
    if (!clean) return { ok: false, error: en.auth.errors.usernameRequired };
    if (!avatarId) return { ok: false, error: en.auth.errors.avatarRequired };
    if (!password || password.length < 6) return { ok: false, error: en.auth.errors.passwordTooWeak };

    try {
      const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(clean), password);
      const now = Date.now();
      await setDoc(doc(db, 'users', cred.user.uid), { username: clean, avatarId, createdAt: now });
      await setDoc(doc(db, 'stats', cred.user.uid), newUserStats(now));
      return { ok: true };
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        return { ok: false, error: en.auth.errors.usernameTaken };
      }
      if (err.code === 'auth/weak-password') {
        return { ok: false, error: en.auth.errors.passwordTooWeak };
      }
      return { ok: false, error: en.common.genericError };
    }
  }

  async function login(username, password) {
    const clean = username.trim();
    if (!clean || !password) return { ok: false, error: en.auth.errors.usernameRequired };
    try {
      await signInWithEmailAndPassword(auth, usernameToEmail(clean), password);
      return { ok: true };
    } catch {
      return { ok: false, error: en.auth.errors.accountNotFound };
    }
  }

  function logout() {
    // Firestore data stays under the account's uid — signing back in
    // restores meScore/timeSec/progress exactly as it was.
    return signOut(auth);
  }

  async function addScore(amount) {
    if (!firebaseUser || !amount) return;
    await updateDoc(doc(db, 'stats', firebaseUser.uid), { meScore: increment(amount) });
  }

  async function spendTime(amountSec) {
    if (!firebaseUser || !amountSec) return;
    const ref = doc(db, 'stats', firebaseUser.uid);
    // Transaction rather than increment(-n): the balance must clamp at
    // 0, and increment() alone can't express that.
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const current = snap.data().timeSec ?? 0;
      tx.update(ref, { timeSec: Math.max(0, current - amountSec) });
    });
  }

  async function recordSession(gameId, record) {
    if (!firebaseUser) return;
    await addDoc(collection(db, 'sessions'), { userId: firebaseUser.uid, gameId, ...record });
  }

  const value = {
    user,
    authReady,
    signedIn,
    users,
    stats,
    allStats,
    sessions,
    createAccount,
    login,
    logout,
    addScore,
    spendTime,
    recordSession,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
