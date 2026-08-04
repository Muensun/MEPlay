import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colorForIndex } from '../theme/palette';

const games = [
  {
    id: 'wordguess',
    title: 'ทายคำ',
    emoji: '🔤',
    description: 'ทายคำศัพท์ให้ถูกภายในจำนวนครั้งที่กำหนด',
    path: '/game/wordguess',
    available: true,
  },
  {
    id: 'coming-1',
    title: 'เร็วๆ นี้',
    emoji: '🎲',
    description: 'เกมใหม่กำลังจะมา',
    available: false,
  },
  {
    id: 'coming-2',
    title: 'เร็วๆ นี้',
    emoji: '🧩',
    description: 'เกมใหม่กำลังจะมา',
    available: false,
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <section className="hero">
        <h1>
          <img src="/nameapp.png" alt="MEPlay" className="hero-wordmark" />
        </h1>
        <p>รวมเกมสนุกๆ จาก Mission Earth ไว้ในที่เดียว สะสมแต้ม แข่งอันดับกับเพื่อน</p>
        {!user && (
          <Link to="/login" className="btn-primary btn-lg">
            สร้างบัญชีเพื่อเริ่มเล่น
          </Link>
        )}
      </section>

      <section>
        <h2>เกมทั้งหมด</h2>
        <div className="game-grid">
          {games.map((game, i) => (
            <div
              key={game.id}
              className={`game-card ${!game.available ? 'disabled' : ''}`}
              style={{ '--accent': colorForIndex(i + 1) }}
            >
              <div className="game-emoji">{game.emoji}</div>
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              {game.available ? (
                <Link to={user ? game.path : '/login'} className="btn-primary">
                  {user ? 'เล่นเลย' : 'เข้าสู่ระบบเพื่อเล่น'}
                </Link>
              ) : (
                <span className="badge">เร็วๆ นี้</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
