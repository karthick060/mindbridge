// ─── Chat Page — UPGRADED with Real AI Companion ──────────────────────────
// HOW TO USE: Replace your entire frontend/src/pages/ChatPage.jsx with this file
// The AI uses the Anthropic API to give real empathetic responses
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ROOMS, SENTIMENT_COLOR, RISK_COLOR, timeAgo, simulateAnalysis } from '../utils/constants';

// ── Crisis helplines shown inside chat when someone is in distress ──────────
const CRISIS_HELPLINES = [
  { name: 'iCall (TISS)',         phone: '9152987821',    available: 'Mon–Sat, 8am–10pm' },
  { name: 'Vandrevala Foundation',phone: '1860-2662-345', available: '24/7' },
  { name: 'Snehi',                phone: '044-24640050',  available: '24/7' },
  { name: 'NIMHANS',              phone: '080-46110007',  available: 'Mon–Sat' },
];

// ── Pre-seeded messages so rooms feel alive ──────────────────────────────────
const SEED_MESSAGES = {
  anxiety: [
    { id:1, user:'CalmRiver_4821',  text:'Does anyone else feel overwhelmed by small everyday tasks sometimes?',               time:new Date(Date.now()-120000).toISOString(), sentiment:'sad',     risk_level:'low'    },
    { id:2, user:'GentleMoon_7392', text:'Yes, absolutely. Box breathing genuinely helps me — try inhaling 4s, hold 4s, exhale 4s 💙', time:new Date(Date.now()-75000).toISOString(), sentiment:'neutral', risk_level:'low' },
    { id:3, user:'QuietStar_2048',  text:"I've been having panic attacks before work every single morning this week",           time:new Date(Date.now()-30000).toISOString(), sentiment:'sad',     risk_level:'medium' },
  ],
  depression: [
    { id:1, user:'SoftLeaf_9312',   text:'Some days getting out of bed feels physically impossible. Does it ever get easier?',  time:new Date(Date.now()-300000).toISOString(), sentiment:'depressed', risk_level:'medium' },
    { id:2, user:'BraveDawn_4401',  text:'I hear you. One tiny step at a time. It genuinely does get better 🌱',                time:new Date(Date.now()-180000).toISOString(), sentiment:'neutral',   risk_level:'low'    },
  ],
  stress: [
    { id:1, user:'WarmBrook_5543',  text:'Work deadlines are crushing me this week. Anyone else feel like there are never enough hours?', time:new Date(Date.now()-240000).toISOString(), sentiment:'sad', risk_level:'medium' },
  ],
  loneliness: [],
  general: [
    { id:1, user:'ClearWave_3310',  text:'Just wanted to say — this space matters. Thank you all for being here.',              time:new Date(Date.now()-600000).toISOString(), sentiment:'happy',   risk_level:'low'    },
  ],
};

// ── Detect if a message sounds like a crisis ─────────────────────────────────
const isCrisisMessage = (text) => {
  const lower = text.toLowerCase();
  const phrases = ['kill myself','want to die','end my life','suicide','hurt myself','self harm',
    'no reason to live','end it all','cant go on','can\'t go on','give up on life','don\'t want to be here',
    'wish i was dead','want to disappear forever'];
  return phrases.some(p => lower.includes(p));
};

// ── Call Anthropic API for a real AI reply ───────────────────────────────────
const getAIResponse = async (userMessage, roomLabel, conversationHistory) => {
  const systemPrompt = `You are MindBridge AI — a warm, empathetic mental health support companion in the "${roomLabel}" room of an anonymous peer support platform.

Your role:
- Listen deeply and respond with genuine empathy
- Never diagnose or give medical advice
- Ask one thoughtful follow-up question to understand the person better
- Be warm, human, and non-judgmental
- Keep responses concise (2-4 sentences max) — this is a chat, not an essay
- If someone seems to be struggling deeply, gently acknowledge their pain and let them know professional support exists
- Never say you are an AI in a robotic way — be natural and caring
- Use simple, everyday language — not clinical terms

You are NOT a replacement for professional help. You are here to listen, support, and help people feel less alone.`;

  // eslint-disable-next-line
  const messages = [
    ...conversationHistory.slice(-6).map(m => ({
      role: m.isAI ? 'assistant' : 'user',
      content: m.text
    })),
    { role: 'user', content: userMessage }
  ];

  // Using Groq API — FREE, no credit card needed
  // Get your free key at: https://console.groq.com → API Keys → Create
  const GROQ_API_KEY = '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';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 300,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-6).map(m => ({
            role: m.isAI ? 'assistant' : 'user',
            content: m.text
          })),
          { role: 'user', content: userMessage }
        ],
      }),
    });
    const data = await response.json();
    if (data.error) {
      console.error('Groq API error:', data.error);
      return "I'm here with you. Can you tell me a little more about what you're going through?";
    }
    return data.choices?.[0]?.message?.content || "I'm here with you. Can you tell me a little more about what you're going through?";
  } catch (err) {
    console.error('Fetch error:', err);
    return "I'm here and I hear you. Would you like to share more about what's on your mind?";
  }
};

// ── Crisis card shown inside chat ─────────────────────────────────────────────
function CrisisCard() {
  return (
    <div style={{
      background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.3)',
      borderRadius:18, padding:'22px 24px', animation:'fadeUp 0.4s ease both',
      marginBottom:4,
    }}>
      <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:18 }}>
        <span style={{ fontSize:28, flexShrink:0 }}>🆘</span>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'#FCA5A5', marginBottom:5 }}>
            It sounds like you're going through something really difficult right now
          </div>
          <div style={{ fontSize:13.5, color:'rgba(252,165,165,0.75)', lineHeight:1.7 }}>
            You don't have to face this alone. Real support is just one call away — these are free, confidential, and available right now.
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {CRISIS_HELPLINES.map((h, i) => (
          <a key={i} href={`tel:${h.phone.replace(/\D/g,'')}`} style={{
            display:'block', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
            borderRadius:12, padding:'12px 16px', textDecoration:'none', transition:'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.16)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
          >
            <div style={{ fontSize:12.5, fontWeight:700, color:'#FCA5A5', marginBottom:3 }}>{h.name}</div>
            <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:13, color:'#fff', marginBottom:3 }}>{h.phone}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{h.available}</div>
          </a>
        ))}
      </div>
      <div style={{ marginTop:14, fontSize:12, color:'rgba(255,255,255,0.28)', textAlign:'center' }}>
        Emergency: <strong style={{ color:'#FCA5A5' }}>112</strong> · All calls are free and confidential
      </div>
    </div>
  );
}

// ── AI typing indicator ───────────────────────────────────────────────────────
function TypingIndicator({ roomColor }) {
  return (
    <div style={{ display:'flex', gap:11, alignItems:'flex-start', animation:'fadeUp 0.3s ease both' }}>
      <div style={{
        width:36, height:36, borderRadius:12, flexShrink:0,
        background:'rgba(129,140,248,0.12)', border:'1px solid rgba(129,140,248,0.3)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
      }}>🤖</div>
      <div>
        <div style={{ fontSize:11.5, color:'#818CF8', fontFamily:"'JetBrains Mono', monospace", marginBottom:6 }}>
          MindBridge AI
        </div>
        <div style={{
          padding:'14px 18px', background:'rgba(129,140,248,0.08)', border:'1px solid rgba(129,140,248,0.18)',
          borderRadius:'4px 16px 16px 16px', display:'flex', gap:5, alignItems:'center',
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width:7, height:7, borderRadius:'50%', background:'#818CF8',
              animation:`typingDot 1.2s ease infinite`,
              animationDelay:`${i * 0.2}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, roomColor }) {
  const isAI = msg.isAI;
  return (
    <div style={{
      display:'flex', gap:11, alignItems:'flex-start',
      flexDirection:isOwn ? 'row-reverse' : 'row',
      animation:'fadeUp 0.3s ease both',
    }}>
      <div style={{
        width:36, height:36, borderRadius:12, flexShrink:0,
        background: isAI ? 'rgba(129,140,248,0.12)' : `${roomColor}18`,
        border: `1px solid ${isAI ? 'rgba(129,140,248,0.3)' : roomColor+'38'}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'JetBrains Mono', monospace", fontSize: isAI ? 16 : 14,
        color: isAI ? '#818CF8' : roomColor, fontWeight:600,
      }}>
        {isAI ? '🤖' : (msg.user||'?').charAt(0)}
      </div>

      <div style={{ maxWidth:'68%' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6, flexDirection:isOwn?'row-reverse':'row', flexWrap:'wrap' }}>
          <span style={{ fontSize:11.5, color: isAI ? '#818CF8' : isOwn ? roomColor : 'rgba(255,255,255,0.45)', fontFamily:"'JetBrains Mono', monospace", fontWeight:500 }}>
            {isAI ? 'MindBridge AI' : msg.user}
          </span>
          <span style={{ fontSize:10.5, color:'rgba(255,255,255,0.2)' }}>{timeAgo(msg.time)}</span>
          {!isAI && msg.sentiment && (
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100,
              background:`${SENTIMENT_COLOR[msg.sentiment]||'#818CF8'}18`,
              color:SENTIMENT_COLOR[msg.sentiment]||'#818CF8',
              border:`1px solid ${SENTIMENT_COLOR[msg.sentiment]||'#818CF8'}38` }}>
              {msg.sentiment}
            </span>
          )}
          {!isAI && msg.risk_level && msg.risk_level !== 'low' && (
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100,
              background:`${RISK_COLOR[msg.risk_level]}18`, color:RISK_COLOR[msg.risk_level],
              border:`1px solid ${RISK_COLOR[msg.risk_level]}38` }}>
              ⚠ {msg.risk_level}
            </span>
          )}
        </div>
        <div style={{
          padding:'13px 17px', lineHeight:1.75, fontSize:14.5, color:'rgba(255,255,255,0.88)',
          background: isAI
            ? 'rgba(129,140,248,0.08)'
            : isOwn
            ? 'linear-gradient(135deg, rgba(129,140,248,0.22), rgba(99,102,241,0.18))'
            : 'rgba(255,255,255,0.05)',
          border: isAI
            ? '1px solid rgba(129,140,248,0.2)'
            : isOwn
            ? '1px solid rgba(129,140,248,0.28)'
            : '1px solid rgba(255,255,255,0.07)',
          borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ activeRoom, setActiveRoom, msgCounts, userId }) {
  return (
    <aside style={{ width:272, borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', background:'rgba(255,255,255,0.008)', flexShrink:0 }}>
      <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontWeight:700, textTransform:'uppercase', letterSpacing:2, marginBottom:12 }}>Support Rooms</div>
        <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(129,140,248,0.07)', border:'1px solid rgba(129,140,248,0.2)', borderRadius:10, padding:'9px 13px' }}>
          <span style={{ fontSize:14 }}>🤖</span>
          <span style={{ fontSize:12, color:'#818CF8', fontWeight:500 }}>AI Companion is active</span>
        </div>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'8px' }}>
        {ROOMS.map(r => {
          const active = activeRoom.id === r.id;
          return (
            <button key={r.id} onClick={() => setActiveRoom(r)} style={{
              width:'100%', textAlign:'left', padding:'13px 14px',
              background:active ? `${r.color}12` : 'transparent',
              border:`1px solid ${active ? r.color+'2e' : 'transparent'}`,
              borderRadius:13, cursor:'pointer', marginBottom:4, transition:'all 0.2s', fontFamily:"'DM Sans', sans-serif",
            }}
              onMouseEnter={e => { if(!active) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if(!active) e.currentTarget.style.background='transparent'; }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                <span style={{ fontSize:20 }}>{r.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:active?r.color:'rgba(255,255,255,0.65)', marginBottom:3 }}>{r.label}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>{msgCounts[r.id]||0} messages</div>
                </div>
                {active && <span style={{ width:7, height:7, borderRadius:'50%', background:r.color }} />}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ padding:'14px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'13px 14px' }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, marginBottom:7 }}>Your Identity</div>
          <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11.5, color:'rgba(255,255,255,0.52)', marginBottom:6 }}>{userId}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', lineHeight:1.5 }}>🔒 Auto-deleted when tab closes</div>
        </div>
      </div>
    </aside>
  );
}

// ── Main chat page ────────────────────────────────────────────────────────────
export default function ChatPage({ userId }) {
  const location   = useLocation();
  const initRoomId = location.state?.room || 'anxiety';
  const [activeRoom,  setActiveRoom]  = useState(ROOMS.find(r => r.id === initRoomId) || ROOMS[0]);
  const [allMessages, setAllMessages] = useState(SEED_MESSAGES);
  const [input,       setInput]       = useState('');
  const [analyzing,   setAnalyzing]   = useState(false);
  const [aiTyping,    setAiTyping]    = useState(false);
  const [showCrisis,  setShowCrisis]  = useState(false);
  const wsRef  = useRef(null);
  const endRef = useRef(null);

  const currentMsgs = allMessages[activeRoom.id] || [];
  const msgCounts   = Object.fromEntries(Object.entries(allMessages).map(([k,v])=>[k,v.length]));

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [currentMsgs.length, activeRoom.id, aiTyping]);

  // WebSocket for real users (when backend is running)
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.hostname}:8000/ws/chat/${activeRoom.id}/`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'message' && data.anon_id !== userId) {
        setAllMessages(prev => ({
          ...prev,
          [activeRoom.id]: [...(prev[activeRoom.id]||[]), {
            id: Date.now(), user: data.anon_id, text: data.message,
            time: new Date().toISOString(), sentiment: data.sentiment, risk_level: data.risk_level,
          }],
        }));
      }
    };
    return () => ws.close();
  }, [activeRoom.id, userId]);

  const addMessage = useCallback((msg) => {
    setAllMessages(prev => ({ ...prev, [activeRoom.id]: [...(prev[activeRoom.id]||[]), msg] }));
  }, [activeRoom.id]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || analyzing) return;
    const text = input.trim();
    setInput('');
    setAnalyzing(true);
    setShowCrisis(false);

    await new Promise(r => setTimeout(r, 500));
    const analysis = simulateAnalysis(text);
    setAnalyzing(false);

    // Crisis detection — show helplines AND let AI respond with care
    if (isCrisisMessage(text)) {
      setShowCrisis(true);
      // Still add the user message so they feel heard
      const userMsg = { id: Date.now(), user: userId, text, isOwn: true, time: new Date().toISOString(), sentiment: 'depressed', risk_level: 'critical' };
      addMessage(userMsg);
      // AI responds with crisis support
      setAiTyping(true);
      const aiReply = await getAIResponse(text, activeRoom.label, currentMsgs);
      setAiTyping(false);
      addMessage({ id: Date.now()+1, isAI: true, text: aiReply, time: new Date().toISOString() });
      return;
    }

    if (analysis.blocked) {
      // For toxic/non-crisis blocked messages
      addMessage({ id: Date.now(), isAI: true, time: new Date().toISOString(),
        text: "This message was flagged as it may be harmful to others in this space. This is a safe, supportive community — please be kind to yourself and others 💙" });
      return;
    }

    // Add user's message
    const userMsg = { id: Date.now(), user: userId, text, isOwn: true, time: new Date().toISOString(), sentiment: analysis.sentiment, risk_level: analysis.risk_level };
    addMessage(userMsg);

    // Send via WebSocket if backend is live
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: text, anon_id: userId }));
    }

    // AI always responds — this is the key upgrade
    setAiTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600)); // feels natural
    const aiReply = await getAIResponse(text, activeRoom.label, [...currentMsgs, userMsg]);
    setAiTyping(false);
    addMessage({ id: Date.now()+1, isAI: true, text: aiReply, time: new Date().toISOString() });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, analyzing, userId, activeRoom.id, activeRoom.label, addMessage]);

  return (
    <div style={{ height:'100vh', display:'flex', background:'#080812', color:'#fff', fontFamily:"'DM Sans', sans-serif", paddingTop:66 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes typingDot { 0%,60%,100% { transform:translateY(0); opacity:0.4; } 30% { transform:translateY(-5px); opacity:1; } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <Sidebar activeRoom={activeRoom} setActiveRoom={setActiveRoom} msgCounts={msgCounts} userId={userId} />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Room header */}
        <div style={{ padding:'15px 26px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:14, background:'rgba(255,255,255,0.008)', flexShrink:0 }}>
          <span style={{ fontSize:28 }}>{activeRoom.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17, fontWeight:700, color:activeRoom.color }}>{activeRoom.label}</div>
            <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{activeRoom.desc}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ background:'rgba(129,140,248,0.09)', border:'1px solid rgba(129,140,248,0.22)', borderRadius:9, padding:'6px 14px', fontSize:12, color:'#818CF8' }}>
              🤖 AI Companion Active
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflow:'auto', padding:'26px 28px', display:'flex', flexDirection:'column', gap:18 }}>
          {/* Welcome message when room is empty */}
          {currentMsgs.length === 0 && (
            <div style={{ textAlign:'center', marginTop:60, color:'rgba(255,255,255,0.28)' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>{activeRoom.icon}</div>
              <div style={{ fontSize:17, marginBottom:8, color:'rgba(255,255,255,0.5)' }}>You're not alone here</div>
              <div style={{ fontSize:13.5, marginBottom:20 }}>MindBridge AI is here with you. Share what's on your mind.</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(129,140,248,0.07)', border:'1px solid rgba(129,140,248,0.2)', borderRadius:12, padding:'10px 18px', fontSize:13, color:'#818CF8' }}>
                🤖 MindBridge AI is listening
              </div>
            </div>
          )}

          {currentMsgs.map(msg => (
            <MessageBubble key={msg.id} msg={msg} isOwn={msg.isOwn||msg.user===userId} roomColor={activeRoom.color} />
          ))}

          {/* Crisis helpline card */}
          {showCrisis && <CrisisCard />}

          {/* AI is typing */}
          {aiTyping && <TypingIndicator roomColor={activeRoom.color} />}

          {/* Analyzing spinner */}
          {analyzing && (
            <div style={{ display:'flex', gap:10, alignItems:'center', color:'rgba(255,255,255,0.26)', fontSize:13, paddingLeft:47 }}>
              <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid rgba(129,140,248,0.3)', borderTopColor:'#818CF8', animation:'spin 0.75s linear infinite', flexShrink:0 }} />
              Analyzing…
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input area */}
        <div style={{ padding:'17px 26px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.008)', flexShrink:0 }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Share how you're feeling in ${activeRoom.label}…`}
              rows={2}
              style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:14, padding:'14px 18px', color:'#fff', fontSize:14.5, resize:'none', outline:'none', fontFamily:"'DM Sans', sans-serif", lineHeight:1.65, transition:'border-color 0.2s', minHeight:58 }}
              onFocus={e => e.target.style.borderColor='rgba(129,140,248,0.48)'}
              onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.09)'}
            />
            <button onClick={sendMessage} disabled={!input.trim()||analyzing||aiTyping}
              style={{ background:input.trim()&&!analyzing&&!aiTyping?'linear-gradient(135deg, #818CF8, #6366F1)':'rgba(255,255,255,0.05)', border:'none', borderRadius:13, width:58, height:58, cursor:input.trim()&&!analyzing&&!aiTyping?'pointer':'not-allowed', fontSize:22, transition:'all 0.2s', flexShrink:0, color:'#fff', boxShadow:input.trim()?'0 0 32px rgba(129,140,248,0.28)':'none' }}
              onMouseEnter={e => { if(input.trim()) e.currentTarget.style.transform='scale(1.06)'; }}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            >{analyzing||aiTyping?'⏳':'↑'}</button>
          </div>
          <div style={{ marginTop:9, fontSize:11, color:'rgba(255,255,255,0.16)', textAlign:'center' }}>
            AI moderated for safety · Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}