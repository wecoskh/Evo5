import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export function Nav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const onLanding = pathname === '/';

  return (
    <nav className="nav">
      <div className="container nav-inner">
<Link to="/" className="logo">
            <span className="logo-mark">E5</span>
            <span>EV05</span>
          </Link>

        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu">☰</button>

        <div className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          {onLanding && (
            <>
              <a href="#problem">Problem</a>
              <a href="#ecosystem">5-in-1</a>
              <a href="#protocol">Zero-Contact</a>
              <a href="#features">Features</a>
              <a href="#try">Try the AI</a>
              <a href="#revenue">Revenue</a>
            </>
          )}
          {user ? (
            <>
              <NavLink to="/app" className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ marginBottom: 12 }}>
              <span className="logo-mark">E5</span><span>EV05</span>
            </div>
            <p className="muted" style={{ fontSize: 14, maxWidth: '34ch', margin: 0 }}>
              The world's first AI-mediated, zero-contact 5-in-1 marketplace. Trust infrastructure
              for brands, creators, celebrities, volunteers and researchers.
            </p>
          </div>
          <div>
            <h5>Platform</h5>
            <a href="#ecosystem">5-in-1 Ecosystem</a>
            <a href="#protocol">Zero-Contact Protocol</a>
            <a href="#features">Innovations</a>
            <a href="#architecture">Architecture</a>
          </div>
          <div>
            <h5>Business</h5>
            <a href="#revenue">Revenue Model</a>
            <a href="#roadmap">Roadmap</a>
            <a href="#compare">vs Competitors</a>
          </div>
          <div>
            <h5>Access</h5>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
            <Link to="/app">Dashboard</Link>
          </div>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} EV05 — Where Influence Meets Intelligence</span>
          <span>MarTech & Creator Economy Technology · Global</span>
        </div>
      </div>
    </footer>
  );
}
