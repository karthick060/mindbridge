// ─── Dashboard Page — REAL BACKEND DATA ──────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { ROOMS, SENTIMENT_COLOR, RISK_COLOR } from '../utils/constants';
import { api } from '../utils/api';

// ─── Admin gate — password stored in sessionStorage (clears on tab close) ─
function useAdminAuth() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem('mb_admin') === 'true'
  );
  const login = useCallback((pwd) => {
    // Change this password to whatever you want
    const ADMIN_PASSWORD = 'mindbridge2024';
    if (pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem('mb_admin', 'true');
      setAuthed(true);
      return true;
    }
    return false;
  }, []);
  const logout = useCallback(() => {
    sessionStorage.removeItem('mb_admin');
    setAuthed(false);
  }, []);
  return { authed, login, logout };
}

function AdminLoginGate({ onLogin }) {
  const [pwd, setPwd]     = useState('');
  const [error, setError] = useState('');
  const [show, setShow]   = useState(false);

  const submit = () => {
    const ok = onLogin(pwd);
    if (!ok) { setError('Incorrect password.'); setPwd(''); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080812', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '48px 44px', width: 360, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>🔐</div>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Admin Access</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 32 }}>This dashboard is restricted to administrators only.</p>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            type={show ? 'text' : 'password'}
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Enter admin password"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '13px 44px 13px 16px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }}
          />
          <button onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, padding: 0 }}>{show ? '🙈' : '👁️'}</button>
        </div>
        {error && <div style={{ color: '#FCA5A5', fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <button onClick={submit} style={{ width: '100%', background: 'linear-gradient(135deg, #818CF8, #6366F1)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          Enter Dashboard
        </button>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,10,22,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || '#818CF8' }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
};

function StatCard({ icon, label, value, color, sub, highlight }) {
  return (
    <div
      style={{ background: highlight ? `${color}0c` : 'rgba(255,255,255,0.025)', border: `1px solid ${highlight ? color + '30' : 'rgba(255,255,255,0.07)'}`, borderRadius: 20, padding: 28, transition: 'all 0.4s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ fontSize: 30, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 38, fontWeight: 800, color, letterSpacing: '-1.5px', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid rgba(129,140,248,0.2)', borderTopColor: '#818CF8', animation: 'spin 0.75s linear infinite' }} />
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading live data…</span>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 8 }}>Could not load dashboard</div>
      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, marginBottom: 24 }}>{message}</div>
      <button onClick={onRetry} style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 12, padding: '10px 24px', color: '#818CF8', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Retry</button>
    </div>
  );
}

export default function DashboardPage() {
  const { authed, login, logout } = useAdminAuth();

  const [stats,     setStats]     = useState(null);
  const [flags,     setFlags]     = useState([]);
  const [roomData,  setRoomData]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [clock,     setClock]     = useState(new Date());
  const [newAlert,  setNewAlert]  = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  // Build sentiment chart data from stats
  const sentimentData = stats ? [
    { name: 'Happy',     value: 0, color: '#6EE7B7' },
    { name: 'Neutral',   value: 0, color: '#93C5FD' },
    { name: 'Sad',       value: 0, color: '#A78BFA' },
    { name: 'Depressed', value: 0, color: '#F9A8D4' },
    { name: 'Angry',     value: 0, color: '#FCA5A5' },
  ].map(s => {
    const found = stats.sentiment_breakdown?.find(b => b.sentiment?.toLowerCase() === s.name.toLowerCase());
    const total = stats.sentiment_breakdown?.reduce((a, b) => a + b.count, 0) || 1;
    return { ...s, value: found ? Math.round((found.count / total) * 100) : 0 };
  }) : [];

  // Build room bar chart data
  const roomCounts = ROOMS.map(r => ({
    name:     r.label.split(' ')[0],
    messages: roomData.find(d => d.room__slug === r.id)?.count || 0,
    color:    r.color,
    icon:     r.icon,
  }));

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [statsRes, flagsRes, roomRes] = await Promise.all([
        api.getDashboardStats(),
        api.getFlaggedMessages(),
        api.getRoomActivity(),
      ]);
      setStats(statsRes);
      setRoomData(roomRes);

      // Check for new alerts
      if (flagsRes.length > prevCount) {
        setNewAlert(true);
        setPrevCount(flagsRes.length);
        setTimeout(() => setNewAlert(false), 3000);
      }
      setFlags(flagsRes);
    } catch (e) {
      setError('Backend unreachable. Is your Django server running?');
    } finally {
      setLoading(false);
    }
  }, [prevCount]);

  // Initial load
  useEffect(() => { if (authed) fetchAll(); }, [authed, fetchAll]);

  // Poll every 10 seconds
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(fetchAll, 10000);
    return () => clearInterval(t);
  }, [authed, fetchAll]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Resolve — calls real backend PATCH endpoint ──────────────────────────
  const resolveFlag = async (id) => {
    try {
      await api.resolveAlert(id);
      // Optimistically remove from list, refetch will confirm
      setFlags(prev => prev.filter(f => f.id !== id));
    } catch (e) {
      alert('Failed to resolve. Check your backend connection.');
    }
  };

  const unresolved = flags.filter(f => !f.is_resolved);

  if (!authed) return <AdminLoginGate onLogin={login} />;

  return (
    <div style={{ minHeight: '100vh', background: '#080812', color: '#fff', fontFamily: "'DM Sans', sans-serif", paddingTop: 66 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ping   { 0% { transform:scale(1); opacity:1; } 100% { transform:scale(2.2); opacity:0; } }
        @keyframes spin   { to { transform:rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, animation: 'fadeUp 0.7s ease both' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, marginBottom: 8, letterSpacing: '-1px' }}>Admin Dashboard</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ECDC4', display: 'block' }} />
                <span style={{ position: 'absolute', width: 7, height: 7, borderRadius: '50%', background: '#4ECDC4', animation: 'ping 1.5s infinite', top: 0, left: 0 }} />
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.36)' }}>Live · {clock.toLocaleTimeString()} · Auto-refreshes every 10s</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {unresolved.length > 0 && (
              <div style={{ background: newAlert ? 'rgba(239,68,68,0.16)' : 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 13, padding: '13px 20px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', transition: 'all 0.4s' }} onClick={() => setActiveTab('alerts')}>
                <span style={{ fontSize: 22 }}>🚨</span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#FCA5A5' }}>{unresolved.length} Unresolved Alert{unresolved.length !== 1 ? 's' : ''}</div>
                  <div style={{ fontSize: 12, color: 'rgba(252,165,165,0.55)' }}>Click to review</div>
                </div>
              </div>
            )}
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
              🔓 Logout
            </button>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={fetchAll} /> : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 34, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: 4, width: 'fit-content' }}>
              {['overview', 'activity', 'alerts'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? 'rgba(129,140,248,0.2)' : 'transparent', border: `1px solid ${activeTab === t ? 'rgba(129,140,248,0.38)' : 'transparent'}`, color: activeTab === t ? '#818CF8' : 'rgba(255,255,255,0.38)', padding: '8px 22px', borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
                  {t}
                  {t === 'alerts' && unresolved.length > 0 && (
                    <span style={{ position: 'absolute', top: -6, right: -6, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unresolved.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {activeTab === 'overview' && stats && (
              <div style={{ animation: 'fadeUp 0.5s ease both' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 28 }}>
                  <StatCard icon="👥" label="Active Users (24h)"  value={stats.active_users}      color="#4ECDC4" sub="Unique anonymous users" />
                  <StatCard icon="💬" label="Messages Today"      value={stats.messages_today}    color="#818CF8" sub="All rooms combined" />
                  <StatCard icon="🚫" label="Blocked by AI"       value={stats.blocked_messages}  color="#FCA5A5" sub="Harmful content" />
                  <StatCard icon="⚠️" label="Unresolved Alerts"   value={stats.high_risk_alerts}  color="#FCD34D" sub="Need review" highlight={stats.high_risk_alerts > 0} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  {/* Sentiment */}
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
                    <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 4, color: 'rgba(255,255,255,0.72)' }}>Sentiment Distribution</h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.26)', marginBottom: 22 }}>Across all rooms — last 24h</p>
                    <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
                      <PieChart width={155} height={155}>
                        <Pie data={sentimentData} cx={72} cy={72} innerRadius={42} outerRadius={72} paddingAngle={3} dataKey="value">
                          {sentimentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                      </PieChart>
                      <div style={{ flex: 1 }}>
                        {sentimentData.map((s, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{s.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 55, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                                <div style={{ width: `${s.value}%`, height: '100%', background: s.color, borderRadius: 100 }} />
                              </div>
                              <span style={{ fontSize: 12, color: s.color, fontWeight: 700, width: 32, textAlign: 'right' }}>{s.value}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Room bar chart */}
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
                    <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 4, color: 'rgba(255,255,255,0.72)' }}>Messages per Room</h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.26)', marginBottom: 22 }}>Last 24 hours</p>
                    <ResponsiveContainer width="100%" height={155}>
                      <BarChart data={roomCounts} barSize={26}>
                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.22)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar dataKey="messages" radius={[7, 7, 0, 0]}>
                          {roomCounts.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVITY */}
            {activeTab === 'activity' && (
              <div style={{ animation: 'fadeUp 0.5s ease both' }}>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 4, color: 'rgba(255,255,255,0.72)' }}>Room Breakdown — Last 24h</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.26)', marginBottom: 26 }}>Message count per support room</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {roomCounts.map((r, i) => {
                      const max = Math.max(...roomCounts.map(x => x.messages), 1);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{r.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{r.name}</span>
                              <span style={{ fontSize: 13, color: r.color, fontWeight: 700 }}>{r.messages}</span>
                            </div>
                            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min((r.messages / max) * 100, 100)}%`, height: '100%', background: r.color, borderRadius: 100 }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ALERTS */}
            {activeTab === 'alerts' && (
              <div style={{ animation: 'fadeUp 0.5s ease both' }}>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 15.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>Flagged Messages</h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>
                      {unresolved.length} unresolved · Saved permanently in database · Resolve marks as reviewed
                    </p>
                  </div>
                  {flags.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.28)' }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>No flagged messages</div>
                      <div style={{ fontSize: 13 }}>High/critical risk messages from chat will appear here automatically.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {flags.map(f => (
                        <div key={f.id} style={{ background: f.is_resolved ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.025)', border: `1px solid ${f.is_resolved ? 'rgba(255,255,255,0.05)' : (RISK_COLOR[f.risk_level] || '#818CF8') + '28'}`, borderRadius: 14, padding: '17px 22px', display: 'flex', gap: 16, alignItems: 'flex-start', opacity: f.is_resolved ? 0.4 : 1, transition: 'all 0.4s' }}>
                          <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: `${RISK_COLOR[f.risk_level] || '#818CF8'}14`, border: `1px solid ${RISK_COLOR[f.risk_level] || '#818CF8'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: RISK_COLOR[f.risk_level] || '#818CF8', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                            {(f.anon_user || '?').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 7, flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>{f.anon_user}</span>
                              <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 100, background: `${RISK_COLOR[f.risk_level] || '#818CF8'}14`, color: RISK_COLOR[f.risk_level] || '#818CF8', border: `1px solid ${RISK_COLOR[f.risk_level] || '#818CF8'}30` }}>⚠ {f.risk_level}</span>
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>{f.room_slug} · {new Date(f.created_at).toLocaleTimeString()}</span>
                            </div>
                            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{f.trigger_msg}</div>
                          </div>
                          {!f.is_resolved
                            ? <button onClick={() => resolveFlag(f.id)} style={{ flexShrink: 0, background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: 9, padding: '9px 18px', color: '#4ECDC4', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(78,205,196,0.2)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(78,205,196,0.1)'}>
                              Resolve
                            </button>
                            : <span style={{ fontSize: 12, color: '#4ECDC4', flexShrink: 0, marginTop: 8, fontWeight: 600 }}>✓ Resolved</span>
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}