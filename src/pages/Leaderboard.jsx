import { useAuth } from '../context/AuthContext';
import { avatarUrlFor } from '../assets/avatars';
import { en } from '../i18n/en';

export default function Leaderboard() {
  const { users, allStats, user } = useAuth();
  const ranked = [...users]
    .map((u) => ({ ...u, meScore: allStats[u.id]?.meScore ?? 0 }))
    .sort((a, b) => b.meScore - a.meScore);

  return (
    <div className="page">
      <h1>{en.leaderboard.title}</h1>
      <p className="muted">{en.leaderboard.subtitle}</p>

      {ranked.length === 0 ? (
        <p className="muted">{en.leaderboard.empty}</p>
      ) : (
        <ol className="leaderboard-list">
          {ranked.map((u, i) => (
            <li key={u.id} className={user?.id === u.id ? 'me' : ''}>
              <span className="rank">#{i + 1}</span>
              <img src={avatarUrlFor(u.avatarId)} alt="" className="leaderboard-avatar" />
              <span className="name">{u.username}</span>
              <span className="score">
                {u.meScore.toLocaleString()} {en.leaderboard.scoreHeader}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
