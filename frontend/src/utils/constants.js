// ─── Shared Constants & Utilities ─────────────────────────────────────────

/** Five support rooms — each has a slug, display name, icon, accent colour */
export const ROOMS = [
  { id: 'anxiety',    label: 'Anxiety Support',    icon: '🌊', color: '#4ECDC4', desc: 'A safe space to share anxiety struggles' },
  { id: 'depression', label: 'Depression Support', icon: '🌙', color: '#A78BFA', desc: "You're not alone in the darkness" },
  { id: 'stress',     label: 'Stress Relief',      icon: '🍃', color: '#6EE7B7', desc: "Share what's weighing on you" },
  { id: 'loneliness', label: 'Loneliness',          icon: '🕯️', color: '#FCA5A5', desc: 'Connect when you feel alone' },
  { id: 'general',    label: 'General Support',    icon: '💬', color: '#93C5FD', desc: 'Open mental health discussions' },
];

/** Map sentiment label → accent colour */
export const SENTIMENT_COLOR = {
  happy:     '#6EE7B7',
  neutral:   '#93C5FD',
  sad:       '#A78BFA',
  angry:     '#FCA5A5',
  depressed: '#F9A8D4',
};

/** Map risk level → colour */
export const RISK_COLOR = {
  low:      '#6EE7B7',
  medium:   '#FCD34D',
  high:     '#FB923C',
  critical: '#EF4444',
};

/** Generate a random anonymous display name (client-side fallback) */
export const generateLocalAnonId = () => {
  const adj  = ['Calm','Gentle','Quiet','Soft','Brave','Kind','Warm','Still','Clear','Pure','Bright','Swift','Serene','Tender'];
  const noun = ['River','Moon','Cloud','Star','Leaf','Stone','Wind','Dawn','Lake','Brook','Mist','Pine','Wave','Sky'];
  const num  = Math.floor(Math.random() * 9000) + 1000;
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}_${num}`;
};

/** Human-readable time ago */
export const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 5)    return 'just now';
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

/**
 * Client-side NLP simulation.
 * Used when the Django backend is not running (pure demo mode).
 * Mimics the server-side 4-layer pipeline with keyword matching.
 */
export const simulateAnalysis = (text) => {
  const lower = text.toLowerCase();

  // Layer 1 — Crisis detection
  const crisisPhrases = ['kill myself','want to die','end my life','suicide','hurt myself','self harm','no reason to live','end it all'];
  if (crisisPhrases.some(p => lower.includes(p))) {
    return { blocked: true, reason: 'crisis_language', sentiment: 'depressed', risk_level: 'critical', sentiment_score: 0.96, toxicity_score: 0.9, risk_score: 1.0 };
  }

  // Layer 2 — Toxicity
  const toxicPhrases = ['hate you','worthless','stupid idiot','shut up you','kill you'];
  if (toxicPhrases.some(p => lower.includes(p))) {
    return { blocked: true, reason: 'toxic_content', sentiment: 'angry', risk_level: 'high', sentiment_score: 0.82, toxicity_score: 0.93, risk_score: 0.88 };
  }

  // Layer 3 — Sentiment
  const sadWords     = ['sad','depressed','lonely','hopeless','crying','overwhelmed','scared','panic','anxious','numb','empty','tired','exhausted'];
  const positiveWords= ['happy','better','good','thank','hope','help','grateful','smile','love','improving','progress'];
  const sadCount     = sadWords.filter(w => lower.includes(w)).length;

  // Layer 4 — Risk scoring
  if (sadCount >= 3) return { blocked: false, sentiment: 'depressed', risk_level: 'high',   sentiment_score: 0.88, toxicity_score: 0.03, risk_score: 0.78 };
  if (sadCount >= 2) return { blocked: false, sentiment: 'depressed', risk_level: 'medium', sentiment_score: 0.75, toxicity_score: 0.02, risk_score: 0.52 };
  if (sadCount >= 1) return { blocked: false, sentiment: 'sad',       risk_level: 'medium', sentiment_score: 0.62, toxicity_score: 0.01, risk_score: 0.38 };
  if (positiveWords.some(w => lower.includes(w)))
                     return { blocked: false, sentiment: 'happy',     risk_level: 'low',    sentiment_score: 0.80, toxicity_score: 0.01, risk_score: 0.05 };
  return               { blocked: false, sentiment: 'neutral',         risk_level: 'low',    sentiment_score: 0.55, toxicity_score: 0.01, risk_score: 0.08 };
};
