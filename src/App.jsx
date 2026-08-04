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
import WordGuess from './games/wordguess/WordGuess';
import './App.css';

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
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
            path="/game/wordguess"
            element={
              <RequireAuth>
                <WordGuess />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </>
  );
}
