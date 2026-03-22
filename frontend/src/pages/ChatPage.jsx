// ─── Chat Page — Fully Responsive ─────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ROOMS, SENTIMENT_COLOR, RISK_COLOR, timeAgo, simulateAnalysis } from '../utils/constants';

const CRISIS_HELPLINES = [
  { name:'iCall (TISS)',          phone:'9152987821',    available:'Mon-Sat, 8am-10pm' },
  { name:'Vandrevala Foundation', phone:'1860-2662-345', available:'24/7' },
  { name:'Snehi',                 phone:'044-24640050',  available:'24/7' },
  { name:'NIMHANS',               phone:'080-46110007',  available:'Mon-Sat' },
];

const SEED_MESSAGES = {
  anxiety: [
    { id:1, user:'CalmRiver_4821',  text:'Does anyone else feel overwhelmed by small everyday tasks sometimes?', time:new Date(Date.now()-120000).toISOString(), sentiment:'sad', risk_level:'low' },
    { id:2, user:'GentleMoon_7392', text:'Yes, absolutely. Box breathing genuinely helps me 💙', time:new Date(Date.now()-75000).toISOString(), sentiment:'neutral', risk_level:'low' },
    { id:3, user:'QuietStar_2048',  text:"I've been having panic attacks before work every single morning this week", time:new Date(Date.now()-30000).toISOString(), sentiment:'sad', risk_level:'medium' },
  ],
  depression: [
    { id:1, user:'SoftLeaf_9312',  text:'Some days getting out of bed feels physically impossible. Does it ever get easier?', time:new Date(Date.now()-300000).toISOString(), sentiment:'depressed', risk_level:'medium' },
    { id:2, user:'BraveDawn_4401', text:'I hear you. One tiny step at a time. It genuinely does get better 🌱', time:new Date(Date.now()-180000).toISOString(), sentiment:'neutral', risk_level:'low' },
  ],
  stress: [
    { id:1, user:'WarmBrook_5543', text:'Work deadlines are crushing me this week. Anyone else?', time:new Date(Date.now()-240000).toISOString(), sentiment:'sad', risk_level:'medium' },
  ],
  loneliness: [],
  general: [
    { id:1, user:'ClearWave_3310', text:'Just wanted to say this space matters. Thank you all for being here.', time:new Date(Date.now()-600000).toISOString(), sentiment:'happy', risk_level:'low' },
  ],
};

const isCrisisMessage = (text) => {
  const lower = text.toLowerCase();
  const phrases = ['kill myself','want to die','end my life','suicide','hurt myself','self harm','no reason to live','end it all'];
  return phrases.some(p => lower.includes(p));
};

const getAIResponse = async (userMessage, roomLabel, conversationHistory) => {
  const systemPrompt = `You are MindBridge AI, a warm empathetic mental health support companion in the "${roomLabel}" room. Listen deeply, respond with genuine empathy, ask one thoughtful follow-up question. Keep responses to 2-4 sentences. Be warm and human, never robotic. Never diagnose.`;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer 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` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', max_tokens: 300,
        messages: [
          { role:'system', content:systemPrompt },
          ...conversationHistory.slice(-6).map(m => ({ role:m.isAI?'assistant':'user', content:m.text })),
          { role:'user', content:userMessage }
        ],
      }),
    });
    const data = await response.json();
    if (data.error) return "I'm here with you. Can you tell me more about what you're going through?";
    return data.choices?.[0]?.message?.content || "I'm here with you. Can you tell me more?";
  } catch {
    return "I'm here and I hear you. Would you like to share more?";
  }
};

function CrisisCard() {
  return (
    <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:18, padding:'20px', animation:'fadeUp 0.4s ease both', marginBottom:4 }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:16 }}>
        <span style={{ fontSize:24, flexShrink:0 }}>🆘</span>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#FCA5A5', marginBottom:4 }}>You are not alone in this</div>
          <div style={{ fontSize:13, color:'rgba(252,165,165,0.75)', lineHeight:1.6 }}>Real support is just one call away. Free, confidential, available now.</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {CRISIS_HELPLINES.map((h, i) => (
          <a key={i} href={`tel:${h.phone.replace(/\D/g,'')}`} style={{ display:'block', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'10px 12px', textDecoration:'none' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#FCA5A5', marginBottom:2 }}>{h.name}</div>
            <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:12, color:'#fff', marginBottom:2 }}>{h.phone}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{h.available}</div>
          </a>
        ))}
      </div>
      <div style={{ marginTop:12, fontSize:11, color:'rgba(255,255,255,0.28)', textAlign:'center' }}>Emergency: <strong style={{ color:'#FCA5A5' }}>112</strong></div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start', animation:'fadeUp 0.3s ease both' }}>
      <div style={{ width:32, height:32, borderRadius:10, flexShrink:0, background:'rgba(129,140,248,0.12)', border:'1px solid rgba(129,140,248,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🤖</div>
      <div>
        <div style={{ fontSize:11, color:'#818CF8', fontFamily:"'JetBrains Mono', monospace", marginBottom:5 }}>MindBridge AI</div>
        <div style={{ padding:'12px 16px', background:'rgba(129,140,248,0.08)', border:'1px solid rgba(129,140,248,0.18)', borderRadius:'4px 14px 14px 14px', display:'flex', gap:4, alignItems:'center' }}>
          {[0,1,2].map(i => (<div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#818CF8', animation:'typingDot 1.2s ease infinite', animationDelay:`${i*0.2}s` }} />))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, isOwn, roomColor }) {
  const isAI = msg.isAI;
  return (
    <div style={{ display:'flex', gap:9, alignItems:'flex-start', flexDirection:isOwn?'row-reverse':'row', animation:'fadeUp 0.3s ease both' }}>
      <div style={{ width:32, height:32, borderRadius:10, flexShrink:0, background:isAI?'rgba(129,140,248,0.12)':`${roomColor}18`, border:`1px solid ${isAI?'rgba(129,140,248,0.3)':roomColor+'38'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:isAI?13:12, color:isAI?'#818CF8':roomColor, fontWeight:600 }}>
        {isAI ? '🤖' : (msg.user||'?').charAt(0)}
      </div>
      <div style={{ maxWidth:'74%' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5, flexDirection:isOwn?'row-reverse':'row', flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:isAI?'#818CF8':isOwn?roomColor:'rgba(255,255,255,0.45)', fontFamily:"'JetBrains Mono', monospace", fontWeight:500 }}>{isAI?'MindBridge AI':msg.user}</span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>{timeAgo(msg.time)}</span>
          {!isAI && msg.sentiment && (<span style={{ fontSize:9, padding:'2px 6px', borderRadius:100, background:`${SENTIMENT_COLOR[msg.sentiment]||'#818CF8'}18`, color:SENTIMENT_COLOR[msg.sentiment]||'#818CF8', border:`1px solid ${SENTIMENT_COLOR[msg.sentiment]||'#818CF8'}38` }}>{msg.sentiment}</span>)}
          {!isAI && msg.risk_level && msg.risk_level !== 'low' && (<span style={{ fontSize:9, padding:'2px 6px', borderRadius:100, background:`${RISK_COLOR[msg.risk_level]}18`, color:RISK_COLOR[msg.risk_level], border:`1px solid ${RISK_COLOR[msg.risk_level]}38` }}>⚠ {msg.risk_level}</span>)}
        </div>
        <div style={{ padding:'11px 14px', lineHeight:1.7, fontSize:14, color:'rgba(255,255,255,0.88)', background:isAI?'rgba(129,140,248,0.08)':isOwn?'linear-gradient(135deg, rgba(129,140,248,0.22), rgba(99,102,241,0.18))':'rgba(255,255,255,0.05)', border:isAI?'1px solid rgba(129,140,248,0.2)':isOwn?'1px solid rgba(129,140,248,0.28)':'1px solid rgba(255,255,255,0.07)', borderRadius:isOwn?'14px 4px 14px 14px':'4px 14px 14px 14px' }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage({ userId }) {
  const location    = useLocation();
  const initRoomId  = location.state?.room || 'anxiety';
  const [activeRoom,  setActiveRoom]  = useState(ROOMS.find(r => r.id === initRoomId) || ROOMS[0]);
  const [allMessages, setAllMessages] = useState(SEED_MESSAGES);
  const [input,       setInput]       = useState('');
  const [analyzing,   setAnalyzing]   = useState(false);
  const [aiTyping,    setAiTyping]    = useState(false);
  const [showCrisis,  setShowCrisis]  = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const wsRef  = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const currentMsgs = allMessages[activeRoom.id] || [];
  const msgCounts   = Object.fromEntries(Object.entries(allMessages).map(([k,v])=>[k,v.length]));

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [currentMsgs.length, activeRoom.id, aiTyping]);

  useEffect(() => {
    const ws = new WebSocket(`wss://web-production-14b98.up.railway.app/ws/chat/${activeRoom.id}/`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'message' && data.anon_id !== userId) {
        setAllMessages(prev => ({ ...prev, [activeRoom.id]: [...(prev[activeRoom.id]||[]), { id:Date.now(), user:data.anon_id, text:data.message, time:new Date().toISOString(), sentiment:data.sentiment, risk_level:data.risk_level }] }));
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

    if (isCrisisMessage(text)) {
      setShowCrisis(true);
      const userMsg = { id:Date.now(), user:userId, text, isOwn:true, time:new Date().toISOString(), sentiment:'depressed', risk_level:'critical' };
      addMessage(userMsg);
      setAiTyping(true);
      const aiReply = await getAIResponse(text, activeRoom.label, currentMsgs);
      setAiTyping(false);
      addMessage({ id:Date.now()+1, isAI:true, text:aiReply, time:new Date().toISOString() });
      return;
    }

    if (analysis.blocked) {
      addMessage({ id:Date.now(), isAI:true, time:new Date().toISOString(), text:"This message was flagged. Please keep this space kind and supportive 💙" });
      return;
    }

    const userMsg = { id:Date.now(), user:userId, text, isOwn:true, time:new Date().toISOString(), sentiment:analysis.sentiment, risk_level:analysis.risk_level };
    addMessage(userMsg);
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ message:text, anon_id:userId }));

    const SEED_USERS = ['CalmRiver_4821','GentleMoon_7392','QuietStar_2048','SoftLeaf_9312','BraveDawn_4401','WarmBrook_5543','ClearWave_3310'];
const othersInRoom = currentMsgs.some(m => !m.isOwn && !m.isAI && !SEED_USERS.includes(m.user));
    if (othersInRoom) return;
    setAiTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random()*600));
    const aiReply = await getAIResponse(text, activeRoom.label, [...currentMsgs, userMsg]);
    setAiTyping(false);
    addMessage({ id:Date.now()+1, isAI:true, text:aiReply, time:new Date().toISOString() });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, analyzing, userId, activeRoom.id, activeRoom.label, addMessage]);

  const SidebarContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontWeight:700, textTransform:'uppercase', letterSpacing:2, marginBottom:10 }}>Support Rooms</div>
        <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(129,140,248,0.07)', border:'1px solid rgba(129,140,248,0.2)', borderRadius:10, padding:'8px 12px' }}>
          <span style={{ fontSize:13 }}>🤖</span>
          <span style={{ fontSize:12, color:'#818CF8', fontWeight:500 }}>AI Companion active</span>
        </div>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'8px' }}>
        {ROOMS.map(r => {
          const active = activeRoom.id === r.id;
          return (
            <button key={r.id} onClick={() => { setActiveRoom(r); setShowSidebar(false); }} style={{ width:'100%', textAlign:'left', padding:'12px 13px', background:active?`${r.color}12`:'transparent', border:`1px solid ${active?r.color+'2e':'transparent'}`, borderRadius:12, cursor:'pointer', marginBottom:3, transition:'all 0.2s', fontFamily:"'DM Sans', sans-serif" }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18 }}>{r.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:active?r.color:'rgba(255,255,255,0.65)', marginBottom:2 }}>{r.label}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>{msgCounts[r.id]||0} messages</div>
                </div>
                {active && <span style={{ width:6, height:6, borderRadius:'50%', background:r.color, flexShrink:0 }} />}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ padding:'12px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'11px 12px' }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, marginBottom:5 }}>Your Identity</div>
          <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10.5, color:'rgba(255,255,255,0.52)', marginBottom:5, wordBreak:'break-all' }}>{userId}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>🔒 Auto-deleted when tab closes</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#080812', color:'#fff', fontFamily:"'DM Sans', sans-serif", paddingTop:66 }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-5px);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }
      `}</style>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Mobile sidebar overlay */}
        {isMobile && showSidebar && (
          <div style={{ position:'fixed', inset:0, zIndex:150, display:'flex' }} onClick={() => setShowSidebar(false)}>
            <div style={{ width:'80%', maxWidth:300, background:'#080812', borderRight:'1px solid rgba(255,255,255,0.08)', height:'100%', animation:'slideIn 0.25s ease', paddingTop:66 }} onClick={e => e.stopPropagation()}>
              <SidebarContent />
            </div>
            <div style={{ flex:1, background:'rgba(0,0,0,0.5)' }} />
          </div>
        )}

        {/* Desktop sidebar */}
        {!isMobile && (
          <aside style={{ width:260, borderRight:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
            <SidebarContent />
          </aside>
        )}

        {/* Main chat */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          {/* Header */}
          <div style={{ padding:isMobile?'12px 16px':'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.008)', flexShrink:0 }}>
            {isMobile && (
              <button onClick={() => setShowSidebar(true)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'6px 10px', color:'#fff', cursor:'pointer', fontSize:16, flexShrink:0 }}>☰</button>
            )}
            <span style={{ fontSize:22 }}>{activeRoom.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:700, color:activeRoom.color }}>{activeRoom.label}</div>
              {!isMobile && <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.3)', marginTop:1 }}>{activeRoom.desc}</div>}
            </div>
            <div style={{ background:'rgba(129,140,248,0.09)', border:'1px solid rgba(129,140,248,0.22)', borderRadius:8, padding:'5px 10px', fontSize:11, color:'#818CF8', flexShrink:0 }}>🤖 AI Active</div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflow:'auto', padding:isMobile?'14px 12px':'22px 24px', display:'flex', flexDirection:'column', gap:14 }}>
            {currentMsgs.length === 0 && (
              <div style={{ textAlign:'center', marginTop:60, color:'rgba(255,255,255,0.28)' }}>
                <div style={{ fontSize:48, marginBottom:14 }}>{activeRoom.icon}</div>
                <div style={{ fontSize:16, marginBottom:6, color:'rgba(255,255,255,0.5)' }}>You are not alone here</div>
                <div style={{ fontSize:13 }}>MindBridge AI is here with you.</div>
              </div>
            )}
            {currentMsgs.map(msg => (<MessageBubble key={msg.id} msg={msg} isOwn={msg.isOwn||msg.user===userId} roomColor={activeRoom.color} />))}
            {showCrisis && <CrisisCard />}
            {aiTyping && <TypingIndicator />}
            {analyzing && (
              <div style={{ display:'flex', gap:10, alignItems:'center', color:'rgba(255,255,255,0.26)', fontSize:13, paddingLeft:42 }}>
                <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(129,140,248,0.3)', borderTopColor:'#818CF8', animation:'spin 0.75s linear infinite', flexShrink:0 }} />
                Analyzing…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding:isMobile?'10px 12px':'14px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.008)', flexShrink:0 }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Share how you're feeling…"
                rows={isMobile ? 1 : 2}
                style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:12, padding:'12px 14px', color:'#fff', fontSize:14, resize:'none', outline:'none', fontFamily:"'DM Sans', sans-serif", lineHeight:1.6, transition:'border-color 0.2s', minHeight:isMobile?44:54 }}
                onFocus={e => e.target.style.borderColor='rgba(129,140,248,0.48)'}
                onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.09)'}
              />
              <button onClick={sendMessage} disabled={!input.trim()||analyzing||aiTyping}
                style={{ background:input.trim()&&!analyzing&&!aiTyping?'linear-gradient(135deg, #818CF8, #6366F1)':'rgba(255,255,255,0.05)', border:'none', borderRadius:11, width:46, height:46, cursor:input.trim()&&!analyzing&&!aiTyping?'pointer':'not-allowed', fontSize:18, transition:'all 0.2s', flexShrink:0, color:'#fff' }}>
                {analyzing||aiTyping?'⏳':'↑'}
              </button>
            </div>
            <div style={{ marginTop:6, fontSize:10, color:'rgba(255,255,255,0.16)', textAlign:'center' }}>AI moderated · Enter to send</div>
          </div>
        </div>
      </div>
    </div>
  );
}