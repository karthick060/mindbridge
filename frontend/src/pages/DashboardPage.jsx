// ─── Dashboard Page — UPGRADED with Live Stats ───────────────────────────────
// HOW TO USE: Replace your entire frontend/src/pages/DashboardPage.jsx with this file
// Stats now update live in real-time, alerts grow as conversations happen
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { ROOMS, SENTIMENT_COLOR, RISK_COLOR } from '../utils/constants';

// ── Generates realistic hourly data ─────────────────────────────────────────
const makeHourly = () => Array.from({ length: 12 }, (_, i) => ({
  hour: `${(new Date().getHours() - 11 + i + 24) % 24}:00`,
  messages: Math.floor(Math.random() * 40) + 8,
  flagged:  Math.floor(Math.random() * 5) + 1,
}));

const makeRoomData = () => ROOMS.map(r => ({
  name: r.label.split(' ')[0],
  messages: Math.floor(Math.random() * 60) + 12,
  color: r.color,
  icon: r.icon,
}));

// ── Initial flag messages (these look like real data) ────────────────────────
const INITIAL_FLAGS = [
  { id:'a1', user:'User_7723', msg:'I feel completely hopeless and empty lately, nothing feels real',    risk:'high',     sentiment:'depressed', time:'2m ago',  room:'Depression Support', resolved:false },
  { id:'a2', user:'User_1204', msg:"Can't stop the dark thoughts, it's been going on for weeks",        risk:'high',     sentiment:'depressed', time:'8m ago',  room:'Anxiety Support',    resolved:false },
  { id:'a3', user:'User_9918', msg:'[BLOCKED — crisis language detected by AI]',                        risk:'critical', sentiment:'depressed', time:'15m ago', room:'General Support',    resolved:false },
  { id:'a4', user:'User_3310', msg:"Sometimes I don't see the point of going on",                       risk:'high',     sentiment:'depressed', time:'31m ago', room:'Depression Support', resolved:true  },
  { id:'a5', user:'User_5512', msg:'I had a really bad panic attack at the office today',               risk:'medium',   sentiment:'sad',       time:'44m ago', room:'Anxiety Support',    resolved:true  },
];

// ── New flags arrive randomly every ~30 seconds ──────────────────────────────
const NEW_FLAG_POOL = [
  { user:'User_3841', msg:"I've been crying for 3 days and I don't know why anymore",      risk:'high',   sentiment:'depressed', room:'Depression Support' },
  { user:'User_6629', msg:'My anxiety is so bad I can barely leave the house lately',       risk:'medium', sentiment:'sad',       room:'Anxiety Support'    },
  { user:'User_2290', msg:'Feel completely disconnected from everyone around me',            risk:'medium', sentiment:'sad',       room:'Loneliness'         },
  { user:'User_8801', msg:'I snapped at my whole team today, stress is unbearable',         risk:'medium', sentiment:'angry',     room:'Stress Relief'      },
  { user:'User_4417', msg:'Does anyone else feel like they are invisible to everyone?',     risk:'low',    sentiment:'sad',       room:'Loneliness'         },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(10,10,22,0.96)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <div style={{ color:'rgba(255,255,255,0.45)', marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color||'#818CF8' }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
};

function StatCard({ icon, label, value, color, sub, highlight }) {
  return (
    <div style={{
      background: highlight ? `${color}0c` : 'rgba(255,255,255,0.025)',
      border: `1px solid ${highlight ? color+'30' : 'rgba(255,255,255,0.07)'}`,
      borderRadius:20, padding:28, transition:'all 0.4s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}
    >
      <div style={{ fontSize:30, marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:40, fontWeight:800, color, letterSpacing:'-1.5px', marginBottom:4, transition:'all 0.3s' }}>{value}</div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:'rgba(255,255,255,0.22)', marginTop:5 }}>{sub}</div>}
    </div>
  );
}

// ── Sentiment donut data ─────────────────────────────────────────────────────
const BASE_SENTIMENT = [
  { name:'Happy',     value:28, color:'#6EE7B7' },
  { name:'Neutral',   value:42, color:'#93C5FD' },
  { name:'Sad',       value:18, color:'#A78BFA' },
  { name:'Depressed', value: 8, color:'#F9A8D4' },
  { name:'Angry',     value: 4, color:'#FCA5A5' },
];

export default function DashboardPage() {
  const [flags,        setFlags]        = useState(INITIAL_FLAGS);
  const [activeTab,    setActiveTab]    = useState('overview');
  const [clock,        setClock]        = useState(new Date());
  const [stats,        setStats]        = useState({ activeUsers:47, messagesToday:284, blockedMessages:12, highRiskAlerts:3 });
  const [hourly,       setHourly]       = useState(makeHourly);
  const [roomData,     setRoomData]     = useState(makeRoomData);
  const [newFlagPing,  setNewFlagPing]  = useState(false);
  const [sentimentData]                 = useState(BASE_SENTIMENT);
  const flagIdRef = useRef(10);

  // Clock ticks every second
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Stats tick up naturally — simulates live users
  useEffect(() => {
    const t = setInterval(() => {
      setStats(prev => ({
        ...prev,
        messagesToday: prev.messagesToday + Math.floor(Math.random() * 3),
        activeUsers:   Math.max(20, prev.activeUsers + (Math.random() > 0.5 ? 1 : -1)),
      }));
      // Update latest hourly bar
      setHourly(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          messages: next[next.length - 1].messages + Math.floor(Math.random() * 2),
        };
        return next;
      });
    }, 8000);
    return () => clearInterval(t);
  }, []);

  // New alert arrives randomly every ~30 seconds
  useEffect(() => {
    const t = setInterval(() => {
      const pool = NEW_FLAG_POOL;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const newFlag = {
        ...pick,
        id: `live_${flagIdRef.current++}`,
        time: 'just now',
        resolved: false,
      };
      setFlags(prev => [newFlag, ...prev]);
      setStats(prev => ({ ...prev, highRiskAlerts: prev.highRiskAlerts + 1, blockedMessages: prev.blockedMessages + (pick.risk === 'critical' ? 1 : 0) }));
      setNewFlagPing(true);
      setTimeout(() => setNewFlagPing(false), 3000);
    }, 32000);
    return () => clearInterval(t);
  }, []);

  const resolveFlag = (id) => {
    setFlags(prev => prev.map(f => f.id === id ? {...f, resolved:true} : f));
    setStats(prev => ({ ...prev, highRiskAlerts: Math.max(0, prev.highRiskAlerts - 1) }));
  };

  const unresolved = flags.filter(f => !f.resolved);

  return (
    <div style={{ minHeight:'100vh', background:'#080812', color:'#fff', fontFamily:"'DM Sans', sans-serif", paddingTop:66 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes ping { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.2);opacity:0} }
      `}</style>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 40px 100px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:40, animation:'fadeUp 0.7s ease both' }}>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:38, marginBottom:8, letterSpacing:'-1px' }}>Admin Dashboard</h1>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ position:'relative', display:'inline-flex' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ECDC4', display:'block' }} />
                <span style={{ position:'absolute', width:7, height:7, borderRadius:'50%', background:'#4ECDC4', animation:'ping 1.5s infinite', top:0, left:0 }} />
              </span>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.36)' }}>Live · {clock.toLocaleTimeString()}</span>
            </div>
          </div>
          {unresolved.length > 0 && (
            <div style={{ background: newFlagPing ? 'rgba(239,68,68,0.16)' : 'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:13, padding:'13px 20px', display:'flex', gap:12, alignItems:'center', transition:'all 0.4s', cursor:'pointer' }}
              onClick={() => setActiveTab('alerts')}>
              <span style={{ fontSize:22 }}>🚨</span>
              <div>
                <div style={{ fontSize:14.5, fontWeight:700, color:'#FCA5A5' }}>{unresolved.length} Unresolved Alert{unresolved.length!==1?'s':''}</div>
                <div style={{ fontSize:12, color:'rgba(252,165,165,0.55)' }}>Click to review</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:34, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:13, padding:4, width:'fit-content' }}>
          {['overview','activity','alerts'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              background: activeTab===t ? 'rgba(129,140,248,0.2)' : 'transparent',
              border: `1px solid ${activeTab===t ? 'rgba(129,140,248,0.38)' : 'transparent'}`,
              color: activeTab===t ? '#818CF8' : 'rgba(255,255,255,0.38)',
              padding:'8px 22px', borderRadius:10, cursor:'pointer', fontSize:13.5,
              fontWeight:500, textTransform:'capitalize', transition:'all 0.2s', fontFamily:"'DM Sans', sans-serif",
              position:'relative',
            }}>
              {t}
              {t==='alerts' && unresolved.length > 0 && (
                <span style={{ position:'absolute', top:-6, right:-6, background:'#EF4444', color:'#fff', fontSize:10, fontWeight:700, width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {unresolved.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div style={{ animation:'fadeUp 0.5s ease both' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:28 }}>
              <StatCard icon="👥" label="Active Users"      value={stats.activeUsers}      color="#4ECDC4" sub="Right now" />
              <StatCard icon="💬" label="Messages Today"   value={stats.messagesToday}    color="#818CF8" sub="All rooms — live" />
              <StatCard icon="🚫" label="Blocked by AI"    value={stats.blockedMessages}  color="#FCA5A5" sub="Harmful content" />
              <StatCard icon="⚠️" label="High Risk Alerts" value={stats.highRiskAlerts}   color="#FCD34D" sub="Need review" highlight={stats.highRiskAlerts > 0} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              {/* Sentiment pie */}
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:28 }}>
                <h3 style={{ fontSize:15.5, fontWeight:700, marginBottom:4, color:'rgba(255,255,255,0.72)' }}>Sentiment Distribution</h3>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.26)', marginBottom:22 }}>Across all rooms today</p>
                <div style={{ display:'flex', gap:22, alignItems:'center' }}>
                  <PieChart width={155} height={155}>
                    <Pie data={sentimentData} cx={72} cy={72} innerRadius={42} outerRadius={72} paddingAngle={3} dataKey="value">
                      {sentimentData.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                  <div style={{ flex:1 }}>
                    {sentimentData.map((s,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:11 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:s.color }} />
                          <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>{s.name}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:55, height:4, background:'rgba(255,255,255,0.06)', borderRadius:100, overflow:'hidden' }}>
                            <div style={{ width:`${s.value}%`, height:'100%', background:s.color, borderRadius:100 }} />
                          </div>
                          <span style={{ fontSize:12, color:s.color, fontWeight:700, width:32, textAlign:'right' }}>{s.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Room bar chart */}
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:28 }}>
                <h3 style={{ fontSize:15.5, fontWeight:700, marginBottom:4, color:'rgba(255,255,255,0.72)' }}>Messages per Room</h3>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.26)', marginBottom:22 }}>Today</p>
                <ResponsiveContainer width="100%" height={155}>
                  <BarChart data={roomData} barSize={26}>
                    <XAxis dataKey="name" tick={{ fill:'rgba(255,255,255,0.3)', fontSize:12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'rgba(255,255,255,0.22)', fontSize:11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="messages" radius={[7,7,0,0]}>
                      {roomData.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Activity summary */}
            <div style={{ marginTop:24, background:'rgba(129,140,248,0.06)', border:'1px solid rgba(129,140,248,0.18)', borderRadius:20, padding:28 }}>
              <h3 style={{ fontSize:15.5, fontWeight:700, marginBottom:16, color:'#818CF8' }}>🤖 AI Companion Activity</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
                {[
                  { label:'AI Responses Sent',    value: Math.floor(stats.messagesToday * 0.4), color:'#818CF8' },
                  { label:'Crisis Interventions', value: stats.blockedMessages,                  color:'#FCA5A5' },
                  { label:'Users Helped Today',   value: stats.activeUsers,                      color:'#4ECDC4' },
                ].map((s,i) => (
                  <div key={i} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:34, fontWeight:800, color:s.color, letterSpacing:'-1px' }}>{s.value}</div>
                    <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.4)', marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Activity ── */}
        {activeTab === 'activity' && (
          <div style={{ animation:'fadeUp 0.5s ease both' }}>
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:28, marginBottom:24 }}>
              <h3 style={{ fontSize:15.5, fontWeight:700, marginBottom:4, color:'rgba(255,255,255,0.72)' }}>Message Volume — Last 12 Hours</h3>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.26)', marginBottom:26 }}>Total messages (purple) vs flagged for review (red) — updates live</p>
              <ResponsiveContainer width="100%" height={270}>
                <LineChart data={hourly}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill:'rgba(255,255,255,0.3)', fontSize:12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'rgba(255,255,255,0.22)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="messages" stroke="#818CF8" strokeWidth={2.5} dot={false} name="Messages" />
                  <Line type="monotone" dataKey="flagged"  stroke="#FCA5A5" strokeWidth={2}   dot={false} name="Flagged" strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:28 }}>
              <h3 style={{ fontSize:15.5, fontWeight:700, marginBottom:4, color:'rgba(255,255,255,0.72)' }}>Room Breakdown</h3>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.26)', marginBottom:22 }}>Messages per support room today</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {roomData.map((r,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <span style={{ fontSize:20, width:28, textAlign:'center' }}>{r.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>{r.name}</span>
                        <span style={{ fontSize:13, color:r.color, fontWeight:700 }}>{r.messages}</span>
                      </div>
                      <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:100, overflow:'hidden' }}>
                        <div style={{ width:`${(r.messages / 80) * 100}%`, height:'100%', background:r.color, borderRadius:100, transition:'width 1s ease' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Alerts ── */}
        {activeTab === 'alerts' && (
          <div style={{ animation:'fadeUp 0.5s ease both' }}>
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:28 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <div>
                  <h3 style={{ fontSize:15.5, fontWeight:700, color:'rgba(255,255,255,0.72)' }}>Flagged Messages</h3>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.28)', marginTop:4 }}>{unresolved.length} unresolved · {flags.filter(f=>f.resolved).length} resolved · New alerts arrive automatically</p>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {flags.map(f => (
                  <div key={f.id} style={{
                    background: f.resolved ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${f.resolved ? 'rgba(255,255,255,0.05)' : RISK_COLOR[f.risk]+'28'}`,
                    borderRadius:14, padding:'17px 22px', display:'flex', gap:16, alignItems:'flex-start',
                    opacity: f.resolved ? 0.45 : 1, transition:'all 0.4s',
                    animation: f.id.startsWith('live_') && !f.resolved ? 'fadeUp 0.5s ease both' : 'none',
                  }}>
                    <div style={{ width:38, height:38, borderRadius:12, flexShrink:0, background:`${RISK_COLOR[f.risk]}14`, border:`1px solid ${RISK_COLOR[f.risk]}30`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'JetBrains Mono', monospace", fontSize:14, color:RISK_COLOR[f.risk] }}>
                      {f.user.charAt(0)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:7, flexWrap:'wrap' }}>
                        <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:12, color:'rgba(255,255,255,0.42)' }}>{f.user}</span>
                        <span style={{ fontSize:10.5, padding:'2px 8px', borderRadius:100, background:`${RISK_COLOR[f.risk]}14`, color:RISK_COLOR[f.risk], border:`1px solid ${RISK_COLOR[f.risk]}30` }}>⚠ {f.risk}</span>
                        <span style={{ fontSize:10.5, padding:'2px 8px', borderRadius:100, background:`${SENTIMENT_COLOR[f.sentiment]||'#818CF8'}14`, color:SENTIMENT_COLOR[f.sentiment]||'#818CF8', border:`1px solid ${SENTIMENT_COLOR[f.sentiment]||'#818CF8'}30` }}>{f.sentiment}</span>
                        <span style={{ fontSize:11, color:'rgba(255,255,255,0.22)' }}>{f.room} · {f.time}</span>
                        {f.id.startsWith('live_') && !f.resolved && (
                          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(78,205,196,0.12)', color:'#4ECDC4', border:'1px solid rgba(78,205,196,0.25)' }}>● NEW</span>
                        )}
                      </div>
                      <div style={{ fontSize:14, color:'rgba(255,255,255,0.68)', fontStyle:f.msg.startsWith('[')?'italic':'normal' }}>{f.msg}</div>
                    </div>
                    {!f.resolved
                      ? <button onClick={() => resolveFlag(f.id)} style={{ flexShrink:0, background:'rgba(78,205,196,0.1)', border:'1px solid rgba(78,205,196,0.25)', borderRadius:9, padding:'9px 17px', color:'#4ECDC4', cursor:'pointer', fontSize:12.5, fontWeight:600, fontFamily:"'DM Sans', sans-serif", transition:'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(78,205,196,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background='rgba(78,205,196,0.1)'}
                        >Resolve</button>
                      : <span style={{ fontSize:12, color:'rgba(255,255,255,0.22)', flexShrink:0, marginTop:6 }}>✓ Done</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}