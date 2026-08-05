import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Splash, { shouldShowSplash } from './components/Splash';
import PageLoader from './components/PageLoader';
import { usePageLoading } from './hooks/usePageLoading';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Leaderboard from './pages/Leaderboard';
import MEWord from './games/meword/MEWord';
import './App.css';

function RequireAuth({ children }) {
  const { signedIn, authReady } = useAuth();
  // Firebase restores a saved session asynchronously — without this
  // guard, a signed-in player gets bounced to /login for a flash before
  // onAuthStateChanged fires once on load. Gated on `signedIn` (auth
  // state only) rather than the fully profile-hydrated `user`, so a
  // slower Firestore fetch right after doesn't trigger the same flash.
  if (!authReady) return null;
  return signedIn ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(shouldShowSplash);
  const pageLoading = usePageLoading();

  return (
    <>
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      {!showSplash && pageLoading && <PageLoader />}
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route
            path="/game/meword"
            element={
              <RequireAuth>
                <MEWord />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </>
  );
}
