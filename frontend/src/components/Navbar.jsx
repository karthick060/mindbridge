// ─── Navbar Component ─────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/',          label: 'Home'      },
  { to: '/chat',      label: 'Chat'      },
  { to: '/resources', label: 'Resources' },
  { to: '/dashboard', label: 'Dashboard' },
];

export default function Navbar({ userId }) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Become opaque on scroll
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: scrolled ? 'rgba(8,8,18,0.94)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition: 'all 0.35s ease',
      padding: '0 40px', height: 66,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: 'linear-gradient(135deg, #818CF8 0%, #4ECDC4 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, boxShadow: '0 0 20px rgba(129,140,248,0.35)',
        }}>🧠</div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, color: '#fff', fontWeight: 700, letterSpacing: '-0.5px' }}>
          MindBridge
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {NAV_LINKS.map(({ to, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link key={to} to={to} style={{
              textDecoration: 'none',
              background: active ? 'rgba(129,140,248,0.15)' : 'transparent',
              border: `1px solid ${active ? 'rgba(129,140,248,0.4)' : 'transparent'}`,
              color: active ? '#818CF8' : 'rgba(255,255,255,0.52)',
              padding: '8px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 500,
              transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color='rgba(255,255,255,0.52)'; e.currentTarget.style.background='transparent'; }}}
            >{label}</Link>
          );
        })}

        {/* Anonymous ID badge */}
        {userId && (
          <div style={{
            marginLeft: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 10, padding: '7px 14px',
            fontSize: 11.5, color: 'rgba(255,255,255,0.38)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            🔒 {userId}
          </div>
        )}
      </div>
    </nav>
  );
}
