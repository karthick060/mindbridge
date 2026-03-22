// ─── Resources Page — UPGRADED with Interactive Breathing Exercise ───────────
// HOW TO USE: Replace your entire frontend/src/pages/ResourcesPage.jsx with this file
// Box breathing is now animated and guided — users can actually do it live
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';

const HELPLINES = [
  { name:'iCall',                  phone:'9152987821',    country:'India', tag:'Free',   desc:'Free, professional and confidential counselling helpline run by TISS Mumbai.' },
  { name:'Vandrevala Foundation',  phone:'1860-2662-345', country:'India', tag:'24/7',   desc:'24/7 multilingual mental health helpline with trained counselors.' },
  { name:'NIMHANS',                phone:'080-46110007',  country:'India', tag:'Govt',   desc:'National Institute of Mental Health helpline for professional crisis support.' },
  { name:'Snehi',                  phone:'044-24640050',  country:'India', tag:'Crisis', desc:'Emotional support and suicide prevention helpline based in Chennai.' },
  { name:'iCall WhatsApp',         phone:'+919152987821', country:'India', tag:'Chat',   desc:'WhatsApp-based support — message if you prefer not to speak on a call.' },
  { name:'Fortis Stress Helpline', phone:'8376804102',    country:'India', tag:'Stress', desc:'Dedicated mental health helpline by Fortis Healthcare.' },
];

// ── Box Breathing component — fully animated and guided ──────────────────────
const PHASES = [
  { label:'Breathe In',  duration:4, color:'#818CF8', scale:1.5, instruction:'Slowly breathe in through your nose...' },
  { label:'Hold',        duration:4, color:'#4ECDC4', scale:1.5, instruction:'Hold gently. You are safe.' },
  { label:'Breathe Out', duration:4, color:'#A78BFA', scale:0.8, instruction:'Slowly breathe out through your mouth...' },
  { label:'Hold',        duration:4, color:'#6EE7B7', scale:0.8, instruction:'Hold. Feel the stillness.' },
];

function BoxBreathing() {
  const [running,     setRunning]     = useState(false);
  const [phaseIndex,  setPhaseIndex]  = useState(0);
  const [countdown,   setCountdown]   = useState(4);
  const [cycles,      setCycles]      = useState(0);
  const [circleScale, setCircleScale] = useState(1);
  const timerRef = useRef(null);

  const phase = PHASES[phaseIndex];

  useEffect(() => {
    if (!running) return;
    setCircleScale(phase.scale);
    setCountdown(phase.duration);
    let count = phase.duration;
    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timerRef.current);
        setPhaseIndex(prev => {
          const next = (prev + 1) % PHASES.length;
          if (next === 0) setCycles(c => c + 1);
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phaseIndex]);

  const stop = () => {
    setRunning(false);
    clearInterval(timerRef.current);
    setPhaseIndex(0);
    setCountdown(4);
    setCircleScale(1);
  };

  return (
    <div style={{ background:'rgba(129,140,248,0.05)', border:'1px solid rgba(129,140,248,0.18)', borderRadius:24, padding:'36px 32px', marginBottom:48 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>🌬️ Box Breathing — Live Exercise</h2>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>
            A proven technique used by Navy SEALs and therapists to calm anxiety in minutes.
            Press Start and follow the circle.
          </p>
        </div>
        {cycles > 0 && (
          <div style={{ background:'rgba(78,205,196,0.1)', border:'1px solid rgba(78,205,196,0.25)', borderRadius:12, padding:'8px 16px', textAlign:'center', flexShrink:0, marginLeft:20 }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#4ECDC4' }}>{cycles}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>cycle{cycles!==1?'s':''} done</div>
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:48, alignItems:'center', flexWrap:'wrap' }}>
        {/* Animated circle */}
        <div style={{ position:'relative', width:200, height:200, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {/* Outer ring */}
          <div style={{
            position:'absolute', width:200, height:200, borderRadius:'50%',
            border:'1px solid rgba(255,255,255,0.08)',
          }} />
          {/* Animated circle */}
          <div style={{
            width:90, height:90, borderRadius:'50%',
            background: running ? `${phase.color}22` : 'rgba(255,255,255,0.04)',
            border: `2px solid ${running ? phase.color : 'rgba(255,255,255,0.12)'}`,
            transform: `scale(${running ? circleScale : 1})`,
            transition: `transform ${running ? phase.duration : 0.5}s ease-in-out, background 0.5s, border-color 0.5s`,
            display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column',
            boxShadow: running ? `0 0 40px ${phase.color}30` : 'none',
          }}>
            <div style={{ fontSize:28, fontWeight:800, color: running ? phase.color : 'rgba(255,255,255,0.3)', lineHeight:1 }}>
              {running ? countdown : '·'}
            </div>
          </div>
          {/* Phase label below circle */}
          <div style={{ position:'absolute', bottom:-8, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', fontSize:13, fontWeight:600, color: running ? phase.color : 'rgba(255,255,255,0.25)', transition:'color 0.5s' }}>
            {running ? phase.label : 'Ready'}
          </div>
        </div>

        {/* Right side */}
        <div style={{ flex:1, minWidth:220 }}>
          {/* Current instruction */}
          <div style={{ fontSize:16, color:'rgba(255,255,255,0.72)', marginBottom:24, minHeight:28, lineHeight:1.6, fontStyle:'italic' }}>
            {running ? phase.instruction : 'Take a moment for yourself. This exercise takes less than 2 minutes.'}
          </div>

          {/* Phase indicators */}
          <div style={{ display:'flex', gap:8, marginBottom:28 }}>
            {PHASES.map((p, i) => (
              <div key={i} style={{ flex:1, height:4, borderRadius:100, background: running && phaseIndex === i ? p.color : 'rgba(255,255,255,0.08)', transition:'background 0.4s' }} />
            ))}
          </div>

          {/* Buttons */}
          {!running ? (
            <button onClick={() => setRunning(true)} style={{
              background:'linear-gradient(135deg, #818CF8, #6366F1)', border:'none', borderRadius:14,
              padding:'14px 32px', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer',
              fontFamily:"'DM Sans', sans-serif", boxShadow:'0 0 32px rgba(129,140,248,0.3)', transition:'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            >
              Start Breathing Exercise
            </button>
          ) : (
            <button onClick={stop} style={{
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14,
              padding:'12px 28px', color:'rgba(255,255,255,0.55)', fontSize:14, cursor:'pointer',
              fontFamily:"'DM Sans', sans-serif", transition:'all 0.2s',
            }}>
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Grounding technique component ─────────────────────────────────────────────
function GroundingExercise() {
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);
  const steps = [
    { count:'5', sense:'SEE',   prompt:'Look around. Name 5 things you can see right now.',   color:'#4ECDC4' },
    { count:'4', sense:'TOUCH', prompt:'Feel 4 things. Notice their texture, temperature.',    color:'#818CF8' },
    { count:'3', sense:'HEAR',  prompt:'Listen. What are 3 sounds you can hear?',              color:'#A78BFA' },
    { count:'2', sense:'SMELL', prompt:'Take a breath. Name 2 things you can smell.',          color:'#6EE7B7' },
    { count:'1', sense:'TASTE', prompt:'One thing you can taste, even just your mouth.',       color:'#FCA5A5' },
  ];

  return (
    <div style={{ background:'rgba(78,205,196,0.05)', border:'1px solid rgba(78,205,196,0.18)', borderRadius:24, padding:'32px', marginBottom:48 }}>
      <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>🖐️ 5-4-3-2-1 Grounding</h2>
      <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:28, lineHeight:1.6 }}>
        Ground yourself back to the present moment. Especially helpful during panic or dissociation.
      </p>
      {!active ? (
        <button onClick={() => { setActive(true); setStep(0); }} style={{
          background:'rgba(78,205,196,0.1)', border:'1px solid rgba(78,205,196,0.3)', borderRadius:14,
          padding:'13px 28px', color:'#4ECDC4', fontSize:14, fontWeight:700, cursor:'pointer',
          fontFamily:"'DM Sans', sans-serif", transition:'all 0.2s',
        }}>
          Start Grounding Exercise
        </button>
      ) : (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:24 }}>
            {steps.map((s,i) => (
              <div key={i} style={{ flex:1, height:4, borderRadius:100, background: i <= step ? s.color : 'rgba(255,255,255,0.08)', transition:'background 0.4s' }} />
            ))}
          </div>
          <div style={{ background:`${steps[step].color}10`, border:`1px solid ${steps[step].color}28`, borderRadius:16, padding:'24px', marginBottom:20, animation:'fadeIn 0.4s ease' }}>
            <div style={{ fontSize:48, fontWeight:800, color:steps[step].color, marginBottom:4, letterSpacing:'-2px' }}>{steps[step].count}</div>
            <div style={{ fontSize:18, fontWeight:700, color:steps[step].color, marginBottom:10 }}>things you can {steps[step].sense}</div>
            <div style={{ fontSize:15, color:'rgba(255,255,255,0.6)', lineHeight:1.7 }}>{steps[step].prompt}</div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} style={{
                background:`linear-gradient(135deg, ${steps[step].color}44, ${steps[step].color}22)`,
                border:`1px solid ${steps[step].color}40`, borderRadius:12, padding:'11px 24px',
                color:steps[step].color, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif",
              }}>
                Next →
              </button>
            ) : (
              <button onClick={() => setActive(false)} style={{
                background:'rgba(78,205,196,0.12)', border:'1px solid rgba(78,205,196,0.3)', borderRadius:12,
                padding:'11px 24px', color:'#4ECDC4', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif",
              }}>
                ✓ Done — Well done!
              </button>
            )}
            <button onClick={() => setActive(false)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'11px 20px', color:'rgba(255,255,255,0.35)', fontSize:13, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
              Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#080812', color:'#fff', fontFamily:"'DM Sans', sans-serif", paddingTop:66 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>
      <div style={{ maxWidth:1020, margin:'0 auto', padding:'60px 40px 100px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:52, animation:'fadeUp 0.7s ease both' }}>
          <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:48, marginBottom:14, letterSpacing:'-1.5px' }}>
            Mental Health Resources
          </h1>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:16, maxWidth:520, margin:'0 auto', lineHeight:1.72 }}>
            Real tools. Real helplines. This page exists because you deserve more than just a chat room.
          </p>
        </div>

        {/* Emergency banner */}
        <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:18, padding:'22px 28px', marginBottom:48, display:'flex', gap:18, alignItems:'flex-start', animation:'fadeUp 0.7s 0.1s ease both' }}>
          <span style={{ fontSize:36, flexShrink:0 }}>🆘</span>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:'#FCA5A5', marginBottom:7 }}>In a Crisis Right Now?</div>
            <div style={{ fontSize:14.5, color:'rgba(255,255,255,0.55)', lineHeight:1.72 }}>
              If you or someone you know is in <strong style={{ color:'#FCA5A5' }}>immediate danger</strong>, call emergency services.
              In India: <strong style={{ color:'#FCA5A5', fontFamily:"'JetBrains Mono', monospace" }}>112</strong>
            </div>
          </div>
        </div>

        {/* Live breathing exercise */}
        <div style={{ animation:'fadeUp 0.7s 0.15s ease both' }}>
          <BoxBreathing />
        </div>

        {/* Grounding exercise */}
        <div style={{ animation:'fadeUp 0.7s 0.2s ease both' }}>
          <GroundingExercise />
        </div>

        {/* Helplines */}
        <section style={{ marginBottom:52, animation:'fadeUp 0.7s 0.25s ease both' }}>
          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>📞 Helplines & Crisis Support</h2>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.35)', marginBottom:26, lineHeight:1.6 }}>
            These are real Indian mental health helplines — free, confidential, staffed by trained counselors.
            Tap the number to call directly.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            {HELPLINES.map((h, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:28, transition:'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.042)'; e.currentTarget.style.transform='translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.025)'; e.currentTarget.style.transform='translateY(0)'; }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:10, color:'#4ECDC4', fontWeight:700, textTransform:'uppercase', letterSpacing:1.5 }}>{h.country}</span>
                  <span style={{ fontSize:10, padding:'2px 9px', borderRadius:100, background:'rgba(78,205,196,0.1)', color:'#4ECDC4', border:'1px solid rgba(78,205,196,0.25)' }}>{h.tag}</span>
                </div>
                <h3 style={{ fontSize:17, fontWeight:700, marginBottom:9 }}>{h.name}</h3>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13.5, marginBottom:18, lineHeight:1.65 }}>{h.desc}</p>
                <a href={`tel:${h.phone.replace(/\D/g,'')}`} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(78,205,196,0.09)', border:'1px solid rgba(78,205,196,0.25)', borderRadius:11, padding:'11px 20px', color:'#4ECDC4', textDecoration:'none', fontSize:14.5, fontWeight:700, fontFamily:"'JetBrains Mono', monospace", transition:'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(78,205,196,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(78,205,196,0.09)'}
                >📞 {h.phone}</a>
              </div>
            ))}
          </div>
        </section>

        {/* Facts */}
        <section style={{ animation:'fadeUp 0.7s 0.3s ease both' }}>
          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:26 }}>📖 Good to Know</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
            {[
              { icon:'🧠', stat:'1 in 5',  desc:'adults experience a mental health condition in any given year.' },
              { icon:'💬', stat:'80%',      desc:'of people with depression respond positively to treatment.' },
              { icon:'🌱', stat:'50%',      desc:'of all mental health conditions begin by age 14 — early support matters.' },
            ].map((f,i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:28, textAlign:'center' }}>
                <div style={{ fontSize:34, marginBottom:12 }}>{f.icon}</div>
                <div style={{ fontSize:30, fontWeight:800, color:'#818CF8', marginBottom:8, letterSpacing:'-1px' }}>{f.stat}</div>
                <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.42)', lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}