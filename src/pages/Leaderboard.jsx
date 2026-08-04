import { useAuth } from '../context/AuthContext';

export default function Leaderboard() {
  const { users, user } = useAuth();
  const ranked = [...users].sort((a, b) => b.points - a.points);

  return (
    <div className="page">
      <h1>Leaderboard</h1>
      <p className="muted">อันดับผู้เล่นบนเครื่องนี้ (เดโม — ยังไม่เชื่อมกับส่วนกลาง)</p>

      {ranked.length === 0 ? (
        <p className="muted">ยังไม่มีผู้เล่น สมัครสมาชิกแล้วเริ่มเล่นเพื่อขึ้นอันดับ!</p>
      ) : (
        <ol className="leaderboard-list">
          {ranked.map((u, i) => (
            <li
              key={u.username}
              className={user?.username === u.username ? 'me' : ''}
            >
              <span className="rank">#{i + 1}</span>
              <span className="name">{u.displayName}</span>
              <span className="score">{u.points} แต้ม</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
