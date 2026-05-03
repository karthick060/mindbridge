// ─── Dashboard Page — REAL TIME FRONTEND DATA ────────────────────────────────
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { ROOMS, SENTIMENT_COLOR, RISK_COLOR } from '../utils/constants';

// Initialize stats store — fills from real chat activity
if (!window.MindBridgeStats) {
  window.MindBridgeStats = {
    messages: [],
    blockedCount: 0,
    activeUsers: new Set(),
    presenceCounts: {},   // { room_slug: live_count } — updated by WebSocket presence events
    sessionStart: Date.now(),
  };
}

const SEED_USERS = [
  'CalmRiver_4821','GentleMoon_7392','QuietStar_2048',
  'SoftLeaf_9312','BraveDawn_4401','WarmBrook_5543','ClearWave_3310'
];

const getStats = () => {
  const store = window.MindBridgeStats;
  const msgs = store.messages || [];
  const realMsgs = msgs.filter(m => !SEED_USERS.includes(m.user));

  const roomCounts = ROOMS.map(r => ({
    name: r.label.split(' ')[0],
    messages: realMsgs.filter(m => m.room === r.id && !m.isAI).length,
    color: r.color,
    icon: r.icon,
  }));

  const sentimentMap = { happy: 0, neutral: 0, sad: 0, depressed: 0, angry: 0 };
  realMsgs.forEach(m => {
    if (m.sentiment && sentimentMap[m.sentiment] !== undefined) sentimentMap[m.sentiment]++;
  });
  const total = realMsgs.length || 1;
  const sentimentData = [
    { name: 'Happy',     value: Math.round((sentimentMap.happy     / total) * 100), color: '#6EE7B7' },
    { name: 'Neutral',   value: Math.round((sentimentMap.neutral   / total) * 100), color: '#93C5FD' },
    { name: 'Sad',       value: Math.round((sentimentMap.sad       / total) * 100), color: '#A78BFA' },
    { name: 'Depressed', value: Math.round((sentimentMap.depressed / total) * 100), color: '#F9A8D4' },
    { name: 'Angry',     value: Math.round((sentimentMap.angry     / total) * 100), color: '#FCA5A5' },
  ];

  const now = Date.now();
  const hourly = Array.from({ length: 12 }, (_, i) => {
    const hour = new Date(now - (11 - i) * 3600000);
    const start = hour.getTime();
    const end = start + 3600000;
    return {
      hour: `${hour.getHours()}:00`,
      messages: realMsgs.filter(m => { const t = new Date(m.time).getTime(); return t >= start && t < end && !m.isAI; }).length,
      flagged:  realMsgs.filter(m => { const t = new Date(m.time).getTime(); return t >= start && t < end && m.risk_level !== 'low'; }).length,
    };
  });

  const flagged = realMsgs
    .filter(m => ['high', 'critical', 'medium'].includes(m.risk_level) && !m.isAI)
    .slice(-20).reverse()
    .map((m, i) => ({
      id: `flag_${i}_${m.time}`,
      user: m.user || 'Anonymous',
      msg: m.text,
      risk: m.risk_level,
      sentiment: m.sentiment,
      time: new Date(m.time).toLocaleTimeString(),
      room: ROOMS.find(r => r.id === m.room)?.label || 'General Support',
      resolved: false,
    }));

  // ── Active users: use live presence counts from WebSocket ──────────────
  // Sum across all rooms, fall back to counting unique message senders
  const presenceCounts = store.presenceCounts || {};
  const presenceTotal = Object.values(presenceCounts).reduce((a, b) => a + b, 0);
  const fallbackUsers = new Set(realMsgs.filter(m => !m.isAI).map(m => m.user));
  const activeUsers = presenceTotal > 0 ? presenceTotal : fallbackUsers.size;

  return {
    totalMessages:   realMsgs.filter(m => !m.isAI).length,
    activeUsers,
    blockedMessages: store.blockedCount || 0,
    highRiskAlerts:  realMsgs.filter(m => ['high', 'critical'].includes(m.risk_level) && !m.isAI).length,
    aiResponses:     msgs.filter(m => m.isAI).length,
    crisisDetected:  realMsgs.filter(m => m.risk_level === 'critical').length,
    sessionMinutes:  Math.floor((Date.now() - store.sessionStart) / 60000),
    roomCounts, sentimentData, hourly, flagged,
  };
};

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

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 0', color: 'rgba(255,255,255,0.3)', animation: 'fadeUp 0.6s ease both' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>💬</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>No activity yet</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.28)', marginBottom: 28 }}>Go to Chat and start a conversation — live stats will appear here automatically.</div>
      <a href="/chat" style={{ display: 'inline-block', background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 12, padding: '12px 28px', color: '#818CF8', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Go to Chat →</a>
    </div>
  );
}

export default function DashboardPage() {
  const [stats,     setStats]     = useState(getStats());
  const [activeTab, setActiveTab] = useState('overview');
  const [clock,     setClock]     = useState(new Date());
  const [flags,     setFlags]     = useState([]);
  const [newAlert,  setNewAlert]  = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  // Refresh stats every 2 seconds for real-time feel
  useEffect(() => {
    const t = setInterval(() => {
      const s = getStats();
      setStats(s);
      if (s.flagged.length > prevCount) {
        setNewAlert(true);
        setPrevCount(s.flagged.length);
        setTimeout(() => setNewAlert(false), 3000);
      }
      // Preserve resolved state
      setFlags(prev => {
        const resolvedKeys = new Set(prev.filter(f => f.resolved).map(f => `${f.user}_${f.msg}`));
        return s.flagged.map(f => ({ ...f, resolved: resolvedKeys.has(`${f.user}_${f.msg}`) }));
      });
    }, 2000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevCount]);

  useEffect(() => {
    const s = getStats();
    setStats(s);
    setFlags(s.flagged);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const resolveFlag = (id) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, resolved: true } : f));
  };

  const unresolved = flags.filter(f => !f.resolved);
  const isEmpty    = stats.totalMessages === 0;

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
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.36)' }}>Live · {clock.toLocaleTimeString()} · Updates every 2s</span>
            </div>
          </div>
          {unresolved.length > 0 && (
            <div style={{ background: newAlert ? 'rgba(239,68,68,0.16)' : 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 13, padding: '13px 20px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', transition: 'all 0.4s' }} onClick={() => setActiveTab('alerts')}>
              <span style={{ fontSize: 22 }}>🚨</span>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#FCA5A5' }}>{unresolved.length} Unresolved Alert{unresolved.length !== 1 ? 's' : ''}</div>
                <div style={{ fontSize: 12, color: 'rgba(252,165,165,0.55)' }}>Click to review</div>
              </div>
            </div>
          )}
        </div>

        {isEmpty ? <EmptyState /> : (
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
            {activeTab === 'overview' && (
              <div style={{ animation: 'fadeUp 0.5s ease both' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 28 }}>
                  <StatCard icon="👥" label="Active Users"     value={stats.activeUsers}     color="#4ECDC4" sub="Live connections" />
                  <StatCard icon="💬" label="Messages Today"   value={stats.totalMessages}   color="#818CF8" sub="All rooms — live" />
                  <StatCard icon="🚫" label="Blocked by AI"    value={stats.blockedMessages} color="#FCA5A5" sub="Harmful content" />
                  <StatCard icon="⚠️" label="High Risk Alerts" value={stats.highRiskAlerts}  color="#FCD34D" sub="Need review" highlight={stats.highRiskAlerts > 0} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
                    <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 4, color: 'rgba(255,255,255,0.72)' }}>Sentiment Distribution</h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.26)', marginBottom: 22 }}>Across all rooms today</p>
                    <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
                      <PieChart width={155} height={155}>
                        <Pie data={stats.sentimentData} cx={72} cy={72} innerRadius={42} outerRadius={72} paddingAngle={3} dataKey="value">
                          {stats.sentimentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                      </PieChart>
                      <div style={{ flex: 1 }}>
                        {stats.sentimentData.map((s, i) => (
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

                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
                    <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 4, color: 'rgba(255,255,255,0.72)' }}>Messages per Room</h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.26)', marginBottom: 22 }}>Today</p>
                    <ResponsiveContainer width="100%" height={155}>
                      <BarChart data={stats.roomCounts} barSize={26}>
                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.22)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar dataKey="messages" radius={[7, 7, 0, 0]}>
                          {stats.roomCounts.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.18)', borderRadius: 20, padding: 28 }}>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 16, color: '#818CF8' }}>🤖 AI Companion Activity</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                    {[
                      { label: 'AI Responses Sent',    value: stats.aiResponses,    color: '#818CF8' },
                      { label: 'Crisis Interventions', value: stats.crisisDetected, color: '#FCA5A5' },
                      { label: 'Live Connections',      value: stats.activeUsers,    color: '#4ECDC4' },
                    ].map((s, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 34, fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVITY */}
            {activeTab === 'activity' && (
              <div style={{ animation: 'fadeUp 0.5s ease both' }}>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 4, color: 'rgba(255,255,255,0.72)' }}>Message Volume — Last 12 Hours</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.26)', marginBottom: 26 }}>Total messages (purple) vs flagged for review (red) — updates live</p>
                  <ResponsiveContainer width="100%" height={270}>
                    <LineChart data={stats.hourly}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.22)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="messages" stroke="#818CF8" strokeWidth={2.5} dot={false} name="Messages" />
                      <Line type="monotone" dataKey="flagged"  stroke="#FCA5A5" strokeWidth={2}   dot={false} name="Flagged" strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 22, color: 'rgba(255,255,255,0.72)' }}>Room Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {stats.roomCounts.map((r, i) => {
                      const max = Math.max(...stats.roomCounts.map(x => x.messages), 1);
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
                      {unresolved.length} unresolved · {flags.filter(f => f.resolved).length} resolved · New alerts arrive automatically
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', marginTop: 6 }}>
                      ℹ️ Flagged when users send medium/high/critical risk messages. Click Resolve to mark as reviewed.
                    </p>
                  </div>
                  {flags.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.28)' }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>No flagged messages</div>
                      <div style={{ fontSize: 13 }}>When users send concerning messages in chat, they'll appear here for review.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {flags.map(f => (
                        <div key={f.id} style={{ background: f.resolved ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.025)', border: `1px solid ${f.resolved ? 'rgba(255,255,255,0.05)' : (RISK_COLOR[f.risk] || '#818CF8') + '28'}`, borderRadius: 14, padding: '17px 22px', display: 'flex', gap: 16, alignItems: 'flex-start', opacity: f.resolved ? 0.4 : 1, transition: 'all 0.4s' }}>
                          <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: `${RISK_COLOR[f.risk] || '#818CF8'}14`, border: `1px solid ${RISK_COLOR[f.risk] || '#818CF8'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: RISK_COLOR[f.risk] || '#818CF8', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                            {(f.user || '?').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 7, flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>{f.user}</span>
                              <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 100, background: `${RISK_COLOR[f.risk] || '#818CF8'}14`, color: RISK_COLOR[f.risk] || '#818CF8', border: `1px solid ${RISK_COLOR[f.risk] || '#818CF8'}30` }}>⚠ {f.risk}</span>
                              {f.sentiment && <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 100, background: `${SENTIMENT_COLOR[f.sentiment] || '#818CF8'}14`, color: SENTIMENT_COLOR[f.sentiment] || '#818CF8', border: `1px solid ${SENTIMENT_COLOR[f.sentiment] || '#818CF8'}30` }}>{f.sentiment}</span>}
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>{f.room} · {f.time}</span>
                            </div>
                            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{f.msg}</div>
                          </div>
                          {!f.resolved
                            ? <button onClick={() => resolveFlag(f.id)}
                                style={{ flexShrink: 0, background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: 9, padding: '9px 18px', color: '#4ECDC4', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
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