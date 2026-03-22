// ─── Home / Landing Page ─────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { ROOMS } from '../utils/constants';

/* Reusable ambient blob */
const Blob = ({ style }) => (
  <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }} />
);

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#080812', color: '#fff', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Ambient background ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <Blob style={{ top: '6%', left: '16%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(129,140,248,0.09) 0%, transparent 70%)' }} />
        <Blob style={{ bottom: '15%', right: '10%', width: 550, height: 550, background: 'radial-gradient(circle, rgba(78,205,196,0.07) 0%, transparent 70%)' }} />
        <Blob style={{ top: '52%', left: '48%', width: 900, height: 900, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)' }} />
        {/* Subtle grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.022 }}>
          <defs>
            <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeWidth="0.6"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>

        {/* ── Hero section ── */}
        <section style={{ paddingTop: 160, paddingBottom: 100, textAlign: 'center', animation: 'fadeUp 0.8s ease both' }}>
          {/* Status pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.28)',
            borderRadius: 100, padding: '8px 20px', marginBottom: 38,
            fontSize: 12.5, color: '#818CF8', fontWeight: 500, letterSpacing: 0.3,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#818CF8', animation: 'pulseDot 2s infinite' }} />
            AI-Powered  ·  Fully Anonymous  ·  Real-Time Peer Support
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(44px, 7vw, 88px)',
            fontWeight: 700, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 28,
          }}>
            You don't have to face<br />
            <span style={{ background: 'linear-gradient(135deg, #818CF8 25%, #4ECDC4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              this alone.
            </span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.46)', maxWidth: 530, margin: '0 auto 52px', lineHeight: 1.78 }}>
            A private, judgment-free space to connect with peers who understand.
            No accounts, no real names — just honest, human conversations.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/chat')} style={{
              background: 'linear-gradient(135deg, #818CF8, #6366F1)',
              border: 'none', color: '#fff', padding: '16px 44px', borderRadius: 14,
              fontSize: 16, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 0 50px rgba(129,140,248,0.3)', transition: 'all 0.28s',
              fontFamily: "'DM Sans', sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 55px rgba(129,140,248,0.42)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 0 50px rgba(129,140,248,0.3)'; }}
            >
              Enter Anonymously →
            </button>
            <button onClick={() => navigate('/resources')} style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.65)', padding: '16px 44px', borderRadius: 14,
              fontSize: 16, cursor: 'pointer', transition: 'all 0.25s', fontFamily: "'DM Sans', sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.3)'; e.currentTarget.style.color='#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; e.currentTarget.style.color='rgba(255,255,255,0.65)'; }}
            >
              View Resources
            </button>
          </div>
        </section>

        {/* ── Feature cards ── */}
        <section style={{ paddingBottom: 90, animation: 'fadeUp 0.8s 0.2s ease both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
            {[
              { icon: '🔒', title: 'Zero Identity',   color: '#818CF8', desc: 'No signup. No email. No tracking. You receive a random name that vanishes when you close the tab.' },
              { icon: '🤖', title: 'AI Moderation',   color: '#4ECDC4', desc: 'Every message is scanned by an NLP pipeline — toxicity detection, sentiment analysis, and risk scoring.' },
              { icon: '📊', title: 'Sentiment Aware', color: '#F9A8D4', desc: 'Our system understands emotional context and quietly alerts trained counselors when someone needs extra care.' },
            ].map((f, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 22, padding: 34, transition: 'all 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.045)'; e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.025)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; }}
              >
                <div style={{ fontSize: 36, marginBottom: 18 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: f.color }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14.5, lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Support rooms ── */}
        <section style={{ paddingBottom: 90, animation: 'fadeUp 0.8s 0.35s ease both' }}>
          <div style={{ textAlign: 'center', marginBottom: 46 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, marginBottom: 12 }}>Support Rooms</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 15.5 }}>Choose the space that feels right for you today</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
            {ROOMS.map(r => (
              <button key={r.id} onClick={() => navigate('/chat', { state: { room: r.id } })} style={{
                background: 'rgba(255,255,255,0.025)', border: `1px solid ${r.color}1a`,
                borderRadius: 18, padding: '24px 14px', textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.28s', fontFamily: "'DM Sans', sans-serif",
              }}
                onMouseEnter={e => { e.currentTarget.style.background=`${r.color}12`; e.currentTarget.style.borderColor=`${r.color}44`; e.currentTarget.style.transform='scale(1.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor=`${r.color}1a`; e.currentTarget.style.transform='scale(1)'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: r.color, marginBottom: 8 }}>{r.label}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.55 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ paddingBottom: 110, animation: 'fadeUp 0.8s 0.45s ease both' }}>
          <div style={{ textAlign: 'center', marginBottom: 46 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, marginBottom: 12 }}>How It Works</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 15.5 }}>Privacy and safety built into every step</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[
              { step:'01', title:'Get Anonymous ID', desc:'A random name is generated. No signup required.', color:'#818CF8' },
              { step:'02', title:'Join a Room',       desc:"Pick the topic that matches what you're going through.", color:'#4ECDC4' },
              { step:'03', title:'Chat Freely',        desc:'Share your thoughts. AI keeps the space safe.', color:'#F9A8D4' },
              { step:'04', title:'Leave No Trace',     desc:'Close the tab — your session is gone forever.', color:'#FCD34D' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 30 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: s.color, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>{s.step}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
