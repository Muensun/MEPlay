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
              style={{ '--accent': colorForIndex(i + 1) }}
            >
              <img src={game.logo} alt="" className="game-card-logo" />
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              {game.available ? (
                <Link to={user ? game.path : '/login'} className="btn-primary">
                  {user ? en.home.playCta : en.home.signInToPlayCta}
                </Link>
              ) : (
                <span className="badge">{en.home.comingSoon}</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
