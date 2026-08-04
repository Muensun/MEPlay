import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
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
  return (
    <>
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
