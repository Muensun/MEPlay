import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colorForIndex } from '../theme/palette';
import { games } from '../config/games';
import { en } from '../i18n/en';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <section className="hero">
        <h1>
          <img src="/nameapp.png" alt={en.home.heroWordmarkAlt} className="hero-wordmark" />
        </h1>

        {!user && (
          <Link to="/login" className="btn-primary btn-lg">
            {en.home.heroCtaSignedOut}
          </Link>
        )}
      </section>

      <section>
        <h2>{en.home.gamesHeading}</h2>
        <div className="game-grid">
          {games.map((game, i) => (
            <div
              key={game.id}
              className={`game-card ${!game.available ? 'disabled' : ''}`}
              style={{
                '--accent': colorForIndex(i + 1),
                ...(game.background ? { '--game-card-bg': `url(${game.background})` } : {}),
              }}
            >
              {game.logo ? (
                <img src={game.logo} alt={game.title} className="game-card-logo" />
              ) : (
                <span className="game-card-logo game-card-logo-placeholder" aria-hidden="true">
                  ?
                </span>
              )}
              {game.available ? (
                <Link
                  to={user ? game.path : '/login'}
                  className="game-card-link"
                  aria-label={user ? `${en.home.playCta}: ${game.title}` : en.home.signInToPlayCta}
                />
              ) : (
                <span className="badge game-card-badge">{en.home.comingSoon}</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
